import React, { useState, useEffect, useRef } from 'react';
import { GameStore } from '../../utils/simulation';
import { PLOTS } from '../../data/plots';
import { Furniture } from '../../types';

interface EditorPanelProps {
    onClose: () => void; 
}

const COLORS = [
    '#ff7675', '#74b9ff', '#55efc4', '#fdcb6e', '#a29bfe', 
    '#e17055', '#0984e3', '#00b894', '#6c5ce7', '#d63031',
    '#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#ffffff',
    '#8b4513', '#cd84f1', '#ffcccc', '#182C61', '#2C3A47',
    '#8cb393', '#5a8fff', '#303952', '#f7d794', '#ea8685'
];

const PLOT_NAMES: Record<string, string> = {
    'default_empty': '自定义空地',
    'tech_hq': '科技园区',
    'finance_center': '金融中心',
    'creative_park': '创意工坊',
    'kindergarten': '向日葵幼儿园',
    'elementary': '实验小学',
    'high_school': '第一中学',
    'hospital_l': '综合医院',
    'gym_center': '健身中心',
    'library': '市图书馆',
    'apt_luxury': '豪华公寓',
    'villa_wide': '半山别墅',
    'elder_home': '养老社区',
    'restaurant': '美食餐厅',
    'cafe': '咖啡厅',
    'super_l': '大型超市',
    'cinema': '电影院',
    'nightclub': '不夜城Club',
    'netcafe': '极速网咖',
    'park_center': '中央公园'
};

