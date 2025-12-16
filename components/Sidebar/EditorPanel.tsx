import React, { useState, useEffect } from 'react';
import { GameStore } from '../../utils/simulation';
import { PLOTS } from '../../data/plots';
import { Furniture } from '../../types';

interface EditorPanelProps {
    onClose: () => void; // 用于非保存退出 (Cancel)
}

// 简单的家具模板列表 (用于添加)
const FURNITURE_TEMPLATES: Partial<Furniture>[] = [
    { label: '办公桌', w: 48, h: 32, color: '#2c3e50', utility: 'work', pixelPattern: 'desk_pixel' },
    { label: '椅子', w: 22, h: 22, color: '#8a9ca6', utility: 'sit', pixelPattern: 'chair_pixel' },
    { label: '双人床', w: 100, h: 120, color: '#ff7675', utility: 'energy', pixelPattern: 'bed_king' },
    { label: '沙发', w: 80, h: 40, color: '#74b9ff', utility: 'comfort', pixelPattern: 'sofa_pixel' },
    { label: '马桶', w: 30, h: 30, color: '#fff', utility: 'bladder', pixelPattern: 'toilet' },
    { label: '盆栽', w: 34, h: 34, color: '#00b894', utility: 'gardening', pixelPattern: 'bush' },
    { label: '自动贩卖机', w: 44, h: 34, color: '#ff5252', utility: 'buy_drink', pixelPattern: 'vending' },
    { label: '路灯', w: 12, h: 60, color: '#f1c40f', utility: 'none', pixelPattern: 'lamp_post' }, 
];

const EditorPanel: React.FC<EditorPanelProps> = ({ onClose }) => {
    const [mode, setMode] = useState<'plot' | 'furniture'>('plot');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // 同步 Editor 状态
    useEffect(() => {
        GameStore.enterEditorMode();
        const updateState = () => {
            setCanUndo(GameStore.history.length > 0);
            setCanRedo(GameStore.redoStack.length > 0);
        };
        const unsub = GameStore.subscribe(updateState);
        updateState();
        return () => {
            unsub();
            // 注意：不要在 unmount 时调用 confirm，因为 unmount 可能是由 cancel 触发的
        };
    }, []);
    
    const handleSetMode = (m: 'plot' | 'furniture') => {
        setMode(m);
        GameStore.editor.mode = m;
        GameStore.editor.selectedPlotId = null;
        GameStore.editor.selectedFurnitureId = null;
        GameStore.notify();
    };

    const handleAddPlot = (templateId: string) => {
        // 在屏幕中心添加，或者随机位置
        GameStore.addPlot(templateId, 500, 500);
    };

    const handleAddFurniture = (tpl: Partial<Furniture>) => {
        GameStore.addFurniture({ ...tpl, id: '', x: 0, y: 0 } as Furniture, 500, 500);
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
        onClose(); // Close UI
    };

    const handleCancel = () => {
        GameStore.cancelEditorChanges();
        onClose(); // Close UI
    };

    return (
        <div className="absolute left-[90px] top-20 bottom-20 w-[240px] bg-[#121212]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto flex flex-col animate-[fadeIn_0.2s_ease-out] z-40">
            {/* Header / Actions */}
            <div className="p-3 border-b border-white/10 flex flex-col gap-2 bg-white/5 rounded-t-xl">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-warning flex items-center gap-2">
                        🛠️ 编辑模式
                    </span>
                    <div className="flex gap-1">
                        <button 
                            onClick={handleSave} 
                            className="bg-success text-black text-[10px] font-bold px-2 py-1 rounded hover:bg-white transition-colors"
                            title="保存并退出"
                        >
                            ✓
                        </button>
                        <button 
                            onClick={handleCancel} 
                            className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors"
                            title="取消并不保存"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                
                {/* History Controls */}
                <div className="flex gap-1 justify-between">
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
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                
                {/* Actions Panel */}
                <div className="mb-4">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">当前操作</div>
                    <div className="flex flex-col gap-2 bg-white/5 p-2 rounded border border-white/5">
                        <div className="text-xs text-gray-300 truncate">
                            {mode === 'plot' 
                                ? (GameStore.editor.selectedPlotId ? `选中: ${GameStore.editor.selectedPlotId}` : "点击地皮进行移动")
                                : (GameStore.editor.selectedFurnitureId ? `选中: ${GameStore.editor.selectedFurnitureId}` : "点击家具进行移动")
                            }
                        </div>
                        {(GameStore.editor.selectedPlotId || GameStore.editor.selectedFurnitureId) && (
                            <button 
                                onClick={handleDelete}
                                className="bg-danger/20 hover:bg-danger/40 text-danger border border-danger/30 rounded py-1 px-2 text-xs transition-colors"
                            >
                                移除选中项
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
                    {mode === 'plot' ? '添加地皮 / 道路' : '添加家具'}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    {mode === 'plot' ? (
                        Object.entries(PLOTS).map(([key, template]) => (
                            <button
                                key={key}
                                onClick={() => handleAddPlot(key)}
                                className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-2 text-left flex flex-col gap-1 transition-all"
                            >
                                <span className="text-xs font-bold text-gray-200 truncate w-full">{key.replace('_template', '')}</span>
                                <span className="text-[9px] text-gray-500">{template.type}</span>
                                <span className="text-[9px] text-gray-600">{template.width}x{template.height}</span>
                            </button>
                        ))
                    ) : (
                        FURNITURE_TEMPLATES.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAddFurniture(item)}
                                className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-2 text-left flex flex-col gap-1 transition-all"
                            >
                                <div 
                                    className="w-4 h-4 rounded mb-1" 
                                    style={{background: item.color}}
                                ></div>
                                <span className="text-xs font-bold text-gray-200">{item.label}</span>
                                <span className="text-[9px] text-gray-500">{item.utility}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditorPanel;