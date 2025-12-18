import { PlotTemplate, Furniture } from '../types';

// ==========================================
// 🎨 配色与工具
// ==========================================
const PALETTE = {
    wood_warm: '#d4a373', wood_dark: '#8b4513', floor_stone: '#dcdde1',
    plant_green: '#2ecc71', tech_blue: '#0984e3', road_gray: '#3d404b'
};

// 辅助：快速生成矩阵
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
// 1. 居住区模板 (Residential)
// ==========================================

// [紧凑型公寓] - 用于外环角落的细分地块 (尺寸: 300x300)
const PLOT_APT_SMALL: PlotTemplate = {
    id: 'apt_small', width: 300, height: 300, type: 'residential',
    housingUnits: [{ id: 'u_s', name: '单身公寓', capacity: 2, cost: 800, type: 'apartment', area: { x: 10, y: 10, w: 280, h: 280 } }],
    rooms: [{ id: 'r_main', x: 10, y: 10, w: 280, h: 280, label: '温馨小屋', color: '#fff', pixelPattern: 'wood' }],
    furniture: [
        { id: 'bed', x: 20, y: 20, w: 60, h: 80, color: '#ff7675', label: '床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true },
        { id: 'pc', x: 100, y: 30, w: 50, h: 30, color: '#3742fa', label: '电脑', utility: 'play', pixelPattern: 'pc_pixel' },
        { id: 'kit', x: 200, y: 20, w: 60, h: 30, color: '#b2bec3', label: '厨房', utility: 'cook', pixelPattern: 'kitchen' },
        { id: 'sofa', x: 20, y: 150, w: 80, h: 40, color: '#74b9ff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
        { id: 'bath', x: 220, y: 220, w: 40, h: 40, color: '#fff', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' }
    ]
};

// [豪华别墅] - 适配外环右侧长条地块 (尺寸: 500x350)
const PLOT_VILLA_WIDE: PlotTemplate = {
    id: 'villa_wide', width: 500, height: 350, type: 'residential',
    housingUnits: [{ id: 'u_v', name: '湖景别墅', capacity: 4, cost: 5000, type: 'villa', area: { x: 10, y: 10, w: 480, h: 330 } }],
    rooms: [
        { id: 'garden', x: 0, y: 0, w: 500, h: 350, label: '', color: PALETTE.plant_green, pixelPattern: 'grass_dense' },
        { id: 'house', x: 20, y: 20, w: 300, h: 310, label: '主楼', color: '#fff', pixelPattern: 'pave_fancy' },
        { id: 'pool', x: 340, y: 50, w: 140, h: 250, label: '泳池', color: '#5a8fff', pixelPattern: 'water' }
    ],
    furniture: [
        { id: 'piano', x: 40, y: 40, w: 60, h: 80, color: '#2d3436', label: '钢琴', utility: 'play', pixelPattern: 'piano' },
        { id: 'sofa_vip', x: 120, y: 50, w: 100, h: 40, color: '#e17055', label: '真皮沙发', utility: 'comfort', pixelPattern: 'sofa_vip', multiUser: true },
        { id: 'bed_m', x: 40, y: 180, w: 80, h: 90, color: '#ff7675', label: '主卧床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true },
        { id: 'kit_lux', x: 200, y: 200, w: 80, h: 40, color: '#b2bec3', label: '岛台', utility: 'cook', pixelPattern: 'kitchen' },
        { id: 'sunbed', x: 360, y: 20, w: 40, h: 80, color: '#ffeaa7', label: '躺椅', utility: 'comfort', pixelPattern: 'bed_bunk' }
    ]
};

// [人才公寓] - 适配内环或边缘 (尺寸: 400x300)
const PLOT_DORM_STD: PlotTemplate = {
    id: 'dorm_std', width: 400, height: 300, type: 'residential',
    housingUnits: [{ id: 'u_d', name: '人才公寓', capacity: 8, cost: 200, type: 'public_housing', area: { x: 10, y: 10, w: 380, h: 280 } }],
    rooms: [{ id: 'dorm_r', x: 10, y: 10, w: 380, h: 280, label: '集体宿舍', color: '#f5f6fa', pixelPattern: 'tile' }],
    furniture: [
        ...createGrid('bunk', 20, 20, 4, 1, 60, 0, { w: 50, h: 80, color: '#74b9ff', label: '床位', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createGrid('bunk_2', 20, 200, 4, 1, 60, 0, { w: 50, h: 80, color: '#74b9ff', label: '床位', utility: 'energy', pixelPattern: 'bed_bunk' }),
        { id: 'toilet_row', x: 300, y: 20, w: 40, h: 100, color: '#fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' },
        { id: 'shower_row', x: 300, y: 150, w: 40, h: 100, color: '#81ecec', label: '淋浴间', utility: 'hygiene', pixelPattern: 'shower_stall' }
    ]
};

// ==========================================
// 2. 商业与办公 (Work & Commercial)
// ==========================================

// [科技总部] - 适配内环顶部宽地块 (尺寸: 600x300)
const PLOT_TECH_HQ: PlotTemplate = {
    id: 'tech_hq', width: 600, height: 300, type: 'work',
    rooms: [
        { id: 'tech_f', x: 0, y: 0, w: 600, h: 300, label: '研发中心', color: '#ecf0f1', pixelPattern: 'grid' },
        { id: 'server_room', x: 480, y: 20, w: 100, h: 260, label: '机房', color: '#2c3e50', pixelPattern: 'stripes' }
    ],
    furniture: [
        ...createGrid('server', 500, 40, 1, 5, 0, 50, { w: 60, h: 40, color: '#00cec9', label: 'Server', utility: 'work', pixelPattern: 'server', pixelGlow: true }),
        ...createGrid('workstation', 50, 50, 5, 2, 80, 100, { w: 60, h: 50, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),
        { id: 'recep', x: 250, y: 250, w: 100, h: 40, color: '#a29bfe', label: '前台', utility: 'work', pixelPattern: 'reception' },
        { id: 'meet', x: 50, y: 200, w: 150, h: 80, color: '#b2bec3', label: '会议桌', utility: 'work_group', pixelPattern: 'table_marble' }
    ]
};

// [商业广场] - 适配内环底部 (尺寸: 600x300)
const PLOT_MALL_WIDE: PlotTemplate = {
    id: 'mall_wide', width: 600, height: 300, type: 'commercial',
    rooms: [{ id: 'mall_f', x: 0, y: 0, w: 600, h: 300, label: '购物中心', color: '#ffeaa7', pixelPattern: 'mall' }],
    furniture: [
        // 左侧服装
        ...createGrid('rack', 40, 40, 3, 2, 60, 100, { w: 10, h: 60, color: '#a29bfe', label: '服饰', utility: 'buy_item', pixelPattern: 'clothes_rack' }),
        // 右侧餐饮
        ...createGrid('food', 400, 40, 2, 2, 80, 80, { w: 60, h: 40, color: '#fdcb6e', label: '美食', utility: 'buy_food', pixelPattern: 'food_cart' }),
        { id: 'cinema_gate', x: 250, y: 20, w: 100, h: 60, color: '#2d3436', label: '影城入口', utility: 'cinema_3d', pixelPattern: 'cinema' },
        { id: 'cashier', x: 250, y: 250, w: 100, h: 40, color: '#636e72', label: '收银台', utility: 'work', pixelPattern: 'cashier' }
    ]
};

// [创意园/Design] - 竖向中型地块 (尺寸: 350x450)
const PLOT_DESIGN_V: PlotTemplate = {
    id: 'design_v', width: 350, height: 450, type: 'work',
    rooms: [{ id: 'studio', x: 0, y: 0, w: 350, h: 450, label: '画室', color: '#fff9e8', pixelPattern: 'wood' }],
    furniture: [
        ...createGrid('easel', 30, 30, 4, 4, 80, 80, { w: 40, h: 50, color: '#ff7675', label: '画架', utility: 'paint', pixelPattern: 'easel' }),
        { id: 'statue_d', x: 150, y: 350, w: 50, h: 50, color: '#fff', label: '雕塑', utility: 'art', pixelPattern: 'statue' }
    ]
};

// ==========================================
// 3. 公共服务 (Public)
// ==========================================

// [医院] - 大型地块 (尺寸: 500x400)
const PLOT_HOSPITAL_L: PlotTemplate = {
    id: 'hospital_l', width: 500, height: 400, type: 'public',
    rooms: [
        { id: 'hall', x: 0, y: 0, w: 500, h: 400, label: '门诊部', color: '#f5f6fa', pixelPattern: 'tile' },
        { id: 'ward', x: 350, y: 20, w: 130, h: 360, label: '住院区', color: '#81ecec', pixelPattern: 'simple' }
    ],
    furniture: [
        { id: 'reg', x: 100, y: 350, w: 100, h: 40, color: '#74b9ff', label: '挂号', utility: 'work', pixelPattern: 'reception' },
        ...createGrid('h_bed', 370, 40, 1, 4, 0, 90, { w: 60, h: 70, color: '#fff', label: '病床', utility: 'healing', pixelPattern: 'bed_king' }),
        { id: 'doc_1', x: 30, y: 30, w: 80, h: 60, color: '#fff', label: '诊室1', utility: 'work', pixelPattern: 'desk_simple' },
        { id: 'doc_2', x: 30, y: 120, w: 80, h: 60, color: '#fff', label: '诊室2', utility: 'work', pixelPattern: 'desk_simple' },
        { id: 'scan', x: 150, y: 50, w: 60, h: 80, color: '#2d3436', label: 'CT机', utility: 'none', pixelPattern: 'server' }
    ]
};

// [学校组合] - 适配宽长条
const PLOT_SCHOOL_L: PlotTemplate = {
    id: 'school_l', width: 600, height: 400, type: 'public',
    rooms: [
        { id: 'class_zone', x: 20, y: 20, w: 300, h: 360, label: '教学楼', color: '#dff9fb', pixelPattern: 'wood' },
        { id: 'play_zone', x: 340, y: 20, w: 240, h: 360, label: '操场', color: '#e55039', pixelPattern: 'run_track' }
    ],
    furniture: [
        ...createGrid('desk_s', 40, 40, 3, 4, 80, 60, { w: 50, h: 30, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school' }),
        { id: 'hoop', x: 500, y: 180, w: 20, h: 40, color: '#e17055', label: '篮筐', utility: 'play', pixelPattern: 'hoop' },
        { id: 'slide', x: 400, y: 50, w: 60, h: 100, color: '#ff7675', label: '滑梯', utility: 'play', pixelPattern: 'slide' }
    ]
};

// [中央公园] - 适配中心正方形 (尺寸: 550x450)
const PLOT_PARK_CENTER: PlotTemplate = {
    id: 'park_center', width: 550, height: 450, type: 'public',
    rooms: [{ id: 'p_g', x: 0, y: 0, w: 550, h: 450, label: '', color: PALETTE.plant_green, pixelPattern: 'grass' }],
    furniture: [
        { id: 'fountain', x: 200, y: 150, w: 150, h: 150, color: '#74b9ff', label: '中央喷泉', utility: 'none', pixelPattern: 'water', pixelGlow: true },
        { id: 'statue_c', x: 260, y: 190, w: 30, h: 30, color: '#fff', label: '纪念碑', utility: 'none', pixelPattern: 'statue' },
        ...createGrid('bench_p', 100, 100, 2, 2, 300, 200, { w: 50, h: 20, color: '#e17055', label: '长椅', utility: 'comfort', pixelPattern: 'bench_park' }),
        { id: 'bush_1', x: 50, y: 50, w: 40, h: 40, color: '#27ae60', label: '灌木', utility: 'none', pixelPattern: 'bush' },
        { id: 'bush_2', x: 460, y: 360, w: 40, h: 40, color: '#27ae60', label: '灌木', utility: 'none', pixelPattern: 'bush' }
    ]
};

// [小服务店] - 适配内环角落小方块 (尺寸: 200x200)
const PLOT_SHOP_S: PlotTemplate = {
    id: 'shop_s', width: 200, height: 200, type: 'commercial',
    rooms: [{ id: 's_r', x: 0, y: 0, w: 200, h: 200, label: '便利店', color: '#fff', pixelPattern: 'tile' }],
    furniture: [
        { id: 'shelf_1', x: 20, y: 20, w: 60, h: 160, color: '#ffdd59', label: '货架', utility: 'buy_item', pixelPattern: 'shelf_food' },
        { id: 'cash', x: 120, y: 140, w: 60, h: 30, color: '#2c3e50', label: '收银', utility: 'work', pixelPattern: 'cashier' }
    ]
};

export const PLOTS: Record<string, PlotTemplate> = {
    'apt_small': PLOT_APT_SMALL,
    'villa_wide': PLOT_VILLA_WIDE,
    'dorm_std': PLOT_DORM_STD,
    'tech_hq': PLOT_TECH_HQ,
    'mall_wide': PLOT_MALL_WIDE,
    'design_v': PLOT_DESIGN_V,
    'hospital_l': PLOT_HOSPITAL_L,
    'school_l': PLOT_SCHOOL_L,
    'park_center': PLOT_PARK_CENTER,
    'shop_s': PLOT_SHOP_S,
    // 保留部分通用模板以备不时之需
    'road_h': { id: 'road_h', width: 500, height: 100, type: 'public', rooms: [], furniture: [] },
    'road_v': { id: 'road_v', width: 100, height: 500, type: 'public', rooms: [], furniture: [] }
};