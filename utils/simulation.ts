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

export class GameStore {
    static sims: Sim[] = [];
    static particles: { x: number; y: number; life: number }[] = [];
    
    // [设置] 默认速度调整为 2 (30FPS下，每帧加2 -> 30帧加60 -> 1秒=1游戏分钟)
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

    // [Editor] 历史记录堆栈
    static history: EditorAction[] = [];
    static redoStack: EditorAction[] = [];
    
    // [Editor] 暂存快照 (用于取消操作)
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

    static subscribe(cb: () => void) {
        this.listeners.push(cb);
        return () => { this.listeners = this.listeners.filter(l => l !== cb); };
    }

    static notify() {
        this.listeners.forEach(cb => cb());
    }

    static removeSim(id: string) {
        this.sims = this.sims.filter(s => s.id !== id);
        if (this.selectedSimId === id) this.selectedSimId = null;
        this.notify();
    }

    // 重建世界
    static rebuildWorld(initial = false) {
        if (initial) {
            this.worldLayout = JSON.parse(JSON.stringify(WORLD_LAYOUT));
        }

        this.rooms = [];
        this.housingUnits = [];
        
        // 每次 rebuild 都会重新生成 plot 下的家具，所以只保留 custom furniture
        const persistentFurniture = this.furniture.filter(f => 
            f.id.startsWith('custom_') || 
            f.id.startsWith('vending_') || 
            f.id.startsWith('trash_') || 
            f.id.startsWith('hydrant_')
        );
        this.furniture = persistentFurniture;

        if (initial) {
             // @ts-ignore
             this.furniture.push(...STREET_PROPS);
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

    // === [NEW] 归属权刷新逻辑 ===
    // 遍历所有 custom 家具，检测它们是否在某个 HousingUnit 内，如果是，将 homeId 写入家具数据中
    static refreshFurnitureOwnership() {
        this.furniture.forEach(f => {
            // 仅处理用户放置的自定义家具 (custom_ 开头)
            if (f.id.startsWith('custom_')) {
                // 计算家具中心点
                const cx = f.x + f.w / 2;
                const cy = f.y + f.h / 2;

                const ownerUnit = this.housingUnits.find(u => {
                    // maxX/maxY 是 instantiatePlot 时计算并附加的，如果没有则实时计算
                    const maxX = u.maxX ?? (u.x + u.area.w);
                    const maxY = u.maxY ?? (u.y + u.area.h);
                    return cx >= u.x && cx < maxX && cy >= u.y && cy < maxY;
                });
                
                if (ownerUnit) {
                    f.homeId = ownerUnit.id;
                } else {
                    delete f.homeId;
                }
            }
        });
        console.log("[System] Furniture ownership refreshed.");
    }

    // === Editor Transaction Logic ===

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
        this.refreshFurnitureOwnership(); // [新增] 确认编辑后主动刷新一次归属权
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
        if (!confirm('确定要清空所有地皮和家具吗？(此操作不可撤销，除非点击取消退出编辑器)')) return;

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

        if (action.type === 'move') {
            if (action.entityType === 'plot') {
                const plot = this.worldLayout.find(p => p.id === action.id);
                if (plot && action.prevData) {
                    plot.x = action.prevData.x;
                    plot.y = action.prevData.y;
                    this.rebuildWorld(false); 
                }
            } else if (action.entityType === 'furniture') {
                const furn = this.furniture.find(f => f.id === action.id);
                if (furn && action.prevData) {
                    furn.x = action.prevData.x;
                    furn.y = action.prevData.y;
                }
            }
        } else if (action.type === 'add') {
            if (action.entityType === 'plot') {
                this.removePlot(action.id, false);
            } else {
                this.removeFurniture(action.id, false);
            }
        } else if (action.type === 'remove') {
            if (action.entityType === 'plot' && action.prevData) {
                this.worldLayout.push(action.prevData);
                this.rebuildWorld(false);
            } else if (action.entityType === 'furniture' && action.prevData) {
                this.furniture.push(action.prevData);
            }
        }
        this.initIndex();
        this.notify();
    }

    static redo() {
        const action = this.redoStack.pop();
        if (!action) return;
        this.history.push(action);

        if (action.type === 'move') {
            if (action.entityType === 'plot') {
                const plot = this.worldLayout.find(p => p.id === action.id);
                if (plot && action.newData) {
                    plot.x = action.newData.x;
                    plot.y = action.newData.y;
                    this.rebuildWorld(false);
                }
            } else if (action.entityType === 'furniture') {
                const furn = this.furniture.find(f => f.id === action.id);
                if (furn && action.newData) {
                    furn.x = action.newData.x;
                    furn.y = action.newData.y;
                }
            }
        } else if (action.type === 'add') {
            if (action.entityType === 'plot' && action.newData) {
                this.worldLayout.push(action.newData);
                this.rebuildWorld(false);
            } else if (action.entityType === 'furniture' && action.newData) {
                this.furniture.push(action.newData);
            }
        } else if (action.type === 'remove') {
            if (action.entityType === 'plot') {
                this.removePlot(action.id, false);
            } else {
                this.removeFurniture(action.id, false);
            }
        }
        this.initIndex();
        this.notify();
    }

    static isColliding(rect1: {x:number, y:number, w:number, h:number}, rect2: {x:number, y:number, w:number, h:number}) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    }