// 扩充后的家具目录
const FURNITURE_CATALOG: Record<string, { label: string, items: Partial<Furniture>[] }> = {
    'skills': {
        label: '技能/爱好',
        items: [
            // 健身
            { label: '跑步机', w: 40, h: 70, color: '#2d3436', utility: 'run', pixelPattern: 'treadmill', tags: ['gym'] },
            { label: '举重床', w: 50, h: 80, color: '#2d3436', utility: 'lift', pixelPattern: 'weights_rack', tags: ['gym'] },
            { label: '瑜伽垫', w: 30, h: 70, color: '#ff7aa8', utility: 'stretch', pixelPattern: 'yoga_mat', tags: ['gym'] },
            // 音乐
            { label: '钢琴', w: 60, h: 50, color: '#1e1e1e', utility: 'play_instrument', pixelPattern: 'piano', tags: ['piano', 'instrument'] },
            { label: '吉他架', w: 30, h: 30, color: '#e17055', utility: 'play_instrument', pixelPattern: 'easel', tags: ['instrument'] },
            // 逻辑
            { label: '国际象棋', w: 40, h: 40, color: '#dfe6e9', utility: 'play_chess', pixelPattern: 'chess_table', tags: ['desk', 'game'] },
            { label: '编程工作站', w: 60, h: 40, color: '#74b9ff', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'desk'] },
            // 艺术
            { label: '画架', w: 40, h: 50, color: '#a29bfe', utility: 'paint', pixelPattern: 'easel', tags: ['easel', 'art'] },
            // 园艺
            { label: '种植箱', w: 40, h: 40, color: '#55efc4', utility: 'gardening', pixelPattern: 'bush', tags: ['plant'] },
            { label: '玫瑰花丛', w: 40, h: 40, color: '#ff7675', utility: 'gardening', pixelPattern: 'flower_rose', tags: ['plant'] },
            // 钓鱼
            { label: '私人鱼塘', w: 100, h: 80, color: '#74b9ff', utility: 'fishing', pixelPattern: 'water', tags: ['decor'] },
            // 魅力
            { label: '演讲台', w: 40, h: 30, color: '#a29bfe', utility: 'practice_speech', pixelPattern: 'desk_simple', tags: ['desk'] },
            { label: '落地镜', w: 20, h: 60, color: '#81ecec', utility: 'practice_speech', pixelPattern: 'closet', tags: ['mirror'] },
        ]
    },
    'career': {
        label: '职业设施', 
        items: [
            // IT / 商务
            { label: '标准工位', w: 50, h: 40, color: '#dfe6e9', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'desk'] },
            { label: '老板班台', w: 80, h: 50, color: '#8b4513', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk', 'boss_desk'] },
            { label: '会议桌', w: 120, h: 60, color: '#f5f6fa', utility: 'work', pixelPattern: 'table_dining', tags: ['meeting'] },
            { label: '服务器', w: 40, h: 60, color: '#1e1e1e', utility: 'work', pixelPattern: 'server', tags: ['server'] },
            // 医疗
            { label: '医疗床', w: 50, h: 80, color: '#fff', utility: 'healing', pixelPattern: 'medical_bed', tags: ['medical_bed', 'bed'] },
            { label: 'CT扫描仪', w: 60, h: 80, color: '#b2bec3', utility: 'none', pixelPattern: 'scanner', tags: ['medical_device'] },
            { label: '护士站', w: 80, h: 40, color: '#fff', utility: 'work', pixelPattern: 'reception', tags: ['desk'] },
            // 餐饮 / 零售
            { label: '收银台', w: 60, h: 40, color: '#2c3e50', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] },
            { label: '大灶台', w: 80, h: 40, color: '#636e72', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove'] },
            { label: '货架(食品)', w: 50, h: 100, color: '#fdcb6e', utility: 'buy_item', pixelPattern: 'shelf_food', tags: ['shelf'] },
            // 教育
            { label: '黑板', w: 100, h: 10, color: '#2d3436', utility: 'none', tags: ['blackboard'] },
            { label: '课桌', w: 40, h: 30, color: '#fdcb6e', utility: 'study', pixelPattern: 'desk_school', tags: ['desk', 'study'] },
        ]
    },
    'home': {
        label: '家具家电',
        items: [
            { label: '双人床', w: 80, h: 100, color: '#ff7675', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed', 'sleep'] },
            { label: '单人床', w: 50, h: 80, color: '#74b9ff', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed', 'sleep'] },
            { label: '婴儿床', w: 40, h: 40, color: '#ff9ff3', utility: 'nap_crib', pixelPattern: 'bed_crib', tags: ['bed', 'baby'] },
            { label: '真皮沙发', w: 100, h: 40, color: '#a29bfe', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['sofa', 'seat'] },
            { label: '懒人沙发', w: 40, h: 40, color: '#ff7aa8', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa', 'seat'] },
            { label: '餐桌', w: 60, h: 60, color: '#fab1a0', utility: 'hunger', pixelPattern: 'table_dining', tags: ['table'] },
            { label: '冰箱', w: 40, h: 40, color: '#fff', utility: 'hunger', pixelPattern: 'fridge', tags: ['kitchen'] },
            { label: '橱柜', w: 80, h: 40, color: '#b2bec3', utility: 'cooking', pixelPattern: 'kitchen', tags: ['kitchen', 'stove'] },
            { label: '马桶', w: 30, h: 30, color: '#fff', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] },
            { label: '淋浴间', w: 40, h: 40, color: '#81ecec', utility: 'hygiene', pixelPattern: 'shower_stall', tags: ['shower'] },
            { label: '浴缸', w: 70, h: 40, color: '#fff', utility: 'hygiene', pixelPattern: 'bath_tub', tags: ['bath'] },
        ]
    },
    'decor': {
        label: '装饰环境',
        items: [
            { label: '公园长椅', w: 60, h: 20, color: '#e17055', utility: 'comfort', pixelPattern: 'bench_park', tags: ['seat'] },
            { label: '大树', w: 50, h: 50, color: '#27ae60', utility: 'none', pixelPattern: 'tree_pixel', tags: ['tree'] },
            { label: '灌木', w: 30, h: 30, color: '#2ecc71', utility: 'none', pixelPattern: 'bush', tags: ['plant'] },
            { label: '喷泉', w: 100, h: 100, color: '#74b9ff', utility: 'none', pixelPattern: 'water', tags: ['decor'] },
            { label: '自动贩卖机', w: 40, h: 30, color: '#ff5252', utility: 'buy_drink', pixelPattern: 'vending', tags: ['shop'] },
            { label: '垃圾桶', w: 20, h: 20, color: '#636e72', utility: 'none', pixelPattern: 'trash', tags: ['decor'] },
            { label: '地毯(大)', w: 120, h: 80, color: '#ff9c8a', utility: 'none', pixelPattern: 'rug_art', tags: ['decor'] },
        ]
    }
};

const SURFACE_TYPES = [
    { label: '草地', color: '#8cb393', pattern: 'grass' },
    { label: '柏油路', color: '#3d404b', pattern: 'stripes' },
    { label: '斑马线', color: 'rgba(255,255,255,0.2)', pattern: 'zebra' },
    { label: '水池', color: '#5a8fff', pattern: 'water' },
];

const FLOOR_PATTERNS = [
    { label: '基础', pattern: 'simple' },
    { label: '木地板', pattern: 'wood' },
    { label: '瓷砖', pattern: 'tile' },
    { label: '地砖', pattern: 'pave_fancy' },
    { label: '商场', pattern: 'mall' },
    { label: '网格', pattern: 'grid' },
];

const EditorPanel: React.FC<EditorPanelProps> = ({ onClose }) => {
    const [mode, setMode] = useState<'plot' | 'furniture' | 'floor'>('plot');
    const [category, setCategory] = useState('skills');
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);
    const [activeTool, setActiveTool] = useState<'camera' | 'select'>('select');

    // 面板拖拽
    const panelRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [position, setPosition] = useState({ x: 90, y: 80 });
    const [isPanelDragging, setIsPanelDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        GameStore.enterEditorMode();
        // @ts-ignore
        GameStore.editor.setTool('select');
        
        const updateState = () => {
            setCanUndo(GameStore.history.length > 0);
            setCanRedo(GameStore.redoStack.length > 0);
            // @ts-ignore
            if (GameStore.editor.activeTool) setActiveTool(GameStore.editor.activeTool);
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

    // 键盘事件
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') handleDelete();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 拖拽逻辑
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isPanelDragging) {
                setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
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
            setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };
    
    const handleToolChange = (tool: 'camera' | 'select') => {
        GameStore.editor.setTool(tool);
        setActiveTool(tool);
    };

    const handleSetMode = (m: 'plot' | 'furniture' | 'floor') => {
        setMode(m);
        GameStore.editor.mode = m;
        GameStore.resetEditorState();
        GameStore.editor.mode = m; // resetState 会清空 mode，需重设
        GameStore.notify();
    };

    const handleStartPlacingPlot = (templateId: string) => GameStore.startPlacingPlot(templateId);
    const handleStartDrawingPlot = () => GameStore.startDrawingPlot('default_empty');
    const handleStartDrawingRoom = () => GameStore.startDrawingFloor('simple', '#ffffff', '房间', true);
    
    const handleStartPlacingFurniture = (tpl: Partial<Furniture>) => {
        const initialColor = selectedColor || tpl.color || '#ffffff';
        GameStore.startPlacingFurniture({ ...tpl, id: '', x: 0, y: 0, color: initialColor });
    };

    const handleStartDrawingFloor = (type: any) => {
        GameStore.startDrawingFloor(type.pattern, selectedColor || type.color, type.label, false);
    };

    const handleDelete = () => {
        if (GameStore.editor.selectedPlotId) GameStore.removePlot(GameStore.editor.selectedPlotId);
        else if (GameStore.editor.selectedFurnitureId) GameStore.removeFurniture(GameStore.editor.selectedFurnitureId);
        else if (GameStore.editor.selectedRoomId) GameStore.removeRoom(GameStore.editor.selectedRoomId);
    };

    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        if (GameStore.editor.placingFurniture) {
            GameStore.editor.placingFurniture.color = color;
            GameStore.notify();
        } else if (GameStore.editor.selectedFurnitureId) {
            const f = GameStore.furniture.find(i => i.id === GameStore.editor.selectedFurnitureId);
            if (f) { f.color = color; GameStore.notify(); }
        } else if (GameStore.editor.selectedRoomId) {
            const r = GameStore.rooms.find(rm => rm.id === GameStore.editor.selectedRoomId);
            if (r) { r.color = color; GameStore.notify(); }
        }
    };

    const handlePatternChange = (pattern: string) => {
        if (GameStore.editor.selectedRoomId) {
            const r = GameStore.rooms.find(rm => rm.id === GameStore.editor.selectedRoomId);
            if (r) { r.pixelPattern = pattern; GameStore.notify(); }
        }
    };

    const handleSave = () => { GameStore.confirmEditorChanges(); onClose(); };
    const handleCancel = () => { GameStore.cancelEditorChanges(); onClose(); };
    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                GameStore.importMapData(JSON.parse(event.target?.result as string));
            } catch (err) { alert("❌ 文件无效"); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };
    const handleExport = () => {
        const blob = new Blob([JSON.stringify(GameStore.getMapData(), null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `simgod_map_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div ref={panelRef} style={{ left: position.x, top: position.y }} className="fixed w-[280px] bg-[#121212]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto flex flex-col animate-[fadeIn_0.2s_ease-out] z-40 max-h-[85vh]">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
            
            {/* Header */}
            <div onMouseDown={startDrag} className="p-3 border-b border-white/10 flex flex-col gap-2 bg-white/5 rounded-t-xl cursor-move select-none">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-warning flex items-center gap-2">🛠️ 地图编辑器</span>
                    <div className="flex gap-1">
                        <button onMouseDown={e => e.stopPropagation()} onClick={handleImportClick} className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded">导入</button>
                        <button onMouseDown={e => e.stopPropagation()} onClick={handleExport} className="bg-purple-600 text-white text-[10px] px-2 py-1 rounded">导出</button>
                        <button onMouseDown={e => e.stopPropagation()} onClick={handleSave} className="bg-success text-black text-[10px] px-2 py-1 rounded">保存</button>
                        <button onMouseDown={e => e.stopPropagation()} onClick={handleCancel} className="bg-white/10 text-white text-[10px] px-2 py-1 rounded">退出</button>
                    </div>
                </div>
                <div className="flex gap-1 justify-between" onMouseDown={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                        <button onClick={() => GameStore.undo()} disabled={!canUndo} className={`px-2 py-1 rounded text-[10px] border ${canUndo ? 'text-white border-white/20' : 'text-gray-600 border-transparent'}`}>↩ 撤销</button>
                        <button onClick={() => GameStore.redo()} disabled={!canRedo} className={`px-2 py-1 rounded text-[10px] border ${canRedo ? 'text-white border-white/20' : 'text-gray-600 border-transparent'}`}>↪ 恢复</button>
                    </div>
                    <button onClick={() => GameStore.clearMap()} className="px-2 py-1 rounded text-[10px] border border-danger/30 text-danger">🗑️ 清空</button>
                </div>
            </div>

            {/* Tools */}
            <div className="flex gap-2 p-2 bg-black/20 border-b border-white/10">
                <button onClick={() => handleToolChange('camera')} className={`flex-1 py-1.5 text-xs rounded border ${activeTool === 'camera' ? 'bg-accent text-black border-accent' : 'bg-white/5 border-white/10 text-gray-400'}`}>✋ 漫游</button>
                <button onClick={() => handleToolChange('select')} className={`flex-1 py-1.5 text-xs rounded border ${activeTool === 'select' ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>👆 编辑</button>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-white/10">
                {[{id:'plot', l:'地皮'}, {id:'floor', l:'房间'}, {id:'furniture', l:'家具'}].map(m => (
                    <button key={m.id} onClick={() => handleSetMode(m.id as any)} className={`flex-1 py-2 text-xs font-bold ${mode === m.id ? 'bg-white/10 text-white border-b-2 border-accent' : 'text-gray-500'}`}>{m.l}</button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">
                {/* Info Box */}
                <div className="bg-white/5 p-2 rounded border border-white/5">
                    <div className="text-[10px] text-gray-500 font-bold mb-1">当前选择</div>
                    <div className="text-xs text-gray-300 truncate mb-2">
                        {GameStore.editor.selectedPlotId ? `地皮: ${GameStore.editor.selectedPlotId}` : 
                         GameStore.editor.selectedRoomId ? `房间: ${GameStore.editor.selectedRoomId}` : 
                         GameStore.editor.selectedFurnitureId ? `家具: ${selectedFurniture?.label}` : "无"}
                    </div>
                    {(GameStore.editor.selectedPlotId || GameStore.editor.selectedRoomId || GameStore.editor.selectedFurnitureId) && (
                        <button onClick={handleDelete} className="w-full bg-danger/20 text-danger border border-danger/30 rounded py-1 text-xs">删除选中项 (Del)</button>
                    )}
                </div>

                {mode === 'floor' && GameStore.editor.selectedRoomId && (
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold mb-2">地面材质</div>
                        <div className="grid grid-cols-3 gap-1">
                            {FLOOR_PATTERNS.map(fp => (
                                <button key={fp.pattern} onClick={() => handlePatternChange(fp.pattern)} className="text-[10px] py-1 rounded border bg-black/20 border-white/10 text-gray-300 hover:text-white">{fp.label}</button>
                            ))}
                        </div>
                    </div>
                )}

                {(mode === 'furniture' || mode === 'floor') && (
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold mb-2">颜色</div>
                        <div className="flex flex-wrap gap-1.5">
                            {COLORS.map(c => (
                                <button key={c} onClick={() => handleColorChange(c)} className={`w-5 h-5 rounded-full border ${selectedColor === c ? 'border-white scale-110' : 'border-white/10'}`} style={{background: c}} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Lists */}
                {mode === 'plot' && (
                    <div className="flex flex-col gap-2">
                        <button onClick={handleStartDrawingPlot} className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs font-bold text-gray-200">⬜ 自定义空地</button>
                        <div className="text-[10px] text-gray-500 font-bold mt-2">地表笔刷</div>
                        <div className="grid grid-cols-2 gap-2">
                            {SURFACE_TYPES.map(t => (
                                <button key={t.pattern} onClick={() => handleStartDrawingFloor(t)} className="bg-white/5 border border-white/10 rounded p-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded" style={{background: t.color}}></div><span className="text-xs text-gray-300">{t.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold mt-2">预设模板</div>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.keys(PLOTS).filter(k => !k.startsWith('road') && k!=='default_empty').map(key => (
                                <button key={key} onClick={() => handleStartPlacingPlot(key)} className="bg-white/5 border border-white/10 rounded p-2 text-left">
                                    <span className="text-xs font-bold text-gray-200 block truncate">{PLOT_NAMES[key] || key}</span>
                                    <span className="text-[9px] text-gray-500">{PLOTS[key].width}x{PLOTS[key].height}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {mode === 'floor' && (
                    <button onClick={handleStartDrawingRoom} className="w-full bg-white/5 border border-white/10 rounded p-4 text-center">
                        <span className="text-xl block mb-1">🏗️</span>
                        <span className="text-xs font-bold text-gray-200">框选建造房间</span>
                    </button>
                )}

                {mode === 'furniture' && (
                    <>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {Object.keys(FURNITURE_CATALOG).map(k => (
                                <button key={k} onClick={() => setCategory(k)} className={`px-2 py-1 rounded text-[10px] border ${category === k ? 'bg-accent/20 border-accent text-accent' : 'border-white/10 text-gray-400'}`}>{FURNITURE_CATALOG[k].label}</button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {FURNITURE_CATALOG[category].items.map((item, idx) => (
                                <button key={idx} onClick={() => handleStartPlacingFurniture(item)} className="bg-white/5 border border-white/10 rounded p-2 text-left flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{background: item.color}}></div>
                                    <div className="overflow-hidden">
                                        <div className="text-xs font-bold text-gray-200 truncate">{item.label}</div>
                                        <div className="text-[9px] text-gray-500">{item.w}x{item.h}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EditorPanel;