import React, { useState, useEffect, useRef } from 'react';
import { GameStore } from '../../utils/simulation';
import { PLOTS } from '../../data/plots';
import { Furniture } from '../../types';

interface EditorPanelProps {
    onClose: () => void; 
}

// 家具分类目录
const FURNITURE_CATALOG: Record<string, { label: string, items: Partial<Furniture>[] }> = {
    'basic': {
        label: '基础',
        items: [
            { label: '木桌', w: 34, h: 34, color: '#a8b4c8', utility: 'work', pixelPattern: 'desk_simple' },
            { label: '椅子', w: 22, h: 22, color: '#8a9ca6', utility: 'sit', pixelPattern: 'chair_pixel' },
            { label: '双人床', w: 100, h: 120, color: '#ff7675', utility: 'energy', pixelPattern: 'bed_king' },
            { label: '单人床', w: 60, h: 90, color: '#74b9ff', utility: 'energy', pixelPattern: 'bed_king' },
            { label: '沙发', w: 80, h: 40, color: '#74b9ff', utility: 'comfort', pixelPattern: 'sofa_pixel' },
            { label: '衣柜', w: 40, h: 100, color: '#636e72', utility: 'none', pixelPattern: 'closet' },
        ]
    },
    'bathroom': {
        label: '卫浴',
        items: [
            { label: '马桶', w: 30, h: 30, color: '#fff', utility: 'bladder', pixelPattern: 'toilet' },
            { label: '淋浴间', w: 34, h: 44, color: '#81ecec', utility: 'hygiene', pixelPattern: 'shower_stall' },
            { label: '浴缸', w: 80, h: 60, color: '#fff', utility: 'hygiene', pixelPattern: 'bath_tub' },
        ]
    },
    'kitchen': {
        label: '厨房',
        items: [
            { label: '冰箱', w: 40, h: 40, color: '#fff', utility: 'hunger', pixelPattern: 'fridge' },
            { label: '灶台', w: 44, h: 64, color: '#d63031', utility: 'work', pixelPattern: 'stove' },
            { label: '餐桌', w: 64, h: 64, color: '#fab1a0', utility: 'hunger', pixelPattern: 'table_dining' },
        ]
    },
    'decor': {
        label: '装饰',
        items: [
            { label: '盆栽', w: 34, h: 34, color: '#00b894', utility: 'gardening', pixelPattern: 'bush' },
            { label: '地毯', w: 108, h: 108, color: '#ff9c8a', utility: 'none', pixelPattern: 'rug_art' },
            { label: '雕像', w: 34, h: 34, color: '#ffffff', utility: 'art', pixelPattern: 'statue' },
            { label: '路灯', w: 12, h: 60, color: '#f1c40f', utility: 'none', pixelPattern: 'lamp_post' },
        ]
    },
    'electronics': {
        label: '电器',
        items: [
            { label: '电脑', w: 44, h: 34, color: '#3742fa', utility: 'work', pixelPattern: 'pc_pixel' },
            { label: '自动贩卖机', w: 44, h: 34, color: '#ff5252', utility: 'buy_drink', pixelPattern: 'vending' },
            { label: '游戏机', w: 54, h: 74, color: '#8a7cff', utility: 'play', pixelPattern: 'arcade_racing' },
        ]
    }
};