    static checkOverlap(item: {x:number, y:number, w:number, h:number, id?:string}, type: 'plot' | 'furniture', skipCheck: boolean = false): boolean {
        if (skipCheck) return false;

        if (type === 'plot') {
            for (const p of this.worldLayout) {
                if (p.id === item.id) continue;
                const tpl = PLOTS[p.templateId];
                if (!tpl) continue;
                if (this.isColliding(item, {x: p.x, y: p.y, w: tpl.width, h: tpl.height})) {
                    return true;
                }
            }
        }
        
        if (type === 'furniture') {
            for (const f of this.furniture) {
                if (f.id === item.id) continue;
                if (this.isColliding(item, f)) return true;
            }
        }
        return false;
    }

    // === Actions ===

    static startPlacingPlot(templateId: string) {
        this.editor.mode = 'plot';
        this.editor.placingTemplateId = templateId;
        this.editor.placingFurniture = null;
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.editor.isDragging = true; 
        this.notify();
    }

    static startPlacingFurniture(template: Partial<Furniture>) {
        this.editor.mode = 'furniture';
        this.editor.placingFurniture = template;
        this.editor.placingTemplateId = null;
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.editor.isDragging = true;
        this.notify();
    }

    static placePlot(x: number, y: number) {
        const templateId = this.editor.placingTemplateId;
        if (!templateId) return;
        
        const tpl = PLOTS[templateId];
        if (!tpl) return;

        const newId = `plot_${Date.now()}`;
        const newPlot: WorldPlot = {
            id: newId,
            templateId: templateId,
            x: x,
            y: y
        };
        
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
            x: x,
            y: y
        } as Furniture;
        
        this.recordAction({ type: 'add', entityType: 'furniture', id: newItem.id, newData: newItem });

        this.furniture.push(newItem);
        this.initIndex();
        this.refreshFurnitureOwnership(); // [新增] 放置家具后刷新归属权
        
