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
        dragOffset: { x: 0, y: 0 }
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

    // 重建世界：将地皮数据转化为绝对坐标数据
    static rebuildWorld(initial = false) {
        if (initial) {
            this.worldLayout = JSON.parse(JSON.stringify(WORLD_LAYOUT));
        }

        this.rooms = [];
        this.furniture = [];
        this.housingUnits = [];
        
        // 1. 添加基础设施 (现在全部是 Plot)
        // 旧代码: this.rooms.push(...ROADS); 已废弃

        // 2. 遍历地皮配置
        this.worldLayout.forEach(plot => {
            GameStore.instantiatePlot(plot);
        });

        // 3. 添加全局独立家具 (STREET_PROPS)
        // 注意：如果是编辑器添加的家具，已经存在于 this.furniture 中? 
        // 不，instantiatePlot 只处理 plot 内部的。
        // 我们需要把独立的 props 也加上。如果是初始加载，把 STREET_PROPS 加进去。
        // 如果是后续重建，this.furniture 应该包含所有东西？
        // 不，每次 rebuild 都会清空 furniture。所以我们需要一种方式持久化独立家具。
        // 简单方案：initial 时加载 props，后续 addFurniture 会直接 push 到 this.furniture。
        // 但 rebuild 会清空 furniture，所以我们需要一个 persistentFurniture 列表。
        // 为了简化，我们假设 Editor 模式下的 addFurniture 是添加 "独立家具"，
        // 而 instantiatePlot 是从 template 生成 "绑定家具"。
        // 我们需要一个地方存储这些独立家具的数据源。
        // 这里暂时简化：独立家具一旦添加，就只在运行时存在，rebuild 时不清空它们？
        // 更好的做法：rebuild 时，先清空，然后重新实例化所有 plot，再把 "独立家具列表" 加回来。
        // 目前我们没有独立家具列表，直接存在 this.furniture。
        // 所以 rebuildWorld 在非 initial 时，不能简单清空 furniture。
        // 修改策略：将 furniture 分为 "来自Plot" 和 "独立放置"。
        // 暂时只在 initial 时加载 STREET_PROPS。后续新增的家具，如果不归属 Plot，需要保留。
        
        if (initial) {
             // @ts-ignore
             this.furniture.push(...STREET_PROPS);
        } else {
            // 如果不是初始加载，我们需要保留那些 id 以前缀 "custom_" 开头或者是 STREET_PROPS 的家具
            // 但这样有点复杂。
            // 让我们采用简单的方案：this.furniture 包含所有。
            // 当 rebuildWorld 被调用时（比如 addPlot），我们保留 custom furniture。
            const customFurniture = this.furniture.filter(f => !f.id.includes('_') || f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'));
            this.furniture = customFurniture; 
            // 注意：这会导致非 custom 的家具被清空，然后由下面的 instantiatePlot 重新生成。这是对的。
        }

        console.log(`[System] World Rebuilt. Rooms: ${this.rooms.length}, Furniture: ${this.furniture.length}`);
        
        this.initIndex();
    }

    static instantiatePlot(plot: WorldPlot) {
        const template = PLOTS[plot.templateId];
        if (!template) {
            // console.error(`Plot template not found: ${plot.templateId}`);
            return;
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

    // === Editor Transaction Logic ===

    static enterEditorMode() {
        this.editor.mode = 'plot'; // 默认模式
        // 创建快照
        this.snapshot = {
            worldLayout: JSON.parse(JSON.stringify(this.worldLayout)),
            furniture: JSON.parse(JSON.stringify(this.furniture)) // 这里主要为了保存 custom furniture
        };
        this.history = [];
        this.redoStack = [];
        this.time.speed = 0; // 暂停游戏
        this.notify();
    }

    static confirmEditorChanges() {
        this.snapshot = null; // 清除快照，确认修改
        this.editor.mode = 'none';
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.time.speed = 1; // 恢复游戏
        this.initIndex(); // 确保索引最新
        this.notify();
    }

    static cancelEditorChanges() {
        if (this.snapshot) {
            // 恢复快照
            this.worldLayout = this.snapshot.worldLayout;
            // 恢复家具需要小心，因为 instantiatePlot 会重新生成 plot furniture
            // 我们只需要恢复 custom furniture
            // 简单做法：直接全量恢复快照的 furniture，然后 rebuildWorld 会处理好
            // 但 rebuildWorld 会重新生成 plot furniture。
            // 所以我们其实只需要恢复 worldLayout，并且把 custom furniture 还原。
            
            // 重新全量构建
            this.rebuildWorld(false); 
            // 此时 this.furniture 包含 plot furniture + current custom (which is none if we rebuilt from clean slate?)
            // 我们的 rebuildWorld 逻辑是保留 "existing custom"。
            // 所以我们需要把 snapshot 里的 custom furniture 提取出来赋值给 this.furniture
            const snapshotCustom = this.snapshot.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'));
            this.furniture = [...this.furniture.filter(f => !f.id.startsWith('custom_')), ...snapshotCustom];
            
            // 再跑一次 rebuild 确保顺序或者索引正确? 其实不需要，只要索引正确。
            this.initIndex();
        }
        this.snapshot = null;
        this.editor.mode = 'none';
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.time.speed = 1;
        this.notify();
    }

    static clearMap() {
        if (this.editor.mode === 'none') return;
        
        // 记录操作用于撤销 (这是一个破坏性操作，记录所有数据量太大，暂时仅支持清空 Layout)
        // 简化：Clear 操作不可撤销，或者只能通过 Cancel 恢复
        if (!confirm('确定要清空所有地皮和家具吗？(此操作不可撤销，除非点击取消退出编辑器)')) return;

        this.worldLayout = [];
        this.furniture = []; // 清空所有
        this.rooms = [];
        this.housingUnits = [];
        
        this.initIndex();
        this.notify();
    }

    // === Undo / Redo ===

    static recordAction(action: EditorAction) {
        this.history.push(action);
        this.redoStack = []; // 新操作清空重做栈
        if (this.history.length > 50) this.history.shift(); // 限制步数
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
                    this.rebuildWorld(false); // 必须重建以移动所有子组件
                }
            } else if (action.entityType === 'furniture') {
                const furn = this.furniture.find(f => f.id === action.id);
                if (furn && action.prevData) {
                    furn.x = action.prevData.x;
                    furn.y = action.prevData.y;
                }
            }
        } else if (action.type === 'add') {
            // 撤销添加 -> 删除
            if (action.entityType === 'plot') {
                this.removePlot(action.id, false); // false = don't record history
            } else {
                this.removeFurniture(action.id, false);
            }
        } else if (action.type === 'remove') {
            // 撤销删除 -> 恢复
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
            // 重做添加
            if (action.entityType === 'plot' && action.newData) {
                this.worldLayout.push(action.newData);
                this.rebuildWorld(false);
            } else if (action.entityType === 'furniture' && action.newData) {
                this.furniture.push(action.newData);
            }
        } else if (action.type === 'remove') {
            // 重做删除
            if (action.entityType === 'plot') {
                this.removePlot(action.id, false);
            } else {
                this.removeFurniture(action.id, false);
            }
        }
        this.initIndex();
        this.notify();
    }

    // === Collision Detection ===

    // 检测矩形碰撞
    static isColliding(rect1: {x:number, y:number, w:number, h:number}, rect2: {x:number, y:number, w:number, h:number}) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    }

    static checkOverlap(item: {x:number, y:number, w:number, h:number, id?:string}, type: 'plot' | 'furniture'): boolean {
        // 1. Plot vs Plot
        if (type === 'plot') {
            for (const p of this.worldLayout) {
                if (p.id === item.id) continue;
                // 获取 Plot 的实际宽高 (从 template)
                const tpl = PLOTS[p.templateId];
                if (!tpl) continue;
                if (this.isColliding(item, {x: p.x, y: p.y, w: tpl.width, h: tpl.height})) {
                    return true;
                }
            }
        }
        
        // 2. Furniture vs Furniture
        // 注意：家具只和家具碰撞，不和 Plot 碰撞 (因为家具是在 Plot 上面的)
        // 但根据需求 "地皮和家具不可以重叠"，如果这意味着家具不能放在非 Plot 区域? 不，通常意味着物理碰撞
        // 如果是独立家具，检查是否和其他独立家具碰撞
        if (type === 'furniture') {
            for (const f of this.furniture) {
                if (f.id === item.id) continue;
                if (this.isColliding(item, f)) return true;
            }
        }

        return false;
    }

    // === Actions ===

    static addPlot(templateId: string, x: number, y: number) {
        const tpl = PLOTS[templateId];
        if (!tpl) return;

        // 碰撞检测
        if (this.checkOverlap({x, y, w: tpl.width, h: tpl.height}, 'plot')) {
            alert('位置重叠！无法放置。');
            return;
        }

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
        this.notify();
    }

    static removePlot(plotId: string, record = true) {
        const plot = this.worldLayout.find(p => p.id === plotId);
        if (!plot) return;

        if (record) {
            this.recordAction({ type: 'remove', entityType: 'plot', id: plotId, prevData: plot });
        }

        this.worldLayout = this.worldLayout.filter(p => p.id !== plotId);
        
        // Remove associated entities
        this.rooms = this.rooms.filter(r => !r.id.startsWith(`${plotId}_`));
        this.furniture = this.furniture.filter(f => !f.id.startsWith(`${plotId}_`));
        this.housingUnits = this.housingUnits.filter(h => !h.id.startsWith(`${plotId}_`));

        this.editor.selectedPlotId = null;
        this.initIndex();
        this.notify();
    }

    static movePlot(plotId: string, dx: number, dy: number, finished: boolean = false) {
        const plot = this.worldLayout.find(p => p.id === plotId);
        if (!plot) return;

        const oldX = plot.x;
        const oldY = plot.y;
        const newX = oldX + dx;
        const newY = oldY + dy;

        const tpl = PLOTS[plot.templateId];
        
        // 如果是拖拽结束 (finished=true)，执行碰撞检测和最终移动
        // 如果是拖拽中 (finished=false)，我们只更新显示，不做严格碰撞回弹 (或者做实时变红)
        // 这里的 movePlot 是被 GameCanvas 的 mouseMove 调用的，它是增量移动
        // 为了支持 Undo，我们需要记录"开始拖拽前"的位置。
        // 这通常在 onMouseDown 记录。
        
        // 这里简化：movePlot 只在 finished 时记录 history
        // 但 GameCanvas 调用是每一帧。
        // 我们修改 GameCanvas 逻辑：拖拽结束时调用一个 `finalizeMove`。
        
        // 暂时保持简单：实时移动，不做碰撞阻止 (让用户自己看着办)，或者在松手时检测重叠并弹回？
        // 需求是 "不可以重叠"。
        // 实时检测：如果新位置重叠，禁止移动？
        
        if (this.checkOverlap({ id: plotId, x: newX, y: newY, w: tpl.width, h: tpl.height }, 'plot')) {
            // 碰撞了，不移动 (简单的阻挡)
            return;
        }

        plot.x = newX;
        plot.y = newY;

        // Sync components
        this.rooms.forEach(r => { if (r.id.startsWith(`${plotId}_`)) { r.x += dx; r.y += dy; } });
        this.furniture.forEach(f => { if (f.id.startsWith(`${plotId}_`)) { f.x += dx; f.y += dy; } });
        this.housingUnits.forEach(h => { 
            if (h.id.startsWith(`${plotId}_`)) { 
                h.x += dx; h.y += dy; 
                if(h.maxX) h.maxX += dx; if(h.maxY) h.maxY += dy; 
            } 
        });

        this.notify();
    }
    
    // [New] 专门用于记录移动结束的动作
    static finalizeMove(entityType: 'plot' | 'furniture', id: string, startPos: {x:number, y:number}) {
        let currentPos = {x:0, y:0};
        if (entityType === 'plot') {
            const p = this.worldLayout.find(x => x.id === id);
            if (p) currentPos = {x: p.x, y: p.y};
        } else {
            const f = this.furniture.find(x => x.id === id);
            if (f) currentPos = {x: f.x, y: f.y};
        }

        if (startPos.x !== currentPos.x || startPos.y !== currentPos.y) {
            this.recordAction({
                type: 'move',
                entityType,
                id,
                prevData: startPos, // 撤销时回到起点
                newData: currentPos // 重做时回到终点
            });
        }
    }

    static addFurniture(itemTemplate: Furniture, x: number, y: number) {
        if (this.checkOverlap({x, y, w: itemTemplate.w, h: itemTemplate.h}, 'furniture')) {
            alert('位置重叠！');
            return;
        }

        const newItem = {
            ...itemTemplate,
            id: `custom_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
            x: x,
            y: y
        };
        
        this.recordAction({ type: 'add', entityType: 'furniture', id: newItem.id, newData: newItem });

        this.furniture.push(newItem);
        this.initIndex();
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

    static moveFurniture(id: string, x: number, y: number) {
        const item = this.furniture.find(f => f.id === id);
        if (!item) return;

        if (this.checkOverlap({ id, x, y, w: item.w, h: item.h }, 'furniture')) {
            return;
        }

        item.x = x;
        item.y = y;
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

            // 碰撞体积构建
            const padding = 4;
            const isPassable = f.pixelPattern && passableTypes.some(t => f.pixelPattern?.includes(t));
            
            // 简单的通行逻辑：如果不是地面装饰，就是障碍物
            // 可以优化：增加 isObstacle 字段
            if (!isPassable && f.utility !== 'none' && !f.label.includes('地毯')) {
                this.pathFinder.setObstacle(
                    f.x + padding, 
                    f.y + padding, 
                    Math.max(1, f.w - padding * 2), 
                    Math.max(1, f.h - padding * 2)
                );
            }
        });
        
        console.log(`[System] Indexes Built. PathFinder ready (${this.pathFinder.cols}x${this.pathFinder.rows}).`);
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

        // 保存当前世界布局
        const saveData = {
            version: 2.5,
            time: this.time,
            logs: this.logs,
            sims: safeSims,
            worldLayout: this.worldLayout,
            customFurniture: this.furniture.filter(f => f.id.startsWith('custom_')) // 只保存自定义家具
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
            if (!data.version || data.version < 2.4) {
                 console.warn("Save too old, resetting.");
                 return false;
            }

            this.time = { ...data.time };
            this.logs = data.logs || [];
            
            // 恢复世界布局
            if (data.worldLayout) {
                this.worldLayout = data.worldLayout;
                this.rebuildWorld(false); // 重建
                // 恢复自定义家具
                if (data.customFurniture) {
                    this.furniture.push(...data.customFurniture);
                    this.initIndex();
                }
            }

            this.sims = data.sims.map((sData: any) => {
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
            this.notify();
            return true;
        } catch (e) {
            console.error("Load failed", e);
            return false;
        }
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

// 按照家庭生成初始人口 (保持不变)
function generateFamily(count: number) {
    const familyId = Math.random().toString(36).substring(2, 8);
    
    // [新逻辑] 1. 随机决定家庭阶级 (贫富差距大)
    const r = Math.random();
    let wealthClass: 'poor' | 'middle' | 'rich';
    let baseMoney = 0;

    if (r < 0.15) {
        wealthClass = 'rich';
        baseMoney = 10000 + Math.floor(Math.random() * 20000); // 1万 - 3万
    } else if (r < 0.8) {
        wealthClass = 'middle';
        baseMoney = 2500 + Math.floor(Math.random() * 6500); // 2500 - 6500
    } else {
        wealthClass = 'poor';
        baseMoney = 1000 + Math.floor(Math.random() * 500); // 1000 - 1500
    }

    // [新逻辑] 2. 根据阶级分配住房
    // 筛选未满员的住房
    let targetHomeTypes: string[] = [];
    if (wealthClass === 'rich') targetHomeTypes = ['villa', 'apartment']; // 富人首选别墅，其次公寓
    else if (wealthClass === 'middle') targetHomeTypes = ['apartment', 'public_housing']; // 中产首选公寓
    else targetHomeTypes = ['public_housing']; // 穷人住公租房/宿舍

    const availableHomes = GameStore.housingUnits.filter(unit => {
        const occupants = GameStore.sims.filter(s => s.homeId === unit.id).length;
        // 匹配类型 且 容量足够
        return targetHomeTypes.includes(unit.type) && (occupants + count <= unit.capacity);
    });

    // 排序：优先匹配首选类型 (数组顺序)
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
        // 优先选最好的
        const bestType = availableHomes[0].type;
        const bestHomes = availableHomes.filter(h => h.type === bestType);
        const home = bestHomes[Math.floor(Math.random() * bestHomes.length)];
        
        homeId = home.id;
        homeX = home.x + home.area.w / 2;
        homeY = home.y + home.area.h / 2;
        homeTypeStr = home.name;
    }

    // 父母各自的姓氏
    const getSurname = () => SURNAMES[Math.floor(Math.random() * SURNAMES.length)];

    const members: Sim[] = [];

    // 1. 生成家长 (1-2人)
    const parentCount = (count > 1 && Math.random() > 0.3) ? 2 : 1; 
    const isSameSex = parentCount === 2 && Math.random() < 0.1; 
    
    const p1Gender: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
    let p2Gender: 'M' | 'F' = p1Gender === 'M' ? 'F' : 'M';
    if (isSameSex) p2Gender = p1Gender;

    const p1Surname = getSurname();
    const parent1 = new Sim({ 
        x: homeX, y: homeY, 
        surname: p1Surname, familyId, ageStage: 'Adult', gender: p1Gender, homeId,
        money: baseMoney // 初始资金由家庭共享(这里赋予户主)
    });
    members.push(parent1);

    let parent2: Sim | null = null;
    if (parentCount === 2) {
        const p2Surname = getSurname(); 
        parent2 = new Sim({ 
            x: homeX + 10, y: homeY + 10, 
            surname: p2Surname, familyId, ageStage: 'Adult', gender: p2Gender, homeId,
            money: 0 // 配偶初始没钱 (或者可以给点私房钱)
        });
        members.push(parent2);
        
        SocialLogic.marry(parent1, parent2, true); 
    }

    // 2. 生成孩子
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
            homeId, // 孩子跟随家庭住址
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

    console.log(`Spawned family [${wealthClass}] at ${homeTypeStr} (${homeId}). Money: ${baseMoney}`);
    return members;
}

export function initGame() {
    GameStore.sims = [];
    GameStore.particles = [];
    GameStore.logs = []; 
    GameStore.time = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };

    GameStore.rebuildWorld(true); // true = initial build

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
    // [Mod] Pause game if in editor mode
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
    console.log(`[AI] 开始生成第 ${monthIndex} 月的市民日记...`);
    
    const allSimsData = GameStore.sims.map(sim => sim.getDaySummary(monthIndex));
    
    const currentMonth = GameStore.time.month;
    const holiday = HOLIDAYS[currentMonth];
    let contextStr = `现在的季节是 ${currentMonth}月。`;
    if (holiday) {
        contextStr += ` 本月是【${holiday.name}】(${holiday.type})，全城都在过节！`;
    }
    const BATCH_SIZE = 5;
    
    for (let i = 0; i < allSimsData.length; i += BATCH_SIZE) {
        const batch = allSimsData.slice(i, i + BATCH_SIZE);
        try {
            const diariesMap = await batchGenerateDiaries(batch, contextStr);
            Object.entries(diariesMap).forEach(([simId, diaryContent]) => {
                const sim = GameStore.sims.find(s => s.id === simId);
                if (sim) {
                    sim.addDiary(diaryContent);
                }
            });
            await new Promise(resolve => setTimeout(resolve, 4000));
        } catch (error) {
            console.error("[AI] 批次生成失败:", error);
        }
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
        // [Mod] Pause updates in editor mode
        if (GameStore.editor.mode === 'none') {
            GameStore.sims.forEach(s => s.update(GameStore.time.speed, false));
        }
    } catch (error) {
        console.error("Game Loop Error:", error);
        GameStore.time.speed = 0; 
        GameStore.notify();
    }
}