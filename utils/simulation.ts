import { PALETTES, HOLIDAYS, BUFFS, JOBS, CONFIG, SURNAMES } from '../constants'; 
import { PLOTS } from '../data/plots'; 
import { WORLD_LAYOUT, STREET_PROPS } from '../data/world'; 
import { LogEntry, GameTime, Job, Furniture, RoomDef, HousingUnit, WorldPlot, EditorState } from '../types';
import { Sim } from './Sim';
import { SpatialHashGrid } from './spatialHash';
import { PathFinder } from './pathfinding'; 
import { batchGenerateDiaries } from '../services/geminiService'; 
import { SocialLogic } from './logic/social';

export { Sim } from './Sim';
export { minutes, getJobCapacity } from './simulationHelpers';
export { drawAvatarHead } from './render/pixelArt'; 

// 编辑器操作接口
interface EditorAction {
    type: 'add' | 'remove' | 'move';
    entityType: 'plot' | 'furniture';
    id: string;
    prevData?: any; // 用于撤销
    newData?: any;  // 用于重做
}

// 存档元数据接口
export interface SaveMetadata {
    slot: number;
    timestamp: number;
    timeLabel: string; // "Y1 M2"
    pop: number; // 人口
    realTime: string; // "2023-10-01 12:00"
}

export class GameStore {
    static sims: Sim[] = [];
    static particles: { x: number; y: number; life: number }[] = [];
    
