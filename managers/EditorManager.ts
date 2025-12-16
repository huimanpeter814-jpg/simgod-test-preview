import { GameStore } from '../utils/simulation';
import { PLOTS } from '../data/plots';
import { Furniture, WorldPlot, RoomDef, EditorAction, EditorState } from '../types';

export class EditorManager implements EditorState {
    // === 状态 ===
    mode: 'none' | 'plot' | 'furniture' | 'floor' = 'none';
    selectedPlotId: string | null = null;
    selectedFurnitureId: string | null = null;
    selectedRoomId: string | null = null;
    
    isDragging: boolean = false;
    dragOffset: { x: number, y: number } = { x: 0, y: 0 };
    
    placingTemplateId: string | null = null;
    placingFurniture: Partial<Furniture> | null = null;
    
    drawingPlot: {
        startX: number;
        startY: number;
        currX: number;
        currY: number;
        templateId: string;
    } | null = null;

    drawingFloor: {
        startX: number;
        startY: number;
        currX: number;
        currY: number;
        pattern: string;
        color: string;
        label: string;
        hasWall: boolean;
    } | null = null;

    previewPos: { x: number, y: number } | null = null;

    // 历史记录
    history: EditorAction[] = [];
    redoStack: EditorAction[] = [];
    
    // 快照 (用于取消操作)
    snapshot: {
        worldLayout: WorldPlot[];
        furniture: Furniture[];
        rooms: RoomDef[]; 
    } | null = null;

    // === 核心逻辑 ===

    enterEditorMode() {
        this.mode = 'plot'; 
        this.snapshot = {
            worldLayout: JSON.parse(JSON.stringify(GameStore.worldLayout)),
            furniture: JSON.parse(JSON.stringify(GameStore.furniture)),
            rooms: JSON.parse(JSON.stringify(GameStore.rooms.filter(r => r.isCustom))) 
        };
        this.history = [];
        this.redoStack = [];
        GameStore.time.speed = 0; 
        GameStore.notify();
    }

    confirmChanges() {
        this.snapshot = null; 
        this.resetState();
        GameStore.time.speed = 1; 
        GameStore.initIndex(); 
        GameStore.refreshFurnitureOwnership();
        GameStore.notify();
    }

    cancelChanges() {
        if (this.snapshot) {
            GameStore.worldLayout = this.snapshot.worldLayout;
            const snapshotCustom = this.snapshot.furniture.filter(f => f.id.startsWith('custom_') || f.id.startsWith('vending_') || f.id.startsWith('trash_') || f.id.startsWith('hydrant_'));
            GameStore.furniture = [...GameStore.furniture.filter(f => !f.id.startsWith('custom_')), ...snapshotCustom];
            const existingSystemRooms = GameStore.rooms.filter(r => !r.isCustom);
            GameStore.rooms = [...existingSystemRooms, ...this.snapshot.rooms];
            GameStore.rebuildWorld(false); 
        }
        this.snapshot = null;
        this.resetState();
        GameStore.time.speed = 1;
        GameStore.notify();
    }

    resetState() {
        this.mode = 'none';
        this.selectedPlotId = null;
        this.selectedFurnitureId = null;
        this.selectedRoomId = null;
        this.placingTemplateId = null;
        this.placingFurniture = null;
        this.drawingFloor = null;
        this.drawingPlot = null;
        this.isDragging = false;
        this.previewPos = null;
    }

    clearMap() {
        if (this.mode === 'none') return;
        if (!confirm('确定要清空所有地皮和家具吗？')) return;
        GameStore.worldLayout = [];
        GameStore.furniture = []; 
        GameStore.rooms = [];
        GameStore.housingUnits = [];
        GameStore.initIndex();
        GameStore.notify();
    }

    // === 撤销/重做 ===

    recordAction(action: EditorAction) {
        this.history.push(action);
        this.redoStack = []; 
        if (this.history.length > 50) this.history.shift(); 
    }

    undo() {
        const action = this.history.pop();
        if (!action) return;
        this.redoStack.push(action);
        this.applyUndoRedo(action, true);
    }

    redo() {
        const action = this.redoStack.pop();
        if (!action) return;
        this.history.push(action);
        this.applyUndoRedo(action, false);
    }

