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
// 1. 科技大厦 (Tech Tower) [拆分自 CBD]
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
// 2. 环球金融中心 (Finance Center) [拆分自 CBD]
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
// 3. 创意园区 (Creative Park) [拆分自 CBD]
// ==========================================
const PLOT_DESIGN: PlotTemplate = {
    id: 'design_template',
    width: 440,
    height: 340,
    type: 'work',
    rooms: [
        { id: 'design_ground', x: 0, y: 0, w: 440, h: 340, label: '', color: '#f0f5ff', pixelPattern: 'grid' },
        { id: 'design_studio', x: 20, y: 20, w: 400, h: 300, label: '像素艺术工作室', color: PALETTE.build_brick_white, pixelPattern: 'brush' },
    ],
    furniture: [
        { id: 'messy_rug', x: 250, y: 60, w: 108, h: 108, color: '#ff9c8a', label: '艺术地毯', utility: 'none', pixelPattern: 'rug_art' },
        ...createGrid('art_easel', 40, 60, 3, 3, 90, 80, { w: 44, h: 54, color: '#ff5252', label: '画架', utility: 'paint', pixelPattern: 'easel' }),
        { id: 'plaster_statue', x: 310, y: 60, w: 34, h: 34, color: '#ffffff', label: '石膏像', utility: 'none', pixelPattern: 'statue' },
        { id: 'paint_buckets', x: 170, y: 150, w: 24, h: 24, color: '#ff6b81', label: '颜料桶', utility: 'none', pixelPattern: 'paint' },
        { id: 'coffee_corner', x: 300, y: 230, w: 44, h: 44, color: '#ff5252', label: '咖啡角', utility: 'drink', pixelPattern: 'coffee_corner' },
        { id: 'bean_bag_1', x: 250, y: 80, w: 44, h: 44, color: '#ff7aa8', label: '懒人沙发', utility: 'comfort', pixelPattern: 'beanbag' },
        { id: 'bean_bag_2', x: 290, y: 100, w: 44, h: 44, color: '#8a7cff', label: '懒人沙发', utility: 'comfort', pixelPattern: 'beanbag' },
    ]
};