        this.editor.placingFurniture = null;
        this.editor.isDragging = false;
        this.notify();
    }

    static removePlot(plotId: string, record = true) {
        const plot = this.worldLayout.find(p => p.id === plotId);
        if (!plot) return;

        if (record) {
            this.recordAction({ type: 'remove', entityType: 'plot', id: plotId, prevData: plot });
        }

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
            if (plot) {
                if (plot.x !== x || plot.y !== y) {
                    plot.x = x;
                    plot.y = y;
                    hasChange = true;
                    this.rebuildWorld(false); 
                }
            }
        } else {
            const furn = this.furniture.find(f => f.id === id);
            if (furn) {
                if (furn.x !== x || furn.y !== y) {
                    furn.x = x;
                    furn.y = y;
                    hasChange = true;
                }
            }
        }

        if (hasChange) {
            this.recordAction({
                type: 'move',
                entityType,
                id,
                prevData: startPos, 
                newData: { x, y } 
            });
            this.initIndex();
            this.refreshFurnitureOwnership(); // [新增] 移动后刷新归属权
        }
        
        this.editor.previewPos = null;
        this.notify();
    }

    static removeFurniture(id: string, record = true) {
        const item = this.furniture.find(f => f.id === id);
        if (!item) return;

        if (record) {
            this.recordAction({ type: 'remove', entityType: 'furniture', id, prevData: item });
        }

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
        
        console.log(`[System] Indexes Built.`);
    }

    static spawnHeart(x: number, y: number) {
        this.particles.push({ x, y, life: 1.0 });
    }

    static addLog(sim: Sim | null, text: string, type: any, isAI = false) {
        const timeStr = `Y${this.time.year} M${this.time.month} | ${String(this.time.hour).padStart(2, '0')}:${String(this.time.minute).padStart(2, '0')}`;
        let category: 'sys' | 'chat' | 'rel' = 'chat';
        if (type === 'sys' || type === 'money' || type === 'family') category = 'sys';
        else if (type === 'rel_event' || type === 'jealous') category = 'rel';
        else if (type === 'love') category = 'rel';

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

    static saveGame() {
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
            version: 2.6, // [修改] 升级存档版本以强制重置地图布局
            time: this.time,
            logs: this.logs,
            sims: safeSims,
            worldLayout: this.worldLayout,
            customFurniture: this.furniture.filter(f => f.id.startsWith('custom_')) 
        };

        try {
            localStorage.setItem('pixel_life_save_v1', JSON.stringify(saveData));
            console.log("Game Saved.");
        } catch (e) {
            console.error("Save failed", e);
        }
    }

    static loadGame(): boolean {
        try {
            const json = localStorage.getItem('pixel_life_save_v1');
            if (!json) return false;
            const data = JSON.parse(json);
            // [修改] 检查版本号，如果低于 2.6 则强制重置地图布局
            if (!data.version || data.version < 2.6) {
                 console.warn("Save version too old, migrating map layout...");
                 // 仅保留角色数据和时间，丢弃旧的 worldLayout
                 this.time = { ...data.time };
                 this.logs = data.logs || [];
                 // 强制使用新的默认布局
                 this.worldLayout = JSON.parse(JSON.stringify(WORLD_LAYOUT));
                 // 保留用户自定义家具 (如果位置合理)
                 if (data.customFurniture) {
                     this.furniture = data.customFurniture;
                 }
                 // 加载角色
                 this.loadSims(data.sims);
                 
                 this.rebuildWorld(false);
                 return true;
            }

            this.time = { ...data.time };
            this.logs = data.logs || [];
            
            if (data.worldLayout) {
                this.worldLayout = data.worldLayout;
                if (data.customFurniture) {
                    this.furniture = data.customFurniture;
                }
                this.rebuildWorld(false); 
            }

            this.loadSims(data.sims);
            this.notify();
            return true;
        } catch (e) {
            console.error("Load failed", e);
            return false;
        }
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

    static clearSave() {
        if (confirm('确定要删除存档并重置世界吗？\n这将清除当前进度并刷新页面。')) {
            localStorage.removeItem('pixel_life_save_v1');
            location.reload();
        }
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

    if (r < 0.15) {
        wealthClass = 'rich';
        baseMoney = 10000 + Math.floor(Math.random() * 20000); 
    } else if (r < 0.8) {
        wealthClass = 'middle';
        baseMoney = 2500 + Math.floor(Math.random() * 6500); 
    } else {
        wealthClass = 'poor';
        baseMoney = 1000 + Math.floor(Math.random() * 500); 
    }

    let targetHomeTypes: string[] = [];
    if (wealthClass === 'rich') targetHomeTypes = ['villa', 'apartment']; 
    else if (wealthClass === 'middle') targetHomeTypes = ['apartment', 'public_housing']; 
    else targetHomeTypes = ['public_housing']; 

    const availableHomes = GameStore.housingUnits.filter(unit => {
        const occupants = GameStore.sims.filter(s => s.homeId === unit.id).length;
        return targetHomeTypes.includes(unit.type) && (occupants + count <= unit.capacity);
    });

    availableHomes.sort((a, b) => {
        const idxA = targetHomeTypes.indexOf(a.type);
        const idxB = targetHomeTypes.indexOf(b.type);
        return idxA - idxB;
    });

    let homeId: string | null = null;
    let homeX = 100 + Math.random() * (CONFIG.CANVAS_W - 200);
    let homeY = 400 + Math.random() * (CONFIG.CANVAS_H - 500);
    let homeTypeStr = "露宿街头";

    if (availableHomes.length > 0) {
        const bestType = availableHomes[0].type;
        const bestHomes = availableHomes.filter(h => h.type === bestType);
        const home = bestHomes[Math.floor(Math.random() * bestHomes.length)];
        
        homeId = home.id;
        homeX = home.x + home.area.w / 2;
        homeY = home.y + home.area.h / 2;
        homeTypeStr = home.name;
    }

    const getSurname = () => SURNAMES[Math.floor(Math.random() * SURNAMES.length)];

    const members: Sim[] = [];

    const parentCount = (count > 1 && Math.random() > 0.3) ? 2 : 1; 
    const isSameSex = parentCount === 2 && Math.random() < 0.1; 
    
    const p1Gender: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
    let p2Gender: 'M' | 'F' = p1Gender === 'M' ? 'F' : 'M';
    if (isSameSex) p2Gender = p1Gender;

    const p1Surname = getSurname();
    const parent1 = new Sim({ 
        x: homeX, y: homeY, 
        surname: p1Surname, familyId, ageStage: 'Adult', gender: p1Gender, homeId,
        money: baseMoney 
    });
    members.push(parent1);

    let parent2: Sim | null = null;
    if (parentCount === 2) {
        const p2Surname = getSurname(); 
        parent2 = new Sim({ 
            x: homeX + 10, y: homeY + 10, 
            surname: p2Surname, familyId, ageStage: 'Adult', gender: p2Gender, homeId,
            money: 0 
        });
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
            x: homeX + (i+1)*15, 
            y: homeY + 15, 
            surname: childSurname, 
            familyId, 
            ageStage,
            homeId, 
            fatherId: p1Gender === 'M' ? parent1.id : (parent2 && p2Gender === 'M' ? parent2.id : undefined),
            motherId: p1Gender === 'F' ? parent1.id : (parent2 && p2Gender === 'F' ? parent2.id : undefined),
            money: 0
        });
        
        members.forEach(p => {
            if (p.ageStage === 'Adult') {
                SocialLogic.setKinship(p, child, 'child');
                SocialLogic.setKinship(child, p, 'parent');
                p.childrenIds.push(child.id);
            } else {
                SocialLogic.setKinship(p, child, 'sibling');
                SocialLogic.setKinship(child, p, 'sibling');
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
    // 确保初始化时速度也是 2
    GameStore.time = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };

    GameStore.rebuildWorld(true); 

    if (GameStore.loadGame()) {
        GameStore.addLog(null, "存档读取成功", "sys");
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

        // 触发市民的“分钟级”更新 (minuteChanged = true)
        // 优化：将大量低频逻辑放入这里，而不是每一帧都执行
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
                    s.dailyExpense = 0;
                    s.dailyIncome = 0; 
                    s.payRent(); 
                    
                    s.calculateDailyBudget(); 
                    s.applyMonthlyEffects(currentMonth, holiday);
                });
                
                GameStore.saveGame();
            }
        }
        GameStore.notify();
    }
}

async function handleDailyDiaries(monthIndex: number) {
    // 日记生成逻辑保持精简以适应上下文长度限制
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