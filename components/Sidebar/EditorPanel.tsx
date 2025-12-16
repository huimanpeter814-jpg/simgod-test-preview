import React, { useState, useEffect, useRef } from 'react';
import { GameStore } from '../../utils/simulation';
import { PLOTS } from '../../data/plots';
import { Furniture } from '../../types';

interface EditorPanelProps {
    onClose: () => void; 
}

// 调色板
const COLORS = [
    '#ff7675', '#74b9ff', '#55efc4', '#fdcb6e', '#a29bfe', 
    '#e17055', '#0984e3', '#00b894', '#6c5ce7', '#d63031',
    '#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#ffffff',
    '#8b4513', '#cd84f1', '#ffcccc', '#182C61', '#2C3A47'
];

// 地皮中文映射
const PLOT_NAMES: Record<string, string> = {
    'tech': '科技大厦',
    'finance': '金融中心',
    'design': '创意园区',
    'kindergarten': '幼儿园',
    'elementary': '第一小学',
    'high_school': '星海中学',
    'dorm': '人才公寓',
    'villa': '湖畔别墅',
    'apartment': '公寓楼',
    'park': '中央公园',
    'commercial': '商业广场',
    'service': '公共服务区',
    'nightlife': '娱乐不夜城',
    'gallery': '美术馆',
    'netcafe': '网咖',
    'road_h': '横向道路',
    'road_v': '纵向道路',
    'road_cross': '十字路口'
};

