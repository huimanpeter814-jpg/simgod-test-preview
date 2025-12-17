import { PALETTES, HOLIDAYS, JOBS, CONFIG, SURNAMES } from '../constants'; 
import { PLOTS } from '../data/plots'; 
import { WORLD_LAYOUT, STREET_PROPS } from '../data/world'; 
import { LogEntry, GameTime, Job, Furniture, RoomDef, HousingUnit, WorldPlot, SaveMetadata, EditorAction, EditorState, AgeStage } from '../types';
import { Sim } from './Sim';
import { SpatialHashGrid } from './spatialHash';
import { PathFinder } from './pathfinding'; 
import { FamilyGenerator } from './logic/genetics';
import { NarrativeSystem } from './logic/narrative';
import { EditorManager } from '../managers/EditorManager';
import { SaveManager, GameSaveData } from '../managers/SaveManager'; 

// Re-exports
export { Sim } from './Sim';
export { minutes, getJobCapacity } from './simulationHelpers';
export { drawAvatarHead } from './render/pixelArt'; 

export class GameStore {
    static sims: Sim[] = [];
    static particles: { x: number; y: number; life: number }[] = [];
    
    static time: GameTime = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };
    
    static timeAccumulator: number = 0;
    static logs: LogEntry[] = [];
    static selectedSimId: string | null = null;
    static listeners: (() => void)[] = [];

    // [Refactor] 静态 EditorManager 实例
    static editor = new EditorManager();

    static rooms: RoomDef[] = [];
    static furniture: Furniture[] = [];
    static housingUnits: (HousingUnit & { x: number, y: number })[] = [];
    
    static worldLayout: WorldPlot[] = [];

    static furnitureIndex: Map<string, Furniture[]> = new Map();
    static worldGrid: SpatialHashGrid = new SpatialHashGrid(100);
    static pathFinder: PathFinder = new PathFinder(CONFIG.CANVAS_W, CONFIG.CANVAS_H, 20);

    // Toast Notification State
    static toastMessage: string | null = null;
    static toastTimer: any = null;

    static subscribe(cb: () => void) {
        this.listeners.push(cb);
        return () => { this.listeners = this.listeners.filter(l => l !== cb); };
    }

    static notify() {
        this.listeners.forEach(cb => cb());
    }

    static showToast(msg: string) {
        this.toastMessage = msg;
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            this.toastMessage = null;
            this.notify();
        }, 3000);
        this.notify();
    }

    static removeSim(id: string) {
        this.sims = this.sims.filter(s => s.id !== id);
        if (this.selectedSimId === id) this.selectedSimId = null;
        this.notify();
    }

    static assignRandomHome(sim: Sim) {
        const availableHomes = this.housingUnits.filter(unit => {
            const residents = this.sims.filter(s => s.homeId === unit.id).length;
            return residents < unit.capacity;
        });

        if (availableHomes.length === 0) {
            this.showToast("❌ 没有空闲的住处了！");
            return;
        }

        let candidates = availableHomes;
        if (sim.money > 5000) {
            const luxury = availableHomes.filter(h => h.type === 'villa' || h.type === 'apartment');
            if (luxury.length > 0) candidates = luxury;
        } else if (sim.money < 2000) {
            const budget = availableHomes.filter(h => h.type === 'public_housing');
            if (budget.length > 0) candidates = budget;
        }

        const newHome = candidates[Math.floor(Math.random() * candidates.length)];
        sim.homeId = newHome.id;
        this.addLog(sim, `搬进了新家：${newHome.name}`, 'life');
        this.showToast(`✅ 已分配住址：${newHome.name}`);

        // 配偶和孩子跟随搬家
        const partner = this.sims.find(s => s.id === sim.partnerId && sim.relationships[s.id]?.isSpouse);
        if (partner && partner.homeId !== newHome.id) {
            partner.homeId = newHome.id;
            this.addLog(partner, `随配偶搬进了新家`, 'family');
        }

        const children = this.sims.filter(s => sim.childrenIds.includes(s.id) && ([AgeStage.Infant, AgeStage.Toddler, AgeStage.Child, AgeStage.Teen] as AgeStage[]).includes(s.ageStage));
        children.forEach(child => {
            if (child.homeId !== newHome.id) {
                child.homeId = newHome.id;
            }
        });

        this.refreshFurnitureOwnership();
        this.notify();
    }

    // 重建世界逻辑
    static rebuildWorld(initial = false) {
        if (this.worldLayout.length === 0) {
            this.worldLayout = JSON.parse(JSON.stringify(WORLD_LAYOUT));
        }

        if (initial) {
            this.rooms = [];
        } else {
            this.rooms = this.rooms.filter(r => r.isCustom);
        }
        
        this.housingUnits = [];
        
        if (initial) {
            this.furniture = [];
            // @ts-ignore
            this.furniture.push(...STREET_PROPS);
        } else {
            this.furniture = this.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'));
        }

        this.worldLayout.forEach(plot => {
            GameStore.instantiatePlot(plot);
        });

        this.initIndex();
    }

    static instantiatePlot(plot: WorldPlot) {
        let template = PLOTS[plot.templateId];
        
        if (!template || plot.templateId === 'default_empty') {
            const w = plot.width || 300;
            const h = plot.height || 300;
            
            template = {
                id: 'default_empty',
                width: w,
                height: h,
                type: (plot.customType as any) || 'public', 
                rooms: [
                    { 
                        id: 'base', x: 0, y: 0, w: w, h: h, 
                        label: plot.customName || '空地皮', 
                        color: plot.customColor || '#dcdcdc', 
                        pixelPattern: 'simple' 
                    }
                ],
                furniture: [],
                housingUnits: [] 
            };

            const type = plot.customType;
            if (type && ['dorm', 'villa', 'apartment'].includes(type)) {
                let unitType: 'public_housing' | 'apartment' | 'villa' = 'public_housing';
                let capacity = 6;
                let cost = 500;

                if (type === 'villa') {
                    unitType = 'villa'; capacity = 4; cost = 5000;
                } else if (type === 'apartment') {
                    unitType = 'apartment'; capacity = 2; cost = 1500;
                } else if (type === 'dorm') {
                    unitType = 'public_housing'; capacity = 8; cost = 200;
                }

                template.housingUnits!.push({
                    id: 'custom_home', 
                    name: plot.customName || (unitType === 'villa' ? '私人别墅' : '自建公寓'),
                    capacity: capacity,
                    cost: cost,
                    type: unitType,
                    area: { x: 0, y: 0, w: w, h: h } 
                });
            }
        }

        const plotUnits: (HousingUnit & { x: number, y: number, maxX: number, maxY: number })[] = [];

        if (template.housingUnits) {
            template.housingUnits.forEach(u => {
                const unitAbs = {
                    ...u,
                    id: `${plot.id}_${u.id}`,
                    x: u.area.x + plot.x,
                    y: u.area.y + plot.y,
                    maxX: u.area.x + plot.x + u.area.w,
                    maxY: u.area.y + plot.y + u.area.h
                };
                this.housingUnits.push(unitAbs);
                plotUnits.push(unitAbs);
            });
        }

        template.rooms.forEach(r => {
            const absX = r.x + plot.x;
            const absY = r.y + plot.y;
            const ownerUnit = plotUnits.find(u => absX >= u.x && absX < u.maxX && absY >= u.y && absY < u.maxY);
            this.rooms.push({ ...r, id: `${plot.id}_${r.id}`, x: absX, y: absY, homeId: ownerUnit ? ownerUnit.id : undefined });
        });

        template.furniture.forEach(f => {
            const absX = f.x + plot.x;
            const absY = f.y + plot.y;
            const ownerUnit = plotUnits.find(u => absX >= u.x && absX < u.maxX && absY >= u.y && absY < u.maxY);
            this.furniture.push({ ...f, id: `${plot.id}_${f.id}`, x: absX, y: absY, homeId: ownerUnit ? ownerUnit.id : undefined });
        });
    }

    static updatePlotAttributes(plotId: string, attrs: { name?: string, color?: string, type?: string }) {
        const plot = this.worldLayout.find(p => p.id === plotId);
        if (!plot) return;

        let hasChange = false;
        if (attrs.name !== undefined && plot.customName !== attrs.name) { plot.customName = attrs.name; hasChange = true; }
        if (attrs.color !== undefined && plot.customColor !== attrs.color) { plot.customColor = attrs.color; hasChange = true; }
        if (attrs.type !== undefined && plot.customType !== attrs.type) { plot.customType = attrs.type; hasChange = true; }

        if (hasChange) {
            this.rooms = this.rooms.filter(r => !r.id.startsWith(`${plotId}_`));
            this.furniture = this.furniture.filter(f => !f.id.startsWith(`${plotId}_`));
            this.housingUnits = this.housingUnits.filter(h => !h.id.startsWith(`${plotId}_`));
            this.instantiatePlot(plot);
            this.initIndex();
            this.notify();
        }
    }

    static refreshFurnitureOwnership() {
        this.furniture.forEach(f => {
            if (f.id.startsWith('custom_')) {
                const cx = f.x + f.w / 2;
                const cy = f.y + f.h / 2;
                const ownerUnit = this.housingUnits.find(u => {
                    const maxX = u.maxX ?? (u.x + u.area.w);
                    const maxY = u.maxY ?? (u.y + u.area.h);
                    return cx >= u.x && cx < maxX && cy >= u.y && cy < maxY;
                });
                if (ownerUnit) f.homeId = ownerUnit.id;
                else delete f.homeId;
            }
        });
    }

    // === 🗺️ 地图数据管理 (Delegated to SaveManager) ===

    static getMapData() {
        // 构建 MapData 对象，由 SaveManager 决定如何处理（这里直接返回对象供 UI 下载）
        return {
            version: "1.0",
            timestamp: Date.now(),
            worldLayout: this.worldLayout,
            rooms: this.rooms.filter(r => r.isCustom),
            customFurniture: this.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'))
        };
    }

    static importMapData(rawJson: any) {
        // [新增] 使用 SaveManager 进行解析和校验
        const validData = SaveManager.parseMapData(rawJson);
        
        if (!validData) {
            this.showToast("❌ 导入失败：文件格式无效");
            return;
        }

        try {
            this.worldLayout = validData.worldLayout;
            this.rebuildWorld(true);
            
            if (validData.rooms) this.rooms = [...this.rooms, ...validData.rooms];
            if (validData.customFurniture) this.furniture = [...this.furniture, ...validData.customFurniture];
            
            this.initIndex();
            this.refreshFurnitureOwnership();
            this.showToast("✅ 地图导入成功！");
            this.notify();
        } catch (e) {
            console.error("Import execution failed", e);
            this.showToast("❌ 导入过程出错，请重试");
        }
    }

    // === Proxy Methods to EditorManager ===
    static get history() { return this.editor.history; } // For compatibility if accessed directly
    static get redoStack() { return this.editor.redoStack; }

    static enterEditorMode() { this.editor.enterEditorMode(); }
    static confirmEditorChanges() { this.editor.confirmChanges(); }
    static cancelEditorChanges() { this.editor.cancelChanges(); }
    static resetEditorState() { this.editor.resetState(); }
    static clearMap() { this.editor.clearMap(); }
    static recordAction(action: EditorAction) { this.editor.recordAction(action); }
    static undo() { this.editor.undo(); }
    static redo() { this.editor.redo(); }
    static startPlacingPlot(templateId: string) { this.editor.startPlacingPlot(templateId); }
    static startDrawingPlot(templateId: string) { this.editor.startDrawingPlot(templateId); }
    static startPlacingFurniture(template: Partial<Furniture>) { this.editor.startPlacingFurniture(template); }
    static startDrawingFloor(pattern: string, color: string, label: string, hasWall: boolean) { this.editor.startDrawingFloor(pattern, color, label, hasWall); }
    static placePlot(x: number, y: number) { this.editor.placePlot(x, y); }
    static createCustomPlot(rect: any, templateId: string) { this.editor.createCustomPlot(rect, templateId); }
    static placeFurniture(x: number, y: number) { this.editor.placeFurniture(x, y); }
    static createCustomRoom(rect: any, pattern: string, color: string, label: string, hasWall: boolean) { this.editor.createCustomRoom(rect, pattern, color, label, hasWall); }
    static removePlot(plotId: string) { this.editor.removePlot(plotId); }
    static removeRoom(roomId: string) { this.editor.removeRoom(roomId); }
    static removeFurniture(id: string) { this.editor.removeFurniture(id); }
    static changePlotTemplate(plotId: string, templateId: string) { this.editor.changePlotTemplate(plotId, templateId); }
    static finalizeMove(type: 'plot'|'furniture'|'room', id: string, startPos: any) { this.editor.finalizeMove(type, id, startPos); }

    static initIndex() {
        this.furnitureIndex.clear();
        this.worldGrid.clear();
        this.pathFinder.clear(); 

        const passableTypes = ['rug_fancy', 'rug_persian', 'rug_art', 'pave_fancy', 'stripes', 'zebra', 'manhole', 'grass', 'concrete', 'tile', 'wood', 'run_track', 'water'];

        this.furniture.forEach(f => {
            if (!this.furnitureIndex.has(f.utility)) { this.furnitureIndex.set(f.utility, []); }
            this.furnitureIndex.get(f.utility)!.push(f);
            this.worldGrid.insert({ id: f.id, x: f.x, y: f.y, w: f.w, h: f.h, type: 'furniture', ref: f });

            const padding = 4;
            const isPassable = f.pixelPattern && passableTypes.some(t => f.pixelPattern?.includes(t));
            if (!isPassable && f.utility !== 'none' && !f.label.includes('地毯')) {
                this.pathFinder.setObstacle(f.x + padding, f.y + padding, Math.max(1, f.w - padding * 2), Math.max(1, f.h - padding * 2));
            }
        });

        this.rooms.forEach(r => {
            if (r.isCustom) {
                this.worldGrid.insert({ id: r.id, x: r.x, y: r.y, w: r.w, h: r.h, type: 'room', ref: r });
            }
        });
    }

    static spawnHeart(x: number, y: number) {
        this.particles.push({ x, y, life: 1.0 });
    }

    static addLog(sim: Sim | null, text: string, type: any, isAI = false) {
        const timeStr = `Y${this.time.year} M${this.time.month} | ${String(this.time.hour).padStart(2, '0')}:${String(this.time.minute).padStart(2, '0')}`;
        let category: 'sys' | 'chat' | 'rel' | 'life' = 'chat';
        if (['sys', 'family'].includes(type)) category = 'sys';
        else if (['money', 'act', 'achievement', 'normal'].includes(type)) category = 'life';
        else if (['love', 'jealous', 'rel_event', 'bad'].includes(type)) category = 'rel'; 
        else category = 'chat'; 

        const entry: LogEntry = {
            id: Math.random(),
            time: timeStr,
            text: text,
            type: type,
            category: category,
            isAI: isAI,
            simName: sim ? sim.name : '系统'
        };
        this.logs.unshift(entry);
        if (this.logs.length > 200) this.logs.pop();
        this.notify();
    }

    // === 💾 存档系统 (Delegated to SaveManager) ===

    static getSaveSlots() {
        return SaveManager.getSaveSlots();
    }

    static saveGame(slotIndex: number = 1) {
        // 1. 准备 Sims 数据 (处理引用和循环依赖)
        const safeSims = this.sims.map(sim => {
            const s = Object.assign({}, sim);
            // 清理临时状态，避免序列化问题
            if (s.interactionTarget && (s.interactionTarget as any).ref) {
                s.interactionTarget = null; s.action = 'idle'; s.target = null;
                // @ts-ignore
                s.path = []; s.bubble = { text: null, timer: 0, type: 'normal' };
            }
            return s;
        });

        // 2. 构建存档数据包
        const saveData: GameSaveData = {
            version: 3.2, 
            timestamp: Date.now(),
            time: this.time,
            logs: this.logs,
            sims: safeSims,
            worldLayout: this.worldLayout,
            rooms: this.rooms.filter(r => r.isCustom),
            customFurniture: this.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_')) 
        };

        // 3. 调用 SaveManager 执行保存
        const success = SaveManager.saveToSlot(slotIndex, saveData);
        
        if (success) {
            this.showToast(`✅ 存档 ${slotIndex} 保存成功！`);
        } else {
            this.showToast(`❌ 保存失败: 存储空间不足?`);
        }
    }

    static loadGame(slotIndex: number = 1): boolean {
        // 1. 调用 SaveManager 读取数据
        const data = SaveManager.loadFromSlot(slotIndex);
        
        if (!data) {
            this.showToast(`❌ 读取存档失败`);
            return false;
        }

        try {
            // 2. 恢复世界布局
            if (data.worldLayout) this.worldLayout = data.worldLayout;
            else this.worldLayout = JSON.parse(JSON.stringify(WORLD_LAYOUT)); 

            this.rebuildWorld(true); // 此时 furniture 被重置为初始状态

            // 3. 恢复自定义建筑和家具
            if (data.rooms) this.rooms = [...this.rooms, ...data.rooms];
            if (data.customFurniture) {
                // 将加载的自定义家具追加到当前家具列表中
                const staticFurniture = this.furniture; 
                this.furniture = [...staticFurniture, ...data.customFurniture];
            }

            // 4. 恢复游戏时间与日志
            this.time = { ...data.time, speed: 1 };
            this.logs = data.logs || [];

            // 5. 恢复市民 (反序列化)
            this.loadSims(data.sims);

            // 6. 重建索引和关系
            this.initIndex();
            this.refreshFurnitureOwnership();
            
            this.showToast(`📂 读取存档 ${slotIndex} 成功！`);
            this.notify();
            return true;
        } catch (e) {
            console.error("[GameStore] Hydration failed:", e);
            // 发生严重错误时尝试回滚或重置（此处简单提示）
            this.showToast(`❌ 存档数据损坏，无法恢复`);
            return false;
        }
    }

    static deleteSave(slotIndex: number) {
        SaveManager.deleteSlot(slotIndex);
        this.notify();
        this.showToast(`🗑️ 存档 ${slotIndex} 已删除`);
    }

    static loadSims(simsData: any[]) {
        this.sims = simsData.map((sData: any) => {
            // 需要重新实例化 Sim 类，而不是仅仅使用纯对象
            const sim = new Sim({ x: sData.pos.x, y: sData.pos.y }); 
            
            // 覆盖属性
            Object.assign(sim, sData);
            
            // 数据补全/兼容性处理
            if (!sim.childrenIds) sim.childrenIds = [];
            if (!sim.health) sim.health = 100;
            // [Fix] 使用枚举 AgeStage.Adult 而不是字符串
            if (!sim.ageStage) sim.ageStage = AgeStage.Adult;
            if (sim.interactionTarget) sim.interactionTarget = null;
            
            // 恢复职业对象 (确保引用的是常量中的 Job 对象)
            const currentJobDefinition = JOBS.find(j => j.id === sim.job.id);
            if (currentJobDefinition) {
                sim.job = { ...currentJobDefinition };
            }

            // [修复] 核心修复：根据 action 属性恢复正确的 State 实例
            // 否则 state 只是一个普通对象，没有 update 方法，导致报错
            sim.restoreState();

            return sim;
        });
    }

    static spawnFamily() {
        const size = 1 + Math.floor(Math.random() * 4); 
        // [Refactor] 使用独立的 FamilyGenerator
        const fam = FamilyGenerator.generate(size, this.housingUnits, this.sims);
        this.sims.push(...fam);
        this.addLog(null, `新家庭搬入城市！共 ${fam.length} 人。`, "sys");
        this.notify();
    }
}

