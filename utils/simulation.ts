import { PALETTES, HOLIDAYS, JOBS, CONFIG, SURNAMES } from '../constants'; 
import { PLOTS } from '../data/plots'; 
import { WORLD_LAYOUT,STREET_PROPS  } from '../data/world'; 
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

    // 🆕 核心逻辑更新：房屋分配
    static assignRandomHome(sim: Sim) {
        let targetTypes: string[] = [];

        // 1. 老年人优先分配养老院
        if (sim.ageStage === AgeStage.Elder) {
            targetTypes = ['elder_care', 'apartment', 'public_housing'];
        } 
        // 2. 富人分配别墅或高级公寓
        else if (sim.money > 5000) {
            targetTypes = ['villa', 'apartment'];
        } 
        // 3. 穷人分配公屋/宿舍
        else if (sim.money < 2000) {
            targetTypes = ['public_housing'];
        } 
        // 4. 中产阶级
        else {
            targetTypes = ['apartment', 'public_housing'];
        }

        // 筛选符合类型的空闲房源
        let candidates = this.housingUnits.filter(unit => {
            const residents = this.sims.filter(s => s.homeId === unit.id).length;
            return targetTypes.includes(unit.type) && residents < unit.capacity;
        });

        // 优先匹配首选类型 (数组第一个)
        const preferred = candidates.filter(u => u.type === targetTypes[0]);
        if (preferred.length > 0) {
            candidates = preferred;
        }

        // 兜底：如果目标类型都满了，寻找任何有空位的房子 (排除养老院，除非是老人)
        if (candidates.length === 0) {
            candidates = this.housingUnits.filter(unit => {
                const residents = this.sims.filter(s => s.homeId === unit.id).length;
                if (unit.type === 'elder_care' && sim.ageStage !== AgeStage.Elder) return false;
                return residents < unit.capacity;
            });
        }

        if (candidates.length === 0) {
            this.showToast("❌ 没有空闲的住处了！");
            // 可以考虑添加 "homeless" 状态处理
            return;
        }

        // 随机选择一个
        const newHome = candidates[Math.floor(Math.random() * candidates.length)];
        sim.homeId = newHome.id;

        // 根据房屋类型生成不同的日志
        if (newHome.type === 'elder_care') {
            this.addLog(sim, `办理了入住手续，搬进了养老社区：${newHome.name}`, 'life');
        } else if (newHome.type === 'villa') {
            this.addLog(sim, `搬进了豪宅：${newHome.name}`, 'life');
        } else {
            this.addLog(sim, `搬进了新家：${newHome.name}`, 'life');
        }
        
        this.showToast(`✅ 已分配住址：${newHome.name}`);

        // === 家人跟随搬家逻辑 ===
        // 只有非养老院类型的搬家才会触发家人跟随
        if (newHome.type !== 'elder_care') {
            // 1. 配偶跟随 (除非配偶已经是老人且住在养老院)
            const partner = this.sims.find(s => s.id === sim.partnerId && sim.relationships[s.id]?.isSpouse);
            if (partner && partner.homeId !== newHome.id) {
                const partnerHome = this.housingUnits.find(u => u.id === partner.homeId);
                if (!partnerHome || partnerHome.type !== 'elder_care') {
                    partner.homeId = newHome.id;
                    this.addLog(partner, `随配偶搬进了新家`, 'family');
                }
            }

            // 2. 未成年子女跟随
            const children = this.sims.filter(s => 
                sim.childrenIds.includes(s.id) && 
                ([AgeStage.Infant, AgeStage.Toddler, AgeStage.Child, AgeStage.Teen] as AgeStage[]).includes(s.ageStage)
            );
            children.forEach(child => {
                if (child.homeId !== newHome.id) {
                    child.homeId = newHome.id;
                }
            });
        }

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
            if (type && ['dorm', 'villa', 'apartment', 'residential'].includes(type)) {
                let unitType: 'public_housing' | 'apartment' | 'villa' = 'public_housing';
                let capacity = 6;
                let cost = 500;

                if (type === 'villa') {
                    unitType = 'villa'; capacity = 4; cost = 5000;
                } else if (type === 'apartment') {
                    unitType = 'apartment'; capacity = 2; cost = 1500;
                } else if (type === 'dorm' || type === 'residential') {
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
            this.furniture.push({ 
                ...f, 
                id: `${plot.id}_${f.id}`, 
                x: absX, 
                y: absY, 
                homeId: ownerUnit ? ownerUnit.id : undefined,
                // 🆕 建议在 types.ts 的 Furniture 接口里加个可选的 plotId
                // plotId: plot.id 
            });
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
            // 简单的局部刷新：移除旧的，重新实例化
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
        return {
            version: "1.0",
            timestamp: Date.now(),
            worldLayout: this.worldLayout,
            rooms: this.rooms.filter(r => r.isCustom),
            customFurniture: this.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'))
        };
    }

    static importMapData(rawJson: any) {
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
    static get history() { return this.editor.history; } 
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
    // 🆕 新增：地皮家具索引 (Plot ID -> Furniture List)
    static furnitureByPlot: Map<string, Furniture[]> = new Map();

    static initIndex() {
        this.furnitureIndex.clear();
        this.worldGrid.clear();
        this.pathFinder.clear();
        this.furnitureByPlot.clear(); // 清空旧索引

        const passableTypes = ['rug_fancy', 'rug_persian', 'rug_art', 'pave_fancy', 'stripes', 'zebra', 'manhole', 'grass', 'concrete', 'tile', 'wood', 'run_track', 'water'];

        this.furniture.forEach(f => {
            // 1. 原有逻辑：按功能索引
            if (!this.furnitureIndex.has(f.utility)) { this.furnitureIndex.set(f.utility, []); }
            this.furnitureIndex.get(f.utility)!.push(f);
            
            // 2. 原有逻辑：空间哈希
            this.worldGrid.insert({ id: f.id, x: f.x, y: f.y, w: f.w, h: f.h, type: 'furniture', ref: f });

            // 🆕 3. 新增逻辑：提取 plotId 并存入索引
            // 假设家具ID格式为 "plotId_furnitureId" (你在 instantiatePlot 里是这么生成的)
            // 我们通过字符串分割获取 plotId
            const parts = f.id.split('_');
            // 注意：因为 plotId 可能包含下划线（如 p_nw_1），我们需要一种更稳健的方式，
            // 或者在 instantiatePlot 时给 Furniture 对象直接加上 plotId 属性（推荐）。
            // 这里为了兼容现有数据，我们假设 ID 的前缀匹配：
            // 更好的做法是：在 instantiatePlot 里给 furniture 加个 plotId 字段。
            // 暂时用这种简易方式：找到包含这个家具的地皮
            const ownerPlot = this.worldLayout.find(p => f.id.startsWith(p.id));
            if (ownerPlot) {
                if (!this.furnitureByPlot.has(ownerPlot.id)) {
                    this.furnitureByPlot.set(ownerPlot.id, []);
                }
                this.furnitureByPlot.get(ownerPlot.id)!.push(f);
            }

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
        const safeSims = this.sims.map(sim => {
            const s = Object.assign({}, sim);
            if (s.interactionTarget && (s.interactionTarget as any).ref) {
                s.interactionTarget = null; s.action = 'idle'; s.target = null;
                // @ts-ignore
                s.path = []; s.bubble = { text: null, timer: 0, type: 'normal' };
            }
            return s;
        });

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

        const success = SaveManager.saveToSlot(slotIndex, saveData);
        
        if (success) {
            this.showToast(`✅ 存档 ${slotIndex} 保存成功！`);
        } else {
            this.showToast(`❌ 保存失败: 存储空间不足?`);
        }
    }

    static loadGame(slotIndex: number = 1, silent: boolean = false): boolean {
        const data = SaveManager.loadFromSlot(slotIndex);
        
        if (!data) {
            if (!silent) {
                this.showToast(`❌ 读取存档失败`);
            }
            return false;
        }

        try {
            if (data.worldLayout) this.worldLayout = data.worldLayout;
            else this.worldLayout = JSON.parse(JSON.stringify(WORLD_LAYOUT)); 

            this.rebuildWorld(true); 

            if (data.rooms) this.rooms = [...this.rooms, ...data.rooms];
            if (data.customFurniture) {
                const staticFurniture = this.furniture; 
                this.furniture = [...staticFurniture, ...data.customFurniture];
            }

            this.time = { ...data.time, speed: 1 };
            this.logs = data.logs || [];

            this.loadSims(data.sims);

            this.initIndex();
            this.refreshFurnitureOwnership();
            
            if (!silent) {
                this.showToast(`📂 读取存档 ${slotIndex} 成功！`);
            }
            this.notify();
            return true;
        } catch (e) {
            console.error("[GameStore] Hydration failed:", e);
            if (!silent) this.showToast(`❌ 存档数据损坏，无法恢复`);
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
            const sim = new Sim({ x: sData.pos.x, y: sData.pos.y }); 
            
            Object.assign(sim, sData);
            
            if (!sim.childrenIds) sim.childrenIds = [];
            if (!sim.health) sim.health = 100;
            if (!sim.ageStage) sim.ageStage = AgeStage.Adult;
            if (sim.interactionTarget) sim.interactionTarget = null;
            
            const currentJobDefinition = JOBS.find(j => j.id === sim.job.id);
            if (currentJobDefinition) {
                sim.job = { ...currentJobDefinition };
            }

            sim.restoreState();

            return sim;
        });
    }

    static spawnFamily(size?: number) {
        const count = size || (2 + Math.floor(Math.random() * 3)); 
        const fam = FamilyGenerator.generate(count, this.housingUnits, this.sims);
        this.sims.push(...fam);
        
        const logMsg = count === 1 
            ? `新居民 ${fam[0].name} 搬入了城市。`
            : `新家庭 (${fam[0].surname}家) 搬入城市！共 ${fam.length} 人。`;
            
        this.addLog(null, logMsg, "sys");
        this.notify();
    }

    static spawnSingle() {
        this.spawnFamily(1);
    }
}

// ---------------- Game Loop Functions ----------------

export function initGame() {
    GameStore.sims = [];
    GameStore.particles = [];
    GameStore.logs = []; 
    GameStore.time = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };

    GameStore.rebuildWorld(true); 

    if (GameStore.loadGame(1,true)) {
        GameStore.addLog(null, "自动读取存档 1 成功", "sys");
    } else {
        GameStore.addLog(null, "正在初始化新城市人口...", "sys");
        
        GameStore.spawnSingle();
        GameStore.spawnSingle();
        GameStore.spawnFamily();
        GameStore.spawnFamily();

        GameStore.addLog(null, `新世界已生成！当前人口: ${GameStore.sims.length}`, "sys");
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