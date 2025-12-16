import { PlotTemplate, Furniture } from '../types';

// 调色板引用
const PALETTE = {
    shadow_dark: '#1e222e',
    highlight_light: '#f8f9fa',
    accent_dark: '#1a1e2c',
    deco_neon_blue: '#3dd5f7',
    deco_plant: '#1eb85c',
    deco_tech_glow: '#6cffec',
    deco_wood_red: '#8b4513',
    deco_flower_red: '#ff6b81',
    deco_flower_yellow: '#ffdd59',
    ground_water: '#5a8fff',
    ground_grass_light: '#6cff8c',
    build_brick_white: '#fff9e8',
    build_brick_red: '#ff6b6b'
};

// 辅助函数
const createRow = (baseId: string, startX: number, startY: number, count: number, gapX: number, gapY: number, props: any) => {
    return Array.from({ length: count }).map((_, i) => ({
        ...props,
        id: `${baseId}_${i}`,
        x: startX + i * gapX,
        y: startY + i * gapY,
    }));
};

const createGrid = (baseId: string, startX: number, startY: number, cols: number, rows: number, gapX: number, gapY: number, props: any) => {
    let items: Furniture[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            items.push({
                ...props,
                id: `${baseId}_${r}_${c}`,
                x: startX + c * gapX,
                y: startY + r * gapY
            });
        }
    }
    return items;
};

// ==========================================
// 1. 科技大厦 (Large 500x400)
// ==========================================
const PLOT_TECH: PlotTemplate = {
    id: 'tech_template',
    width: 500,
    height: 400,
    type: 'work',
    rooms: [
        { id: 'tech_ground', x: 0, y: 0, w: 500, h: 400, label: '', color: '#f0f5ff', pixelPattern: 'grid' },
        { id: 'office_tower_a', x: 20, y: 20, w: 460, h: 360, label: '科技大厦', color: '#d4e0f0', pixelPattern: 'windows' },
        { id: 'office_carpet_work', x: 40, y: 40, w: 420, h: 320, label: '', color: '#c4d0e4', pixelPattern: 'dots' },
    ],
    furniture: [
        ...createGrid('tech_desk', 60, 60, 6, 4, 65, 70, { w: 48, h: 32, color: '#2c3e50', label: '升降办公桌', utility: 'none', dir: 'down', pixelPattern: 'desk_pixel' }),
        ...createGrid('monitor_l', 70, 60, 6, 4, 65, 70, { w: 16, h: 6, color: PALETTE.deco_tech_glow, label: '', utility: 'none', pixelGlow: true }),
        ...createGrid('monitor_r', 80, 60, 6, 4, 65, 70, { w: 16, h: 6, color: PALETTE.deco_tech_glow, label: '', utility: 'none', pixelGlow: true }),
        ...createGrid('tech_chair', 75, 80, 6, 4, 65, 70, { w: 22, h: 22, color: '#8a9ca6', label: '码农工位', utility: 'work', pixelPattern: 'chair_pixel' }),
        
        ...createRow('server_rack', 60, 300, 3, 75, 0, { w: 64, h: 38, color: '#253048', label: '服务器组', utility: 'none', dir: 'left', pixelPattern: 'server', pixelGlow: true, glowColor: '#00ffaa' }),
        { id: 'boss_chair', x: 320, y: 300, w: 44, h: 44, color: '#253048', label: '老板椅', utility: 'work', pixelPattern: 'chair_boss' },
        { id: 'server_console', x: 370, y: 310, w: 34, h: 24, color: '#a8b4c8', label: '控制台', utility: 'work', pixelPattern: 'console' },
        { id: 'water_cooler', x: 420, y: 300, w: 24, h: 24, color: '#00d2d3', label: '饮水机', utility: 'drink', pixelPattern: 'water_cooler' },
        { id: 'office_plant_1', x: 40, y: 330, w: 18, h: 18, color: PALETTE.deco_plant, label: '龟背竹', utility: 'none', pixelPattern: 'plant_pixel' },
    ]
};

// ==========================================
// 2. 环球金融中心 (Large 500x400)
// ==========================================
const PLOT_FINANCE: PlotTemplate = {
    id: 'finance_template',
    width: 500,
    height: 400,
    type: 'work',
    rooms: [
        { id: 'finance_ground', x: 0, y: 0, w: 500, h: 400, label: '', color: '#f0f5ff', pixelPattern: 'grid' },
        { id: 'office_tower_b', x: 20, y: 20, w: 460, h: 360, label: '环球金融中心', color: '#ffffff', pixelPattern: 'checker' },
    ],
    furniture: [
        { id: 'conf_rug', x: 50, y: 45, w: 290, h: 180, color: '#a8b4c8', label: '地毯', utility: 'none', pixelPattern: 'rug_fancy' },
        { id: 'conf_table', x: 120, y: 90, w: 168, h: 84, color: '#f0f5ff', label: '大理石会议桌', utility: 'work_group', dir: 'down', multiUser: true, pixelPattern: 'table_marble' },
        { id: 'conf_projector', x: 80, y: 100, w: 12, h: 64, color: '#253048', label: '投影仪', utility: 'none', pixelPattern: 'tech' },
        ...createRow('conf_chair_t', 130, 60, 4, 44, 0, { w: 22, h: 22, color: '#253048', label: '商务工位', utility: 'work', pixelPattern: 'chair_leather' }),
        ...createRow('conf_chair_b', 130, 180, 4, 44, 0, { w: 22, h: 22, color: '#253048', label: '商务工位', utility: 'work', pixelPattern: 'chair_leather' }),
        
        { id: 'boss_area_rug', x: 130, y: 245, w: 230, h: 108, color: '#c23636', label: '波斯地毯', utility: 'none', pixelPattern: 'rug_persian' },
        { id: 'boss_desk', x: 180, y: 250, w: 126, h: 54, color: PALETTE.deco_wood_red, label: '红木班台', utility: 'none', pixelPattern: 'desk_wood' },
        { id: 'boss_pc', x: 200, y: 270, w: 44, h: 12, color: '#1a1e2c', label: '一体机', utility: 'none', pixelPattern: 'pc_pixel' },
        { id: 'boss_chair_fin', x: 200, y: 300, w: 44, h: 44, color: '#253048', label: '老板椅', utility: 'work', pixelPattern: 'chair_boss' },
        { id: 'boss_bookshelf', x: 320, y: 250, w: 24, h: 80, color: PALETTE.deco_wood_red, label: '藏书架', utility: 'none', pixelPattern: 'bookshelf' },
        { id: 'boss_safe', x: 140, y: 310, w: 34, h: 34, color: '#5a6572', label: '保险柜', utility: 'none', pixelPattern: 'safe' },
    ]
};

// ==========================================
// 3. 创意园区 (Medium-Large 400x300)
// ==========================================
const PLOT_DESIGN: PlotTemplate = {
    id: 'design_template',
    width: 400,
    height: 300,
    type: 'work',
    rooms: [
        { id: 'design_ground', x: 0, y: 0, w: 400, h: 300, label: '', color: '#f0f5ff', pixelPattern: 'grid' },
        { id: 'design_studio', x: 10, y: 10, w: 380, h: 280, label: '像素工作室', color: PALETTE.build_brick_white, pixelPattern: 'brush' },
    ],
    furniture: [
        { id: 'messy_rug', x: 200, y: 40, w: 108, h: 108, color: '#ff9c8a', label: '艺术地毯', utility: 'none', pixelPattern: 'rug_art' },
        ...createGrid('art_easel', 30, 40, 3, 2, 60, 80, { w: 44, h: 54, color: '#ff5252', label: '画架', utility: 'paint', pixelPattern: 'easel' }),
        { id: 'plaster_statue', x: 260, y: 40, w: 34, h: 34, color: '#ffffff', label: '石膏像', utility: 'none', pixelPattern: 'statue' },
        { id: 'paint_buckets', x: 160, y: 130, w: 24, h: 24, color: '#ff6b81', label: '颜料', utility: 'none', pixelPattern: 'paint' },
        { id: 'coffee_corner', x: 300, y: 220, w: 44, h: 44, color: '#ff5252', label: '咖啡', utility: 'drink', pixelPattern: 'coffee_corner' },
        { id: 'bean_bag_1', x: 200, y: 60, w: 44, h: 44, color: '#ff7aa8', label: '懒人沙发', utility: 'comfort', pixelPattern: 'beanbag' },
    ]
};

// ==========================================
// 4. 宿舍/公寓区 (Large 500x400)
// ==========================================
const PLOT_DORM: PlotTemplate = {
    id: 'dorm_template',
    width: 500,
    height: 400,
    type: 'residential',
    housingUnits: [
        { id: 'unit_n1', name: '人才公寓 A', capacity: 6, cost: 200, type: 'public_housing', area: { x: 10, y: 20, w: 200, h: 360 } },
        { id: 'unit_n2', name: '人才公寓 B', capacity: 6, cost: 200, type: 'public_housing', area: { x: 220, y: 20, w: 200, h: 360 } }
    ],
    rooms: [
        { id: 'talent_ground_n', x: 0, y: 0, w: 500, h: 400, label: '', color: '#f0f2f8', pixelPattern: 'simple' },
        { id: 'talent_apt_n1', x: 10, y: 20, w: 200, h: 360, label: '公寓 A', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
        { id: 'talent_apt_n2', x: 220, y: 20, w: 200, h: 360, label: '公寓 B', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
        { id: 'ne_bath_wall', x: 430, y: 20, w: 60, h: 360, color: '#dce4f0', label: '澡堂', utility: 'none', pixelPattern: 'simple' },
    ],
    furniture: [
        ...createGrid('dorm_bed_n1', 20, 40, 2, 2, 80, 140, { w: 54, h: 84, color: '#ffb142', label: '上下铺', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createGrid('dorm_desk_n1', 20, 130, 2, 2, 80, 140, { w: 34, h: 34, color: '#a8b4c8', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),
        
        ...createGrid('dorm_bed_n2', 230, 40, 2, 2, 80, 140, { w: 54, h: 84, color: '#1dd1a1', label: '上下铺', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createGrid('dorm_desk_n2', 230, 130, 2, 2, 80, 140, { w: 34, h: 34, color: '#a8b4c8', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),

        ...createRow('ne_toilet', 440, 30, 4, 0, 50, { w: 30, h: 30, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' }),
        ...createRow('ne_shower', 440, 250, 2, 0, 50, { w: 30, h: 40, color: '#81ecec', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' }),
    ]
};

// ==========================================
// 5. 豪华独栋别墅 (Medium 300x300)
// ==========================================
const PLOT_VILLA: PlotTemplate = {
    id: 'villa_template',
    width: 300,
    height: 300,
    type: 'residential',
    housingUnits: [
        { id: 'unit_villa_1', name: '精致别墅', capacity: 4, cost: 5000, type: 'villa', area: { x: 10, y: 10, w: 280, h: 280 } }
    ],
    rooms: [
        { id: 'villa_lawn', x: 0, y: 0, w: 300, h: 300, label: '', color: '#55efc4', pixelPattern: 'grass_dense' },
        { id: 'villa_main', x: 10, y: 10, w: 180, h: 140, label: '大厅', color: '#fff', pixelPattern: 'pave_fancy' },
        { id: 'villa_kitchen', x: 200, y: 10, w: 90, h: 140, label: '厨', color: '#dfe6e9', pixelPattern: 'tile' },
        { id: 'villa_bed', x: 10, y: 160, w: 180, h: 130, label: '卧', color: '#ffeaa7', pixelPattern: 'carpet' },
        { id: 'villa_bath', x: 200, y: 160, w: 90, h: 130, label: '浴', color: '#81ecec', pixelPattern: 'tile' },
    ],
    furniture: [
        { id: 'villa_sofa', x: 40, y: 30, w: 100, h: 40, color: '#a29bfe', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_vip' },
        { id: 'villa_tv', x: 40, y: 10, w: 100, h: 10, color: '#2d3436', label: '电视', utility: 'play', pixelPattern: 'tv_wall' },
        { id: 'villa_piano', x: 140, y: 40, w: 40, h: 60, color: '#2d3436', label: '钢琴', utility: 'play', pixelPattern: 'piano' },
        
        { id: 'villa_table', x: 210, y: 80, w: 64, h: 64, color: '#fab1a0', label: '餐桌', utility: 'hunger', pixelPattern: 'table_dining' },
        { id: 'villa_fridge', x: 210, y: 20, w: 34, h: 34, color: '#fff', label: '冰箱', utility: 'hunger', pixelPattern: 'fridge' },
        
        { id: 'villa_king', x: 30, y: 190, w: 80, h: 90, color: '#ff7675', label: '大床', utility: 'energy', pixelPattern: 'bed_king' },
        { id: 'villa_desk', x: 120, y: 170, w: 60, h: 40, color: '#8b4513', label: '书桌', utility: 'work', pixelPattern: 'desk_wood' },
        { id: 'villa_pc', x: 130, y: 175, w: 30, h: 20, color: '#2d3436', label: '电脑', utility: 'play', pixelPattern: 'pc_pixel' },
        
        { id: 'villa_tub', x: 210, y: 180, w: 60, h: 40, color: '#fff', label: '浴缸', utility: 'hygiene', pixelPattern: 'bath_tub' },
        { id: 'villa_toilet', x: 220, y: 250, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' },
    ]
};

// ==========================================
// 6. 公寓楼 (Large 500x400)
// ==========================================
const PLOT_APARTMENT: PlotTemplate = {
    id: 'apt_complex_template',
    width: 500,
    height: 400,
    type: 'residential',
    housingUnits: [
        { id: 'apt_u1', name: '公寓 101', capacity: 2, cost: 1200, type: 'apartment', area: { x: 10, y: 10, w: 230, h: 180 } },
        { id: 'apt_u2', name: '公寓 102', capacity: 2, cost: 1200, type: 'apartment', area: { x: 260, y: 10, w: 230, h: 180 } },
        { id: 'apt_u3', name: '公寓 201', capacity: 2, cost: 1200, type: 'apartment', area: { x: 10, y: 210, w: 230, h: 180 } },
        { id: 'apt_u4', name: '公寓 202', capacity: 2, cost: 1200, type: 'apartment', area: { x: 260, y: 210, w: 230, h: 180 } },
    ],
    rooms: [
        { id: 'apt_ground', x: 0, y: 0, w: 500, h: 400, label: '', color: '#b2bec3', pixelPattern: 'concrete' },
        { id: 'apt_corridor_h', x: 0, y: 195, w: 500, h: 10, label: '', color: '#636e72', pixelPattern: 'stripes' },
        { id: 'apt_corridor_v', x: 245, y: 0, w: 10, h: 400, label: '', color: '#636e72', pixelPattern: 'stripes' },
        { id: 'u1_room', x: 10, y: 10, w: 230, h: 180, label: '101', color: '#dfe6e9', pixelPattern: 'wood' },
        { id: 'u2_room', x: 260, y: 10, w: 230, h: 180, label: '102', color: '#dfe6e9', pixelPattern: 'wood' },
        { id: 'u3_room', x: 10, y: 210, w: 230, h: 180, label: '201', color: '#dfe6e9', pixelPattern: 'wood' },
        { id: 'u4_room', x: 260, y: 210, w: 230, h: 180, label: '202', color: '#dfe6e9', pixelPattern: 'wood' },
    ],
    furniture: [
        ...createGrid('apt_bed', 20, 20, 2, 2, 250, 200, { w: 50, h: 80, color: '#ff7675', label: '床', utility: 'energy', pixelPattern: 'bed_king' }),
        ...createGrid('apt_sofa', 100, 20, 2, 2, 250, 200, { w: 60, h: 30, color: '#74b9ff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' }),
        ...createGrid('apt_kitchen', 150, 140, 2, 2, 250, 200, { w: 60, h: 30, color: '#b2bec3', label: '厨台', utility: 'cook', pixelPattern: 'kitchen' }),
        ...createGrid('apt_toilet', 20, 140, 2, 2, 250, 200, { w: 24, h: 24, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' }),
    ]
};

// ==========================================
// 7. 中央公园 (Large 500x400)
// ==========================================
const PLOT_PARK: PlotTemplate = {
    id: 'park_template',
    width: 500,
    height: 400,
    type: 'public',
    rooms: [
        { id: 'park_base', x: 0, y: 0, w: 500, h: 400, label: '', color: PALETTE.ground_grass_light, pixelPattern: 'grass' },
        { id: 'park_lake_border', x: 140, y: 110, w: 220, h: 180, label: '', color: '#8a7cff', pixelPattern: 'wave' },
        { id: 'park_lake', x: 150, y: 120, w: 200, h: 160, label: '镜湖', color: PALETTE.ground_water, pixelPattern: 'water' },
        { id: 'park_pave_cross', x: 0, y: 200, w: 500, h: 20, label: '', color: '#9ca6b4', pixelPattern: 'stone' },
    ],
    furniture: [
        ...createRow('tree_row_t', 20, 20, 5, 100, 0, { w: 42, h: 42, color: '#253048', label: '梧桐', utility: 'none', pixelPattern: 'tree_pixel', pixelOutline: true }),
        ...createRow('tree_row_b', 20, 340, 5, 100, 0, { w: 42, h: 42, color: '#253048', label: '梧桐', utility: 'none', pixelPattern: 'tree_pixel', pixelOutline: true }),
        { id: 'park_bench_1', x: 180, y: 80, w: 54, h: 24, color: '#e17055', label: '长椅', utility: 'comfort', pixelPattern: 'bench_park' },
        { id: 'park_bench_2', x: 260, y: 80, w: 54, h: 24, color: '#e17055', label: '长椅', utility: 'comfort', pixelPattern: 'bench_park' },
        { id: 'duck_boat', x: 200, y: 160, w: 44, h: 34, color: '#ffdd59', label: '鸭子船', utility: 'play', pixelPattern: 'boat_duck' },
        { id: 'fishing_spot', x: 150, y: 290, w: 24, h: 24, color: '#74b9ff', label: '钓鱼', utility: 'fishing', pixelPattern: 'fishing_rod' },
        { id: 'picnic_mat', x: 50, y: 250, w: 80, h: 60, color: '#ff6b81', label: '野餐垫', utility: 'hunger', pixelPattern: 'picnic_mat' },
        { id: 'food_cart', x: 380, y: 250, w: 60, h: 40, color: '#d35400', label: '餐车', utility: 'buy_food', pixelPattern: 'food_cart' },
        { id: 'park_toilet_build', x: 420, y: 50, w: 60, h: 60, color: '#b2bec3', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' },
    ]
};

// ==========================================
// 8. 商业娱乐区 (Large 500x400)
// ==========================================
const PLOT_COMMERCIAL: PlotTemplate = {
    id: 'commercial_template',
    width: 500,
    height: 400,
    type: 'commercial',
    rooms: [
        { id: 'commercial_pave', x: 0, y: 0, w: 500, h: 400, label: '', color: '#9ca6b4', pixelPattern: 'pave_fancy' },
        { id: 'mall_main', x: 10, y: 10, w: 280, h: 380, label: '购物中心', color: '#ffd93d', pixelPattern: 'mall' },
        { id: 'cinema_main', x: 300, y: 10, w: 190, h: 380, label: '影城', color: '#252a36', pixelPattern: 'cinema' },
    ],
    furniture: [
        ...createGrid('shelf_food', 30, 50, 2, 3, 70, 60, { w: 50, h: 24, color: '#ffdd59', label: '货架', utility: 'buy_item', pixelPattern: 'shelf_food' }),
        ...createGrid('shelf_clothes', 170, 50, 2, 3, 50, 60, { w: 10, h: 40, color: '#e17055', label: '衣架', utility: 'buy_item', pixelPattern: 'clothes_rack' }),
        { id: 'cashier', x: 100, y: 250, w: 60, h: 40, color: '#2c3e50', label: '收银台', utility: 'work', multiUser: true, pixelPattern: 'cashier' },
        { id: 'fitting', x: 230, y: 250, w: 40, h: 80, color: '#a8b4c8', label: '试衣间', utility: 'none', pixelPattern: 'fitting_room' },
        
        { id: 'ticket', x: 320, y: 30, w: 60, h: 40, color: '#ff5252', label: '售票', utility: 'work', pixelPattern: 'ticket_booth' },
        { id: 'screen', x: 320, y: 100, w: 150, h: 10, color: '#fff', label: '屏幕', utility: 'none' },
        ...createGrid('seat', 330, 140, 3, 4, 40, 40, { w: 30, h: 30, color: '#c0392b', label: '座位', utility: 'cinema_3d', pixelPattern: 'seat_reg' }),
    ]
};

// ==========================================
// 9. 公共服务区 (Large 500x400)
// ==========================================
const PLOT_SERVICE: PlotTemplate = {
    id: 'service_template',
    width: 500,
    height: 400,
    type: 'public',
    rooms: [
        { id: 'public_ground', x: 0, y: 0, w: 500, h: 400, label: '', color: '#fff9e8', pixelPattern: 'public' },
        { id: 'restaurant_main', x: 10, y: 10, w: 480, h: 180, label: '餐厅', color: '#7ce8ff', pixelPattern: 'hospital' },
        { id: 'library_main', x: 10, y: 200, w: 480, h: 190, label: '图书馆', color: '#ffffff', pixelPattern: 'library' },
    ],
    furniture: [
        { id: 'rest_front', x: 30, y: 30, w: 80, h: 40, color: '#e17055', label: '前台', utility: 'work', pixelPattern: 'reception' },
        ...createGrid('rest_table', 140, 40, 4, 2, 80, 70, { w: 60, h: 50, color: '#fab1a0', label: '餐桌', utility: 'eat_out', pixelPattern: 'table_dining', cost: 60 }),
        { id: 'kitchen_stove', x: 400, y: 30, w: 60, h: 100, color: '#d63031', label: '后厨', utility: 'work', pixelPattern: 'stove' },
        
        ...createGrid('bookshelf', 30, 220, 6, 1, 50, 0, { w: 40, h: 80, color: '#e67e22', label: '书架', utility: 'buy_book', pixelPattern: 'bookshelf_hist' }),
        ...createGrid('read_desk', 30, 320, 2, 1, 100, 0, { w: 80, h: 50, color: '#d35400', label: '阅览桌', utility: 'work', pixelPattern: 'desk_library' }),
        { id: 'lib_desk', x: 400, y: 320, w: 60, h: 40, color: '#5a6572', label: '管理员', utility: 'work', pixelPattern: 'desk_librarian' },
    ]
};

// ==========================================
// 10. 休闲与夜生活 (Large 500x400)
// ==========================================
const PLOT_NIGHTLIFE: PlotTemplate = {
    id: 'nightlife_template',
    width: 500,
    height: 400,
    type: 'public',
    rooms: [
        { id: 'gym_zone', x: 10, y: 10, w: 230, h: 380, label: '健身房', color: '#a8b4c8', pixelPattern: 'gym' },
        { id: 'club_zone', x: 250, y: 10, w: 240, h: 380, label: '夜店', color: '#162056', pixelPattern: 'neon' },
    ],
    furniture: [
        ...createRow('treadmill', 30, 40, 3, 50, 0, { w: 40, h: 70, color: '#2c3e50', label: '跑步机', utility: 'run', pixelPattern: 'treadmill' }),
        { id: 'yoga_mat', x: 30, y: 150, w: 100, h: 60, color: '#ff9c8a', label: '瑜伽垫', utility: 'stretch', pixelPattern: 'yoga_mat' },
        ...createGrid('weights', 30, 250, 2, 2, 50, 50, { w: 40, h: 40, color: '#5a6572', label: '举铁', utility: 'lift', pixelPattern: 'weights_rack' }),
        
        { id: 'dj_booth', x: 320, y: 40, w: 100, h: 40, color: '#7158e2', label: 'DJ台', utility: 'music', pixelPattern: 'dj_stage', pixelGlow: true },
        { id: 'dance_floor', x: 280, y: 100, w: 180, h: 120, color: '#2c3e50', label: '舞池', utility: 'dance', pixelPattern: 'dance_floor', pixelGlow: true },
        { id: 'bar', x: 270, y: 250, w: 200, h: 40, color: '#e84393', label: '吧台', utility: 'buy_drink', pixelPattern: 'bar_counter' },
        ...createRow('bar_stool', 280, 300, 4, 40, 0, { w: 20, h: 20, color: '#fff', label: '凳子', utility: 'sit', pixelPattern: 'stool_bar' }),
    ]
};

// ==========================================
// 11. 美术馆 (Medium 300x300)
// ==========================================
const PLOT_GALLERY: PlotTemplate = {
    id: 'gallery_template',
    width: 300,
    height: 300,
    type: 'public',
    rooms: [
        { id: 'gallery_room', x: 0, y: 0, w: 300, h: 300, label: '美术馆', color: '#f7f1e3', pixelPattern: 'simple' },
    ],
    furniture: [
        { id: 'statue_v', x: 130, y: 130, w: 40, h: 40, color: '#fff', label: '雕像', utility: 'art', pixelPattern: 'statue' },
        ...createRow('paint_top', 20, 20, 4, 70, 0, { w: 50, h: 10, color: '#ff6b6b', label: '画作', utility: 'art', pixelPattern: 'painting' }),
        ...createGrid('paint_side', 20, 80, 1, 3, 0, 70, { w: 10, h: 50, color: '#54a0ff', label: '画作', utility: 'art', pixelPattern: 'painting' }),
        { id: 'display_case', x: 200, y: 200, w: 40, h: 40, color: '#00d2d3', label: '珍宝', utility: 'art', pixelPattern: 'display_case' },
    ]
};

// ==========================================
// 12. 网咖 (Small Filler 200x300)
// ==========================================
const PLOT_NETCAFE: PlotTemplate = {
    id: 'netcafe_template',
    width: 200,
    height: 300,
    type: 'commercial',
    rooms: [
        { id: 'netcafe_room', x: 0, y: 0, w: 200, h: 300, label: '星际网咖', color: '#1e272e', pixelPattern: 'simple' },
    ],
    furniture: [
        { id: 'counter', x: 60, y: 20, w: 80, h: 30, color: '#57606f', label: '网管', utility: 'work', pixelPattern: 'reception' },
        ...createGrid('pc_row', 30, 80, 2, 4, 80, 50, { w: 40, h: 30, color: '#3742fa', label: '电脑', utility: 'work', cost: 5, pixelPattern: 'pc_pixel', pixelGlow: true }),
        { id: 'vending', x: 20, y: 20, w: 30, h: 30, color: '#ffa502', label: '饮料', utility: 'buy_drink', pixelPattern: 'vending' },
    ]
};

// ==========================================
// 13. 向日葵幼儿园 (Medium 300x300)
// ==========================================
const PLOT_KINDERGARTEN: PlotTemplate = {
    id: 'kindergarten_template',
    width: 300,
    height: 300,
    type: 'public',
    rooms: [
        { id: 'kg_ground', x: 0, y: 0, w: 300, h: 300, label: '幼儿园', color: '#fff0f5', pixelPattern: 'simple' },
        { id: 'kg_play', x: 10, y: 10, w: 280, h: 180, label: '活动室', color: '#ffeaa7', pixelPattern: 'carpet' },
        { id: 'kg_nap', x: 10, y: 200, w: 280, h: 90, label: '午睡室', color: '#dff9fb', pixelPattern: 'wood' },
    ],
    furniture: [
        ...createGrid('kg_mat', 30, 30, 3, 2, 60, 60, { w: 40, h: 40, color: '#74b9ff', label: '积木', utility: 'play_blocks', pixelPattern: 'play_mat' }),
        { id: 'kg_slide', x: 220, y: 30, w: 40, h: 80, color: '#ff7675', label: '滑梯', utility: 'play', pixelPattern: 'slide' },
        { id: 'kg_teacher', x: 100, y: 150, w: 40, h: 30, color: '#fab1a0', label: '讲台', utility: 'work', pixelPattern: 'desk_pixel' },
        ...createGrid('kg_crib', 20, 210, 4, 1, 60, 0, { w: 40, h: 30, color: '#ff9ff3', label: '小床', utility: 'nap_crib', pixelPattern: 'bed_crib' }),
    ]
};

// ==========================================
// 14. 第一小学 (Large 500x400)
// ==========================================
const PLOT_ELEMENTARY: PlotTemplate = {
    id: 'elementary_template',
    width: 500,
    height: 400,
    type: 'public',
    rooms: [
        { id: 'elem_ground', x: 0, y: 0, w: 500, h: 400, label: '第一小学', color: '#f0f2f8', pixelPattern: 'concrete' },
        { id: 'elem_c1', x: 10, y: 10, w: 230, h: 180, label: '一年级', color: '#dcede6', pixelPattern: 'wood' },
        { id: 'elem_c2', x: 260, y: 10, w: 230, h: 180, label: '二年级', color: '#dcede6', pixelPattern: 'wood' },
        { id: 'elem_play', x: 10, y: 200, w: 480, h: 190, label: '操场', color: '#e55039', pixelPattern: 'run_track' },
    ],
    furniture: [
        ...createGrid('desk_c1', 20, 40, 3, 2, 60, 50, { w: 40, h: 30, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school' }),
        { id: 'board_c1', x: 50, y: 15, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none' },
        ...createGrid('desk_c2', 270, 40, 3, 2, 60, 50, { w: 40, h: 30, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school' }),
        { id: 'board_c2', x: 300, y: 15, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none' },
        
        { id: 'flag', x: 240, y: 250, w: 20, h: 20, color: '#d63031', label: '旗杆', utility: 'none' },
        { id: 'guard', x: 450, y: 350, w: 30, h: 30, color: '#2c3e50', label: '岗亭', utility: 'work', pixelPattern: 'chair_pixel' },
    ]
};

// ==========================================
// 15. 星海中学 (Large 500x400)
// ==========================================
const PLOT_HIGHSCHOOL: PlotTemplate = {
    id: 'high_school_template',
    width: 500,
    height: 400,
    type: 'public',
    rooms: [
        { id: 'high_ground', x: 0, y: 0, w: 500, h: 400, label: '星海中学', color: '#dfe6e9', pixelPattern: 'concrete' },
        { id: 'high_class', x: 10, y: 10, w: 240, h: 180, label: '教学楼', color: '#ffffff', pixelPattern: 'tile' },
        { id: 'high_lib', x: 260, y: 10, w: 230, h: 180, label: '图书馆', color: '#81ecec', pixelPattern: 'library' },
        { id: 'high_canteen', x: 10, y: 200, w: 240, h: 190, label: '食堂', color: '#fab1a0', pixelPattern: 'kitchen' },
        { id: 'high_gym', x: 260, y: 200, w: 230, h: 190, label: '体育馆', color: '#a29bfe', pixelPattern: 'gym' },
    ],
    furniture: [
        ...createGrid('high_desk', 30, 40, 3, 3, 60, 40, { w: 40, h: 25, color: '#b2bec3', label: '书桌', utility: 'study_high', pixelPattern: 'desk_simple' }),
        { id: 'high_board', x: 60, y: 15, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none' },
        ...createGrid('high_shelf', 280, 40, 3, 2, 60, 60, { w: 40, h: 40, color: '#0984e3', label: '书架', utility: 'read', pixelPattern: 'bookshelf_sci' }),
        ...createGrid('high_table', 30, 240, 2, 2, 80, 60, { w: 60, h: 40, color: '#fab1a0', label: '餐桌', utility: 'eat_canteen', pixelPattern: 'table_dining', cost: 10 }),
        { id: 'high_stove', x: 200, y: 220, w: 40, h: 60, color: '#d63031', label: '灶台', utility: 'work', pixelPattern: 'stove' },
        { id: 'high_hoop', x: 360, y: 210, w: 20, h: 40, color: '#e17055', label: '篮筐', utility: 'play', pixelPattern: 'hoop' },
    ]
};

// ==========================================
// 16. 道路模板 (Road Templates)
// ==========================================
const PLOT_ROAD_H: PlotTemplate = {
    id: 'road_h_template',
    width: 500,
    height: 100,
    type: 'public',
    rooms: [
        { id: 'road_surface', x: 0, y: 0, w: 500, h: 100, label: '', color: '#3d404b', pixelPattern: 'stripes' }
    ],
    furniture: []
};

const PLOT_ROAD_V: PlotTemplate = {
    id: 'road_v_template',
    width: 100,
    height: 500,
    type: 'public',
    rooms: [
        { id: 'road_surface', x: 0, y: 0, w: 100, h: 500, label: '', color: '#3d404b', pixelPattern: 'stripes' }
    ],
    furniture: []
};

const PLOT_ROAD_CROSS: PlotTemplate = {
    id: 'road_cross_template',
    width: 100,
    height: 100,
    type: 'public',
    rooms: [
        { id: 'road_surface', x: 0, y: 0, w: 100, h: 100, label: '', color: '#3d404b', pixelPattern: 'stripes' },
        { id: 'zebra_cross', x: 0, y: 0, w: 100, h: 100, label: '', color: 'rgba(255,255,255,0.2)', pixelPattern: 'zebra' }
    ],
    furniture: []
};

// 汇总导出
export const PLOTS: Record<string, PlotTemplate> = {
    'tech': PLOT_TECH,
    'finance': PLOT_FINANCE,
    'design': PLOT_DESIGN,
    'kindergarten': PLOT_KINDERGARTEN,
    'elementary': PLOT_ELEMENTARY,
    'high_school': PLOT_HIGHSCHOOL,
    'dorm': PLOT_DORM,
    'villa': PLOT_VILLA,
    'apartment': PLOT_APARTMENT,
    'park': PLOT_PARK,
    'commercial': PLOT_COMMERCIAL,
    'service': PLOT_SERVICE,
    'nightlife': PLOT_NIGHTLIFE,
    'gallery': PLOT_GALLERY,
    'netcafe': PLOT_NETCAFE,
    'road_h': PLOT_ROAD_H,
    'road_v': PLOT_ROAD_V,
    'road_cross': PLOT_ROAD_CROSS
};