    static time: GameTime = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };
    
    static timeAccumulator: number = 0;
    static logs: LogEntry[] = [];
    static selectedSimId: string | null = null;
    static listeners: (() => void)[] = [];

    // [Editor] 增强的编辑器状态
    static editor: EditorState = {
        mode: 'none',
        selectedPlotId: null,
        selectedFurnitureId: null,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        placingTemplateId: null,
        placingFurniture: null,
        previewPos: null
    };

    static history: EditorAction[] = [];
    static redoStack: EditorAction[] = [];
    
    static snapshot: {
        worldLayout: WorldPlot[];
        furniture: Furniture[];
    } | null = null;

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

    // [新增] 为市民分配住址
    static assignRandomHome(sim: Sim) {
        // 1. 筛选有空位的房源
        const availableHomes = this.housingUnits.filter(unit => {
            const residents = this.sims.filter(s => s.homeId === unit.id).length;
            return residents < unit.capacity;
        });

        if (availableHomes.length === 0) {
            this.showToast("❌ 没有空闲的住处了！");
            return;
        }

        // 2. 简单的财富匹配逻辑 (富人优先住好房，穷人住公租房)
        let candidates = availableHomes;
        if (sim.money > 5000) {
            // 优先别墅或公寓
            const luxury = availableHomes.filter(h => h.type === 'villa' || h.type === 'apartment');
            if (luxury.length > 0) candidates = luxury;
        } else if (sim.money < 2000) {
            // 优先公租房
            const budget = availableHomes.filter(h => h.type === 'public_housing');
            if (budget.length > 0) candidates = budget;
        }

        // 3. 随机选择一个
        const newHome = candidates[Math.floor(Math.random() * candidates.length)];
        
        // 4. 执行搬家
        sim.homeId = newHome.id;
        this.addLog(sim, `搬进了新家：${newHome.name}`, 'life');
        this.showToast(`✅ 已分配住址：${newHome.name}`);

        // 5. 连带搬迁逻辑 (配偶和未成年子女一起搬)
        // 查找配偶
        const partner = this.sims.find(s => s.id === sim.partnerId && sim.relationships[s.id]?.isSpouse);
        if (partner && partner.homeId !== newHome.id) {
            partner.homeId = newHome.id;
            this.addLog(partner, `随配偶搬进了新家`, 'family');
        }

        // 查找未成年子女
        const children = this.sims.filter(s => sim.childrenIds.includes(s.id) && ['Infant', 'Toddler', 'Child', 'Teen'].includes(s.ageStage));
        children.forEach(child => {
            if (child.homeId !== newHome.id) {
                child.homeId = newHome.id;
            }
        });

        // 6. 刷新家具归属权
        this.refreshFurnitureOwnership();
        this.notify();
    }

    // 重建世界：根据代码中的 WORLD_LAYOUT 生成静态地图
    static rebuildWorld(initial = false) {
        // [修复] 仅在初始化或地图为空时重置布局，防止运行时修改被覆盖
        if (initial || this.worldLayout.length === 0) {
            this.worldLayout = JSON.parse(JSON.stringify(WORLD_LAYOUT));
        }

        this.rooms = [];
        this.housingUnits = [];
        
        // [修复] 保留玩家放置的自定义家具 (custom_) 和系统预设 (STREET_PROPS)
        // 这里的逻辑是：如果是全量重建(initial)，则只保留STREET_PROPS
        // 如果是部分重建(运行时)，我们最好不要在这里清空 this.furniture，除非我们确定要重置
        // 鉴于我们修改了 finalizeMove 不再调用 rebuildWorld，这里主要服务于 loadGame 和 initGame
        
        if (initial) {
            this.furniture = [];
            // @ts-ignore
            this.furniture.push(...STREET_PROPS);
        } else {
            // 如果不是 initial，保留现有 custom furniture，重新生成 plot furniture
            // 但这样会很复杂，简单的策略是：rebuildWorld 只在加载和重置时使用
            // 运行时修改使用增量更新
            this.furniture = this.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'));
        }

        this.worldLayout.forEach(plot => {
            GameStore.instantiatePlot(plot);
        });

        this.initIndex();
    }

    static instantiatePlot(plot: WorldPlot) {
        const template = PLOTS[plot.templateId];
        if (!template) return;

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
            const ownerUnit = plotUnits.find(u => 
                absX >= u.x && absX < u.maxX && 
                absY >= u.y && absY < u.maxY
            );
            this.rooms.push({
                ...r,
                id: `${plot.id}_${r.id}`,
                x: absX,
                y: absY,
                homeId: ownerUnit ? ownerUnit.id : undefined
            });
        });

        template.furniture.forEach(f => {
            const absX = f.x + plot.x;
            const absY = f.y + plot.y;
            const ownerUnit = plotUnits.find(u => 
                absX >= u.x && absX < u.maxX && 
                absY >= u.y && absY < u.maxY
            );
            this.furniture.push({
                ...f,
                id: `${plot.id}_${f.id}`,
                x: absX,
                y: absY,
                homeId: ownerUnit ? ownerUnit.id : undefined
            });
        });
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

    // === Editor Logic ===
    static enterEditorMode() {
        this.editor.mode = 'plot'; 
        this.snapshot = {
            worldLayout: JSON.parse(JSON.stringify(this.worldLayout)),
            furniture: JSON.parse(JSON.stringify(this.furniture)) 
        };
        this.history = [];
        this.redoStack = [];
        this.time.speed = 0; 
        this.notify();
    }

    static confirmEditorChanges() {
        this.snapshot = null; 
        this.resetEditorState();
        this.time.speed = 1; 
        this.initIndex(); 
        this.refreshFurnitureOwnership();
        this.notify();
    }

    static cancelEditorChanges() {
        if (this.snapshot) {
            this.worldLayout = this.snapshot.worldLayout;
            const snapshotCustom = this.snapshot.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'));
            this.furniture = [...this.furniture.filter(f => !f.id.startsWith('custom_')), ...snapshotCustom];
            this.rebuildWorld(false); 
        }
        this.snapshot = null;
        this.resetEditorState();
        this.time.speed = 1;
        this.notify();
    }

    static resetEditorState() {
        this.editor.mode = 'none';
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.editor.placingTemplateId = null;
        this.editor.placingFurniture = null;
        this.editor.isDragging = false;
        this.editor.previewPos = null;
    }

    static clearMap() {
        if (this.editor.mode === 'none') return;
        if (!confirm('确定要清空所有地皮和家具吗？')) return;
        this.worldLayout = [];
        this.furniture = []; 
        this.rooms = [];
        this.housingUnits = [];
        this.initIndex();
        this.notify();
    }

    static recordAction(action: EditorAction) {
        this.history.push(action);
        this.redoStack = []; 
        if (this.history.length > 50) this.history.shift(); 
    }

    static undo() {
        const action = this.history.pop();
        if (!action) return;
        this.redoStack.push(action);
        this.applyUndoRedo(action, true);
    }

    static redo() {
        const action = this.redoStack.pop();
        if (!action) return;
        this.history.push(action);
        this.applyUndoRedo(action, false);
    }

    static applyUndoRedo(action: EditorAction, isUndo: boolean) {
        // 简化的 Undo/Redo 处理，复用逻辑
        const data = isUndo ? action.prevData : action.newData;
        const type = isUndo ? (action.type === 'add' ? 'remove' : (action.type === 'remove' ? 'add' : 'move')) : action.type;

        if (type === 'move') {
            if (action.entityType === 'plot') {
                const plot = this.worldLayout.find(p => p.id === action.id);
                // [修复] 这里也使用 finalizeMove 的逻辑会更好，但为了简单，只要 rebuildWorld 不重置 layout 即可
                if (plot && data) { plot.x = data.x; plot.y = data.y; this.rebuildWorld(false); }
            } else {
                const furn = this.furniture.find(f => f.id === action.id);
                if (furn && data) { furn.x = data.x; furn.y = data.y; }
            }
        } else if (type === 'add') {
            if (action.entityType === 'plot' && data) { this.worldLayout.push(data); this.rebuildWorld(false); }
            else if (action.entityType === 'furniture' && data) { this.furniture.push(data); }
        } else if (type === 'remove') {
            if (action.entityType === 'plot') { this.removePlot(action.id, false); }
            else { this.removeFurniture(action.id, false); }
        }
        this.initIndex();
        this.notify();
    }

    static isColliding(rect1: {x:number, y:number, w:number, h:number}, rect2: {x:number, y:number, w:number, h:number}) {
        // 缩小一点判定区域，允许边缘轻微重叠 (margin 5px)
        const m = 5;
        return (
            rect1.x + m < rect2.x + rect2.w - m &&
            rect1.x + rect1.w - m > rect2.x + m &&
            rect1.y + m < rect2.y + rect2.h - m &&
            rect1.y + rect1.h - m > rect2.y + m
        );
    }

    // === Actions ===
    static startPlacingPlot(templateId: string) {
        this.editor.mode = 'plot';
        this.editor.placingTemplateId = templateId;
        this.editor.placingFurniture = null;
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.editor.isDragging = true; 
        
        // [修复] 计算拖拽偏移以居中 (Bug 3)
        const tpl = PLOTS[templateId];
        if (tpl) {
            this.editor.dragOffset = { x: tpl.width / 2, y: tpl.height / 2 };
        } else {
            this.editor.dragOffset = { x: 0, y: 0 };
        }

        this.notify();
    }

    static startPlacingFurniture(template: Partial<Furniture>) {
        this.editor.mode = 'furniture';
        this.editor.placingFurniture = template;
        this.editor.placingTemplateId = null;
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.editor.isDragging = true;

        // [修复] 计算拖拽偏移以居中 (Bug 3)
        this.editor.dragOffset = { 
            x: (template.w || 0) / 2, 
            y: (template.h || 0) / 2 
        };

        this.notify();
    }

    static placePlot(x: number, y: number) {
        const templateId = this.editor.placingTemplateId;
        if (!templateId) return;
        const prefix = templateId.startsWith('road') ? 'road_custom_' : 'plot_';
        const newId = `${prefix}${Date.now()}`;

        const newPlot: WorldPlot = { id: newId, templateId: templateId, x: x, y: y };
        this.recordAction({ type: 'add', entityType: 'plot', id: newId, newData: newPlot });
        this.worldLayout.push(newPlot);
        this.instantiatePlot(newPlot); 
        this.initIndex(); 
        this.editor.placingTemplateId = null;
        this.editor.isDragging = false;
        this.notify();
    }

    static placeFurniture(x: number, y: number) {
        const tpl = this.editor.placingFurniture;
        if (!tpl) return;
        const newItem = {
            ...tpl,
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            x: x, y: y
        } as Furniture;
        this.recordAction({ type: 'add', entityType: 'furniture', id: newItem.id, newData: newItem });
        this.furniture.push(newItem);
        this.initIndex();
        this.refreshFurnitureOwnership();
        this.editor.placingFurniture = null;
        this.editor.isDragging = false;
        this.notify();
    }

    static removePlot(plotId: string, record = true) {
        const plot = this.worldLayout.find(p => p.id === plotId);
        if (!plot) return;
        if (record) this.recordAction({ type: 'remove', entityType: 'plot', id: plotId, prevData: plot });
        this.worldLayout = this.worldLayout.filter(p => p.id !== plotId);
        this.rooms = this.rooms.filter(r => !r.id.startsWith(`${plotId}_`));
        this.furniture = this.furniture.filter(f => !f.id.startsWith(`${plotId}_`));
        this.housingUnits = this.housingUnits.filter(h => !h.id.startsWith(`${plotId}_`));
        this.editor.selectedPlotId = null;
        this.initIndex();
        this.notify();
    }

    static finalizeMove(entityType: 'plot' | 'furniture', id: string, startPos: {x:number, y:number}) {
        if (!this.editor.previewPos) return;
        const { x, y } = this.editor.previewPos;
        let hasChange = false;
        if (entityType === 'plot') {
            const plot = this.worldLayout.find(p => p.id === id);
            if (plot && (plot.x !== x || plot.y !== y)) {
                // [修复] 增量更新地皮位置，而不是重建世界 (Bug 1 & 2)
                const dx = x - plot.x;
                const dy = y - plot.y;
                
                plot.x = x; 
                plot.y = y; 
                
                // 更新所有子实体
                this.rooms.forEach(r => { if(r.id.startsWith(`${id}_`)) { r.x += dx; r.y += dy; } });
                this.furniture.forEach(f => { if(f.id.startsWith(`${id}_`)) { f.x += dx; f.y += dy; } });
                this.housingUnits.forEach(u => { 
                    if(u.id.startsWith(`${id}_`)) { 
                        u.x += dx; u.y += dy; 
                        if(u.maxX) u.maxX += dx;
                        if(u.maxY) u.maxY += dy;
                    } 
                });

                hasChange = true; 
                // this.rebuildWorld(false); // [Removed] 不再调用重建
            }
        } else {
            const furn = this.furniture.find(f => f.id === id);
            if (furn && (furn.x !== x || furn.y !== y)) {
                furn.x = x; furn.y = y; hasChange = true;
            }
        }
        if (hasChange) {
            this.recordAction({ type: 'move', entityType, id, prevData: startPos, newData: { x, y } });
            this.initIndex();
            this.refreshFurnitureOwnership();

            // [新增] 检查是否有市民正在使用这个被移动的物品
            if (entityType === 'furniture') {
                this.sims.forEach(sim => {
                    if (sim.interactionTarget && sim.interactionTarget.id === id) {
                        // 如果市民正在使用该物品，直接瞬移市民到新位置，避免视觉脱节
                        if (sim.action === 'using' || sim.action === 'working' || sim.action === 'sleeping') {
                            const f = this.furniture.find(i => i.id === id);
                            if (f) {
                                sim.pos.x = f.x + f.w / 2;
                                sim.pos.y = f.y + f.h / 2;
                            }
                        }
                        // 如果市民正在路上，上面的 Sim.update 修复逻辑会自动处理重寻路
                    }
                });
            }
        }
        this.editor.previewPos = null;
        this.notify();
    }

    static removeFurniture(id: string, record = true) {
        const item = this.furniture.find(f => f.id === id);
        if (!item) return;
        if (record) this.recordAction({ type: 'remove', entityType: 'furniture', id, prevData: item });
        this.furniture = this.furniture.filter(f => f.id !== id);
        this.editor.selectedFurnitureId = null;
        this.initIndex();
        this.notify();
    }

    static initIndex() {
        this.furnitureIndex.clear();
        this.worldGrid.clear();
        this.pathFinder.clear(); 

        const passableTypes = ['rug_fancy', 'rug_persian', 'rug_art', 'pave_fancy', 'stripes', 'zebra', 'manhole', 'grass', 'concrete', 'tile', 'wood', 'run_track'];

        this.furniture.forEach(f => {
            if (!this.furnitureIndex.has(f.utility)) {
                this.furnitureIndex.set(f.utility, []);
            }
            this.furnitureIndex.get(f.utility)!.push(f);

            this.worldGrid.insert({
                id: f.id,
                x: f.x,
                y: f.y,
                w: f.w,
                h: f.h,
                type: 'furniture',
                ref: f
            });

            const padding = 4;
            const isPassable = f.pixelPattern && passableTypes.some(t => f.pixelPattern?.includes(t));
            
            if (!isPassable && f.utility !== 'none' && !f.label.includes('地毯')) {
                this.pathFinder.setObstacle(
                    f.x + padding, 
                    f.y + padding, 
                    Math.max(1, f.w - padding * 2), 
                    Math.max(1, f.h - padding * 2)
                );
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

    // ==========================================
    // 💾 存档系统 (Core Data Separation)
    // ==========================================

    // 获取存档列表
    static getSaveSlots(): (SaveMetadata | null)[] {
        const slots: (SaveMetadata | null)[] = [];
        for (let i = 1; i <= 5; i++) {
            try {
                const json = localStorage.getItem(`simgod_save_${i}`);
                if (json) {
                    const data = JSON.parse(json);
                    slots.push({
                        slot: i,
                        timestamp: data.timestamp || 0,
                        timeLabel: `Y${data.time?.year || 1} M${data.time?.month || 1}`,
                        pop: data.sims?.length || 0,
                        realTime: new Date(data.timestamp).toLocaleString()
                    });
                } else {
                    slots.push(null);
                }
            } catch (e) {
                slots.push(null);
            }
        }
        return slots;
    }

    static saveGame(slotIndex: number = 1) {
        // 清理 Sim 中的临时对象，防止循环引用
        const safeSims = this.sims.map(sim => {
            const s = Object.assign({}, sim);
            if (s.interactionTarget && (s.interactionTarget as any).ref) {
                s.interactionTarget = null;
                s.action = 'idle';
                s.target = null;
                // @ts-ignore
                s.path = []; 
                s.bubble = { text: null, timer: 0, type: 'normal' };
            }
            return s;
        });

        const saveData = {
            version: 3.0, // 版本号升级
            timestamp: Date.now(),
            time: this.time,
            logs: this.logs,
            sims: safeSims,
            // [核心数据分离] 不保存 worldLayout, rooms, staticFurniture
            // 只保存玩家摆放的家具 (custom_)
            customFurniture: this.furniture.filter(f => f.id.startsWith('custom_')) 
        };

        try {
            localStorage.setItem(`simgod_save_${slotIndex}`, JSON.stringify(saveData));
            console.log(`Game Saved to Slot ${slotIndex}.`);
            this.showToast(`✅ 存档 ${slotIndex} 保存成功！`);
        } catch (e) {
            console.error("Save failed", e);
            this.showToast(`❌ 保存失败: 存储空间不足?`);
        }
    }

    static loadGame(slotIndex: number = 1): boolean {
        try {
            const json = localStorage.getItem(`simgod_save_${slotIndex}`);
            if (!json) return false;
            const data = JSON.parse(json);

            // 1. 先初始化全新的“代码版”地图 (Core Data Separation)
            // 这会加载最新的 WORLD_LAYOUT, 房间, 和系统家具
            this.rebuildWorld(true);

            // 2. 恢复游戏时间与日志
            this.time = { ...data.time, speed: 1 }; // 加载后暂停或慢速
            this.logs = data.logs || [];

            // 3. 恢复 Sims
            this.loadSims(data.sims);

            // 4. 撒入用户家具 (Conflict Resolution)
            if (data.customFurniture && Array.isArray(data.customFurniture)) {
                let restoredCount = 0;
                let conflictCount = 0;

                data.customFurniture.forEach((cf: Furniture) => {
                    // 检查碰撞：新地图上该位置是否有东西？
                    // 我们主要检查与静态家具的碰撞，以及是否在房间内(可选)
                    
                    // 简单的碰撞检测：尝试在原位放置
                    let isConflict = false;
                    for (const staticF of this.furniture) {
                        if (this.isColliding(cf, staticF)) {
                            isConflict = true;
                            break;
                        }
                    }

                    if (!isConflict) {
                        this.furniture.push(cf);
                        restoredCount++;
                    } else {
                        // 冲突处理策略：尝试在附近找空位 (简单的螺旋搜索，或者直接放弃)
                        // 这里简化为：直接放弃并退款 (或者放入仓库，如果以后有仓库系统)
                        // 也可以尝试偏移几次
                        let placed = false;
                        const offsets = [{x:20,y:0}, {x:-20,y:0}, {x:0,y:20}, {x:0,y:-20}];
                        for (const off of offsets) {
                            const newCf = { ...cf, x: cf.x + off.x, y: cf.y + off.y };
                            let retryConflict = false;
                            for (const staticF of this.furniture) {
                                if (this.isColliding(newCf, staticF)) {
                                    retryConflict = true; break;
                                }
                            }
                            if (!retryConflict) {
                                this.furniture.push(newCf);
                                placed = true;
                                restoredCount++;
                                break;
                            }
                        }
                        if (!placed) conflictCount++;
                    }
                });
                
                if (conflictCount > 0) {
                    this.addLog(null, `地图结构变更，${conflictCount} 件家具因位置冲突被移除。`, 'sys');
                }
            }

            // 5. 刷新索引和归属权
            this.initIndex();
            this.refreshFurnitureOwnership();
            
            this.showToast(`📂 读取存档 ${slotIndex} 成功！`);
            this.notify();
            return true;
        } catch (e) {
            console.error("Load failed", e);
            this.showToast(`❌ 读取存档失败`);
            return false;
        }
    }

    static deleteSave(slotIndex: number) {
        localStorage.removeItem(`simgod_save_${slotIndex}`);
        this.notify();
        this.showToast(`🗑️ 存档 ${slotIndex} 已删除`);
    }

    static loadSims(simsData: any[]) {
        this.sims = simsData.map((sData: any) => {
            const sim = new Sim({ x: sData.pos.x, y: sData.pos.y }); 
            Object.assign(sim, sData);
            if (!sim.childrenIds) sim.childrenIds = [];
            if (!sim.health) sim.health = 100;
            if (!sim.ageStage) sim.ageStage = 'Adult';
            
            if (sim.interactionTarget) sim.interactionTarget = null;
            
            const currentJobDefinition = JOBS.find(j => j.id === sim.job.id);
            if (currentJobDefinition) {
                sim.job = { ...currentJobDefinition };
            }

            return sim;
        });
    }

    static spawnFamily() {
        const size = 1 + Math.floor(Math.random() * 4); 
        const fam = generateFamily(size);
        this.sims.push(...fam);
        this.addLog(null, `新家庭搬入城市！共 ${fam.length} 人。`, "sys");
        this.notify();
    }
}

// ---------------- Helper Functions ----------------

function generateFamily(count: number) {
    const familyId = Math.random().toString(36).substring(2, 8);
    const r = Math.random();
    let wealthClass: 'poor' | 'middle' | 'rich';
    let baseMoney = 0;

    if (r < 0.15) { wealthClass = 'rich'; baseMoney = 10000 + Math.floor(Math.random() * 20000); } 
    else if (r < 0.8) { wealthClass = 'middle'; baseMoney = 2500 + Math.floor(Math.random() * 6500); } 
    else { wealthClass = 'poor'; baseMoney = 1000 + Math.floor(Math.random() * 500); }

    let targetHomeTypes: string[] = wealthClass === 'rich' ? ['villa', 'apartment'] : (wealthClass === 'middle' ? ['apartment', 'public_housing'] : ['public_housing']); 

    const availableHomes = GameStore.housingUnits.filter(unit => {
        const occupants = GameStore.sims.filter(s => s.homeId === unit.id).length;
        return targetHomeTypes.includes(unit.type) && (occupants + count <= unit.capacity);
    });

    availableHomes.sort((a, b) => targetHomeTypes.indexOf(a.type) - targetHomeTypes.indexOf(b.type));

    let homeId: string | null = null;
    let homeX = 100 + Math.random() * (CONFIG.CANVAS_W - 200);
    let homeY = 400 + Math.random() * (CONFIG.CANVAS_H - 500);

    if (availableHomes.length > 0) {
        const bestType = availableHomes[0].type;
        const bestHomes = availableHomes.filter(h => h.type === bestType);
        const home = bestHomes[Math.floor(Math.random() * bestHomes.length)];
        homeId = home.id;
        homeX = home.x + home.area.w / 2;
        homeY = home.y + home.area.h / 2;
    }

    const getSurname = () => SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const members: Sim[] = [];
    const parentCount = (count > 1 && Math.random() > 0.3) ? 2 : 1; 
    const isSameSex = parentCount === 2 && Math.random() < 0.1; 
    
    const p1Gender: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
    let p2Gender: 'M' | 'F' = p1Gender === 'M' ? 'F' : 'M';
    if (isSameSex) p2Gender = p1Gender;

    const p1Surname = getSurname();
    const parent1 = new Sim({ x: homeX, y: homeY, surname: p1Surname, familyId, ageStage: 'Adult', gender: p1Gender, homeId, money: baseMoney });
    members.push(parent1);

    let parent2: Sim | null = null;
    if (parentCount === 2) {
        const p2Surname = getSurname(); 
        parent2 = new Sim({ x: homeX + 10, y: homeY + 10, surname: p2Surname, familyId, ageStage: 'Adult', gender: p2Gender, homeId, money: 0 });
        members.push(parent2);
        SocialLogic.marry(parent1, parent2, true); 
    }

    const childCount = count - parentCount;
    for (let i = 0; i < childCount; i++) {
        const r = Math.random();
        const ageStage = r > 0.6 ? 'Child' : (r > 0.3 ? 'Teen' : 'Toddler');
        let childSurname = p1Surname;
        if (parent2 && Math.random() > 0.5) childSurname = parent2.surname;
        const child = new Sim({ 
            x: homeX + (i+1)*15, y: homeY + 15, surname: childSurname, familyId, ageStage, homeId, 
            fatherId: p1Gender === 'M' ? parent1.id : (parent2 && p2Gender === 'M' ? parent2.id : undefined),
            motherId: p1Gender === 'F' ? parent1.id : (parent2 && p2Gender === 'F' ? parent2.id : undefined),
            money: 0
        });
        
        members.forEach(p => {
            if (p.ageStage === 'Adult') {
                SocialLogic.setKinship(p, child, 'child'); SocialLogic.setKinship(child, p, 'parent'); p.childrenIds.push(child.id);
            } else {
                SocialLogic.setKinship(p, child, 'sibling'); SocialLogic.setKinship(child, p, 'sibling');
            }
        });
        members.push(child);
    }
    return members;
}

export function initGame() {
    GameStore.sims = [];
    GameStore.particles = [];
    GameStore.logs = []; 
    GameStore.time = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };

    GameStore.rebuildWorld(true); 

    // 尝试加载存档1，如果失败则生成新世界
    if (GameStore.loadGame(1)) {
        GameStore.addLog(null, "自动读取存档 1 成功", "sys");
    } else {
        const familyCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < familyCount; i++) {
            const size = 1 + Math.floor(Math.random() * 4); 
            const fam = generateFamily(size);
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
                const currentSimMonth = GameStore.time.totalDays; 
                handleDailyDiaries(currentSimMonth);

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
                
                // 自动保存到 Slot 1
                GameStore.saveGame(1);
            }
        }
        GameStore.notify();
    }
}

async function handleDailyDiaries(monthIndex: number) {
    const allSimsData = GameStore.sims.map(sim => sim.getDaySummary(monthIndex));
    const currentMonth = GameStore.time.month;
    const holiday = HOLIDAYS[currentMonth];
    let contextStr = `现在的季节是 ${currentMonth}月。`;
    if (holiday) contextStr += ` 本月是【${holiday.name}】(${holiday.type})，全城都在过节！`;
    const BATCH_SIZE = 5;
    for (let i = 0; i < allSimsData.length; i += BATCH_SIZE) {
        const batch = allSimsData.slice(i, i + BATCH_SIZE);
        try {
            const diariesMap = await batchGenerateDiaries(batch, contextStr);
            Object.entries(diariesMap).forEach(([simId, diaryContent]) => {
                const sim = GameStore.sims.find(s => s.id === simId);
                if (sim) sim.addDiary(diaryContent);
            });
        } catch (error) { console.error("[AI] 批次生成失败:", error); }
    }
    GameStore.addLog(null, `第 ${monthIndex} 月的市民日记已生成完毕。`, 'sys', true);
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