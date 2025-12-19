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

// 豪华别墅
const PLOT_VILLA_WIDE: PlotTemplate = {
    id: 'villa_wide', width: 600, height: 500, type: 'residential',
    housingUnits: [{ id: 'unit', name: '半山豪宅', capacity: 6, cost: 12000, type: 'villa', area: { x: 5, y: 5, w: 590, h: 490 } }],
    rooms: [
        { id: 'garden', x: 0, y: 0, w: 600, h: 500, label: '私家花园', color: '#55efc4', pixelPattern: 'grass' },
        { id: 'main', x: 50, y: 50, w: 400, h: 400, label: '主楼', color: '#fff', pixelPattern: 'wood', hasWall: true },
        { id: 'pool', x: 470, y: 100, w: 100, h: 200, label: '泳池', color: '#74b9ff', pixelPattern: 'water' },
    ],
    furniture: [
        { id: 'bed_king', x: 70, y: 70, w: 100, h: 120, color: '#ff7675', label: '皇室大床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true, tags: ['bed', 'sleep'] },
        { id: 'closet', x: 350, y: 70, w: 40, h: 100, color: '#636e72', label: '衣帽间', utility: 'none', pixelPattern: 'closet', tags: ['furniture'] },
        { id: 'piano', x: 300, y: 350, w: 80, h: 60, color: '#2d3436', label: '三角钢琴', utility: 'play_instrument', pixelPattern: 'piano', tags: ['piano'] },
        { id: 'sofa_l', x: 70, y: 350, w: 120, h: 60, color: '#a29bfe', label: '真皮沙发', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['sofa'] },
        { id: 'tv_huge', x: 70, y: 420, w: 120, h: 10, color: '#000', label: '家庭影院', utility: 'play', tags: ['tv'] },
        { id: 'kitchen_l', x: 250, y: 250, w: 120, h: 40, color: '#b2bec3', label: '开放厨房', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove', 'kitchen'] },
        { id: 'fridge', x: 380, y: 250, w: 40, h: 40, color: '#fff', label: '双开门冰箱', utility: 'hunger', pixelPattern: 'fridge', tags: ['kitchen'] },
        { id: 'treadmill', x: 400, y: 70, w: 40, h: 80, color: '#2d3436', label: '家用跑机', utility: 'run', pixelPattern: 'treadmill', tags: ['gym'] },
        { id: 'bath_l', x: 70, y: 200, w: 80, h: 60, color: '#fff', label: '按摩浴缸', utility: 'hygiene', pixelPattern: 'bath_tub', tags: ['bath'] },
    ]
};

// 高级公寓
const PLOT_APT_LUXURY: PlotTemplate = {
    id: 'apt_luxury', width: 400, height: 350, type: 'residential',
    housingUnits: [{ id: 'unit', name: '高级公寓', capacity: 4, cost: 3000, type: 'apartment', area: { x: 5, y: 5, w: 390, h: 340 } }],
    rooms: [
        { id: 'floor', x: 5, y: 5, w: 390, h: 340, label: '全屋', color: '#f5f6fa', pixelPattern: 'wood', hasWall: true }
    ],
    furniture: [
        { id: 'bed', x: 300, y: 20, w: 80, h: 100, color: '#74b9ff', label: '双人床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true, tags: ['bed'] },
        { id: 'pc_desk', x: 300, y: 150, w: 60, h: 40, color: '#dfe6e9', label: '工作台', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'desk'] },
        { id: 'sofa', x: 20, y: 20, w: 100, h: 40, color: '#fab1a0', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa'] },
        { id: 'kitchen', x: 20, y: 250, w: 100, h: 40, color: '#b2bec3', label: '厨房', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'bath', x: 250, y: 280, w: 60, h: 40, color: '#fff', label: '浴缸', utility: 'hygiene', pixelPattern: 'bath_tub', tags: ['bath'] },
        { id: 'toilet', x: 320, y: 280, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] },
    ]
};

// 养老院
const PLOT_ELDER_HOME: PlotTemplate = {
    id: 'elder_home', width: 500, height: 400, type: 'residential',
    housingUnits: [{ id: 'unit', name: '养老社区', capacity: 8, cost: 1500, type: 'elder_care', area: { x: 5, y: 5, w: 490, h: 390 } }],
    rooms: [
        { id: 'main', x: 5, y: 5, w: 490, h: 390, label: '疗养中心', color: '#f0fff4', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        ...createGrid('bed_e', 20, 20, 4, 2, 100, 150, { w: 60, h: 80, color: '#fff', label: '护理床', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed', 'medical_bed'] }),
        { id: 'nurse_desk', x: 200, y: 150, w: 80, h: 40, color: '#fff', label: '护士站', utility: 'work', pixelPattern: 'reception', tags: ['desk'] },
        { id: 'tv_area', x: 200, y: 250, w: 100, h: 40, color: '#fab1a0', label: '活动区', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa'] },
        { id: 'plant', x: 450, y: 350, w: 40, h: 40, color: '#2ecc71', label: '绿植', utility: 'gardening', pixelPattern: 'bush', tags: ['plant'] },
    ]
};

// ==========================================
// 2. 办公类 (Workplace)
// ==========================================

const PLOT_TECH_HQ: PlotTemplate = {
    id: 'tech_hq', width: 600, height: 500, type: 'work',
    rooms: [{ id: 'main', x: 5, y: 5, w: 590, h: 490, label: '科技园区', color: '#f1f2f6', pixelPattern: 'grid', hasWall: true }],
    furniture: [
        ...createGrid('desk', 30, 30, 5, 4, 80, 70, { w: 60, h: 50, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel', tags: ['desk', 'computer'] }),
        { id: 'server1', x: 500, y: 30, w: 40, h: 60, color: '#1e1e1e', label: '服务器', utility: 'work', pixelPattern: 'server', tags: ['server'] },
        { id: 'server2', x: 550, y: 30, w: 40, h: 60, color: '#1e1e1e', label: '服务器', utility: 'work', pixelPattern: 'server', tags: ['server'] },
        { id: 'boss', x: 450, y: 400, w: 100, h: 60, color: '#8b4513', label: 'CEO办公室', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk', 'boss_desk'] },
        { id: 'meet', x: 30, y: 400, w: 160, h: 80, color: '#fff', label: '会议桌', utility: 'work', pixelPattern: 'table_dining', tags: ['meeting'] },
    ]
};

const PLOT_FINANCE: PlotTemplate = {
    id: 'finance_center', width: 500, height: 400, type: 'work',
    rooms: [{ id: 'main', x: 5, y: 5, w: 490, h: 390, label: '金融中心', color: '#ced6e0', pixelPattern: 'tile', hasWall: true }],
    furniture: [
        ...createGrid('desk_biz', 30, 30, 4, 3, 100, 80, { w: 80, h: 50, color: '#b2bec3', label: '办公桌', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk', 'computer'] }),
        { id: 'boss', x: 350, y: 300, w: 120, h: 60, color: '#2d3436', label: '总裁桌', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk', 'boss_desk', 'computer'] },
        { id: 'sofa_rec', x: 30, y: 320, w: 100, h: 40, color: '#a29bfe', label: '接待区', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['sofa'] },
    ]
};

const PLOT_CREATIVE: PlotTemplate = {
    id: 'creative_park', width: 500, height: 400, type: 'work',
    rooms: [{ id: 'main', x: 5, y: 5, w: 490, h: 390, label: '创意园', color: '#fff0f0', pixelPattern: 'wood', hasWall: true }],
    furniture: [
        ...createGrid('easel', 30, 30, 4, 2, 80, 80, { w: 40, h: 50, color: '#ff7675', label: '画架', utility: 'paint', pixelPattern: 'easel', tags: ['easel', 'art'] }),
        ...createGrid('mac', 30, 200, 3, 2, 80, 80, { w: 60, h: 50, color: '#fff', label: '设计工位', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'desk'] }),
        { id: 'chill', x: 350, y: 200, w: 80, h: 40, color: '#fab1a0', label: '休息区', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa'] },
    ]
};

// ==========================================
// 3. 公共服务 (Public)
// ==========================================

const PLOT_KINDERGARTEN: PlotTemplate = {
    id: 'kindergarten', width: 400, height: 300, type: 'public',
    rooms: [
        { id: 'play', x: 5, y: 5, w: 290, h: 290, label: '游戏室', color: '#ff9ff3', pixelPattern: 'wood', hasWall: true },
        { id: 'nap', x: 300, y: 5, w: 90, h: 290, label: '午睡房', color: '#74b9ff', pixelPattern: 'simple', hasWall: true }
    ],
    furniture: [
        ...createGrid('crib', 310, 20, 1, 4, 0, 70, { w: 40, h: 40, color: '#fab1a0', label: '婴儿床', utility: 'nap_crib', pixelPattern: 'bed_crib', tags: ['bed', 'baby'] }),
        { id: 'toys', x: 50, y: 50, w: 60, h: 60, color: '#fdcb6e', label: '积木区', utility: 'play_blocks', pixelPattern: 'rug_art', tags: ['play'] },
        { id: 'slide', x: 150, y: 50, w: 60, h: 80, color: '#ff7675', label: '滑梯', utility: 'play', pixelPattern: 'treadmill', tags: ['play'] }, 
        // [修复] 幼师需要黑板，这里将讲台加上 blackboard 标签，或者假设是教学一体
        { id: 'teacher', x: 20, y: 250, w: 60, h: 30, color: '#a29bfe', label: '讲台', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk', 'blackboard'] }
    ]
};

const PLOT_SCHOOL_HIGH: PlotTemplate = {
    id: 'school_high', width: 600, height: 400, type: 'public',
    rooms: [
        { id: 'class', x: 5, y: 5, w: 390, h: 390, label: '教学楼', color: '#dfe6e9', pixelPattern: 'wood', hasWall: true },
        { id: 'field', x: 400, y: 5, w: 190, h: 390, label: '操场', color: '#27ae60', pixelPattern: 'grass', hasWall: false }
    ],
    furniture: [
        ...createGrid('desk', 30, 50, 4, 4, 80, 60, { w: 50, h: 30, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school', tags: ['desk', 'study'] }),
        { id: 'board', x: 100, y: 10, w: 120, h: 10, color: '#2d3436', label: '黑板', utility: 'none', tags: ['blackboard'] },
        { id: 'teacher', x: 130, y: 25, w: 60, h: 20, color: '#a29bfe', label: '讲台', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        { id: 'hoop', x: 450, y: 50, w: 10, h: 40, color: '#e17055', label: '篮球架', utility: 'play', tags: ['sports'] },
        { id: 'run', x: 420, y: 200, w: 150, h: 150, color: '#e55039', label: '跑道', utility: 'run', pixelPattern: 'treadmill', tags: ['sports'] }
    ]
};

const PLOT_GYM: PlotTemplate = {
    id: 'gym_center', width: 500, height: 400, type: 'public',
    rooms: [
        { id: 'main', x: 5, y: 5, w: 340, h: 390, label: '器械区', color: '#2f3542', pixelPattern: 'tile', hasWall: true },
        { id: 'yoga', x: 350, y: 5, w: 145, h: 390, label: '瑜伽房', color: '#ff9ff3', pixelPattern: 'wood', hasWall: true }
    ],
    furniture: [
        ...createGrid('run', 20, 20, 3, 2, 60, 100, { w: 40, h: 80, color: '#2d3436', label: '跑步机', utility: 'run', pixelPattern: 'treadmill', tags: ['gym'] }),
        ...createGrid('lift', 200, 20, 2, 2, 60, 120, { w: 50, h: 90, color: '#636e72', label: '举重床', utility: 'lift', pixelPattern: 'weights_rack', tags: ['gym'] }),
        ...createGrid('mat', 370, 30, 2, 4, 60, 90, { w: 40, h: 80, color: '#ff7aa8', label: '瑜伽垫', utility: 'stretch', pixelPattern: 'yoga_mat', tags: ['gym'] }),
        { id: 'shower', x: 20, y: 350, w: 40, h: 40, color: '#81ecec', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall', tags: ['shower'] }
    ]
};

const PLOT_HOSPITAL: PlotTemplate = {
    id: 'hospital_l', width: 600, height: 500, type: 'public',
    rooms: [
        { id: 'lobby', x: 5, y: 5, w: 190, h: 490, label: '门诊大厅', color: '#fff', pixelPattern: 'tile', hasWall: true },
        { id: 'ward', x: 200, y: 5, w: 395, h: 300, label: '住院部', color: '#dff9fb', pixelPattern: 'simple', hasWall: true },
        { id: 'tech', x: 200, y: 310, w: 395, h: 185, label: '检查室', color: '#a29bfe', pixelPattern: 'grid', hasWall: true }
    ],
    furniture: [
        { id: 'reception', x: 50, y: 50, w: 100, h: 40, color: '#74b9ff', label: '挂号处', utility: 'work', pixelPattern: 'reception', tags: ['desk'] },
        ...createGrid('doc', 20, 150, 1, 3, 0, 100, { w: 60, h: 40, color: '#fff', label: '诊室', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] }),
        ...createGrid('bed_h', 220, 20, 3, 2, 100, 120, { w: 60, h: 80, color: '#fff', label: '病床', utility: 'healing', pixelPattern: 'medical_bed', tags: ['medical_bed', 'bed'] }),
        { id: 'ct', x: 250, y: 350, w: 80, h: 100, color: '#b2bec3', label: 'CT机', utility: 'none', pixelPattern: 'scanner', tags: ['medical_device'] },
        { id: 'desk_tech', x: 400, y: 350, w: 60, h: 40, color: '#fff', label: '操作台', utility: 'work', pixelPattern: 'desk_pixel', tags: ['desk', 'computer'] }
    ]
};

const PLOT_LIBRARY: PlotTemplate = {
    id: 'library', width: 500, height: 400, type: 'public',
    rooms: [{ id: 'main', x: 5, y: 5, w: 490, h: 390, label: '图书馆', color: '#f7f1e3', pixelPattern: 'wood', hasWall: true }],
    furniture: [
        { id: 'admin', x: 20, y: 350, w: 80, h: 40, color: '#8b4513', label: '借阅台', utility: 'work', pixelPattern: 'reception', tags: ['desk'] },
        ...createGrid('shelf', 20, 20, 4, 3, 100, 80, { w: 80, h: 40, color: '#a29bfe', label: '书架', utility: 'buy_book', pixelPattern: 'closet', tags: ['bookshelf'] }),
        ...createGrid('read', 20, 280, 4, 1, 80, 0, { w: 50, h: 40, color: '#fab1a0', label: '阅览桌', utility: 'study', pixelPattern: 'desk_simple', tags: ['desk', 'study'] }),
        { id: 'chess', x: 400, y: 300, w: 50, h: 50, color: '#dfe6e9', label: '棋桌', utility: 'play_chess', pixelPattern: 'chess_table', tags: ['game', 'desk'] }
    ]
};

// ==========================================
// 4. 商业类 (Commercial)
// ==========================================

const PLOT_RESTAURANT: PlotTemplate = {
    id: 'restaurant', width: 400, height: 300, type: 'commercial',
    rooms: [
        { id: 'hall', x: 5, y: 5, w: 280, h: 290, label: '餐厅', color: '#ffeb3b', pixelPattern: 'tile', hasWall: true },
        { id: 'kitchen', x: 290, y: 5, w: 105, h: 290, label: '后厨', color: '#b2bec3', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        ...createGrid('table', 20, 20, 3, 3, 80, 80, { w: 60, h: 60, color: '#fab1a0', label: '餐桌', utility: 'eat_out', pixelPattern: 'table_dining', tags: ['table'] }),
        { id: 'stove1', x: 300, y: 20, w: 80, h: 40, color: '#636e72', label: '大灶台', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'stove2', x: 300, y: 80, w: 80, h: 40, color: '#636e72', label: '大灶台', utility: 'cooking', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'fridge', x: 320, y: 200, w: 40, h: 40, color: '#fff', label: '冰柜', utility: 'none', pixelPattern: 'fridge', tags: ['kitchen'] },
        // [修复] 增加收银功能，让收银员有地可去
        { id: 'cashier', x: 200, y: 20, w: 60, h: 30, color: '#2c3e50', label: '收银台', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] }
    ]
};

const PLOT_CAFE: PlotTemplate = {
    id: 'cafe', width: 300, height: 300, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 290, h: 290, label: '咖啡厅', color: '#d4a373', pixelPattern: 'wood', hasWall: true }],
    furniture: [
        // [修复] 增加 stove 标签，允许 kitchen_helper 在此工作 (冲咖啡也是烹饪)
        { id: 'counter', x: 20, y: 20, w: 150, h: 40, color: '#8b4513', label: '吧台', utility: 'work', pixelPattern: 'reception', tags: ['bar', 'cashier', 'stove'] },
        ...createGrid('table', 20, 100, 3, 2, 80, 80, { w: 40, h: 40, color: '#fff', label: '圆桌', utility: 'eat_out', pixelPattern: 'table_dining', tags: ['table'] }),
    ]
};

const PLOT_CINEMA: PlotTemplate = {
    id: 'cinema', width: 400, height: 400, type: 'commercial',
    rooms: [{ id: 'hall', x: 5, y: 5, w: 390, h: 390, label: '影厅', color: '#2d3436', pixelPattern: 'simple', hasWall: true }],
    furniture: [
        { id: 'screen', x: 50, y: 20, w: 300, h: 10, color: '#fff', label: '大银幕', utility: 'none', tags: ['screen'] },
        ...createGrid('seat', 50, 80, 5, 4, 60, 60, { w: 40, h: 40, color: '#d63031', label: '影院座', utility: 'cinema_3d', pixelPattern: 'sofa_vip', tags: ['seat'] }),
        // [修复] 增加 cashier 标签，允许收银员/售票员工作
        { id: 'ticket', x: 300, y: 350, w: 80, h: 40, color: '#e17055', label: '售票处', utility: 'work', pixelPattern: 'reception', tags: ['desk', 'cashier'] }
    ]
};

const PLOT_NETCAFE: PlotTemplate = {
    id: 'netcafe', width: 300, height: 300, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 290, h: 290, label: '网咖', color: '#2f3542', pixelPattern: 'grid', hasWall: true }],
    furniture: [
        ...createGrid('pc', 20, 20, 3, 3, 80, 80, { w: 60, h: 50, color: '#3742fa', label: '电竞椅', utility: 'work', pixelPattern: 'desk_pixel', tags: ['computer', 'game'] }),
        // [修复] 增加 cashier 标签
        { id: 'admin', x: 20, y: 260, w: 60, h: 30, color: '#a29bfe', label: '网管', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk', 'cashier'] }
    ]
};

const PLOT_SUPERMARKET: PlotTemplate = {
    id: 'super_l', width: 600, height: 400, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 590, h: 390, label: '大型综超', color: '#fff', pixelPattern: 'tile', hasWall: true }],
    furniture: [
        ...createGrid('shelf_f', 30, 30, 5, 2, 100, 100, { w: 60, h: 80, color: '#ffdd59', label: '食品货架', utility: 'buy_item', pixelPattern: 'shelf_food', tags: ['shelf'] }),
        ...createGrid('shelf_v', 30, 220, 3, 1, 100, 0, { w: 80, h: 40, color: '#55efc4', label: '生鲜货架', utility: 'buy_item', pixelPattern: 'shelf_veg', tags: ['shelf'] }),
        { id: 'cash1', x: 400, y: 300, w: 60, h: 40, color: '#2c3e50', label: '收银台', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] },
        { id: 'cash2', x: 500, y: 300, w: 60, h: 40, color: '#2c3e50', label: '收银台', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] }
    ]
};

const PLOT_NIGHTCLUB: PlotTemplate = {
    id: 'nightclub', width: 500, height: 400, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 490, h: 390, label: '夜店', color: '#000', pixelPattern: 'stripes', hasWall: true }],
    furniture: [
        { id: 'dj', x: 180, y: 20, w: 140, h: 60, color: '#a29bfe', label: 'DJ台', utility: 'music', pixelPattern: 'dj_stage', pixelGlow: true, tags: ['dj_booth'] },
        { id: 'dance', x: 150, y: 100, w: 200, h: 200, color: '#e84393', label: '舞池', utility: 'dance', pixelPattern: 'dance_machine', pixelGlow: true, tags: ['dance'] },
        { id: 'bar', x: 20, y: 320, w: 150, h: 60, color: '#636e72', label: '吧台', utility: 'buy_drink', pixelPattern: 'counter_cosmetic', tags: ['bar'] },
        ...createGrid('seat', 350, 320, 2, 2, 60, 40, { w: 40, h: 30, color: '#d63031', label: '卡座', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['seat'] })
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
    'school_elem': { ...PLOT_SCHOOL_HIGH, id: 'school_elem' }, // 复用中学布局
    'restaurant': PLOT_RESTAURANT,
    'cafe': PLOT_CAFE,
    'cinema': PLOT_CINEMA,
    'netcafe': PLOT_NETCAFE,
    'default_empty': { id: 'default_empty', width: 300, height: 300, type: 'public', rooms: [], furniture: [] }
};