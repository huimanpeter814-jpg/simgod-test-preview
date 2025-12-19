import { PlotTemplate, Furniture } from '../types';

// 辅助：快速生成矩阵家具
const createGrid = (baseId: string, startX: number, startY: number, cols: number, rows: number, gapX: number, gapY: number, props: any) => {
    let items: Furniture[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            items.push({
                ...props, id: `${baseId}_${r}_${c}`,
                x: startX + c * gapX, y: startY + r * gapY
            });
        }
    }
    return items;
};

// ==========================================
// 1. 居住类 (Residential)
// ==========================================

// 豪华别墅 [尺寸: 425*305] (原 600*500)
const PLOT_VILLA_WIDE: PlotTemplate = {
    id: 'villa_wide', width: 425, height: 305, type: 'residential',
    housingUnits: [{ id: 'unit', name: '半山豪宅', capacity: 6, cost: 12000, type: 'villa', area: { x: 5, y: 5, w: 415, h: 295 } }],
    rooms: [
        { id: 'garden', x: 0, y: 0, w: 425, h: 305, label: '花园', color: '#55efc4', pixelPattern: 'grass' },
        { id: 'main', x: 20, y: 20, w: 280, h: 265, label: '主楼', color: '#fff', pixelPattern: 'wood', hasWall: true },
        { id: 'pool', x: 320, y: 50, w: 80, h: 150, label: '泳池', color: '#74b9ff', pixelPattern: 'water' },
    ],
    furniture: [
        { id: 'bed_king', x: 30, y: 30, w: 80, h: 100, color: '#ff7675', label: '皇室大床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true, tags: ['bed', 'sleep'] },
        { id: 'closet', x: 120, y: 30, w: 30, h: 80, color: '#636e72', label: '衣柜', utility: 'none', pixelPattern: 'closet', tags: ['furniture'] },
        { id: 'piano', x: 200, y: 180, w: 60, h: 50, color: '#2d3436', label: '钢琴', utility: 'play_instrument', pixelPattern: 'piano', tags: ['piano'] },
        { id: 'sofa_l', x: 30, y: 220, w: 100, h: 50, color: '#a29bfe', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['sofa'] },
        { id: 'kitchen_l', x: 180, y: 30, w: 100, h: 40, color: '#b2bec3', label: '厨房', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove', 'kitchen'] },
        { id: 'fridge', x: 250, y: 80, w: 30, h: 30, color: '#fff', label: '冰箱', utility: 'hunger', pixelPattern: 'fridge', tags: ['kitchen'] },
        { id: 'treadmill', x: 330, y: 220, w: 40, h: 60, color: '#2d3436', label: '跑机', utility: 'run', pixelPattern: 'treadmill', tags: ['gym'] },
        { id: 'bath_l', x: 30, y: 150, w: 60, h: 50, color: '#fff', label: '浴缸', utility: 'hygiene', pixelPattern: 'bath_tub', tags: ['bath'] },
    ]
};

// 高级公寓 [尺寸: 260*235] (原 400*350)
const PLOT_APT_LUXURY: PlotTemplate = {
    id: 'apt_luxury', width: 260, height: 235, type: 'residential',
    housingUnits: [{ id: 'unit', name: '高级公寓', capacity: 4, cost: 3000, type: 'apartment', area: { x: 5, y: 5, w: 250, h: 225 } }],
    rooms: [
        { id: 'floor', x: 5, y: 5, w: 250, h: 225, label: '全屋', color: '#f5f6fa', pixelPattern: 'wood', hasWall: true }
    ],
    furniture: [
        { id: 'bed', x: 170, y: 20, w: 70, h: 90, color: '#74b9ff', label: '双人床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true, tags: ['bed'] },
        { id: 'pc_desk', x: 180, y: 130, w: 50, h: 30, color: '#dfe6e9', label: '电脑', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'desk'] },
        { id: 'sofa', x: 20, y: 20, w: 80, h: 40, color: '#fab1a0', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa'] },
        { id: 'kitchen', x: 20, y: 160, w: 80, h: 30, color: '#b2bec3', label: '厨房', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'bath', x: 170, y: 180, w: 50, h: 30, color: '#fff', label: '浴缸', utility: 'hygiene', pixelPattern: 'bath_tub', tags: ['bath'] },
        { id: 'toilet', x: 230, y: 180, w: 20, h: 20, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] },
    ]
};

// 养老院 [尺寸: 410*325] (原 500*400)
const PLOT_ELDER_HOME: PlotTemplate = {
    id: 'elder_home', width: 410, height: 325, type: 'residential',
    housingUnits: [{ id: 'unit', name: '养老社区', capacity: 8, cost: 1500, type: 'elder_care', area: { x: 5, y: 5, w: 400, h: 315 } }],
    rooms: [
        { id: 'main', x: 5, y: 5, w: 400, h: 315, label: '疗养中心', color: '#f0fff4', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        // 2x2 grid of beds, tighter
        ...createGrid('bed_e', 20, 20, 4, 2, 90, 100, { w: 60, h: 80, color: '#fff', label: '护理床', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed', 'medical_bed'] }),
        { id: 'nurse_desk', x: 20, y: 240, w: 80, h: 40, color: '#fff', label: '护士站', utility: 'work', pixelPattern: 'reception', tags: ['desk'] },
        { id: 'tv_area', x: 150, y: 240, w: 100, h: 40, color: '#fab1a0', label: '活动区', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa'] },
        { id: 'plant', x: 300, y: 240, w: 40, h: 40, color: '#2ecc71', label: '盆栽', utility: 'gardening', pixelPattern: 'bush', tags: ['plant'] },
    ]
};

// ==========================================
// 2. 办公类 (Workplace)
// ==========================================

// 科技园区 [尺寸: 405*285] (原 600*500)
const PLOT_TECH_HQ: PlotTemplate = {
    id: 'tech_hq', width: 405, height: 285, type: 'work',
    rooms: [{ id: 'main', x: 5, y: 5, w: 395, h: 275, label: '科技园区', color: '#f1f2f6', pixelPattern: 'grid', hasWall: true }],
    furniture: [
        // 4x2 grid
        ...createGrid('desk', 20, 20, 4, 2, 70, 60, { w: 50, h: 40, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel', tags: ['desk', 'computer'] }),
        { id: 'server1', x: 340, y: 20, w: 40, h: 60, color: '#1e1e1e', label: '服务器', utility: 'work', pixelPattern: 'server', tags: ['server'] },
        { id: 'boss', x: 300, y: 200, w: 80, h: 50, color: '#8b4513', label: 'CEO室', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk', 'boss_desk'] },
        { id: 'meet', x: 20, y: 180, w: 120, h: 60, color: '#fff', label: '会议桌', utility: 'work', pixelPattern: 'table_dining', tags: ['meeting'] },
    ]
};

// 金融中心 [尺寸: 280*425] (纵向, 原 500*400)
const PLOT_FINANCE: PlotTemplate = {
    id: 'finance_center', width: 280, height: 425, type: 'work',
    rooms: [{ id: 'main', x: 5, y: 5, w: 270, h: 415, label: '金融中心', color: '#ced6e0', pixelPattern: 'tile', hasWall: true }],
    furniture: [
        // 3 cols, 3 rows, vertical layout
        ...createGrid('desk_biz', 20, 30, 2, 4, 90, 80, { w: 70, h: 40, color: '#b2bec3', label: '办公桌', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk', 'computer'] }),
        { id: 'boss', x: 150, y: 350, w: 100, h: 50, color: '#2d3436', label: '总裁桌', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk', 'boss_desk', 'computer'] },
        { id: 'sofa_rec', x: 20, y: 360, w: 80, h: 40, color: '#a29bfe', label: '接待', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['sofa'] },
    ]
};

// 创意工坊 [尺寸: 370*290] (原 500*400)
const PLOT_CREATIVE: PlotTemplate = {
    id: 'creative_park', width: 370, height: 290, type: 'work',
    rooms: [{ id: 'main', x: 5, y: 5, w: 360, h: 280, label: '创意园', color: '#fff0f0', pixelPattern: 'wood', hasWall: true }],
    furniture: [
        ...createGrid('easel', 20, 20, 4, 1, 60, 0, { w: 40, h: 50, color: '#ff7675', label: '画架', utility: 'paint', pixelPattern: 'easel', tags: ['easel', 'art'] }),
        ...createGrid('mac', 20, 100, 3, 2, 80, 80, { w: 60, h: 50, color: '#fff', label: '设计位', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'desk'] }),
        { id: 'chill', x: 280, y: 150, w: 70, h: 40, color: '#fab1a0', label: '灵感区', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa'] },
    ]
};

// ==========================================
// 3. 公共服务 (Public)
// ==========================================

// 幼儿园 [尺寸: 260*220] (原 400*300)
const PLOT_KINDERGARTEN: PlotTemplate = {
    id: 'kindergarten', width: 260, height: 220, type: 'public',
    rooms: [
        { id: 'play', x: 5, y: 5, w: 180, h: 210, label: '游戏区', color: '#ff9ff3', pixelPattern: 'wood', hasWall: true },
        { id: 'nap', x: 190, y: 5, w: 65, h: 210, label: '午睡', color: '#74b9ff', pixelPattern: 'simple', hasWall: true }
    ],
    furniture: [
        ...createGrid('crib', 200, 20, 1, 3, 0, 50, { w: 40, h: 40, color: '#fab1a0', label: '小床', utility: 'nap_crib', pixelPattern: 'bed_crib', tags: ['bed', 'baby'] }),
        { id: 'toys', x: 20, y: 20, w: 50, h: 50, color: '#fdcb6e', label: '积木', utility: 'play_blocks', pixelPattern: 'rug_art', tags: ['play'] },
        { id: 'slide', x: 100, y: 20, w: 50, h: 70, color: '#ff7675', label: '滑梯', utility: 'play', pixelPattern: 'treadmill', tags: ['play'] },
        { id: 'teacher', x: 20, y: 150, w: 60, h: 30, color: '#a29bfe', label: '讲台', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk', 'blackboard'] }
    ]
};

// 中学 [尺寸: 270*305] (竖版布局) (原 600*400)
const PLOT_SCHOOL_HIGH: PlotTemplate = {
    id: 'school_high', width: 270, height: 305, type: 'public',
    rooms: [
        { id: 'class', x: 5, y: 5, w: 260, h: 190, label: '教室', color: '#dfe6e9', pixelPattern: 'wood', hasWall: true },
        { id: 'field', x: 5, y: 200, w: 260, h: 100, label: '操场', color: '#27ae60', pixelPattern: 'grass', hasWall: false }
    ],
    furniture: [
        ...createGrid('desk', 20, 50, 4, 2, 60, 50, { w: 40, h: 30, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school', tags: ['desk', 'study'] }),
        { id: 'board', x: 70, y: 10, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none', tags: ['blackboard'] },
        { id: 'teacher', x: 90, y: 25, w: 60, h: 20, color: '#a29bfe', label: '讲台', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        { id: 'hoop', x: 120, y: 210, w: 20, h: 10, color: '#e17055', label: '篮框', utility: 'play', tags: ['sports'] },
        { id: 'run', x: 50, y: 230, w: 150, h: 60, color: '#e55039', label: '跑道', utility: 'run', pixelPattern: 'treadmill', tags: ['sports'] }
    ]
};

// 小学 [尺寸: 260*300] (复用学校逻辑但不同尺寸)
const PLOT_SCHOOL_ELEM: PlotTemplate = {
    id: 'school_elem', width: 260, height: 300, type: 'public',
    rooms: [
        { id: 'class', x: 5, y: 5, w: 250, h: 180, label: '教室', color: '#dfe6e9', pixelPattern: 'wood', hasWall: true },
        { id: 'field', x: 5, y: 190, w: 250, h: 105, label: '操场', color: '#27ae60', pixelPattern: 'grass', hasWall: false }
    ],
    furniture: [
        ...createGrid('desk', 20, 50, 3, 2, 70, 50, { w: 40, h: 30, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school', tags: ['desk', 'study'] }),
        { id: 'board', x: 60, y: 10, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none', tags: ['blackboard'] },
        { id: 'teacher', x: 80, y: 25, w: 60, h: 20, color: '#a29bfe', label: '讲台', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        { id: 'slide', x: 100, y: 220, w: 60, h: 50, color: '#ff7675', label: '滑梯', utility: 'play', pixelPattern: 'treadmill', tags: ['play'] }
    ]
};

// 健身中心 [尺寸: 190*305] (竖版) (原 500*400)
const PLOT_GYM: PlotTemplate = {
    id: 'gym_center', width: 190, height: 305, type: 'public',
    rooms: [
        { id: 'main', x: 5, y: 5, w: 180, h: 295, label: '健身房', color: '#2f3542', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        ...createGrid('run', 20, 20, 2, 2, 60, 90, { w: 40, h: 70, color: '#2d3436', label: '跑机', utility: 'run', pixelPattern: 'treadmill', tags: ['gym'] }),
        ...createGrid('lift', 20, 200, 2, 1, 70, 0, { w: 50, h: 80, color: '#636e72', label: '举重', utility: 'lift', pixelPattern: 'weights_rack', tags: ['gym'] }),
        { id: 'mat', x: 140, y: 50, w: 30, h: 70, color: '#ff7aa8', label: '瑜伽', utility: 'stretch', pixelPattern: 'yoga_mat', tags: ['gym'] },
        { id: 'shower', x: 140, y: 200, w: 30, h: 30, color: '#81ecec', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall', tags: ['shower'] }
    ]
};

// 综合医院 [尺寸: 285*230] (原 600*500)
const PLOT_HOSPITAL: PlotTemplate = {
    id: 'hospital_l', width: 285, height: 230, type: 'public',
    rooms: [
        { id: 'lobby', x: 5, y: 5, w: 100, h: 220, label: '门诊', color: '#fff', pixelPattern: 'tile', hasWall: true },
        { id: 'ward', x: 110, y: 5, w: 170, h: 220, label: '住院部', color: '#dff9fb', pixelPattern: 'simple', hasWall: true }
    ],
    furniture: [
        { id: 'reception', x: 20, y: 20, w: 60, h: 30, color: '#74b9ff', label: '挂号', utility: 'work', pixelPattern: 'reception', tags: ['desk'] },
        { id: 'doc', x: 20, y: 100, w: 60, h: 40, color: '#fff', label: '诊室', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        ...createGrid('bed_h', 130, 20, 2, 2, 70, 100, { w: 50, h: 70, color: '#fff', label: '病床', utility: 'healing', pixelPattern: 'medical_bed', tags: ['medical_bed', 'bed'] }),
        { id: 'ct', x: 20, y: 170, w: 60, h: 40, color: '#b2bec3', label: 'CT', utility: 'none', pixelPattern: 'scanner', tags: ['medical_device'] }
    ]
};

// 图书馆 [尺寸: 200*260] (原 500*400)
const PLOT_LIBRARY: PlotTemplate = {
    id: 'library', width: 200, height: 260, type: 'public',
    rooms: [{ id: 'main', x: 5, y: 5, w: 190, h: 250, label: '图书馆', color: '#f7f1e3', pixelPattern: 'wood', hasWall: true }],
    furniture: [
        { id: 'admin', x: 20, y: 210, w: 60, h: 30, color: '#8b4513', label: '借阅台', utility: 'work', pixelPattern: 'reception', tags: ['desk'] },
        ...createGrid('shelf', 20, 20, 2, 3, 80, 60, { w: 60, h: 30, color: '#a29bfe', label: '书架', utility: 'buy_book', pixelPattern: 'closet', tags: ['bookshelf'] }),
        { id: 'read', x: 120, y: 210, w: 50, h: 30, color: '#fab1a0', label: '阅览', utility: 'study', pixelPattern: 'desk_simple', tags: ['desk', 'study'] },
    ]
};

// ==========================================
// 4. 商业类 (Commercial)
// ==========================================

// 餐厅 [尺寸: 215*220] (原 400*300)
const PLOT_RESTAURANT: PlotTemplate = {
    id: 'restaurant', width: 215, height: 220, type: 'commercial',
    rooms: [
        { id: 'hall', x: 5, y: 5, w: 130, h: 210, label: '餐厅', color: '#ffeb3b', pixelPattern: 'tile', hasWall: true },
        { id: 'kitchen', x: 140, y: 5, w: 70, h: 210, label: '后厨', color: '#b2bec3', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        ...createGrid('table', 15, 15, 2, 2, 55, 60, { w: 40, h: 40, color: '#fab1a0', label: '餐桌', utility: 'eat_out', pixelPattern: 'table_dining', tags: ['table'] }),
        { id: 'stove1', x: 150, y: 20, w: 50, h: 30, color: '#636e72', label: '灶台', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'stove2', x: 150, y: 60, w: 50, h: 30, color: '#636e72', label: '灶台', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'fridge', x: 150, y: 150, w: 40, h: 40, color: '#fff', label: '冰柜', utility: 'none', pixelPattern: 'fridge', tags: ['kitchen'] },
        { id: 'cashier', x: 20, y: 160, w: 50, h: 30, color: '#2c3e50', label: '收银', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] }
    ]
};

// 咖啡厅 [尺寸: 195*180] (原 300*300)
const PLOT_CAFE: PlotTemplate = {
    id: 'cafe', width: 195, height: 180, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 185, h: 170, label: '咖啡厅', color: '#d4a373', pixelPattern: 'wood', hasWall: true }],
    furniture: [
        { id: 'counter', x: 10, y: 10, w: 100, h: 30, color: '#8b4513', label: '吧台', utility: 'work', pixelPattern: 'reception', tags: ['bar', 'cashier', 'stove'] },
        ...createGrid('table', 20, 60, 2, 2, 70, 50, { w: 40, h: 30, color: '#fff', label: '圆桌', utility: 'eat_out', pixelPattern: 'table_dining', tags: ['table'] }),
    ]
};

// 电影院 [尺寸: 260*300] (原 400*400)
const PLOT_CINEMA: PlotTemplate = {
    id: 'cinema', width: 260, height: 300, type: 'commercial',
    rooms: [{ id: 'hall', x: 5, y: 5, w: 250, h: 290, label: '影厅', color: '#2d3436', pixelPattern: 'simple', hasWall: true }],
    furniture: [
        { id: 'screen', x: 30, y: 20, w: 200, h: 10, color: '#fff', label: '银幕', utility: 'none', tags: ['screen'] },
        ...createGrid('seat', 30, 50, 4, 4, 50, 40, { w: 30, h: 30, color: '#d63031', label: '座位', utility: 'cinema_3d', pixelPattern: 'sofa_vip', tags: ['seat'] }),
        { id: 'ticket', x: 180, y: 250, w: 60, h: 30, color: '#e17055', label: '售票', utility: 'work', pixelPattern: 'reception', tags: ['desk', 'cashier'] }
    ]
};

// 网咖 [尺寸: 195*240] (原 300*300)
const PLOT_NETCAFE: PlotTemplate = {
    id: 'netcafe', width: 195, height: 240, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 185, h: 230, label: '网咖', color: '#2f3542', pixelPattern: 'grid', hasWall: true }],
    furniture: [
        ...createGrid('pc', 15, 15, 2, 4, 80, 50, { w: 60, h: 40, color: '#3742fa', label: '电竞位', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'game'] }),
        { id: 'admin', x: 100, y: 200, w: 60, h: 25, color: '#a29bfe', label: '网管', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk', 'cashier'] }
    ]
};

// 超市 [尺寸: 290*205] (原 600*400)
const PLOT_SUPERMARKET: PlotTemplate = {
    id: 'super_l', width: 290, height: 205, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 280, h: 195, label: '超市', color: '#fff', pixelPattern: 'tile', hasWall: true }],
    furniture: [
        ...createGrid('shelf_f', 20, 20, 3, 2, 70, 70, { w: 50, h: 50, color: '#ffdd59', label: '货架', utility: 'buy_item', pixelPattern: 'shelf_food', tags: ['shelf'] }),
        ...createGrid('shelf_v', 220, 20, 1, 2, 0, 70, { w: 50, h: 50, color: '#55efc4', label: '生鲜', utility: 'buy_item', pixelPattern: 'shelf_veg', tags: ['shelf'] }),
        { id: 'cash1', x: 150, y: 160, w: 50, h: 30, color: '#2c3e50', label: '收银', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] },
        { id: 'cash2', x: 220, y: 160, w: 50, h: 30, color: '#2c3e50', label: '收银', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] }
    ]
};

// 夜店 [尺寸: 285*230] (原 500*400)
const PLOT_NIGHTCLUB: PlotTemplate = {
    id: 'nightclub', width: 285, height: 230, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 275, h: 220, label: '夜店', color: '#000', pixelPattern: 'stripes', hasWall: true }],
    furniture: [
        { id: 'dj', x: 100, y: 10, w: 80, h: 40, color: '#a29bfe', label: 'DJ', utility: 'music', pixelPattern: 'dj_stage', pixelGlow: true, tags: ['dj_booth'] },
        { id: 'dance', x: 70, y: 60, w: 140, h: 100, color: '#e84393', label: '舞池', utility: 'dance', pixelPattern: 'dance_machine', pixelGlow: true, tags: ['dance'] },
        { id: 'bar', x: 20, y: 180, w: 100, h: 30, color: '#636e72', label: '吧台', utility: 'buy_drink', pixelPattern: 'counter_cosmetic', tags: ['bar'] },
        ...createGrid('seat', 180, 170, 2, 1, 50, 0, { w: 30, h: 30, color: '#d63031', label: '座', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['seat'] })
    ]
};

// 导出所有
export const PLOTS: Record<string, PlotTemplate> = {
    'villa_wide': PLOT_VILLA_WIDE,
    'apt_luxury': PLOT_APT_LUXURY,
    'elder_home': PLOT_ELDER_HOME,
    'tech_hq': PLOT_TECH_HQ,
    'finance_center': PLOT_FINANCE,
    'creative_park': PLOT_CREATIVE,
    'gym_center': PLOT_GYM,
    'hospital_l': PLOT_HOSPITAL,
    'library': PLOT_LIBRARY,
    'super_l': PLOT_SUPERMARKET,
    'nightclub': PLOT_NIGHTCLUB,
    'kindergarten': PLOT_KINDERGARTEN,
    'school_high': PLOT_SCHOOL_HIGH,
    'school_elem': PLOT_SCHOOL_ELEM,
    'restaurant': PLOT_RESTAURANT,
    'cafe': PLOT_CAFE,
    'cinema': PLOT_CINEMA,
    'netcafe': PLOT_NETCAFE,
    'default_empty': { id: 'default_empty', width: 170, height: 170, type: 'public', rooms: [], furniture: [] }
};