    private applyUndoRedo(action: EditorAction, isUndo: boolean) {
        const data = isUndo ? action.prevData : action.newData;
        const type = isUndo ? (action.type === 'add' ? 'remove' : (action.type === 'remove' ? 'add' : (action.type === 'modify' ? 'modify' : 'move'))) : action.type;

        if (type === 'move') {
            if (action.entityType === 'plot') {
                const plot = GameStore.worldLayout.find(p => p.id === action.id);
                if (plot && data) { plot.x = data.x; plot.y = data.y; GameStore.rebuildWorld(false); }
            } else if (action.entityType === 'furniture') {
                const furn = GameStore.furniture.find(f => f.id === action.id);
                if (furn && data) { furn.x = data.x; furn.y = data.y; }
            } else if (action.entityType === 'room') {
                const room = GameStore.rooms.find(r => r.id === action.id);
                if (room && data) { room.x = data.x; room.y = data.y; }
            }
        } else if (type === 'add') {
            if (action.entityType === 'plot' && data) { GameStore.worldLayout.push(data); GameStore.rebuildWorld(false); }
            else if (action.entityType === 'furniture' && data) { GameStore.furniture.push(data); }
            else if (action.entityType === 'room' && data) { GameStore.rooms.push(data); }
        } else if (type === 'remove') {
            if (action.entityType === 'plot') { this.removePlot(action.id, false); }
            else if (action.entityType === 'furniture') { this.removeFurniture(action.id, false); }
            else if (action.entityType === 'room') { this.removeRoom(action.id, false); }
        } else if (type === 'modify') {
            if (action.entityType === 'plot' && data) {
                const plot = GameStore.worldLayout.find(p => p.id === action.id);
                if (plot) {
                    if (data.templateId) plot.templateId = data.templateId;
                    GameStore.rebuildWorld(false);
                }
            }
        }
        GameStore.initIndex();
        GameStore.notify();
    }

    // === 操作 ===

    startPlacingPlot(templateId: string) {
        this.mode = 'plot';
        this.placingTemplateId = templateId;
        this.placingFurniture = null;
        this.drawingFloor = null;
        this.drawingPlot = null;
        this.selectedPlotId = null;
        this.selectedFurnitureId = null;
        this.isDragging = true; 
        
        let w = 300, h = 300;
        if (templateId) {
            const tpl = PLOTS[templateId];
            if (tpl) { w = tpl.width; h = tpl.height; }
        }
        this.dragOffset = { x: w / 2, y: h / 2 };
        GameStore.notify();
    }

    startDrawingPlot(templateId: string = 'default_empty') {
        this.mode = 'plot';
        this.drawingPlot = { startX: 0, startY: 0, currX: 0, currY: 0, templateId };
        this.placingTemplateId = null;
        this.placingFurniture = null;
        this.drawingFloor = null;
        this.selectedPlotId = null;
        this.selectedFurnitureId = null;
        GameStore.notify();
    }

    startPlacingFurniture(template: Partial<Furniture>) {
        this.mode = 'furniture';
        this.placingFurniture = template;
        this.placingTemplateId = null;
        this.drawingFloor = null;
        this.drawingPlot = null;
        this.selectedPlotId = null;
        this.selectedFurnitureId = null;
        this.isDragging = true;
        this.dragOffset = { x: (template.w || 0) / 2, y: (template.h || 0) / 2 };
        GameStore.notify();
    }

    startDrawingFloor(pattern: string, color: string, label: string, hasWall: boolean = false) {
        this.mode = 'floor';
        this.drawingFloor = { startX: 0, startY: 0, currX: 0, currY: 0, pattern, color, label, hasWall };
        this.placingTemplateId = null;
        this.placingFurniture = null;
        this.drawingPlot = null;
        this.selectedPlotId = null;
        this.selectedFurnitureId = null;
        this.selectedRoomId = null;
        GameStore.notify();
    }

    placePlot(x: number, y: number) {
        const templateId = this.placingTemplateId || 'default_empty';
        const prefix = templateId.startsWith('road') ? 'road_custom_' : 'plot_';
        const newId = `${prefix}${Date.now()}`;
        const newPlot: WorldPlot = { id: newId, templateId: templateId, x: x, y: y };
        this.recordAction({ type: 'add', entityType: 'plot', id: newId, newData: newPlot });
        GameStore.worldLayout.push(newPlot);
        GameStore.instantiatePlot(newPlot); 
        GameStore.initIndex(); 
        this.placingTemplateId = null;
        this.isDragging = false;
        GameStore.notify();
    }

    createCustomPlot(rect: {x: number, y: number, w: number, h: number}, templateId: string) {
        const newId = `plot_custom_${Date.now()}`;
        const newPlot: WorldPlot = { id: newId, templateId: templateId, x: rect.x, y: rect.y, width: rect.w, height: rect.h };
        this.recordAction({ type: 'add', entityType: 'plot', id: newId, newData: newPlot });
        GameStore.worldLayout.push(newPlot);
        GameStore.instantiatePlot(newPlot);
        GameStore.initIndex();
        this.selectedPlotId = newId;
        GameStore.notify();
    }

    placeFurniture(x: number, y: number) {
        const tpl = this.placingFurniture;
        if (!tpl) return;
        const newItem = { ...tpl, id: `custom_${Date.now()}_${Math.random().toString(36).substr(2,5)}`, x: x, y: y } as Furniture;
        this.recordAction({ type: 'add', entityType: 'furniture', id: newItem.id, newData: newItem });
        GameStore.furniture.push(newItem);
        GameStore.initIndex();
        GameStore.refreshFurnitureOwnership();
        this.placingFurniture = null;
        this.isDragging = false;
        GameStore.notify();
    }

