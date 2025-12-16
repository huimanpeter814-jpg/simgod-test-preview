import { PALETTES, HOLIDAYS, JOBS, CONFIG, SURNAMES } from '../constants'; 
import { PLOTS } from '../data/plots'; 
import { WORLD_LAYOUT, STREET_PROPS } from '../data/world'; 
import { LogEntry, GameTime, Job, Furniture, RoomDef, HousingUnit, WorldPlot, EditorState, SaveMetadata } from '../types';
import { Sim } from './Sim';
import { SpatialHashGrid } from './spatialHash';
import { PathFinder } from './pathfinding'; 
import { FamilyGenerator } from './logic/genetics';
import { NarrativeSystem } from './logic/narrative';

// Re-exports
export { Sim } from './Sim';
export { minutes, getJobCapacity } from './simulationHelpers';
export { drawAvatarHead } from './render/pixelArt'; 

// 编辑器操作接口
interface EditorAction {
    type: 'add' | 'remove' | 'move' | 'modify';
    entityType: 'plot' | 'furniture' | 'room';
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
        selectedRoomId: null,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        placingTemplateId: null,
        placingFurniture: null,
        drawingFloor: null,
        drawingPlot: null,
        previewPos: null
    };

    static history: EditorAction[] = [];
    static redoStack: EditorAction[] = [];
    
    static snapshot: {
        worldLayout: WorldPlot[];
        furniture: Furniture[];
        rooms: RoomDef[]; 
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

        const children = this.sims.filter(s => sim.childrenIds.includes(s.id) && ['Infant', 'Toddler', 'Child', 'Teen'].includes(s.ageStage));
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

    static getMapData() {
        return {
            version: "1.0",
            timestamp: Date.now(),
            worldLayout: this.worldLayout,
            rooms: this.rooms.filter(r => r.isCustom),
            customFurniture: this.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'))
        };
    }

    static importMapData(data: any) {
        if (!data.worldLayout) { this.showToast("❌ 文件格式错误：缺少地图数据"); return; }
        try {
            this.worldLayout = data.worldLayout;
            this.rebuildWorld(true);
            if (data.rooms) this.rooms = [...this.rooms, ...data.rooms];
            if (data.customFurniture) this.furniture = [...this.furniture, ...data.customFurniture];
            this.initIndex();
            this.refreshFurnitureOwnership();
            this.showToast("✅ 地图导入成功！");
            this.notify();
        } catch (e) {
            console.error("Import failed", e);
            this.showToast("❌ 导入失败，请查看控制台");
        }
    }

    // === Editor Logic ===
    static enterEditorMode() {
        this.editor.mode = 'plot'; 
        this.snapshot = {
            worldLayout: JSON.parse(JSON.stringify(this.worldLayout)),
            furniture: JSON.parse(JSON.stringify(this.furniture)),
            rooms: JSON.parse(JSON.stringify(this.rooms.filter(r => r.isCustom))) 
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
            const existingSystemRooms = this.rooms.filter(r => !r.isCustom);
            this.rooms = [...existingSystemRooms, ...this.snapshot.rooms];
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
        this.editor.selectedRoomId = null;
        this.editor.placingTemplateId = null;
        this.editor.placingFurniture = null;
        this.editor.drawingFloor = null;
        this.editor.drawingPlot = null;
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
        const data = isUndo ? action.prevData : action.newData;
        const type = isUndo ? (action.type === 'add' ? 'remove' : (action.type === 'remove' ? 'add' : (action.type === 'modify' ? 'modify' : 'move'))) : action.type;

        if (type === 'move') {
            if (action.entityType === 'plot') {
                const plot = this.worldLayout.find(p => p.id === action.id);
                if (plot && data) { plot.x = data.x; plot.y = data.y; this.rebuildWorld(false); }
            } else if (action.entityType === 'furniture') {
                const furn = this.furniture.find(f => f.id === action.id);
                if (furn && data) { furn.x = data.x; furn.y = data.y; }
            } else if (action.entityType === 'room') {
                const room = this.rooms.find(r => r.id === action.id);
                if (room && data) { room.x = data.x; room.y = data.y; }
            }
        } else if (type === 'add') {
            if (action.entityType === 'plot' && data) { this.worldLayout.push(data); this.rebuildWorld(false); }
            else if (action.entityType === 'furniture' && data) { this.furniture.push(data); }
            else if (action.entityType === 'room' && data) { this.rooms.push(data); }
        } else if (type === 'remove') {
            if (action.entityType === 'plot') { this.removePlot(action.id, false); }
            else if (action.entityType === 'furniture') { this.removeFurniture(action.id, false); }
            else if (action.entityType === 'room') { this.removeRoom(action.id, false); }
        } else if (type === 'modify') {
            if (action.entityType === 'plot' && data) {
                const plot = this.worldLayout.find(p => p.id === action.id);
                if (plot) {
                    if (data.templateId) plot.templateId = data.templateId;
                    this.rebuildWorld(false);
                }
            }
        }
        this.initIndex();
        this.notify();
    }

    // === Actions ===
    static startPlacingPlot(templateId: string) {
        this.editor.mode = 'plot';
        this.editor.placingTemplateId = templateId;
        this.editor.placingFurniture = null;
        this.editor.drawingFloor = null;
        this.editor.drawingPlot = null;
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.editor.isDragging = true; 
        
        let w = 300, h = 300;
        if (templateId) {
            const tpl = PLOTS[templateId];
            if (tpl) { w = tpl.width; h = tpl.height; }
        }
        this.editor.dragOffset = { x: w / 2, y: h / 2 };
        this.notify();
    }

    static startDrawingPlot(templateId: string = 'default_empty') {
        this.editor.mode = 'plot';
        this.editor.drawingPlot = { startX: 0, startY: 0, currX: 0, currY: 0, templateId };
        this.editor.placingTemplateId = null;
        this.editor.placingFurniture = null;
        this.editor.drawingFloor = null;
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.notify();
    }

    static startPlacingFurniture(template: Partial<Furniture>) {
        this.editor.mode = 'furniture';
        this.editor.placingFurniture = template;
        this.editor.placingTemplateId = null;
        this.editor.drawingFloor = null;
        this.editor.drawingPlot = null;
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.editor.isDragging = true;
        this.editor.dragOffset = { x: (template.w || 0) / 2, y: (template.h || 0) / 2 };
        this.notify();
    }

    static startDrawingFloor(pattern: string, color: string, label: string, hasWall: boolean = false) {
        this.editor.mode = 'floor';
        this.editor.drawingFloor = { startX: 0, startY: 0, currX: 0, currY: 0, pattern, color, label, hasWall };
        this.editor.placingTemplateId = null;
        this.editor.placingFurniture = null;
        this.editor.drawingPlot = null;
        this.editor.selectedPlotId = null;
        this.editor.selectedFurnitureId = null;
        this.editor.selectedRoomId = null;
        this.notify();
    }

    static placePlot(x: number, y: number) {
        const templateId = this.editor.placingTemplateId || 'default_empty';
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

    static createCustomPlot(rect: {x: number, y: number, w: number, h: number}, templateId: string) {
        const newId = `plot_custom_${Date.now()}`;
        const newPlot: WorldPlot = { id: newId, templateId: templateId, x: rect.x, y: rect.y, width: rect.w, height: rect.h };
        this.recordAction({ type: 'add', entityType: 'plot', id: newId, newData: newPlot });
        this.worldLayout.push(newPlot);
        this.instantiatePlot(newPlot);
        this.initIndex();
        this.editor.selectedPlotId = newId;
        this.notify();
    }

    static placeFurniture(x: number, y: number) {
        const tpl = this.editor.placingFurniture;
        if (!tpl) return;
        const newItem = { ...tpl, id: `custom_${Date.now()}_${Math.random().toString(36).substr(2,5)}`, x: x, y: y } as Furniture;
        this.recordAction({ type: 'add', entityType: 'furniture', id: newItem.id, newData: newItem });
        this.furniture.push(newItem);
        this.initIndex();
        this.refreshFurnitureOwnership();
        this.editor.placingFurniture = null;
        this.editor.isDragging = false;
        this.notify();
    }

    static createCustomRoom(rect: {x: number, y: number, w: number, h: number}, pattern: string, color: string, label: string, hasWall: boolean) {
        const newRoom: RoomDef = {
            id: `custom_room_${Date.now()}`,
            x: rect.x, y: rect.y, w: rect.w, h: rect.h,
            label: label, color: color, pixelPattern: pattern, isCustom: true, hasWall: hasWall
        };
        this.recordAction({ type: 'add', entityType: 'room', id: newRoom.id, newData: newRoom });
        this.rooms.push(newRoom);
        this.initIndex();
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

    static removeRoom(roomId: string, record = true) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) return;
        if (record) this.recordAction({ type: 'remove', entityType: 'room', id: roomId, prevData: room });
        this.rooms = this.rooms.filter(r => r.id !== roomId);
        this.editor.selectedRoomId = null;
        this.initIndex();
        this.notify();
    }

    static changePlotTemplate(plotId: string, newTemplateId: string) {
        const plot = this.worldLayout.find(p => p.id === plotId);
        if (!plot) return;
        const oldTemplate = plot.templateId;
        this.recordAction({ type: 'modify', entityType: 'plot', id: plotId, prevData: { templateId: oldTemplate }, newData: { templateId: newTemplateId } });
        plot.templateId = newTemplateId;
        this.rooms = this.rooms.filter(r => !r.id.startsWith(`${plotId}_`));
        this.furniture = this.furniture.filter(f => !f.id.startsWith(`${plotId}_`));
        this.housingUnits = this.housingUnits.filter(h => !h.id.startsWith(`${plotId}_`));
        this.instantiatePlot(plot);
        this.initIndex();
        this.notify();
    }

    static finalizeMove(entityType: 'plot' | 'furniture' | 'room', id: string, startPos: {x:number, y:number}) {
        if (!this.editor.previewPos) return;
        const { x, y } = this.editor.previewPos;
        let hasChange = false;
        
        if (entityType === 'plot') {
            const plot = this.worldLayout.find(p => p.id === id);
            if (plot && (plot.x !== x || plot.y !== y)) {
                const dx = x - plot.x;
                const dy = y - plot.y;
                plot.x = x; plot.y = y; 
                this.rooms.forEach(r => { if(r.id.startsWith(`${id}_`)) { r.x += dx; r.y += dy; } });
                this.furniture.forEach(f => { if(f.id.startsWith(`${id}_`)) { f.x += dx; f.y += dy; } });
                this.housingUnits.forEach(u => { 
                    if(u.id.startsWith(`${id}_`)) { u.x += dx; u.y += dy; if(u.maxX) u.maxX += dx; if(u.maxY) u.maxY += dy; } 
                });
                hasChange = true; 
            }
        } else if (entityType === 'furniture') {
            const furn = this.furniture.find(f => f.id === id);
            if (furn && (furn.x !== x || furn.y !== y)) { furn.x = x; furn.y = y; hasChange = true; }
        } else if (entityType === 'room') {
            const room = this.rooms.find(r => r.id === id);
            if (room && (room.x !== x || room.y !== y)) { room.x = x; room.y = y; hasChange = true; }
        }

        if (hasChange) {
            this.recordAction({ type: 'move', entityType, id, prevData: startPos, newData: { x, y } });
            this.initIndex();
            this.refreshFurnitureOwnership();
            if (entityType === 'furniture') {
                this.sims.forEach(sim => {
                    if (sim.interactionTarget && sim.interactionTarget.id === id) {
                        if (sim.action === 'using' || sim.action === 'working' || sim.action === 'sleeping') {
                            const f = this.furniture.find(i => i.id === id);
                            if (f) { sim.pos.x = f.x + f.w / 2; sim.pos.y = f.y + f.h / 2; }
                        }
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

    // 💾 存档系统
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
                } else { slots.push(null); }
            } catch (e) { slots.push(null); }
        }
        return slots;
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

        const saveData = {
            version: 3.2, 
            timestamp: Date.now(),
            time: this.time,
            logs: this.logs,
            sims: safeSims,
            worldLayout: this.worldLayout,
            rooms: this.rooms.filter(r => r.isCustom),
            customFurniture: this.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_')) 
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