import { PlotTemplate, Furniture, RoomDef } from '../types';

// 调色板引用（为了保持风格一致，这里简单复制常用的）
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
// 1. CBD 科技与金融区 (Tech & Finance)
// 原坐标偏移: (20, 20) -> (0, 0)
// ==========================================
const PLOT_CBD: PlotTemplate = {
    id: 'cbd_template',
    width: 1460,
    height: 400,
    rooms: [
        { id: 'cbd_plaza_ground', x: 560, y: 0, w: 900, h: 360, label: '', color: '#f0f5ff', pixelPattern: 'grid' },
        { id: 'office_tower_a', x: 0, y: 0, w: 460, h: 360, label: '科技大厦', color: '#d4e0f0', pixelPattern: 'windows' },
        { id: 'office_carpet_work', x: 20, y: 20, w: 400, h: 300, label: '', color: '#c4d0e4', pixelPattern: 'dots' },
        { id: 'office_tower_b', x: 600, y: 20, w: 450, h: 320, label: '环球金融中心', color: '#ffffff', pixelPattern: 'checker' },
        { id: 'design_studio', x: 1080, y: 20, w: 380, h: 280, label: '像素艺术工作室', color: PALETTE.build_brick_white, pixelPattern: 'brush' },
    ],
    furniture: [
        // Tech Tower
        ...createGrid('tech_desk', 30, 30, 7, 4, 60, 65, { w: 48, h: 32, color: '#2c3e50', label: '升降办公桌', utility: 'none', dir: 'down', pixelPattern: 'desk_pixel' }),
        ...createGrid('monitor_l', 40, 30, 7, 4, 60, 65, { w: 16, h: 6, color: PALETTE.deco_tech_glow, label: '', utility: 'none', pixelGlow: true }),
        ...createGrid('monitor_r', 50, 30, 7, 4, 60, 65, { w: 16, h: 6, color: PALETTE.deco_tech_glow, label: '', utility: 'none', pixelGlow: true }),
        ...createGrid('tech_chair', 45, 50, 7, 4, 60, 65, { w: 22, h: 22, color: '#8a9ca6', label: '码农工位', utility: 'work', pixelPattern: 'chair_pixel' }),
        
        ...createRow('server_rack', 30, 280, 3, 75, 0, { w: 64, h: 38, color: '#253048', label: '服务器组', utility: 'none', dir: 'left', pixelPattern: 'server', pixelGlow: true, glowColor: '#00ffaa' }),
        { id: 'boss_chair', x: 280, y: 280, w: 44, h: 44, color: '#253048', label: '老板椅', utility: 'work', pixelPattern: 'chair_boss' },
        { id: 'server_console', x: 330, y: 290, w: 34, h: 24, color: '#a8b4c8', label: '控制台', utility: 'work', pixelPattern: 'console' },
        { id: 'water_cooler', x: 390, y: 280, w: 24, h: 24, color: '#00d2d3', label: '饮水机', utility: 'drink', pixelPattern: 'water_cooler' },
        { id: 'coffee_maker', x: 420, y: 280, w: 24, h: 24, color: '#ff6b6b', label: '意式咖啡机', utility: 'drink', pixelPattern: 'coffee_machine' },
        { id: 'office_sofa_l', x: 370, y: 310, w: 84, h: 34, color: '#6c7a8a', label: '休息沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
        { id: 'office_plant_1', x: 10, y: 330, w: 18, h: 18, color: PALETTE.deco_plant, label: '龟背竹', utility: 'none', pixelPattern: 'plant_pixel' },

        // Finance
        { id: 'conf_rug', x: 630, y: 45, w: 290, h: 180, color: '#a8b4c8', label: '地毯', utility: 'none', pixelPattern: 'rug_fancy' },
        { id: 'conf_table', x: 700, y: 90, w: 168, h: 84, color: '#f0f5ff', label: '大理石会议桌', utility: 'work_group', dir: 'down', multiUser: true, pixelPattern: 'table_marble' },
        { id: 'conf_projector', x: 660, y: 100, w: 12, h: 64, color: '#253048', label: '投影仪', utility: 'none', pixelPattern: 'tech' },
        ...createRow('conf_chair_t', 710, 60, 4, 44, 0, { w: 22, h: 22, color: '#253048', label: '商务工位', utility: 'work', pixelPattern: 'chair_leather' }),
        ...createRow('conf_chair_b', 710, 180, 4, 44, 0, { w: 22, h: 22, color: '#253048', label: '商务工位', utility: 'work', pixelPattern: 'chair_leather' }),
        
        { id: 'boss_area_rug', x: 810, y: 225, w: 230, h: 108, color: '#c23636', label: '波斯地毯', utility: 'none', pixelPattern: 'rug_persian' },
        { id: 'boss_desk', x: 860, y: 230, w: 126, h: 54, color: PALETTE.deco_wood_red, label: '红木班台', utility: 'none', pixelPattern: 'desk_wood' },
        { id: 'boss_pc', x: 880, y: 250, w: 44, h: 12, color: '#1a1e2c', label: '一体机', utility: 'none', pixelPattern: 'pc_pixel' },
        { id: 'boss_chair_fin', x: 880, y: 280, w: 44, h: 44, color: '#253048', label: '老板椅', utility: 'work', pixelPattern: 'chair_boss' },
        { id: 'boss_bookshelf', x: 1000, y: 230, w: 24, h: 80, color: PALETTE.deco_wood_red, label: '藏书架', utility: 'none', pixelPattern: 'bookshelf' },
        { id: 'boss_safe', x: 820, y: 290, w: 34, h: 34, color: '#5a6572', label: '保险柜', utility: 'none', pixelPattern: 'safe' },

        // Design Studio
        { id: 'messy_rug', x: 1330, y: 60, w: 108, h: 108, color: '#ff9c8a', label: '艺术地毯', utility: 'none', pixelPattern: 'rug_art' },
        ...createGrid('art_easel', 1100, 60, 3, 3, 90, 80, { w: 44, h: 54, color: '#ff5252', label: '画架', utility: 'paint', pixelPattern: 'easel' }),
        { id: 'plaster_statue', x: 1390, y: 60, w: 34, h: 34, color: '#ffffff', label: '石膏像', utility: 'none', pixelPattern: 'statue' },
        { id: 'paint_buckets', x: 1250, y: 150, w: 24, h: 24, color: '#ff6b81', label: '颜料桶', utility: 'none', pixelPattern: 'paint' },
        { id: 'coffee_corner', x: 1380, y: 230, w: 44, h: 44, color: '#ff5252', label: '咖啡角', utility: 'drink', pixelPattern: 'coffee_corner' },
        { id: 'bean_bag_1', x: 1330, y: 80, w: 44, h: 44, color: '#ff7aa8', label: '懒人沙发', utility: 'comfort', pixelPattern: 'beanbag' },
        { id: 'bean_bag_2', x: 1370, y: 100, w: 44, h: 44, color: '#8a7cff', label: '懒人沙发', utility: 'comfort', pixelPattern: 'beanbag' },
    ]
};

// ==========================================
// 2. 宿舍/公寓区 (North East)
// 原坐标偏移: (1480, 20) -> (0, 0)
// ==========================================
const PLOT_DORM: PlotTemplate = {
    id: 'dorm_template',
    width: 900,
    height: 360,
    rooms: [
        { id: 'talent_ground_n', x: 0, y: 0, w: 900, h: 360, label: '', color: '#f0f2f8', pixelPattern: 'simple' },
        { id: 'talent_apt_n1', x: 20, y: 20, w: 350, h: 320, label: '人才公寓 N1', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
        { id: 'talent_apt_n2', x: 390, y: 20, w: 350, h: 320, label: '人才公寓 N2', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
        { id: 'ne_bath_wall', x: 760, y: 20, w: 100, h: 340, color: '#dce4f0', label: '公共大澡堂', utility: 'none', pixelPattern: 'simple' },
    ],
    furniture: [
        // N1
        ...createGrid('dorm_bed_n1', 40, 60, 3, 2, 120, 120, { w: 54, h: 84, color: '#ffb142', label: '上下铺', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createGrid('dorm_desk_n1', 110, 60, 2, 2, 120, 120, { w: 34, h: 34, color: '#a8b4c8', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),
        
        // N2
        ...createGrid('dorm_bed_n2', 410, 60, 3, 2, 120, 120, { w: 54, h: 84, color: '#1dd1a1', label: '上下铺', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createGrid('dorm_desk_n2', 480, 60, 2, 2, 120, 120, { w: 34, h: 34, color: '#a8b4c8', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),

        // Bath
        ...createRow('ne_toilet', 770, 30, 6, 0, 50, { w: 34, h: 34, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' }),
        ...createRow('ne_shower', 820, 30, 6, 0, 50, { w: 34, h: 44, color: '#81ecec', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' }),
    ]
};

// ==========================================
// 3. 居住区 (West)
// 原坐标偏移: (20, 480) -> (0, 0)
// ==========================================
const PLOT_RESIDENTIAL: PlotTemplate = {
    id: 'res_template',
    width: 480,
    height: 1320,
    rooms: [
        { id: 'res_ground', x: 0, y: 0, w: 480, h: 1320, label: '', color: '#f0f2f8', pixelPattern: 'simple' },
        { id: 'res_block_a', x: 20, y: 20, w: 440, h: 300, label: '人才公寓 A座', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
        { id: 'res_block_b', x: 20, y: 340, w: 440, h: 300, label: '幸福家园 B座', color: PALETTE.build_brick_red, pixelPattern: 'brick_red' },
        { id: 'res_block_c', x: 20, y: 660, w: 440, h: 300, label: '青年旅社', color: '#dce4f0', pixelPattern: 'concrete' },
        { id: 'community_center', x: 20, y: 980, w: 440, h: 320, label: '市民活动中心', color: '#8a7cff', pixelPattern: 'community' },
    ],
    furniture: [
        // Block A
        ...createGrid('dorm_bed', 40, 40, 3, 3, 100, 90, { w: 54, h: 84, color: '#4a7dff', label: '上下铺', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createGrid('dorm_desk', 100, 40, 2, 3, 100, 90, { w: 34, h: 34, color: '#a8b4c8', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),
        { id: 'dorm_toilet_block', x: 380, y: 40, w: 64, h: 258, color: '#ffffff', label: '公共卫浴', utility: 'hygiene', pixelPattern: 'toilet_block' },
        ...createRow('dorm_toilet', 390, 50, 4, 0, 60, { w: 34, h: 34, color: '#5a8fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' }),
        ...createRow('dorm_shower', 330, 70, 4, 0, 50, { w: 34, h: 44, color: '#81ecec', label: '公共淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' }),

        // Block B
        ...createGrid('apt_kitchen', 40, 360, 2, 2, 200, 140, { w: 108, h: 34, color: '#5a6572', label: '整体厨房', utility: 'cook', pixelPattern: 'kitchen' }),
        ...createGrid('apt_fridge', 140, 360, 2, 2, 200, 140, { w: 34, h: 34, color: '#ffffff', label: '冰箱', utility: 'hunger', pixelPattern: 'fridge' }),
        ...createGrid('apt_table', 60, 410, 2, 2, 200, 140, { w: 64, h: 64, color: '#ffd166', label: '餐桌', utility: 'hunger', pixelPattern: 'table_kitchen' }),

        // Youth Apt (Block C)
        ...createGrid('lazy_sofa', 40, 720, 4, 3, 90, 80, { w: 54, h: 44, color: '#7158e2', label: '懒人沙发', utility: 'comfort', pixelPattern: 'sofa_lazy' }),
        { id: 'pizza_box', x: 60, y: 730, w: 24, h: 24, color: '#ff9c8a', label: '披萨盒', utility: 'hunger', pixelPattern: 'pizza_box' },
        { id: 'gaming_tv_wall', x: 230, y: 670, w: 158, h: 12, color: '#1a1e2c', label: '电视墙', utility: 'play', pixelPattern: 'tv_wall' },
        { id: 'console_ps5', x: 240, y: 690, w: 34, h: 24, color: '#ffffff', label: '游戏主机', utility: 'play', pixelPattern: 'console_game' },

        // Community Center
        ...createGrid('mahjong', 60, 1020, 3, 2, 110, 100, { w: 74, h: 74, color: '#27ae60', label: '自动麻将机', utility: 'play', multiUser: true, pixelPattern: 'mahjong_table' }),
        { id: 'pingpong', x: 330, y: 1220, w: 94, h: 54, color: '#4a7dff', label: '乒乓球桌', utility: 'play', pixelPattern: 'pingpong_table' },
        { id: 'community_notice', x: 330, y: 1000, w: 64, h: 12, color: '#8a7cff', label: '公告栏', utility: 'none', pixelPattern: 'notice_board' },
    ]
};

// ==========================================
// 4. 中央公园 (Center)
// 原坐标偏移: (600, 480) -> (0, 0)
// ==========================================
const PLOT_PARK: PlotTemplate = {
    id: 'park_template',
    width: 1000,
    height: 670,
    rooms: [
        { id: 'park_base', x: 0, y: 0, w: 1000, h: 670, label: '', color: PALETTE.ground_grass_light, pixelPattern: 'grass' }, // 修正底色为 light grass 以匹配视觉
        { id: 'park_lawn_main', x: 50, y: 50, w: 900, h: 570, label: '中央公园绿地', color: PALETTE.ground_grass_light, pixelPattern: 'grass_dense' },
        { id: 'park_lake_border', x: 240, y: 160, w: 520, h: 320, label: '', color: '#8a7cff', pixelPattern: 'wave' },
        { id: 'park_lake', x: 250, y: 170, w: 500, h: 300, label: '镜湖', color: PALETTE.ground_water, pixelPattern: 'water' },
        { id: 'park_pave_cross', x: 0, y: 320, w: 1000, h: 40, label: '', color: '#9ca6b4', pixelPattern: 'stone' },
    ],
    furniture: [
        // 树木与花坛
        ...createRow('tree_rd_top', 20, -20, 10, 100, 0, { w: 42, h: 42, color: '#253048', label: '梧桐树', utility: 'none', dir: 'down', pixelPattern: 'tree_pixel', pixelOutline: true }),
        ...createRow('tree_rd_bot', 20, 620, 10, 100, 0, { w: 42, h: 42, color: '#253048', label: '梧桐树', utility: 'none', dir: 'up', pixelPattern: 'tree_pixel', pixelOutline: true }),
        
        ...createGrid('flower_bed_red', 80, 80, 2, 2, 80, 80, { w: 44, h: 44, color: PALETTE.deco_flower_red, label: '玫瑰花坛', utility: 'gardening', pixelPattern: 'flower_rose' }),
        ...createGrid('flower_bed_yel', 800, 80, 2, 2, 80, 80, { w: 44, h: 44, color: PALETTE.deco_flower_yellow, label: '郁金香花坛', utility: 'gardening', pixelPattern: 'flower_tulip' }),

        // 湖泊设施
        { id: 'park_fountain_base', x: 440, y: 270, w: 126, h: 126, color: '#a8b4c8', label: '喷泉池', utility: 'none', pixelPattern: 'fountain_base' },
        { id: 'park_fountain_water', x: 460, y: 290, w: 84, h: 84, color: '#5a8fff', label: '喷泉水景', utility: 'none', pixelPattern: 'water_anim' },
        { id: 'duck_boat_1', x: 300, y: 220, w: 44, h: 34, color: '#ffdd59', label: '小黄鸭船', utility: 'play', pixelPattern: 'boat_duck' },
        { id: 'duck_boat_2', x: 600, y: 270, w: 44, h: 34, color: '#ffdd59', label: '小黄鸭船', utility: 'play', pixelPattern: 'boat_duck' },
        { id: 'wooden_pier', x: 450, y: 410, w: 108, h: 64, color: '#d4bcaa', label: '亲水平台', utility: 'play', pixelPattern: 'pier_wood' },
        
        // 钓鱼点
        ...createRow('fishing_spot_l', 270, 450, 4, 40, 0, { w: 24, h: 24, color: '#74b9ff', label: '钓鱼位', utility: 'fishing', dir: 'down', pixelPattern: 'fishing_rod' }),
        ...createRow('fishing_spot_r', 590, 450, 4, 40, 0, { w: 24, h: 24, color: '#74b9ff', label: '钓鱼位', utility: 'fishing', dir: 'down', pixelPattern: 'fishing_rod' }),

        // 休息与野餐
        ...createRow('park_bench_t', 250, 100, 5, 110, 0, { w: 54, h: 24, color: '#e17055', label: '公园长椅', utility: 'comfort', pixelPattern: 'bench_park' }),
        { id: 'picnic_mat_a', x: 100, y: 420, w: 108, h: 84, color: '#ff6b81', label: '野餐垫', utility: 'hunger', pixelPattern: 'picnic_mat' },
        { id: 'picnic_basket', x: 120, y: 440, w: 34, h: 24, color: '#d4bcaa', label: '野餐篮', utility: 'hunger', pixelPattern: 'basket' },
        { id: 'picnic_mat_b', x: 220, y: 520, w: 108, h: 84, color: '#5a8fff', label: '野餐垫', utility: 'hunger', pixelPattern: 'picnic_mat' },

        // 商业设施
        { id: 'food_cart_1', x: 380, y: 500, w: 64, h: 44, color: '#d35400', label: '热狗餐车', utility: 'buy_food', pixelPattern: 'food_cart' },
        { id: 'food_cart_umbrella', x: 500, y: 500, w: 44, h: 44, color: '#ff9c8a', label: '遮阳伞', utility: 'none', pixelPattern: 'umbrella' },
        { id: 'icecream_cart', x: 550, y: 500, w: 64, h: 44, color: '#ffd166', label: '冰淇淋车', utility: 'buy_food', pixelPattern: 'icecream_cart' },

        // 公厕
        { id: 'park_restroom_struct', x: 750, y: 540, w: 180, h: 60, color: '#b2bec3', label: '公园公厕', utility: 'none', pixelPattern: 'simple' },
        ...createRow('park_toilet', 765, 550, 4, 40, 0, { w: 30, h: 30, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' }),
        
        // 灌木丛
        ...createGrid('forest_dense', 780, 370, 4, 3, 40, 40, { w: 34, h: 34, color: '#00b894', label: '灌木丛', utility: 'gardening', pixelPattern: 'bush' }),
    ]
};

// ==========================================
// 5. 商业娱乐区 (South)
// 原坐标偏移: (580, 1250) -> (0, 0)
// ==========================================
const PLOT_COMMERCIAL: PlotTemplate = {
    id: 'commercial_template',
    width: 1020,
    height: 550,
    rooms: [
        { id: 'commercial_pave', x: 0, y: 0, w: 1020, h: 550, label: '', color: '#9ca6b4', pixelPattern: 'pave_fancy' },
        { id: 'mall_main', x: 20, y: 0, w: 600, h: 530, label: '大型商场', color: '#ffd93d', pixelPattern: 'mall' },
        { id: 'entertainment_complex', x: 650, y: 0, w: 370, h: 530, label: 'IMAX 影城', color: '#252a36', pixelPattern: 'cinema' },
    ],
    furniture: [
        // Mall
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

        // Cinema
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
// 6. 公共服务区 (East)
// 原坐标偏移: (1680, 480) -> (0, 0)
// ==========================================
const PLOT_SERVICE: PlotTemplate = {
    id: 'service_template',
    width: 720,
    height: 720, // 截取上半部分
    rooms: [
        { id: 'public_ground', x: 0, y: 0, w: 720, h: 720, label: '', color: '#fff9e8', pixelPattern: 'public' },
        { id: 'hospital_main', x: 20, y: 20, w: 680, h: 320, label: '餐厅', color: '#7ce8ff', pixelPattern: 'hospital' },
        { id: 'library_complex', x: 20, y: 370, w: 680, h: 350, label: '市图书馆', color: '#ffffff', pixelPattern: 'library' },
    ],
    furniture: [
        // Restaurant
        { id: 'rest_reception', x: 140, y: 40, w: 126, h: 44, color: '#e17055', label: '餐厅前台', utility: 'work', multiUser: true, pixelPattern: 'reception' },
        ...createGrid('rest_table_2', 40, 120, 3, 2, 120, 100, { w: 84, h: 64, color: '#fab1a0', label: '豪华雅座', utility: 'eat_out', pixelPattern: 'table_dining', cost: 60 }),
        ...createGrid('kitchen_counter_1', 420, 40, 1, 4, 0, 70, { w: 34, h: 54, color: '#b2bec3', label: '后厨备菜台', utility: 'work', pixelPattern: 'kitchen_counter' }),
        ...createGrid('kitchen_stove', 520, 40, 2, 4, 80, 70, { w: 44, h: 64, color: '#d63031', label: '后厨灶台', utility: 'work', pixelPattern: 'stove' }),

        // Library
        ...createGrid('book_row_hist', 40, 420, 8, 1, 60, 0, { w: 44, h: 108, color: '#e67e22', label: '历史类书架', utility: 'buy_book', pixelPattern: 'bookshelf_hist' }),
        ...createGrid('book_row_sci', 40, 570, 8, 1, 60, 0, { w: 44, h: 108, color: '#4a7dff', label: '科技类书架', utility: 'buy_book', pixelPattern: 'bookshelf_sci' }),
        ...createGrid('read_desk', 620, 400, 1, 4, 0, 80, { w: 40, h: 60, color: '#d35400', label: '自习长桌', utility: 'work', pixelPattern: 'desk_library' }),
        { id: 'librarian_desk', x: 520, y: 520, w: 64, h: 44, color: '#5a6572', label: '管理员', utility: 'work', pixelPattern: 'desk_librarian' },
    ]
};

// ==========================================
// 7. 休闲与夜生活 (South East)
// 原坐标偏移: (1680, 1250) -> (0, 0)
// ==========================================
const PLOT_NIGHTLIFE: PlotTemplate = {
    id: 'nightlife_template',
    width: 720,
    height: 530,
    rooms: [
        { id: 'gym_complex', x: 320, y: 0, w: 380, h: 530, label: '健身房', color: '#a8b4c8', pixelPattern: 'gym' },
        { id: 'arcade_zone', x: 0, y: 0, w: 300, h: 250, label: '赛博电玩城', color: '#5a6572', pixelPattern: 'arcade' },
        { id: 'night_club', x: 0, y: 270, w: 300, h: 260, label: '霓虹夜店', color: '#162056', pixelPattern: 'neon' },
    ],
    furniture: [
        // Gym
        ...createRow('treadmill', 340, 50, 5, 60, 0, { w: 44, h: 84, color: '#2c3e50', label: '跑步机', utility: 'run', dir: 'up', pixelPattern: 'treadmill' }),
        { id: 'yoga_area', x: 340, y: 180, w: 208, h: 84, color: '#ff9c8a', label: '瑜伽区', utility: 'stretch', pixelPattern: 'yoga_mat' },
        ...createGrid('weights', 370, 300, 3, 2, 60, 60, { w: 44, h: 44, color: '#5a6572', label: '哑铃架', utility: 'lift', pixelPattern: 'weights_rack' }),
        { id: 'water_station_gym', x: 620, y: 150, w: 34, h: 34, color: '#5a8fff', label: '直饮水', utility: 'drink', pixelPattern: 'water_station' },
        ...createGrid('gym_shower', 600, 250, 2, 4, 50,70, { w: 34, h: 44, color: '#81ecec', label: '淋浴间', utility: 'hygiene', dir: 'left', pixelPattern: 'shower_stall' }),

        // Arcade
        ...createGrid('arcade_racing', 20, 20, 4, 1, 60, 0, { w: 54, h: 74, color: '#8a7cff', label: '赛车模拟', utility: 'play', pixelPattern: 'arcade_racing', pixelGlow: true }),
        ...createGrid('arcade_fight', 20, 110, 4, 2, 50, 60, { w: 44, h: 54, color: '#e84393', label: '格斗机台', utility: 'play', pixelPattern: 'arcade_fight', pixelGlow: true }),
        { id: 'dance_machine', x: 220, y: 150, w: 64, h: 64, color: '#ff7aa8', label: '跳舞机', utility: 'dance', pixelPattern: 'dance_machine', pixelGlow: true },

        // Night Club
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
// 8. 远东新区 (Far East)
// 原坐标偏移: (2450, 50) -> (0, 0)
// 包含: Art Gallery (Top) & Netcafe (Bottom)
// ==========================================
const PLOT_FAREAST: PlotTemplate = {
    id: 'fareast_template',
    width: 400,
    height: 1750, 
    rooms: [
        { id: 'art_gallery_ground', x: 0, y: 0, w: 400, h: 500, label: '美术馆', color: '#f7f1e3', pixelPattern: 'simple' },
        { id: 'netcafe_ground', x: 0, y: 1200, w: 400, h: 530, label: '星际网咖', color: '#1e272e', pixelPattern: 'simple' },
    ],
    furniture: [
        // Gallery
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

        // Netcafe (Y offset +1200)
        { id: 'netcafe_sign', x: 50, y: 1180, w: 300, h: 20, color: '#00d2d3', label: 'INTERNET CAFE', utility: 'none', pixelPattern: 'neon' },
        { id: 'netcafe_carpet', x: 20, y: 1300, w: 360, h: 400, color: '#2f3542', label: '吸音地毯', utility: 'none', pixelPattern: 'rug_fancy' },
        { id: 'netcafe_counter', x: 100, y: 1230, w: 120, h: 44, color: '#57606f', label: '网管前台', utility: 'work', multiUser: true, pixelPattern: 'reception' },
        { id: 'netcafe_server', x: 230, y: 1220, w: 44, h: 54, color: '#2ed573', label: '服务器', utility: 'none', pixelPattern: 'server', pixelGlow: true },
        ...createGrid('netcafe_pc_std', 30, 1350, 4, 4, 60, 80, { w: 44, h: 34, color: '#3742fa', label: '网吧电脑', utility: 'work', cost: 5, pixelPattern: 'pc_pixel', pixelGlow: true, glowColor: '#3742fa' }),
        ...createGrid('netcafe_chair_std', 40, 1385, 4, 4, 60, 80, { w: 24, h: 24, color: '#747d8c', label: '电竞椅', utility: 'none', pixelPattern: 'chair_pixel' }),
        ...createGrid('netcafe_pc_vip', 290, 1350, 1, 4, 70, 90, { w: 54, h: 34, color: '#ff4757', label: '顶配电脑', utility: 'work', cost: 25, pixelPattern: 'pc_pixel', pixelGlow: true, glowColor: '#ff4757' }),
        ...createGrid('netcafe_sofa_vip', 295, 1385, 1, 4, 70, 90, { w: 44, h: 34, color: '#2f3542', label: '真皮沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' }),
        { id: 'vending_netcafe', x: 10, y: 1250, w: 44, h: 34, color: '#ffa502', label: '能量饮料', utility: 'buy_drink', pixelPattern: 'vending' },
        { id: 'toilet_netcafe_m', x: 350, y: 1250, w: 34, h: 34, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' },
    ]
};

// 汇总导出
export const PLOTS: Record<string, PlotTemplate> = {
    'cbd': PLOT_CBD,
    'dorm': PLOT_DORM,
    'residential': PLOT_RESIDENTIAL,
    'park': PLOT_PARK,
    'commercial': PLOT_COMMERCIAL,
    'service': PLOT_SERVICE,
    'nightlife': PLOT_NIGHTLIFE,
    'fareast': PLOT_FAREAST
};