    createCustomRoom(rect: {x: number, y: number, w: number, h: number}, pattern: string, color: string, label: string, hasWall: boolean) {
        const newRoom: RoomDef = {
            id: `custom_room_${Date.now()}`,
            x: rect.x, y: rect.y, w: rect.w, h: rect.h,
            label: label, color: color, pixelPattern: pattern, isCustom: true, hasWall: hasWall
        };
        this.recordAction({ type: 'add', entityType: 'room', id: newRoom.id, newData: newRoom });
        GameStore.rooms.push(newRoom);
        GameStore.initIndex();
        GameStore.notify();
    }

    removePlot(plotId: string, record = true) {
        const plot = GameStore.worldLayout.find(p => p.id === plotId);
        if (!plot) return;
        if (record) this.recordAction({ type: 'remove', entityType: 'plot', id: plotId, prevData: plot });
        GameStore.worldLayout = GameStore.worldLayout.filter(p => p.id !== plotId);
        GameStore.rooms = GameStore.rooms.filter(r => !r.id.startsWith(`${plotId}_`));
        GameStore.furniture = GameStore.furniture.filter(f => !f.id.startsWith(`${plotId}_`));
        GameStore.housingUnits = GameStore.housingUnits.filter(h => !h.id.startsWith(`${plotId}_`));
        this.selectedPlotId = null;
        GameStore.initIndex();
        GameStore.notify();
    }

    removeRoom(roomId: string, record = true) {
        const room = GameStore.rooms.find(r => r.id === roomId);
        if (!room) return;
        if (record) this.recordAction({ type: 'remove', entityType: 'room', id: roomId, prevData: room });
        GameStore.rooms = GameStore.rooms.filter(r => r.id !== roomId);
        this.selectedRoomId = null;
        GameStore.initIndex();
        GameStore.notify();
    }

    removeFurniture(id: string, record = true) {
        const item = GameStore.furniture.find(f => f.id === id);
        if (!item) return;
        if (record) this.recordAction({ type: 'remove', entityType: 'furniture', id, prevData: item });
        GameStore.furniture = GameStore.furniture.filter(f => f.id !== id);
        this.selectedFurnitureId = null;
        GameStore.initIndex();
        GameStore.notify();
    }

    changePlotTemplate(plotId: string, newTemplateId: string) {
        const plot = GameStore.worldLayout.find(p => p.id === plotId);
        if (!plot) return;
        const oldTemplate = plot.templateId;
        this.recordAction({ type: 'modify', entityType: 'plot', id: plotId, prevData: { templateId: oldTemplate }, newData: { templateId: newTemplateId } });
        plot.templateId = newTemplateId;
        GameStore.rooms = GameStore.rooms.filter(r => !r.id.startsWith(`${plotId}_`));
        GameStore.furniture = GameStore.furniture.filter(f => !f.id.startsWith(`${plotId}_`));
        GameStore.housingUnits = GameStore.housingUnits.filter(h => !h.id.startsWith(`${plotId}_`));
        GameStore.instantiatePlot(plot);
        GameStore.initIndex();
        GameStore.notify();
    }

    finalizeMove(entityType: 'plot' | 'furniture' | 'room', id: string, startPos: {x:number, y:number}) {
        if (!this.previewPos) return;
        const { x, y } = this.previewPos;
        let hasChange = false;
        
        if (entityType === 'plot') {
            const plot = GameStore.worldLayout.find(p => p.id === id);
            if (plot && (plot.x !== x || plot.y !== y)) {
                const dx = x - plot.x;
                const dy = y - plot.y;
                plot.x = x; plot.y = y; 
                GameStore.rooms.forEach(r => { if(r.id.startsWith(`${id}_`)) { r.x += dx; r.y += dy; } });
                GameStore.furniture.forEach(f => { if(f.id.startsWith(`${id}_`)) { f.x += dx; f.y += dy; } });
                GameStore.housingUnits.forEach(u => { 
                    if(u.id.startsWith(`${id}_`)) { u.x += dx; u.y += dy; if(u.maxX) u.maxX += dx; if(u.maxY) u.maxY += dy; } 
                });
                hasChange = true; 
            }
        } else if (entityType === 'furniture') {
            const furn = GameStore.furniture.find(f => f.id === id);
            if (furn && (furn.x !== x || furn.y !== y)) { furn.x = x; furn.y = y; hasChange = true; }
        } else if (entityType === 'room') {
            const room = GameStore.rooms.find(r => r.id === id);
            if (room && (room.x !== x || room.y !== y)) { room.x = x; room.y = y; hasChange = true; }
        }

        if (hasChange) {
            this.recordAction({ type: 'move', entityType, id, prevData: startPos, newData: { x, y } });
            GameStore.initIndex();
            GameStore.refreshFurnitureOwnership();
            if (entityType === 'furniture') {
                GameStore.sims.forEach(sim => {
                    if (sim.interactionTarget && sim.interactionTarget.id === id) {
                        if (sim.action === 'using' || sim.action === 'working' || sim.action === 'sleeping') {
                            const f = GameStore.furniture.find(i => i.id === id);
                            if (f) { sim.pos.x = f.x + f.w / 2; sim.pos.y = f.y + f.h / 2; }
                        }
                    }
                });
            }
        }
        this.previewPos = null;
        GameStore.notify();
    }
}