const EditorPanel: React.FC<EditorPanelProps> = ({ onClose }) => {
    const [mode, setMode] = useState<'plot' | 'furniture'>('plot');
    const [category, setCategory] = useState('basic');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // 拖拽相关状态
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 90, y: 80 });
    const [isPanelDragging, setIsPanelDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        GameStore.enterEditorMode();
        const updateState = () => {
            setCanUndo(GameStore.history.length > 0);
            setCanRedo(GameStore.redoStack.length > 0);
        };
        const unsub = GameStore.subscribe(updateState);
        updateState();
        return unsub;
    }, []);

    // 面板拖拽逻辑
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isPanelDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };
        const handleMouseUp = () => setIsPanelDragging(false);

        if (isPanelDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPanelDragging, dragOffset]);

    const startDrag = (e: React.MouseEvent) => {
        if (panelRef.current) {
            setIsPanelDragging(true);
            const rect = panelRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };
    
    const handleSetMode = (m: 'plot' | 'furniture') => {
        setMode(m);
        GameStore.editor.mode = m;
        GameStore.notify();
    };

    const handleStartPlacingPlot = (templateId: string) => {
        GameStore.startPlacingPlot(templateId);
    };

    const handleStartPlacingFurniture = (tpl: Partial<Furniture>) => {
        GameStore.startPlacingFurniture({ ...tpl, id: '', x: 0, y: 0 });
    };

    const handleDelete = () => {
        if (mode === 'plot' && GameStore.editor.selectedPlotId) {
            GameStore.removePlot(GameStore.editor.selectedPlotId);
        } else if (mode === 'furniture' && GameStore.editor.selectedFurnitureId) {
            GameStore.removeFurniture(GameStore.editor.selectedFurnitureId);
        }
    };

    const handleSave = () => {
        GameStore.confirmEditorChanges();
        onClose(); 
    };

    const handleCancel = () => {
        GameStore.cancelEditorChanges();
        onClose(); 
    };

    return (
        <div 
            ref={panelRef}
            style={{ left: position.x, top: position.y }}
            className="fixed w-[260px] bg-[#121212]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto flex flex-col animate-[fadeIn_0.2s_ease-out] z-40 max-h-[80vh]"
        >
            {/* Header / Drag Handle */}
            <div 
                onMouseDown={startDrag}
                className="p-3 border-b border-white/10 flex flex-col gap-2 bg-white/5 rounded-t-xl cursor-move select-none"
            >
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-warning flex items-center gap-2">
                        🛠️ 地图编辑器
                    </span>
                    <div className="flex gap-1">
                        <button 
                            onMouseDown={(e) => e.stopPropagation()} // 防止触发拖拽
                            onClick={handleSave} 
                            className="bg-success text-black text-[10px] font-bold px-2 py-1 rounded hover:bg-white transition-colors"
                            title="保存并退出"
                        >
                            确定
                        </button>
                        <button 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={handleCancel} 
                            className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors"
                            title="取消并不保存"
                        >
                            取消
                        </button>
                    </div>
                </div>
                
                {/* History Controls */}
                <div className="flex gap-1 justify-between" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => GameStore.undo()} disabled={!canUndo}
                            className={`px-2 py-1 rounded text-[10px] border ${canUndo ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-transparent border-transparent text-gray-600 cursor-not-allowed'}`}
                        >
                            ↩ 撤销
                        </button>
                        <button 
                            onClick={() => GameStore.redo()} disabled={!canRedo}
                            className={`px-2 py-1 rounded text-[10px] border ${canRedo ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-transparent border-transparent text-gray-600 cursor-not-allowed'}`}
                        >
                            ↪ 恢复
                        </button>
                    </div>
                    <button 
                        onClick={() => GameStore.clearMap()}
                        className="px-2 py-1 rounded text-[10px] border border-danger/30 text-danger hover:bg-danger/20"
                    >
                        🗑️ 清空
                    </button>
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => handleSetMode('plot')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors ${mode === 'plot' ? 'bg-white/10 text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    🗺️ 地皮
                </button>
                <button 
                    onClick={() => handleSetMode('furniture')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors ${mode === 'furniture' ? 'bg-white/10 text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    🪑 家具
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">
                
                {/* Current Selection / Action Info */}
                <div className="bg-white/5 p-2 rounded border border-white/5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">当前操作</div>
                    <div className="text-xs text-gray-300 truncate mb-2">
                        {mode === 'plot' 
                            ? (GameStore.editor.selectedPlotId ? `选中地皮: ${GameStore.editor.selectedPlotId}` : "拖拽地皮或选择下方模板")
                            : (GameStore.editor.selectedFurnitureId ? `选中家具: ${GameStore.editor.selectedFurnitureId}` : "拖拽家具或选择下方物品")
                        }
                    </div>
                    {(GameStore.editor.selectedPlotId || GameStore.editor.selectedFurnitureId) && (
                        <button 
                            onClick={handleDelete}
                            className="w-full bg-danger/20 hover:bg-danger/40 text-danger border border-danger/30 rounded py-1 px-2 text-xs transition-colors"
                        >
                            移除选中项
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="flex flex-col gap-2 h-full">
                    {mode === 'plot' ? (
                        <div className="grid grid-cols-2 gap-2 pb-2">
                            {Object.entries(PLOTS).map(([key, template]) => (
                                <button
                                    key={key}
                                    onClick={() => handleStartPlacingPlot(key)}
                                    className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-2 text-left flex flex-col gap-1 transition-all active:scale-95"
                                >
                                    <span className="text-xs font-bold text-gray-200 truncate w-full">{key.replace('_template', '')}</span>
                                    <span className="text-[9px] text-gray-500">{template.width}x{template.height}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Category Tabs */}
                            <div className="flex flex-wrap gap-1 mb-1">
                                {Object.entries(FURNITURE_CATALOG).map(([key, data]) => (
                                    <button
                                        key={key}
                                        onClick={() => setCategory(key)}
                                        className={`px-2 py-1 rounded text-[10px] border ${category === key ? 'bg-accent/20 border-accent text-accent' : 'border-white/10 text-gray-400 hover:text-white'}`}
                                    >
                                        {data.label}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Items Grid */}
                            <div className="grid grid-cols-2 gap-2 pb-2">
                                {FURNITURE_CATALOG[category].items.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleStartPlacingFurniture(item)}
                                        className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-2 text-left flex flex-col gap-1 transition-all active:scale-95"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full border border-white/20" style={{background: item.color}}></div>
                                            <span className="text-xs font-bold text-gray-200">{item.label}</span>
                                        </div>
                                        <span className="text-[9px] text-gray-500">{item.w}x{item.h}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorPanel;