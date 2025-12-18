import React, { useState, useEffect, useRef } from 'react';
import { GameStore } from '../../utils/simulation';
import { PLOTS } from '../../data/plots';
import { Furniture } from '../../types';

interface EditorPanelProps {
    onClose: () => void; 
}

// 扩充调色板
const COLORS = [
    '#ff7675', '#74b9ff', '#55efc4', '#fdcb6e', '#a29bfe', 
    '#e17055', '#0984e3', '#00b894', '#6c5ce7', '#d63031',
    '#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#ffffff',
    '#8b4513', '#cd84f1', '#ffcccc', '#182C61', '#2C3A47',
    '#8cb393', '#5a8fff', '#303952', '#f7d794', '#ea8685'
];

// 地皮中文映射
const PLOT_NAMES: Record<string, string> = {
    'default_empty': '自定义空地',
    'tech_hq': '科技总部',
    'finance': '金融中心',
    'design_v': '创意工坊',
    'kindergarten': '幼儿园',
    'elementary': '第一小学',
    'school_l': '综合学校',
    'dorm_std': '人才公寓',
    'elder_care': '夕阳红养老院', 
    'villa_wide': '豪华别墅',
    'apt_small': '精品公寓',
    'apartment': '公寓楼',
    'park_center': '中央公园',
    'mall_wide': '商业广场',
    'shop_s': '便民小店',
    'gym': '健身中心',           
    'nightclub': '不夜城Club',   
    'hospital_l': '综合医院',
    'gallery': '美术馆',
    'netcafe': '网咖',
    'road_h': '横向道路',
    'road_v': '纵向道路'
};

// 家具分类目录
const FURNITURE_CATALOG: Record<string, { label: string, items: Partial<Furniture>[] }> = {
    'career': {
        label: '职业设施', 
        items: [
            { label: '办公桌(简约)', w: 48, h: 32, color: '#2c3e50', utility: 'none', pixelPattern: 'desk_pixel', tags: ['desk'] },
            { label: '办公桌(木质)', w: 60, h: 40, color: '#8b4513', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk'] },
            { label: '老板班台', w: 126, h: 54, color: '#8b4513', utility: 'none', pixelPattern: 'desk_wood', tags: ['desk', 'boss_desk'] },
            { label: '会议长桌', w: 168, h: 84, color: '#f0f5ff', utility: 'work_group', pixelPattern: 'table_marble', tags: ['meeting'] },
            { label: '电脑工位', w: 60, h: 50, color: '#dfe6e9', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'desk'] },
            { label: '服务器机组', w: 64, h: 38, color: '#253048', utility: 'none', pixelPattern: 'server', pixelGlow: true, tags: ['server'] },
            { label: '收银台', w: 60, h: 44, color: '#2c3e50', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] },
            { label: '前台', w: 100, h: 40, color: '#a29bfe', utility: 'work', pixelPattern: 'reception', tags: ['desk', 'reception'] },
            { label: '画架', w: 44, h: 54, color: '#ff5252', utility: 'paint', pixelPattern: 'easel', tags: ['easel', 'art'] },
            { label: '课桌', w: 50, h: 30, color: '#fdcb6e', utility: 'study', pixelPattern: 'desk_school', tags: ['desk', 'study'] },
            { label: '黑板', w: 100, h: 10, color: '#2d3436', utility: 'none', tags: ['blackboard'] },
            { label: '医疗床', w: 60, h: 70, color: '#fff', utility: 'healing', pixelPattern: 'bed_king', tags: ['medical_bed', 'bed'] },
            { label: 'CT扫描仪', w: 60, h: 80, color: '#2d3436', utility: 'none', pixelPattern: 'server', tags: ['medical_device'] },
            { label: 'DJ控制台', w: 126, h: 54, color: '#7158e2', utility: 'music', pixelPattern: 'dj_stage', pixelGlow: true, tags: ['dj_booth'] },
            { label: '老板椅', w: 44, h: 44, color: '#253048', utility: 'work', pixelPattern: 'chair_boss', tags: ['boss_chair', 'seat'] },
        ]
    },
    'home': {
        label: '居家生活',
        items: [
            { label: '双人床(King)', w: 100, h: 120, color: '#ff7675', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed', 'sleep'] },
            { label: '单人床', w: 60, h: 90, color: '#74b9ff', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed', 'sleep'] },
            { label: '上下铺', w: 50, h: 80, color: '#ffb142', utility: 'energy', pixelPattern: 'bed_bunk', tags: ['bed', 'sleep'] },
            { label: '婴儿床', w: 40, h: 40, color: '#ff9ff3', utility: 'nap_crib', pixelPattern: 'bed_crib', tags: ['bed', 'baby'] },
            { label: '真皮沙发', w: 120, h: 50, color: '#a29bfe', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['sofa', 'seat'] },
            { label: '布艺沙发', w: 80, h: 40, color: '#74b9ff', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa', 'seat'] },
            { label: '懒人沙发', w: 44, h: 44, color: '#ff7aa8', utility: 'comfort', pixelPattern: 'beanbag', tags: ['sofa', 'seat'] },
            { label: '衣柜', w: 40, h: 100, color: '#636e72', utility: 'none', pixelPattern: 'closet', tags: ['furniture'] },
            { label: '餐桌', w: 64, h: 64, color: '#fab1a0', utility: 'hunger', pixelPattern: 'table_dining', tags: ['table'] },
            { label: '整体橱柜', w: 100, h: 40, color: '#b2bec3', utility: 'cook', pixelPattern: 'kitchen', tags: ['kitchen', 'stove'] },
            { label: '冰箱', w: 40, h: 40, color: '#fff', utility: 'hunger', pixelPattern: 'fridge', tags: ['kitchen'] },
            { label: '钢琴', w: 60, h: 80, color: '#2d3436', utility: 'play', pixelPattern: 'piano', tags: ['piano', 'instrument'] },
        ]
    },
    'bathroom': {
        label: '卫浴洗护',
        items: [
            { label: '马桶', w: 30, h: 30, color: '#fff', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] },
            { label: '淋浴间', w: 40, h: 40, color: '#81ecec', utility: 'hygiene', pixelPattern: 'shower_stall', tags: ['shower'] },
            { label: '浴缸', w: 80, h: 60, color: '#fff', utility: 'hygiene', pixelPattern: 'bath_tub', tags: ['bath'] },
            { label: '公厕隔间', w: 40, h: 100, color: '#fff', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] },
        ]
    },
    'shop': {
        label: '商业娱乐',
        items: [
            { label: '食品货架', w: 60, h: 160, color: '#ffdd59', utility: 'buy_item', pixelPattern: 'shelf_food', tags: ['shelf'] },
            { label: '蔬菜货架', w: 64, h: 28, color: '#55efc4', utility: 'buy_item', pixelPattern: 'shelf_veg', tags: ['shelf'] },
            { label: '服装挂架', w: 10, h: 60, color: '#a29bfe', utility: 'buy_item', pixelPattern: 'clothes_rack', tags: ['shelf'] },
            { label: '美妆柜台', w: 54, h: 34, color: '#ff7aa8', utility: 'buy_item', pixelPattern: 'counter_cosmetic', tags: ['shelf', 'counter'] },
            { label: '自动贩卖机', w: 44, h: 34, color: '#ff5252', utility: 'buy_drink', pixelPattern: 'vending', tags: ['shop'] },
            { label: '美食推车', w: 60, h: 40, color: '#fdcb6e', utility: 'buy_food', pixelPattern: 'food_cart', tags: ['shop'] },
            { label: '爆米花机', w: 44, h: 44, color: '#ffd32a', utility: 'buy_food', pixelPattern: 'popcorn_machine', tags: ['shop'] },
            { label: '冰淇淋车', w: 64, h: 44, color: '#ffd166', utility: 'buy_food', pixelPattern: 'icecream_cart', tags: ['shop'] },
            { label: '抓娃娃机', w: 44, h: 44, color: '#ff7aa8', utility: 'play', pixelPattern: 'claw_machine', tags: ['game'] },
            { label: '赛车游戏机', w: 54, h: 74, color: '#8a7cff', utility: 'play', pixelPattern: 'arcade_racing', pixelGlow: true, tags: ['game'] },
            { label: '跳舞机', w: 64, h: 64, color: '#ff7aa8', utility: 'dance', pixelPattern: 'dance_machine', pixelGlow: true, tags: ['game'] },
            { label: '网吧电脑', w: 44, h: 34, color: '#3742fa', utility: 'work', pixelPattern: 'pc_pixel', tags: ['computer', 'game'] },
        ]
    },
    'fitness': {
        label: '运动设施',
        items: [
            { label: '跑步机', w: 44, h: 84, color: '#0984e3', utility: 'run', pixelPattern: 'treadmill', tags: ['gym'] },
            { label: '哑铃架', w: 44, h: 44, color: '#d63031', utility: 'lift', pixelPattern: 'weights_rack', tags: ['gym'] },
            { label: '篮球架', w: 20, h: 40, color: '#e17055', utility: 'play', pixelPattern: 'hoop', tags: ['sports'] },
            { label: '滑梯', w: 60, h: 100, color: '#ff7675', utility: 'play', pixelPattern: 'slide', tags: ['play'] },
            { label: '游戏垫', w: 44, h: 44, color: '#74b9ff', utility: 'play_blocks', pixelPattern: 'play_mat', tags: ['play'] },
        ]
    },
    'decor': {
        label: '环境装饰',
        items: [
            { label: '公园长椅', w: 50, h: 20, color: '#e17055', utility: 'comfort', pixelPattern: 'bench_park', tags: ['seat'] },
            { label: '喷泉池', w: 150, h: 150, color: '#74b9ff', utility: 'none', pixelPattern: 'water', tags: ['decor'] },
            { label: '小黄鸭船', w: 44, h: 34, color: '#ffdd59', utility: 'play', pixelPattern: 'boat_duck', tags: ['play'] },
            { label: '野餐垫', w: 108, h: 84, color: '#ff6b81', utility: 'hunger', pixelPattern: 'picnic_mat', tags: ['seat', 'picnic'] },
            { label: '地毯(艺术)', w: 108, h: 108, color: '#ff9c8a', utility: 'none', pixelPattern: 'rug_art', tags: ['decor'] },
            { label: '地毯(波斯)', w: 230, h: 108, color: '#c23636', utility: 'none', pixelPattern: 'rug_persian', tags: ['decor'] },
            { label: '纪念碑', w: 30, h: 30, color: '#ffffff', utility: 'none', pixelPattern: 'statue', tags: ['decor'] },
            { label: '雕像', w: 50, h: 50, color: '#ffffff', utility: 'art', pixelPattern: 'statue', tags: ['art'] },
            { label: '展示柜', w: 40, h: 40, color: '#00d2d3', utility: 'art', pixelPattern: 'display_case', pixelGlow: true, tags: ['art'] },
            { label: '梧桐树', w: 42, h: 42, color: '#253048', utility: 'none', pixelPattern: 'tree_pixel', pixelOutline: true, tags: ['tree'] },
            { label: '灌木丛', w: 40, h: 40, color: '#27ae60', utility: 'none', pixelPattern: 'bush', tags: ['plant'] },
            { label: '玫瑰花坛', w: 44, h: 44, color: '#ff6b81', utility: 'gardening', pixelPattern: 'flower_rose', tags: ['plant'] },
            { label: '消防栓', w: 18, h: 18, color: '#ff5252', utility: 'none', pixelOutline: true, tags: ['decor'] },
            { label: '垃圾桶', w: 24, h: 24, color: '#2c3e50', utility: 'none', pixelPattern: 'trash', tags: ['decor'] },
            { label: '保险柜', w: 34, h: 34, color: '#5a6572', utility: 'none', pixelPattern: 'safe', tags: ['decor'] },
        ]
    }
};

// 1. 地皮/户外材质 (Plot Mode)
const SURFACE_TYPES = [
    { label: '草地', color: '#8cb393', pattern: 'grass' },
    { label: '柏油路', color: '#3d404b', pattern: 'stripes' },
    { label: '斑马线', color: 'rgba(255,255,255,0.2)', pattern: 'zebra' },
    { label: '水池', color: '#5a8fff', pattern: 'water' },
];

// 2. [新增] 房间/地板材质 (Selection Mode)
// 这些选项现在只在选中房间后显示
const FLOOR_PATTERNS = [
    { label: '基础', pattern: 'simple' },
    { label: '木地板', pattern: 'wood' },
    { label: '瓷砖', pattern: 'tile' },
    { label: '地砖', pattern: 'pave_fancy' },
    { label: '商场', pattern: 'mall' },
    { label: '网格', pattern: 'grid' },
];

const EditorPanel: React.FC<EditorPanelProps> = ({ onClose }) => {
    // 模式状态：Plot(地皮) | Floor(房间) | Furniture(家具)
    const [mode, setMode] = useState<'plot' | 'furniture' | 'floor'>('plot');
    const [category, setCategory] = useState('career'); // 默认显示职业
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    
    // 编辑状态
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [selectedFurniture, setSelectedFurniture] = useState<Furniture | null>(null);

    // [核心修改] 工具状态：'camera' (漫游) | 'select' (编辑/选择)
    const [activeTool, setActiveTool] = useState<'camera' | 'select'>('select');

    // 面板拖拽状态
    const panelRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [position, setPosition] = useState({ x: 90, y: 80 });
    const [isPanelDragging, setIsPanelDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        GameStore.enterEditorMode();
        // 默认进入编辑模式
        // @ts-ignore
        GameStore.editor.setTool('select');
        
        const updateState = () => {
            setCanUndo(GameStore.history.length > 0);
            setCanRedo(GameStore.redoStack.length > 0);
            
            // 同步 Store 中的工具状态
            // @ts-ignore
            if (GameStore.editor.activeTool) {
                // @ts-ignore
                setActiveTool(GameStore.editor.activeTool);
            }

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

    // 键盘删除事件
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (GameStore.editor.selectedPlotId) {
                    GameStore.removePlot(GameStore.editor.selectedPlotId);
                } else if (GameStore.editor.selectedFurnitureId) {
                    GameStore.removeFurniture(GameStore.editor.selectedFurnitureId);
                } else if (GameStore.editor.selectedRoomId) {
                    GameStore.removeRoom(GameStore.editor.selectedRoomId);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
    
    // [核心修改] 工具切换
    const handleToolChange = (tool: 'camera' | 'select') => {
        GameStore.editor.setTool(tool);
        setActiveTool(tool);
    };
    

    const handleSetMode = (m: 'plot' | 'furniture' | 'floor') => {
        setMode(m);
        GameStore.editor.mode = m;
        // 重置选中状态
        GameStore.editor.selectedPlotId = null;
        GameStore.editor.selectedFurnitureId = null;
        GameStore.editor.selectedRoomId = null;
        GameStore.editor.placingTemplateId = null;
        GameStore.editor.placingFurniture = null;
        GameStore.editor.drawingFloor = null;
        GameStore.editor.drawingPlot = null;
        GameStore.notify();
    };

    const handleStartDrawingPlot = () => {
        GameStore.startDrawingPlot('default_empty');
    };

    const handleStartPlacingPlot = (templateId: string) => {
        GameStore.startPlacingPlot(templateId);
    };

    const handleStartPlacingFurniture = (tpl: Partial<Furniture>) => {
        const initialColor = selectedColor || tpl.color || '#ffffff';
        GameStore.startPlacingFurniture({ ...tpl, id: '', x: 0, y: 0, color: initialColor });
    };

    // [修改] 统一的创建房间入口
    const handleStartDrawingRoom = () => {
        // 默认创建一个白色、基础纹理、带墙的房间
        GameStore.startDrawingFloor('simple', '#ffffff', '房间', true);
    };

    const handleStartDrawingFloor = (type: any, hasWall: boolean) => {
        const initialColor = selectedColor || type.color;
        GameStore.startDrawingFloor(type.pattern, initialColor, type.label, hasWall);
    };

    const handleDelete = () => {
        if (GameStore.editor.selectedPlotId) {
            GameStore.removePlot(GameStore.editor.selectedPlotId);
        } else if (GameStore.editor.selectedFurnitureId) {
            GameStore.removeFurniture(GameStore.editor.selectedFurnitureId);
        } else if (GameStore.editor.selectedRoomId) {
            GameStore.removeRoom(GameStore.editor.selectedRoomId);
        }
    };

    // 更改家具/房间颜色
    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        if (GameStore.editor.placingFurniture) {
            GameStore.editor.placingFurniture.color = color;
            GameStore.notify();
        } else if (GameStore.editor.selectedFurnitureId) {
            const f = GameStore.furniture.find(i => i.id === GameStore.editor.selectedFurnitureId);
            if (f) { f.color = color; GameStore.notify(); }
        } else if (GameStore.editor.drawingFloor) {
            GameStore.editor.drawingFloor.color = color;
            GameStore.notify();
        } else if (GameStore.editor.selectedRoomId) {
            const r = GameStore.rooms.find(rm => rm.id === GameStore.editor.selectedRoomId);
            if (r) { r.color = color; GameStore.notify(); }
        }
    };

    // [新增] 更改房间图案 (材质)
    const handlePatternChange = (pattern: string) => {
        if (GameStore.editor.selectedRoomId) {
            const r = GameStore.rooms.find(rm => rm.id === GameStore.editor.selectedRoomId);
            if (r) { r.pixelPattern = pattern; GameStore.notify(); }
        }
    };

    const handleSave = () => { GameStore.confirmEditorChanges(); onClose(); };
    const handleCancel = () => { GameStore.cancelEditorChanges(); onClose(); };

    const handleExport = () => {
        const mapData = GameStore.getMapData();
        const jsonStr = JSON.stringify(mapData, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `simgod_map_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                GameStore.importMapData(json);
            } catch (err) {
                console.error(err);
                alert("❌ 文件解析失败，请确保是有效的 JSON 文件");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div 
            ref={panelRef}
            style={{ left: position.x, top: position.y }}
            className="fixed w-[280px] bg-[#121212]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto flex flex-col animate-[fadeIn_0.2s_ease-out] z-40 max-h-[85vh]"
        >
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />

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
                        <button onMouseDown={(e) => e.stopPropagation()} onClick={handleImportClick} className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-blue-500 transition-colors border border-blue-400/30" title="从电脑导入地图文件">导入</button>
                        <button onMouseDown={(e) => e.stopPropagation()} onClick={handleExport} className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-purple-500 transition-colors border border-purple-400/30" title="下载当前地图文件">导出</button>
                        <button onMouseDown={(e) => e.stopPropagation()} onClick={handleSave} className="bg-success text-black text-[10px] font-bold px-2 py-1 rounded hover:bg-white transition-colors">应用</button>
                        <button onMouseDown={(e) => e.stopPropagation()} onClick={handleCancel} className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-danger hover:text-white transition-colors">关闭</button>
                    </div>
                </div>
                
                <div className="flex gap-1 justify-between" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                        <button onClick={() => GameStore.undo()} disabled={!canUndo} className={`px-2 py-1 rounded text-[10px] border ${canUndo ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-transparent border-transparent text-gray-600 cursor-not-allowed'}`}>↩ 撤销</button>
                        <button onClick={() => GameStore.redo()} disabled={!canRedo} className={`px-2 py-1 rounded text-[10px] border ${canRedo ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-transparent border-transparent text-gray-600 cursor-not-allowed'}`}>↪ 恢复</button>
                    </div>
                    <button onClick={() => GameStore.clearMap()} className="px-2 py-1 rounded text-[10px] border border-danger/30 text-danger hover:bg-danger/20">🗑️ 清空</button>
                </div>
            </div>

            {/* 工具栏 */}
            <div className="flex gap-2 p-2 bg-black/20 border-b border-white/10 justify-center">
                <button
                    onClick={() => handleToolChange('camera')}
                    className={`flex-1 py-1.5 text-xs rounded border transition-all flex items-center justify-center gap-2 ${activeTool === 'camera' ? 'bg-accent text-black border-accent font-bold shadow-[0_0_10px_rgba(162,155,254,0.3)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    title="漫游模式：左键拖拽移动镜头"
                >
                    <span>✋</span> 漫游镜头
                </button>
                <button
                    onClick={() => handleToolChange('select')}
                    className={`flex-1 py-1.5 text-xs rounded border transition-all flex items-center justify-center gap-2 ${activeTool === 'select' ? 'bg-blue-500 text-white border-blue-400 font-bold shadow-[0_0_10px_rgba(9,132,227,0.5)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    title="编辑模式：拖拽物体移动，拖拽边角缩放"
                >
                    <span>👆</span> 选择/编辑
                </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex border-b border-white/10">
                <button onClick={() => handleSetMode('plot')} className={`flex-1 py-2 text-xs font-bold transition-colors ${mode === 'plot' ? 'bg-white/10 text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}>地皮</button>
                <button onClick={() => handleSetMode('floor')} className={`flex-1 py-2 text-xs font-bold transition-colors ${mode === 'floor' ? 'bg-white/10 text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}>房间</button>
                <button onClick={() => handleSetMode('furniture')} className={`flex-1 py-2 text-xs font-bold transition-colors ${mode === 'furniture' ? 'bg-white/10 text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}>家具</button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3">  
                {/* Current Selection Info & Delete */}
                <div className="bg-white/5 p-2 rounded border border-white/5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">当前操作</div>
                    <div className="text-xs text-gray-300 truncate mb-2">
                        {mode === 'plot' 
                            ? (GameStore.editor.selectedPlotId ? `选中地皮: ${GameStore.editor.selectedPlotId}` : (GameStore.editor.drawingPlot ? "正在框选区域..." : "拖拽地皮或选择下方模板"))
                            : mode === 'floor'
                                ? (GameStore.editor.selectedRoomId ? `选中房间: ${GameStore.editor.selectedRoomId}` : "框选区域以建造")
                                : (GameStore.editor.selectedFurnitureId ? `选中家具: ${selectedFurniture?.label}` : "拖拽家具或选择下方物品")
                        }
                    </div>
                    {(GameStore.editor.selectedPlotId || GameStore.editor.selectedFurnitureId || GameStore.editor.selectedRoomId) && (
                        <button onClick={handleDelete} className="w-full bg-danger/20 hover:bg-danger/40 text-danger border border-danger/30 rounded py-1 px-2 text-xs transition-colors">移除 (Del)</button>
                    )}
                </div>

                {/* [新增] Room Pattern Picker (Only when Room is Selected) */}
                {mode === 'floor' && GameStore.editor.selectedRoomId && (
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">更换地面材质</div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {FLOOR_PATTERNS.map(fp => {
                                const currentRoom = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                                const isActive = currentRoom?.pixelPattern === fp.pattern;
                                return (
                                    <button
                                        key={fp.pattern}
                                        onClick={() => handlePatternChange(fp.pattern)}
                                        className={`text-[10px] py-1 rounded border transition-all ${isActive ? 'bg-accent/30 border-accent text-white' : 'bg-black/20 border-white/10 text-gray-400 hover:text-gray-200'}`}
                                    >
                                        {fp.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Color Picker (Always visible for Furniture/Floor) */}
                {(mode === 'furniture' || mode === 'floor') && (
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">更改颜色</div>
                        <div className="flex flex-wrap gap-1.5">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleColorChange(c)}
                                    className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center overflow-hidden ${selectedColor === c ? 'border-white scale-110 shadow-lg' : 'border-white/10'}`}
                                    style={{ background: c === 'transparent' ? 'rgba(255,255,255,0.1)' : c }}
                                    title={c === 'transparent' ? '无填充 (透明)' : c}
                                >
                                    {c === 'transparent' && <div className="w-full h-px bg-red-500 transform rotate-45 scale-150"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="flex flex-col gap-2 h-full">
                    {mode === 'plot' ? (
                        <>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">建造空地</div>
                            <div className="mb-3">
                                <button onClick={handleStartDrawingPlot} className={`w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-2 text-center flex justify-center items-center gap-2 transition-all active:scale-95 ${GameStore.editor.drawingPlot ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' : ''}`}>
                                    <span className={`text-xs font-bold ${GameStore.editor.drawingPlot ? 'text-yellow-400' : 'text-gray-200'}`}>⬜ 框选空地 (自定义)</span>
                                </button>
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">地表材质 (笔刷)</div>
                            <div className="grid grid-cols-2 gap-2 pb-2">
                                {SURFACE_TYPES.map((type) => (
                                    <button key={type.pattern} onClick={() => handleStartDrawingFloor(type, false)} className={`bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-2 text-left flex items-center gap-2 transition-all active:scale-95 ${GameStore.editor.drawingFloor?.pattern === type.pattern ? 'border-yellow-400 bg-yellow-400/10' : ''}`}>
                                        <div className="w-4 h-4 border border-white/20 rounded" style={{background: type.color}}></div>
                                        <span className={`text-xs font-bold ${GameStore.editor.drawingFloor?.pattern === type.pattern ? 'text-yellow-400' : 'text-gray-200'}`}>{type.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">建筑模板</div>
                            <div className="grid grid-cols-2 gap-2 pb-2">
                                {Object.entries(PLOTS).filter(([k]) => !k.startsWith('road') && !k.startsWith('default')).map(([key, template]) => (
                                    <button key={key} onClick={() => handleStartPlacingPlot(key)} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-2 text-left flex flex-col gap-1 transition-all active:scale-95">
                                        <span className="text-xs font-bold text-gray-200 truncate w-full">{PLOT_NAMES[key] || PLOT_NAMES[key.replace('_template', '')] || key}</span>
                                        <span className="text-[9px] text-gray-500">{template.width}x{template.height}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : mode === 'floor' ? (
                        <>
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">建造工具</div>
                            <div className="mb-3">
                                <button 
                                    onClick={handleStartDrawingRoom} 
                                    className={`w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-3 text-center flex justify-center items-center gap-2 transition-all active:scale-95 ${GameStore.editor.drawingFloor ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' : ''}`}
                                >
                                    <span className="text-lg">🏗️</span>
                                    <span className={`text-xs font-bold ${GameStore.editor.drawingFloor ? 'text-yellow-400' : 'text-gray-200'}`}>框选建造房间</span>
                                </button>
                            </div>
                            <div className="text-[10px] text-gray-400 px-1">
                                💡 提示：建造完成后，选中房间可修改地面的颜色和图案。
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-1 mb-1">
                                {Object.entries(FURNITURE_CATALOG).map(([key, data]) => (
                                    <button key={key} onClick={() => setCategory(key)} className={`px-2 py-1 rounded text-[10px] border ${category === key ? 'bg-accent/20 border-accent text-accent' : 'border-white/10 text-gray-400 hover:text-white'}`}>{data.label}</button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 pb-2">
                                {FURNITURE_CATALOG[category].items.map((item) => (
                                    <button key={item.label} onClick={() => handleStartPlacingFurniture(item)} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 rounded p-2 text-left flex flex-col gap-1 transition-all active:scale-95">
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