// ==========================================
// 4. 宿舍/公寓区 (Residential)
// ==========================================
const PLOT_DORM: PlotTemplate = {
    id: 'dorm_template',
    width: 900,
    height: 360,
    type: 'residential',
    housingUnits: [
        { id: 'unit_n1', name: '人才公寓 N1', capacity: 6, cost: 200, type: 'public_housing', area: { x: 20, y: 20, w: 350, h: 320 } },
        { id: 'unit_n2', name: '人才公寓 N2', capacity: 6, cost: 200, type: 'public_housing', area: { x: 390, y: 20, w: 350, h: 320 } }
    ],
    rooms: [
        { id: 'talent_ground_n', x: 0, y: 0, w: 900, h: 360, label: '', color: '#f0f2f8', pixelPattern: 'simple' },
        { id: 'talent_apt_n1', x: 20, y: 20, w: 350, h: 320, label: '人才公寓 N1', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
        { id: 'talent_apt_n2', x: 390, y: 20, w: 350, h: 320, label: '人才公寓 N2', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
        { id: 'ne_bath_wall', x: 760, y: 20, w: 100, h: 340, color: '#dce4f0', label: '公共大澡堂', utility: 'none', pixelPattern: 'simple' },
    ],
    furniture: [
        ...createGrid('dorm_bed_n1', 40, 60, 3, 2, 120, 120, { w: 54, h: 84, color: '#ffb142', label: '上下铺', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createGrid('dorm_desk_n1', 110, 60, 2, 2, 120, 120, { w: 34, h: 34, color: '#a8b4c8', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),
        
        ...createGrid('dorm_bed_n2', 410, 60, 3, 2, 120, 120, { w: 54, h: 84, color: '#1dd1a1', label: '上下铺', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createGrid('dorm_desk_n2', 480, 60, 2, 2, 120, 120, { w: 34, h: 34, color: '#a8b4c8', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),

        ...createRow('ne_toilet', 770, 30, 6, 0, 50, { w: 34, h: 34, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' }),
        ...createRow('ne_shower', 820, 30, 6, 0, 50, { w: 34, h: 44, color: '#81ecec', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' }),
    ]
};

// ==========================================
// 5. 豪华独栋别墅 (Villa)
// ==========================================
const PLOT_VILLA: PlotTemplate = {
    id: 'villa_template',
    width: 600,
    height: 500,
    type: 'residential',
    housingUnits: [
        { id: 'unit_villa_1', name: '湖畔别墅', capacity: 6, cost: 5000, type: 'villa', area: { x: 20, y: 20, w: 560, h: 460 } }
    ],
    rooms: [
        { id: 'villa_lawn', x: 0, y: 0, w: 600, h: 500, label: '', color: '#55efc4', pixelPattern: 'grass_dense' },
        { id: 'villa_living', x: 20, y: 20, w: 300, h: 220, label: '豪华客厅', color: '#fff', pixelPattern: 'pave_fancy' },
        { id: 'villa_kitchen_room', x: 320, y: 20, w: 260, h: 120, label: '厨房', color: '#dfe6e9', pixelPattern: 'tile' },
        { id: 'villa_study', x: 320, y: 140, w: 260, h: 100, label: '书房', color: '#dcdde1', pixelPattern: 'wood' },
        { id: 'villa_master_bed', x: 20, y: 240, w: 240, h: 240, label: '主卧', color: '#ffeaa7', pixelPattern: 'carpet' },
        { id: 'villa_second_bed', x: 260, y: 240, w: 180, h: 240, label: '次卧', color: '#fab1a0', pixelPattern: 'carpet' },
        { id: 'villa_bath', x: 440, y: 240, w: 140, h: 240, label: '卫浴', color: '#81ecec', pixelPattern: 'tile' },
    ],
    furniture: [
        { id: 'villa_sofa_main', x: 60, y: 60, w: 120, h: 50, color: '#a29bfe', label: '真皮沙发', utility: 'comfort', pixelPattern: 'sofa_vip' },
        { id: 'villa_tv_wall', x: 60, y: 30, w: 120, h: 10, color: '#2d3436', label: '家庭影院', utility: 'play', pixelPattern: 'tv_wall' },
        { id: 'villa_piano', x: 220, y: 100, w: 80, h: 100, color: '#2d3436', label: '钢琴', utility: 'play', pixelPattern: 'piano' },
        { id: 'villa_fridge', x: 330, y: 30, w: 40, h: 40, color: '#fff', label: '冰箱', utility: 'hunger', pixelPattern: 'fridge' },
        { id: 'villa_kitchen_c', x: 380, y: 30, w: 100, h: 40, color: '#b2bec3', label: '橱柜', utility: 'cook', pixelPattern: 'kitchen' },
        { id: 'villa_dining_table', x: 500, y: 40, w: 64, h: 64, color: '#fab1a0', label: '餐桌', utility: 'hunger', pixelPattern: 'table_dining' },
        { id: 'villa_desk_boss', x: 340, y: 160, w: 100, h: 50, color: '#8b4513', label: '书桌', utility: 'work', pixelPattern: 'desk_wood' },
        { id: 'villa_pc_high', x: 370, y: 170, w: 40, h: 30, color: '#2d3436', label: '电脑', utility: 'play', pixelPattern: 'pc_pixel' },
        { id: 'villa_bookshelf', x: 480, y: 150, w: 80, h: 80, color: '#e17055', label: '书架', utility: 'fun', pixelPattern: 'bookshelf' },
        { id: 'villa_king_bed', x: 40, y: 280, w: 100, h: 120, color: '#ff7675', label: '大床', utility: 'energy', pixelPattern: 'bed_king' },
        { id: 'villa_wardrobe', x: 180, y: 280, w: 40, h: 100, color: '#636e72', label: '衣柜', utility: 'none', pixelPattern: 'closet' },
        { id: 'villa_single_bed', x: 300, y: 280, w: 60, h: 90, color: '#74b9ff', label: '单人床', utility: 'energy', pixelPattern: 'bed_king' },
        { id: 'villa_bath_tub', x: 460, y: 260, w: 80, h: 60, color: '#fff', label: '浴缸', utility: 'hygiene', pixelPattern: 'bath_tub' },
        { id: 'villa_toilet', x: 460, y: 400, w: 40, h: 40, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' },
    ]
};

// ==========================================
// 6. 公寓楼 (Apartment Complex)
// ==========================================
const PLOT_APARTMENT: PlotTemplate = {
    id: 'apt_complex_template',
    width: 600,
    height: 600,
    type: 'residential',
    housingUnits: [
        { id: 'apt_unit_1', name: '公寓 101', capacity: 2, cost: 1200, type: 'apartment', area: { x: 10, y: 10, w: 280, h: 280 } },
        { id: 'apt_unit_2', name: '公寓 102', capacity: 2, cost: 1200, type: 'apartment', area: { x: 310, y: 10, w: 280, h: 280 } },
        { id: 'apt_unit_3', name: '公寓 201', capacity: 2, cost: 1200, type: 'apartment', area: { x: 10, y: 310, w: 280, h: 280 } },
        { id: 'apt_unit_4', name: '公寓 202', capacity: 2, cost: 1200, type: 'apartment', area: { x: 310, y: 310, w: 280, h: 280 } },
    ],
    rooms: [
        { id: 'apt_ground', x: 0, y: 0, w: 600, h: 600, label: '', color: '#b2bec3', pixelPattern: 'concrete' },
        { id: 'apt_corridor_h', x: 0, y: 290, w: 600, h: 20, label: '', color: '#636e72', pixelPattern: 'stripes' },
        { id: 'apt_corridor_v', x: 290, y: 0, w: 20, h: 600, label: '', color: '#636e72', pixelPattern: 'stripes' },
        { id: 'u1_room', x: 10, y: 10, w: 280, h: 280, label: '101', color: '#dfe6e9', pixelPattern: 'wood' },
        { id: 'u1_bath', x: 10, y: 10, w: 80, h: 80, label: '', color: '#81ecec', pixelPattern: 'tile' },
        { id: 'u2_room', x: 310, y: 10, w: 280, h: 280, label: '102', color: '#dfe6e9', pixelPattern: 'wood' },
        { id: 'u2_bath', x: 510, y: 10, w: 80, h: 80, label: '', color: '#81ecec', pixelPattern: 'tile' },
        { id: 'u3_room', x: 10, y: 310, w: 280, h: 280, label: '201', color: '#dfe6e9', pixelPattern: 'wood' },
        { id: 'u3_bath', x: 10, y: 510, w: 80, h: 80, label: '', color: '#81ecec', pixelPattern: 'tile' },
        { id: 'u4_room', x: 310, y: 310, w: 280, h: 280, label: '202', color: '#dfe6e9', pixelPattern: 'wood' },
        { id: 'u4_bath', x: 510, y: 510, w: 80, h: 80, label: '', color: '#81ecec', pixelPattern: 'tile' },
    ],
    furniture: [
        { id: 'u1_bed', x: 180, y: 20, w: 60, h: 90, color: '#ff7675', label: '床', utility: 'energy', pixelPattern: 'bed_king' },
        { id: 'u1_sofa', x: 150, y: 150, w: 80, h: 40, color: '#74b9ff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
        { id: 'u1_kitchen', x: 20, y: 230, w: 80, h: 40, color: '#b2bec3', label: '厨台', utility: 'cook', pixelPattern: 'kitchen' },
        { id: 'u1_toilet', x: 20, y: 20, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' },
        { id: 'u1_shower', x: 50, y: 20, w: 30, h: 30, color: '#fff', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' },
        { id: 'u2_bed', x: 330, y: 20, w: 60, h: 90, color: '#fab1a0', label: '床', utility: 'energy', pixelPattern: 'bed_king' },
        { id: 'u2_sofa', x: 350, y: 150, w: 80, h: 40, color: '#74b9ff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
        { id: 'u2_kitchen', x: 500, y: 230, w: 80, h: 40, color: '#b2bec3', label: '厨台', utility: 'cook', pixelPattern: 'kitchen' },
        { id: 'u2_toilet', x: 550, y: 20, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' },
        { id: 'u2_shower', x: 520, y: 20, w: 30, h: 30, color: '#fff', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' },
        { id: 'u3_bed', x: 180, y: 480, w: 60, h: 90, color: '#55efc4', label: '床', utility: 'energy', pixelPattern: 'bed_king' },
        { id: 'u3_sofa', x: 150, y: 400, w: 80, h: 40, color: '#74b9ff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
        { id: 'u3_kitchen', x: 20, y: 330, w: 80, h: 40, color: '#b2bec3', label: '厨台', utility: 'cook', pixelPattern: 'kitchen' },
        { id: 'u3_toilet', x: 20, y: 550, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' },
        { id: 'u3_shower', x: 50, y: 550, w: 30, h: 30, color: '#fff', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' },
        { id: 'u4_bed', x: 330, y: 480, w: 60, h: 90, color: '#fd79a8', label: '床', utility: 'energy', pixelPattern: 'bed_king' },
        { id: 'u4_sofa', x: 350, y: 400, w: 80, h: 40, color: '#74b9ff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
        { id: 'u4_kitchen', x: 500, y: 330, w: 80, h: 40, color: '#b2bec3', label: '厨台', utility: 'cook', pixelPattern: 'kitchen' },
        { id: 'u4_toilet', x: 550, y: 550, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' },
        { id: 'u4_shower', x: 520, y: 550, w: 30, h: 30, color: '#fff', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' },
    ]
};

// ==========================================
// 7. 中央公园 (Public)
// ==========================================
const PLOT_PARK: PlotTemplate = {
    id: 'park_template',
    width: 1000,
    height: 670,
    type: 'public',
    rooms: [
        { id: 'park_base', x: 0, y: 0, w: 1000, h: 670, label: '', color: PALETTE.ground_grass_light, pixelPattern: 'grass' },
        { id: 'park_lawn_main', x: 50, y: 50, w: 900, h: 570, label: '中央公园绿地', color: PALETTE.ground_grass_light, pixelPattern: 'grass_dense' },
        { id: 'park_lake_border', x: 240, y: 160, w: 520, h: 320, label: '', color: '#8a7cff', pixelPattern: 'wave' },
        { id: 'park_lake', x: 250, y: 170, w: 500, h: 300, label: '镜湖', color: PALETTE.ground_water, pixelPattern: 'water' },
        { id: 'park_pave_cross', x: 0, y: 320, w: 1000, h: 40, label: '', color: '#9ca6b4', pixelPattern: 'stone' },
    ],
    furniture: [
        ...createRow('tree_rd_top', 20, -20, 10, 100, 0, { w: 42, h: 42, color: '#253048', label: '梧桐树', utility: 'none', dir: 'down', pixelPattern: 'tree_pixel', pixelOutline: true }),
        ...createRow('tree_rd_bot', 20, 620, 10, 100, 0, { w: 42, h: 42, color: '#253048', label: '梧桐树', utility: 'none', dir: 'up', pixelPattern: 'tree_pixel', pixelOutline: true }),
        ...createGrid('flower_bed_red', 80, 80, 2, 2, 80, 80, { w: 44, h: 44, color: PALETTE.deco_flower_red, label: '玫瑰花坛', utility: 'gardening', pixelPattern: 'flower_rose' }),
        ...createGrid('flower_bed_yel', 800, 80, 2, 2, 80, 80, { w: 44, h: 44, color: PALETTE.deco_flower_yellow, label: '郁金香花坛', utility: 'gardening', pixelPattern: 'flower_tulip' }),
        { id: 'park_fountain_base', x: 440, y: 270, w: 126, h: 126, color: '#a8b4c8', label: '喷泉池', utility: 'none', pixelPattern: 'fountain_base' },
        { id: 'park_fountain_water', x: 460, y: 290, w: 84, h: 84, color: '#5a8fff', label: '喷泉水景', utility: 'none', pixelPattern: 'water_anim' },
        { id: 'duck_boat_1', x: 300, y: 220, w: 44, h: 34, color: '#ffdd59', label: '小黄鸭船', utility: 'play', pixelPattern: 'boat_duck' },
        { id: 'duck_boat_2', x: 600, y: 270, w: 44, h: 34, color: '#ffdd59', label: '小黄鸭船', utility: 'play', pixelPattern: 'boat_duck' },
        { id: 'wooden_pier', x: 450, y: 410, w: 108, h: 64, color: '#d4bcaa', label: '亲水平台', utility: 'play', pixelPattern: 'pier_wood' },
        ...createRow('fishing_spot_l', 270, 450, 4, 40, 0, { w: 24, h: 24, color: '#74b9ff', label: '钓鱼位', utility: 'fishing', dir: 'down', pixelPattern: 'fishing_rod' }),
        ...createRow('fishing_spot_r', 590, 450, 4, 40, 0, { w: 24, h: 24, color: '#74b9ff', label: '钓鱼位', utility: 'fishing', dir: 'down', pixelPattern: 'fishing_rod' }),
        ...createRow('park_bench_t', 250, 100, 5, 110, 0, { w: 54, h: 24, color: '#e17055', label: '公园长椅', utility: 'comfort', pixelPattern: 'bench_park' }),
        { id: 'picnic_mat_a', x: 100, y: 420, w: 108, h: 84, color: '#ff6b81', label: '野餐垫', utility: 'hunger', pixelPattern: 'picnic_mat' },
        { id: 'picnic_basket', x: 120, y: 440, w: 34, h: 24, color: '#d4bcaa', label: '野餐篮', utility: 'hunger', pixelPattern: 'basket' },
        { id: 'picnic_mat_b', x: 220, y: 520, w: 108, h: 84, color: '#5a8fff', label: '野餐垫', utility: 'hunger', pixelPattern: 'picnic_mat' },
        { id: 'food_cart_1', x: 380, y: 500, w: 64, h: 44, color: '#d35400', label: '热狗餐车', utility: 'buy_food', pixelPattern: 'food_cart' },
        { id: 'food_cart_umbrella', x: 500, y: 500, w: 44, h: 44, color: '#ff9c8a', label: '遮阳伞', utility: 'none', pixelPattern: 'umbrella' },
        { id: 'icecream_cart', x: 550, y: 500, w: 64, h: 44, color: '#ffd166', label: '冰淇淋车', utility: 'buy_food', pixelPattern: 'icecream_cart' },
        { id: 'park_restroom_struct', x: 750, y: 540, w: 180, h: 60, color: '#b2bec3', label: '公园公厕', utility: 'none', pixelPattern: 'simple' },
        ...createRow('park_toilet', 765, 550, 4, 40, 0, { w: 30, h: 30, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' }),
        ...createGrid('forest_dense', 780, 370, 4, 3, 40, 40, { w: 34, h: 34, color: '#00b894', label: '灌木丛', utility: 'gardening', pixelPattern: 'bush' }),
    ]
};

// ==========================================
// 8. 商业娱乐区 (Commercial)
// ==========================================
const PLOT_COMMERCIAL: PlotTemplate = {
    id: 'commercial_template',
    width: 1020,
    height: 550,
    type: 'commercial',
    rooms: [
        { id: 'commercial_pave', x: 0, y: 0, w: 1020, h: 550, label: '', color: '#9ca6b4', pixelPattern: 'pave_fancy' },
        { id: 'mall_main', x: 20, y: 0, w: 600, h: 530, label: '大型商场', color: '#ffd93d', pixelPattern: 'mall' },
        { id: 'entertainment_complex', x: 650, y: 0, w: 370, h: 530, label: 'IMAX 影城', color: '#252a36', pixelPattern: 'cinema' },
    ],
    furniture: [
        ...createGrid('cosmetic_cnt', 40, 50, 4, 2, 80, 60, { w: 54, h: 34, color: '#ff7aa8', label: '美妆柜台', utility: 'buy_item', pixelPattern: 'counter_cosmetic' }),
        ...createGrid('cosmetic_mirror', 55, 60, 4, 2, 80, 60, { w: 24, h: 6, color: '#5a8fff', label: '试妆镜', utility: 'none', pixelPattern: 'mirror' }),
        ...createGrid('clothes_rack', 420, 20, 3, 3, 70, 80, { w: 12, h: 64, color: '#e17055', label: '当季新款', utility: 'buy_item', pixelPattern: 'clothes_rack' }),
        { id: 'mannequin_1', x: 370, y: 30, w: 24, h: 24, color: '#ffdd59', label: '模特', utility: 'none', pixelPattern: 'mannequin' },
        { id: 'mannequin_2', x: 370, y: 100, w: 24, h: 24, color: '#ffdd59', label: '模特', utility: 'none', pixelPattern: 'mannequin' },
        { id: 'fitting_room', x: 520, y: 300, w: 44, h: 108, color: '#a8b4c8', label: '试衣间', utility: 'none', pixelPattern: 'fitting_room' },
        { id: 'cashier_mall_1', x: 220, y: 250, w: 60, h: 44, color: '#2c3e50', label: '服务台', utility: 'work', multiUser: true, pixelPattern: 'cashier' },
        { id: 'cashier_mall_2', x: 300, y: 250, w: 60, h: 44, color: '#2c3e50', label: '服务台', utility: 'work', multiUser: true, pixelPattern: 'cashier' },
        ...createGrid('market_shelf_food', 40, 350, 5, 1, 80, 40, { w: 64, h: 28, color: '#ffdd59', label: '零食货架', utility: 'buy_item', pixelPattern: 'shelf_food' }),
        ...createGrid('market_shelf_veg', 40, 410, 5, 1, 80, 40, { w: 64, h: 28, color: '#55efc4', label: '蔬菜货架', utility: 'buy_item', pixelPattern: 'shelf_veg' }),
        ...createGrid('market_shelf_meat', 40, 470, 5, 1, 80, 40, { w: 64, h: 28, color: '#ff6b81', label: '生鲜货架', utility: 'buy_item', pixelPattern: 'shelf_meat' }),
        ...createRow('park_toilet', 520, 480, 2, 40, 0, { w: 30, h: 30, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' }),
        { id: 'ticket_booth_work', x: 770, y: 30, w: 44, h: 44, color: '#ff5252', label: '影院服务台', utility: 'work', multiUser: true, pixelPattern: 'ticket_booth' },
        { id: 'ticket_booth', x: 670, y: 30, w: 84, h: 44, color: '#ff5252', label: '售票处', utility: 'work', pixelPattern: 'ticket_booth' },
        { id: 'popcorn_machine', x: 920, y: 30, w: 44, h: 44, color: '#ffd32a', label: '爆米花机', utility: 'buy_food', pixelPattern: 'popcorn_machine' },
        { id: 'claw_machine_1', x: 870, y: 30, w: 44, h: 44, color: '#ff7aa8', label: '抓娃娃机', utility: 'play', pixelPattern: 'claw_machine' },
        { id: 'screen_imax', x: 680, y: 100, w: 316, h: 12, color: '#ffffff', label: 'IMAX 巨幕', utility: 'none', pixelPattern: 'screen_cinema' },
        ...createGrid('seat_imax_vip', 700, 150, 6, 2, 45, 50, { w: 38, h: 38, color: '#ff5252', label: 'VIP沙发', utility: 'cinema_3d', pixelPattern: 'seat_vip' }),
        ...createGrid('seat_imax_reg', 700, 300, 6, 4, 45, 40, { w: 34, h: 34, color: '#c0392b', label: '普通座', utility: 'cinema_3d', pixelPattern: 'seat_reg' }),
        ...createRow('cinema_toilet', 700, 480, 4, 40, 0, { w: 30, h: 30, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' }),
    ]
};

// ==========================================
// 9. 公共服务区 (Public)
// ==========================================
const PLOT_SERVICE: PlotTemplate = {
    id: 'service_template',
    width: 720,
    height: 720,
    type: 'public',
    rooms: [
        { id: 'public_ground', x: 0, y: 0, w: 720, h: 720, label: '', color: '#fff9e8', pixelPattern: 'public' },
        { id: 'hospital_main', x: 20, y: 20, w: 680, h: 320, label: '餐厅', color: '#7ce8ff', pixelPattern: 'hospital' },
        { id: 'library_complex', x: 20, y: 370, w: 680, h: 350, label: '市图书馆', color: '#ffffff', pixelPattern: 'library' },
    ],
    furniture: [
        { id: 'rest_reception', x: 140, y: 40, w: 126, h: 44, color: '#e17055', label: '餐厅前台', utility: 'work', multiUser: true, pixelPattern: 'reception' },
        ...createGrid('rest_table_2', 40, 120, 3, 2, 120, 100, { w: 84, h: 64, color: '#fab1a0', label: '豪华雅座', utility: 'eat_out', pixelPattern: 'table_dining', cost: 60 }),
        ...createGrid('kitchen_counter_1', 420, 40, 1, 4, 0, 70, { w: 34, h: 54, color: '#b2bec3', label: '后厨备菜台', utility: 'work', pixelPattern: 'kitchen_counter' }),
        ...createGrid('kitchen_stove', 520, 40, 2, 4, 80, 70, { w: 44, h: 64, color: '#d63031', label: '后厨灶台', utility: 'work', pixelPattern: 'stove' }),
        ...createGrid('book_row_hist', 40, 420, 8, 1, 60, 0, { w: 44, h: 108, color: '#e67e22', label: '历史类书架', utility: 'buy_book', pixelPattern: 'bookshelf_hist' }),
        ...createGrid('book_row_sci', 40, 570, 8, 1, 60, 0, { w: 44, h: 108, color: '#4a7dff', label: '科技类书架', utility: 'buy_book', pixelPattern: 'bookshelf_sci' }),
        ...createGrid('read_desk', 620, 400, 1, 4, 0, 80, { w: 40, h: 60, color: '#d35400', label: '自习长桌', utility: 'work', pixelPattern: 'desk_library' }),
        { id: 'librarian_desk', x: 520, y: 520, w: 64, h: 44, color: '#5a6572', label: '管理员', utility: 'work', pixelPattern: 'desk_librarian' },
    ]
};

// ==========================================
// 10. 休闲与夜生活 (Public/Commercial)
// ==========================================
const PLOT_NIGHTLIFE: PlotTemplate = {
    id: 'nightlife_template',
    width: 720,
    height: 530,
    type: 'public',
    rooms: [
        { id: 'gym_complex', x: 320, y: 0, w: 380, h: 530, label: '健身房', color: '#a8b4c8', pixelPattern: 'gym' },
        { id: 'arcade_zone', x: 0, y: 0, w: 300, h: 250, label: '赛博电玩城', color: '#5a6572', pixelPattern: 'arcade' },
        { id: 'night_club', x: 0, y: 270, w: 300, h: 260, label: '霓虹夜店', color: '#162056', pixelPattern: 'neon' },
    ],
    furniture: [
        ...createRow('treadmill', 340, 50, 5, 60, 0, { w: 44, h: 84, color: '#2c3e50', label: '跑步机', utility: 'run', dir: 'up', pixelPattern: 'treadmill' }),
        { id: 'yoga_area', x: 340, y: 180, w: 208, h: 84, color: '#ff9c8a', label: '瑜伽区', utility: 'stretch', pixelPattern: 'yoga_mat' },
        ...createGrid('weights', 370, 300, 3, 2, 60, 60, { w: 44, h: 44, color: '#5a6572', label: '哑铃架', utility: 'lift', pixelPattern: 'weights_rack' }),
        { id: 'water_station_gym', x: 620, y: 150, w: 34, h: 34, color: '#5a8fff', label: '直饮水', utility: 'drink', pixelPattern: 'water_station' },
        ...createGrid('gym_shower', 600, 250, 2, 4, 50,70, { w: 34, h: 44, color: '#81ecec', label: '淋浴间', utility: 'hygiene', dir: 'left', pixelPattern: 'shower_stall' }),
        ...createGrid('arcade_racing', 20, 20, 4, 1, 60, 0, { w: 54, h: 74, color: '#8a7cff', label: '赛车模拟', utility: 'play', pixelPattern: 'arcade_racing', pixelGlow: true }),
        ...createGrid('arcade_fight', 20, 110, 4, 2, 50, 60, { w: 44, h: 54, color: '#e84393', label: '格斗机台', utility: 'play', pixelPattern: 'arcade_fight', pixelGlow: true }),
        { id: 'dance_machine', x: 220, y: 150, w: 64, h: 64, color: '#ff7aa8', label: '跳舞机', utility: 'dance', pixelPattern: 'dance_machine', pixelGlow: true },
        { id: 'bar_counter_long', x: 10, y: 280, w: 34, h: 208, color: '#e84393', label: '发光吧台', utility: 'buy_drink', pixelPattern: 'bar_counter', pixelGlow: true },
        ...createRow('bar_stool', 45, 290, 6, 0, 34, { w: 24, h: 24, color: '#ffffff', label: '高脚凳', utility: 'sit', pixelPattern: 'stool_bar' }),
        { id: 'dj_stage', x: 140, y: 270, w: 126, h: 54, color: '#7158e2', label: 'DJ台', utility: 'music', pixelPattern: 'dj_stage', pixelGlow: true },
        { id: 'dance_floor', x: 120, y: 350, w: 158, h: 108, color: '#2c3e50', label: '舞池', utility: 'dance', pixelPattern: 'dance_floor', pixelGlow: true },
        { id: 'speaker_l', x: 100, y: 270, w: 44, h: 64, color: '#1a1e2c', label: '低音炮', utility: 'none', pixelPattern: 'speaker' },
        { id: 'speaker_r', x: 250, y: 270, w: 44, h: 64, color: '#1a1e2c', label: '低音炮', utility: 'none', pixelPattern: 'speaker' },
        { id: 'vip_sofa', x: 155, y: 470, w: 84, h: 44, color: '#ff5252', label: '卡座', utility: 'comfort', pixelPattern: 'sofa_vip' },
    ]
};

// ==========================================
// 11. 美术馆 (Gallery)
// ==========================================
const PLOT_GALLERY: PlotTemplate = {
    id: 'gallery_template',
    width: 400,
    height: 500,
    type: 'public',
    rooms: [
        { id: 'art_gallery_ground', x: 0, y: 0, w: 400, h: 500, label: '美术馆', color: '#f7f1e3', pixelPattern: 'simple' },
    ],
    furniture: [
        { id: 'gallery_sign', x: 50, y: -20, w: 300, h: 20, color: '#2f3542', label: 'MODERN ART', utility: 'none', pixelPattern: 'simple' },
        { id: 'gallery_desk', x: 100, y: 350, w: 80, h: 40, color: '#dfe4ea', label: '导览台', utility: 'work', pixelPattern: 'reception' },
        { id: 'statue_venus', x: 180, y: 150, w: 40, h: 60, color: '#ffffff', label: '维纳斯像', utility: 'art', pixelPattern: 'statue', pixelShadow: true },
        { id: 'statue_thinker', x: 80, y: 150, w: 40, h: 60, color: '#ffffff', label: '沉思者', utility: 'art', pixelPattern: 'statue', pixelShadow: true },
        ...createRow('painting_wall_top', 10, 10, 5, 80, 0, { w: 50, h: 60, color: '#ff6b6b', label: '抽象画作', utility: 'art', pixelPattern: 'painting' }),
        ...createGrid('painting_wall_left', 10, 100, 1, 3, 0, 80, { w: 50, h: 60, color: '#54a0ff', label: '风景画', utility: 'art', pixelPattern: 'painting' }),
        ...createGrid('painting_wall_right', 330, 100, 1, 3, 0, 80, { w: 50, h: 60, color: '#feca57', label: '肖像画', utility: 'art', pixelPattern: 'painting' }),
        { id: 'display_diamond', x: 150, y: 250, w: 40, h: 40, color: '#00d2d3', label: '希望蓝钻', utility: 'art', pixelPattern: 'display_case', pixelGlow: true },
        { id: 'display_gold', x: 250, y: 250, w: 40, h: 40, color: '#ff9f43', label: '黄金面具', utility: 'art', pixelPattern: 'display_case', pixelGlow: true },
        { id: 'gallery_bench_1', x: 150, y: 430, w: 100, h: 20, color: '#a4b0be', label: '观展长椅', utility: 'comfort', pixelPattern: 'bench_park' },
    ]
};

// ==========================================
// 12. 网咖 (NetCafe)
// ==========================================
const PLOT_NETCAFE: PlotTemplate = {
    id: 'netcafe_template',
    width: 400,
    height: 530,
    type: 'commercial',
    rooms: [
        { id: 'netcafe_ground', x: 0, y: 0, w: 400, h: 530, label: '星际网咖', color: '#1e272e', pixelPattern: 'simple' },
    ],
    furniture: [
        { id: 'netcafe_sign', x: 50, y: -20, w: 300, h: 20, color: '#00d2d3', label: 'INTERNET CAFE', utility: 'none', pixelPattern: 'neon' },
        { id: 'netcafe_carpet', x: 20, y: 100, w: 360, h: 400, color: '#2f3542', label: '吸音地毯', utility: 'none', pixelPattern: 'rug_fancy' },
        { id: 'netcafe_counter', x: 100, y: 30, w: 120, h: 44, color: '#57606f', label: '网管前台', utility: 'work', multiUser: true, pixelPattern: 'reception' },
        { id: 'netcafe_server', x: 230, y: 20, w: 44, h: 54, color: '#2ed573', label: '服务器', utility: 'none', pixelPattern: 'server', pixelGlow: true },
        ...createGrid('netcafe_pc_std', 30, 150, 4, 4, 60, 80, { w: 44, h: 34, color: '#3742fa', label: '网吧电脑', utility: 'work', cost: 5, pixelPattern: 'pc_pixel', pixelGlow: true, glowColor: '#3742fa' }),
        ...createGrid('netcafe_chair_std', 40, 185, 4, 4, 60, 80, { w: 24, h: 24, color: '#747d8c', label: '电竞椅', utility: 'none', pixelPattern: 'chair_pixel' }),
        ...createGrid('netcafe_pc_vip', 290, 150, 1, 4, 70, 90, { w: 54, h: 34, color: '#ff4757', label: '顶配电脑', utility: 'work', cost: 25, pixelPattern: 'pc_pixel', pixelGlow: true, glowColor: '#ff4757' }),
        ...createGrid('netcafe_sofa_vip', 295, 185, 1, 4, 70, 90, { w: 44, h: 34, color: '#2f3542', label: '真皮沙发', utility: 'comfort', pixelPattern: 'sofa_vip' },),
        { id: 'vending_netcafe', x: 10, y: 50, w: 44, h: 34, color: '#ffa502', label: '能量饮料', utility: 'buy_drink', pixelPattern: 'vending' },
        { id: 'toilet_netcafe_m', x: 350, y: 50, w: 34, h: 34, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' },
    ]
};

// ==========================================
// 13. 向日葵幼儿园 (Kindergarten) [拆分自 Education]
// ==========================================
const PLOT_KINDERGARTEN: PlotTemplate = {
    id: 'kindergarten_template',
    width: 440,
    height: 440,
    type: 'public',
    rooms: [
        { id: 'kg_ground', x: 0, y: 0, w: 440, h: 440, label: '向日葵幼儿园', color: '#fff0f5', pixelPattern: 'simple' },
        { id: 'kg_playroom', x: 20, y: 20, w: 260, h: 200, label: '活动室', color: '#ffeaa7', pixelPattern: 'carpet' },
        { id: 'kg_nap_room', x: 20, y: 240, w: 260, h: 140, label: '午睡室', color: '#dff9fb', pixelPattern: 'wood' },
        { id: 'kg_yard', x: 290, y: 20, w: 100, h: 360, label: '', color: '#55efc4', pixelPattern: 'grass' },
    ],
    furniture: [
        ...createGrid('kg_crib', 30, 250, 4, 2, 60, 60, { w: 40, h: 40, color: '#ff9ff3', label: '婴儿床', utility: 'nap_crib', pixelPattern: 'bed_crib' }),
        ...createGrid('kg_mat', 30, 30, 4, 3, 60, 60, { w: 44, h: 44, color: '#74b9ff', label: '游戏垫', utility: 'play_blocks', pixelPattern: 'play_mat' }),
        { id: 'kg_slide', x: 310, y: 40, w: 60, h: 100, color: '#ff7675', label: '滑梯', utility: 'play', pixelPattern: 'slide' },
        // [新增] 教师工位
        { id: 'kg_teacher_desk', x: 200, y: 150, w: 48, h: 32, color: '#fab1a0', label: '教师桌', utility: 'work', pixelPattern: 'desk_pixel' },
    ]
};

// ==========================================
// 14. 第一小学 (Elementary School) [拆分自 Education]
// ==========================================
const PLOT_ELEMENTARY: PlotTemplate = {
    id: 'elementary_template',
    width: 900,
    height: 480,
    type: 'public',
    rooms: [
        { id: 'elem_ground', x: 0, y: 0, w: 900, h: 480, label: '第一小学', color: '#f0f2f8', pixelPattern: 'concrete' },
        { id: 'elem_class_1', x: 20, y: 20, w: 200, h: 180, label: '一年级', color: '#dcede6', pixelPattern: 'wood' },
        { id: 'elem_class_2', x: 240, y: 20, w: 200, h: 180, label: '二年级', color: '#dcede6', pixelPattern: 'wood' },
        { id: 'elem_playground', x: 460, y: 20, w: 400, h: 400, label: '操场', color: '#e55039', pixelPattern: 'run_track' },
    ],
    furniture: [
        ...createGrid('elem_desk_1', 30, 40, 4, 3, 45, 50, { w: 34, h: 24, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school' }),
        ...createGrid('elem_desk_2', 250, 40, 4, 3, 45, 50, { w: 34, h: 24, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school' }),
        { id: 'elem_blackboard_1', x: 70, y: 10, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none' },
        { id: 'elem_blackboard_2', x: 290, y: 10, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none' },
        // [新增] 操场设施 (体育老师)
        { id: 'elem_flag', x: 650, y: 220, w: 20, h: 20, color: '#d63031', label: '旗杆', utility: 'none', pixelPattern: 'simple' },
        // [新增] 校门口保安岗
        { id: 'school_gate_guard_elem', x: 450, y: 450, w: 34, h: 34, color: '#2c3e50', label: '保安岗', utility: 'work', pixelPattern: 'chair_pixel' },
    ]
};

// ==========================================
// 15. 星海中学 (High School) [拆分自 Education]
// ==========================================
const PLOT_HIGHSCHOOL: PlotTemplate = {
    id: 'high_school_template',
    width: 1340,
    height: 480,
    type: 'public',
    rooms: [
        { id: 'high_ground', x: 0, y: 0, w: 1340, h: 480, label: '星海中学', color: '#dfe6e9', pixelPattern: 'concrete' },
        { id: 'high_class_main', x: 20, y: 20, w: 400, h: 200, label: '教学楼', color: '#ffffff', pixelPattern: 'tile' },
        { id: 'high_library', x: 440, y: 20, w: 300, h: 200, label: '图书馆', color: '#81ecec', pixelPattern: 'library' },
        { id: 'high_canteen', x: 20, y: 240, w: 300, h: 200, label: '食堂', color: '#fab1a0', pixelPattern: 'kitchen' },
        { id: 'high_gym', x: 780, y: 20, w: 500, h: 400, label: '体育馆', color: '#a29bfe', pixelPattern: 'gym' },
    ],
    furniture: [
        ...createGrid('high_desk', 40, 40, 8, 3, 45, 50, { w: 34, h: 24, color: '#b2bec3', label: '书桌', utility: 'study_high', pixelPattern: 'desk_simple' }),
        ...createGrid('high_book', 460, 40, 5, 2, 50, 80, { w: 40, h: 60, color: '#0984e3', label: '藏书', utility: 'read', pixelPattern: 'bookshelf_sci' }),
        ...createGrid('high_lunch', 40, 260, 4, 2, 70, 80, { w: 60, h: 60, color: '#fab1a0', label: '餐桌', utility: 'eat_canteen', pixelPattern: 'table_dining', cost: 10 }),
        { id: 'high_hoop', x: 830, y: 50, w: 20, h: 60, color: '#e17055', label: '篮筐', utility: 'play', pixelPattern: 'hoop' },
        // [新增] 教师黑板
        { id: 'high_blackboard', x: 180, y: 30, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none' },
        // [新增] 饭堂厨师工位
        { id: 'high_stove', x: 300, y: 260, w: 44, h: 64, color: '#d63031', label: '食堂灶台', utility: 'work', pixelPattern: 'stove' },
        // [新增] 校门口保安岗
        { id: 'school_gate_guard_high', x: 650, y: 450, w: 34, h: 34, color: '#2c3e50', label: '保安岗', utility: 'work', pixelPattern: 'chair_pixel' },
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
    'tech': PLOT_TECH,       // 科技大厦
    'finance': PLOT_FINANCE, // 环球金融中心
    'design': PLOT_DESIGN,   // 创意园区
    'kindergarten': PLOT_KINDERGARTEN, // 幼儿园
    'elementary': PLOT_ELEMENTARY,     // 小学
    'high_school': PLOT_HIGHSCHOOL,    // 中学
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