// ---------------- Game Loop Functions ----------------

export function initGame() {
    GameStore.sims = [];
    GameStore.particles = [];
    GameStore.logs = []; 
    GameStore.time = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };

    GameStore.rebuildWorld(true); 

    // 尝试自动读取存档 1
    if (GameStore.loadGame(1)) {
        GameStore.addLog(null, "自动读取存档 1 成功", "sys");
    } else {
        const familyCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < familyCount; i++) {
            const size = 1 + Math.floor(Math.random() * 4); 
            // [Refactor] 使用独立的 FamilyGenerator
            const fam = FamilyGenerator.generate(size, GameStore.housingUnits, GameStore.sims);
            GameStore.sims.push(...fam);
        }
        GameStore.addLog(null, `新世界已生成。共 ${familyCount} 个家庭，${GameStore.sims.length} 位市民。`, "sys");
    }
    GameStore.notify();
}

export function updateTime() {
    if (GameStore.editor.mode !== 'none') return;
    if (GameStore.time.speed === 0) return;

    GameStore.timeAccumulator += GameStore.time.speed;
    
    if (GameStore.timeAccumulator >= 60) {
        GameStore.timeAccumulator = 0;
        GameStore.time.minute++;
        GameStore.sims.forEach(s => s.update(1, true));

        if (GameStore.time.minute >= 60) {
            GameStore.time.minute = 0;
            GameStore.time.hour++;
            GameStore.sims.forEach(s => s.checkSpending());

            if (GameStore.time.hour >= 24) {
                GameStore.time.hour = 0;
                
                // [Refactor] 使用独立的 NarrativeSystem
                NarrativeSystem.handleDailyDiaries(GameStore.sims, GameStore.time, (msg) => GameStore.addLog(null, msg, 'sys', true));

                GameStore.time.totalDays++;
                GameStore.time.month++;
                if (GameStore.time.month > 12) {
                    GameStore.time.month = 1;
                    GameStore.time.year++;
                    GameStore.addLog(null, `🎆 新年快乐！进入第 ${GameStore.time.year} 年`, 'sys');
                }

                const currentMonth = GameStore.time.month;
                let dailyLog = `进入 ${GameStore.time.year} 年 ${currentMonth} 月`;
                const holiday = HOLIDAYS[currentMonth];
                if (holiday) {
                    dailyLog += ` | 🎉 本月是: ${holiday.name}`;
                    GameStore.addLog(null, `🎉 ${holiday.name} 到了！本月大家都有些特别的想法...`, 'sys');
                }
                GameStore.addLog(null, dailyLog, 'sys');

                GameStore.sims.forEach(s => {
                    s.dailyExpense = 0; s.dailyIncome = 0; s.payRent(); s.calculateDailyBudget(); s.applyMonthlyEffects(currentMonth, holiday);
                });
                
                // 自动保存逻辑也通过 GameStore 调用 SaveManager
                GameStore.saveGame(1);
            }
        }
        GameStore.notify();
    }
}

export function getActivePalette() {
    const h = GameStore.time.hour;
    if (h >= 5 && h < 9) return PALETTES.earlyMorning;
    if (h >= 9 && h < 15) return PALETTES.noon;
    if (h >= 15 && h < 18) return PALETTES.afternoon;
    if (h >= 18 && h < 21) return PALETTES.dusk;
    if (h >= 21 || h < 0) return PALETTES.night;
    return PALETTES.lateNight;
}

export function gameLoopStep() {
    try {
        updateTime();
        if (GameStore.editor.mode === 'none') {
            GameStore.sims.forEach(s => s.update(GameStore.time.speed, false));
        }
    } catch (error) {
        console.error("Game Loop Error:", error);
        GameStore.time.speed = 0; 
        GameStore.notify();
    }
}