// 全面的家具分类目录
const FURNITURE_CATALOG: Record<string, { label: string, items: Partial<Furniture>[] }> = {
    'office': {
        label: '办公',
        items: [
            { label: '升降办公桌', w: 48, h: 32, color: '#2c3e50', utility: 'none', pixelPattern: 'desk_pixel' },
            { label: '工位椅', w: 22, h: 22, color: '#8a9ca6', utility: 'work', pixelPattern: 'chair_pixel' },
            { label: '老板椅', w: 44, h: 44, color: '#253048', utility: 'work', pixelPattern: 'chair_boss' },
            { label: '控制台', w: 34, h: 24, color: '#a8b4c8', utility: 'work', pixelPattern: 'console' },
            { label: '服务器组', w: 64, h: 38, color: '#253048', utility: 'none', pixelPattern: 'server', pixelGlow: true },
            { label: '会议桌', w: 168, h: 84, color: '#f0f5ff', utility: 'work_group', pixelPattern: 'table_marble' },
            { label: '红木班台', w: 126, h: 54, color: '#8b4513', utility: 'none', pixelPattern: 'desk_wood' },
            { label: '保险柜', w: 34, h: 34, color: '#5a6572', utility: 'none', pixelPattern: 'safe' },
        ]
    },
    'home': {
        label: '居家',
        items: [
            { label: '双人床', w: 100, h: 120, color: '#ff7675', utility: 'energy', pixelPattern: 'bed_king' },
            { label: '单人床', w: 60, h: 90, color: '#74b9ff', utility: 'energy', pixelPattern: 'bed_king' },
            { label: '上下铺', w: 54, h: 84, color: '#ffb142', utility: 'energy', pixelPattern: 'bed_bunk' },
            { label: '婴儿床', w: 40, h: 40, color: '#ff9ff3', utility: 'nap_crib', pixelPattern: 'bed_crib' },
            { label: '真皮沙发', w: 120, h: 50, color: '#a29bfe', utility: 'comfort', pixelPattern: 'sofa_vip' },
            { label: '懒人沙发', w: 44, h: 44, color: '#ff7aa8', utility: 'comfort', pixelPattern: 'beanbag' },
            { label: '衣柜', w: 40, h: 100, color: '#636e72', utility: 'none', pixelPattern: 'closet' },
            { label: '餐桌', w: 64, h: 64, color: '#fab1a0', utility: 'hunger', pixelPattern: 'table_dining' },
            { label: '冰箱', w: 40, h: 40, color: '#fff', utility: 'hunger', pixelPattern: 'fridge' },
            { label: '橱柜', w: 100, h: 40, color: '#b2bec3', utility: 'cook', pixelPattern: 'kitchen' },
        ]
    },
    'school': {
        label: '教育',
        items: [
            { label: '课桌', w: 34, h: 24, color: '#fdcb6e', utility: 'study', pixelPattern: 'desk_school' },
            { label: '阅览桌', w: 40, h: 60, color: '#d35400', utility: 'work', pixelPattern: 'desk_library' },
            { label: '黑板', w: 100, h: 10, color: '#2d3436', utility: 'none' },
            { label: '科技书架', w: 44, h: 108, color: '#4a7dff', utility: 'buy_book', pixelPattern: 'bookshelf_sci' },
            { label: '历史书架', w: 44, h: 108, color: '#e67e22', utility: 'buy_book', pixelPattern: 'bookshelf_hist' },
            { label: '游戏垫', w: 44, h: 44, color: '#74b9ff', utility: 'play_blocks', pixelPattern: 'play_mat' },
            { label: '滑梯', w: 60, h: 100, color: '#ff7675', utility: 'play', pixelPattern: 'slide' },
        ]
    },
    'shop': {
        label: '商业',
        items: [
            { label: '货架(零食)', w: 64, h: 28, color: '#ffdd59', utility: 'buy_item', pixelPattern: 'shelf_food' },
            { label: '货架(蔬菜)', w: 64, h: 28, color: '#55efc4', utility: 'buy_item', pixelPattern: 'shelf_veg' },
            { label: '美妆柜台', w: 54, h: 34, color: '#ff7aa8', utility: 'buy_item', pixelPattern: 'counter_cosmetic' },
            { label: '收银台', w: 60, h: 44, color: '#2c3e50', utility: 'work', pixelPattern: 'cashier' },
            { label: '自动贩卖机', w: 44, h: 34, color: '#ff5252', utility: 'buy_drink', pixelPattern: 'vending' },
            { label: '抓娃娃机', w: 44, h: 44, color: '#ff7aa8', utility: 'play', pixelPattern: 'claw_machine' },
            { label: '爆米花机', w: 44, h: 44, color: '#ffd32a', utility: 'buy_food', pixelPattern: 'popcorn_machine' },
        ]
    },
    'fun': {
        label: '娱乐',
        items: [
            { label: '网吧电脑', w: 44, h: 34, color: '#3742fa', utility: 'work', pixelPattern: 'pc_pixel' },
            { label: '电竞椅', w: 24, h: 24, color: '#747d8c', utility: 'none', pixelPattern: 'chair_pixel' },
            { label: '赛车游戏机', w: 54, h: 74, color: '#8a7cff', utility: 'play', pixelPattern: 'arcade_racing', pixelGlow: true },
            { label: '跳舞机', w: 64, h: 64, color: '#ff7aa8', utility: 'dance', pixelPattern: 'dance_machine', pixelGlow: true },
            { label: '跑步机', w: 44, h: 84, color: '#2c3e50', utility: 'run', pixelPattern: 'treadmill' },
            { label: '哑铃架', w: 44, h: 44, color: '#5a6572', utility: 'lift', pixelPattern: 'weights_rack' },
            { label: 'DJ台', w: 126, h: 54, color: '#7158e2', utility: 'music', pixelPattern: 'dj_stage', pixelGlow: true },
            { label: '酒吧椅', w: 24, h: 24, color: '#ffffff', utility: 'sit', pixelPattern: 'stool_bar' },
        ]
    },
    'park': {
        label: '户外',
        items: [
            { label: '公园长椅', w: 54, h: 24, color: '#e17055', utility: 'comfort', pixelPattern: 'bench_park' },
            { label: '梧桐树', w: 42, h: 42, color: '#253048', utility: 'none', pixelPattern: 'tree_pixel', pixelOutline: true },
            { label: '灌木丛', w: 34, h: 34, color: '#00b894', utility: 'gardening', pixelPattern: 'bush' },
            { label: '花坛(红)', w: 44, h: 44, color: '#ff6b81', utility: 'gardening', pixelPattern: 'flower_rose' },
            { label: '喷泉池', w: 126, h: 126, color: '#a8b4c8', utility: 'none', pixelPattern: 'fountain_base' },
            { label: '小黄鸭船', w: 44, h: 34, color: '#ffdd59', utility: 'play', pixelPattern: 'boat_duck' },
            { label: '野餐垫', w: 108, h: 84, color: '#ff6b81', utility: 'hunger', pixelPattern: 'picnic_mat' },
            { label: '冰淇淋车', w: 64, h: 44, color: '#ffd166', utility: 'buy_food', pixelPattern: 'icecream_cart' },
            { label: '消防栓', w: 18, h: 18, color: '#ff5252', utility: 'none', pixelOutline: true },
            { label: '垃圾桶', w: 24, h: 24, color: '#2c3e50', utility: 'none', pixelPattern: 'trash' },
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
    'decor': {
        label: '装饰',
        items: [
            { label: '地毯(艺术)', w: 108, h: 108, color: '#ff9c8a', utility: 'none', pixelPattern: 'rug_art' },
            { label: '地毯(波斯)', w: 230, h: 108, color: '#c23636', utility: 'none', pixelPattern: 'rug_persian' },
            { label: '雕像', w: 34, h: 34, color: '#ffffff', utility: 'art', pixelPattern: 'statue' },
            { label: '画架', w: 44, h: 54, color: '#ff5252', utility: 'paint', pixelPattern: 'easel' },
            { label: '展示柜', w: 40, h: 40, color: '#00d2d3', utility: 'art', pixelPattern: 'display_case', pixelGlow: true },
        ]
    }
};

const EditorPanel: React.FC<EditorPanelProps> = ({ onClose }) => {
    const [mode, setMode] = useState<'plot' | 'furniture'>('plot');
    const [category, setCategory] = useState('office');
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    
    // 状态管理
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);

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
            
            // 更新选中的家具信息
            if (GameStore.editor.selectedFurnitureId) {
                const f = GameStore.furniture.find(i => i.id === GameStore.editor.selectedFurnitureId);
                setSelectedFurniture(f || null);
            } else {
                setSelectedFurniture(null);
            }
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
        // 如果当前选了颜色，就应用颜色
        const initialColor = selectedColor || tpl.color || '#ffffff';
        GameStore.startPlacingFurniture({ ...tpl, id: '', x: 0, y: 0, color: initialColor });
    };

    const handleDelete = () => {
        if (mode === 'plot' && GameStore.editor.selectedPlotId) {
            GameStore.removePlot(GameStore.editor.selectedPlotId);
        } else if (mode === 'furniture' && GameStore.editor.selectedFurnitureId) {
            GameStore.removeFurniture(GameStore.editor.selectedFurnitureId);
        }
    };

    // 更改家具颜色
    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        
        // 1. 如果正在放置家具，更新放置预览的颜色
        if (GameStore.editor.placingFurniture) {
            GameStore.editor.placingFurniture.color = color;
            GameStore.notify();
        }
        // 2. 如果选中了现有家具，直接更改其颜色
        else if (GameStore.editor.selectedFurnitureId) {
            const f = GameStore.furniture.find(i => i.id === GameStore.editor.selectedFurnitureId);
            if (f) {
                f.color = color;
                GameStore.notify();
            }
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

    //核心功能：导出地图数据
    const handleExport = () => {
        // 1. 导出地皮布局 (worldLayout)
        const layoutData = GameStore.worldLayout.map(p => ({
            id: p.id,
            templateId: p.templateId,
            x: p.x,
            y: p.y
        }));

        // 2. 导出散放家具 (street props)
        // 注意：GameStore.furniture 包含了所有家具（包括地皮自带的）。
        // 我们只导出那些不属于任何地皮（即手动放置或原有的街道装饰）的家具。
        // 地皮自带家具的ID通常以 `plotID_` 开头。
        const plotIds = layoutData.map(p => p.id);
        const propsData = GameStore.furniture.filter(f => {
            const belongsToPlot = plotIds.some(pid => f.id.startsWith(`${pid}_`));
            return !belongsToPlot; // 只保留不属于地皮的家具
        }).map(f => ({
            // 精简数据，去除运行时添加的属性
            id: f.id,
            x: f.x,
            y: f.y,
            w: f.w,
            h: f.h,
            color: f.color,
            label: f.label,
            utility: f.utility,
            dir: f.dir,
            pixelPattern: f.pixelPattern,
            pixelOutline: f.pixelOutline,
            pixelGlow: f.pixelGlow,
            glowColor: f.glowColor,
            cost: f.cost
        }));

        const tsContent = `import { WorldPlot, Furniture } from '../types';

// [Generated by Creator Mode]
export const STREET_PROPS: Furniture[] = ${JSON.stringify(propsData, null, 4)};

export const WORLD_LAYOUT: WorldPlot[] = ${JSON.stringify(layoutData, null, 4)};
`;

        navigator.clipboard.writeText(tsContent).then(() => {
            alert("✅ 地图数据已生成并复制到剪贴板！\n\n请打开代码中的 [data/world.ts] 文件，\n全选并粘贴覆盖原有内容即可永久保存。");
        }).catch(err => {
            console.error("Copy failed", err);
            alert("复制失败，请查看控制台输出");
            console.log(tsContent);
        });
    };

    return (
        <div 
            ref={panelRef}
            style={{ left: position.x, top: position.y }}
            className="fixed w-[280px] bg-[#121212]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto flex flex-col animate-[fadeIn_0.2s_ease-out] z-40 max-h-[85vh]"
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
                        {/* [新增] 导出按钮 */}
                        <button 
                            onMouseDown={(e) => e.stopPropagation()} 
                            onClick={handleExport} 
                            className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-purple-500 transition-colors border border-purple-400/30"
                            title="复制配置代码到剪贴板"
                        >
                            导出代码
                        </button>
                        <button 
                            onMouseDown={(e) => e.stopPropagation()} 
                            onClick={handleSave} 
                            className="bg-success text-black text-[10px] font-bold px-2 py-1 rounded hover:bg-white transition-colors"
                        >
                            应用
                        </button>
                        <button 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={handleCancel} 
                            className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors"
                        >
                            关闭
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

            {/* Content Area (Existing content) */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">
                {/* ... (Current Selection Info, Color Picker, List, etc. remain the same) ... */}
                
                {/* Current Selection Info & Delete */}
                <div className="bg-white/5 p-2 rounded border border-white/5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">当前操作</div>
                    <div className="text-xs text-gray-300 truncate mb-2">
                        {mode === 'plot' 
                            ? (GameStore.editor.selectedPlotId ? `选中地皮: ${GameStore.editor.selectedPlotId}` : "拖拽地皮或选择下方模板")
                            : (GameStore.editor.selectedFurnitureId ? `选中家具: ${selectedFurniture?.label}` : "拖拽家具或选择下方物品")
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

                {/* Color Picker (Only for Furniture mode) */}
                {mode === 'furniture' && (
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">更改颜色</div>
                        <div className="flex flex-wrap gap-1.5">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleColorChange(c)}
                                    className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${selectedColor === c ? 'border-white scale-110 shadow-lg' : 'border-white/10'}`}
                                    style={{ background: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                )}

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
                                    <span className="text-xs font-bold text-gray-200 truncate w-full">
                                        {PLOT_NAMES[key.replace('_template', '')] || key.replace('_template', '')}
                                    </span>
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
                                            <span className="text-xs font-bold text-gray-200 truncate">{item.label}</span>
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