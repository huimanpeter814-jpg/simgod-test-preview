import { Furniture } from '../types';

// ==========================================
// 🎮 像素风RPG调色板 (高饱和度、高对比度)
// ==========================================
const PALETTE = {
    // 基础环境色 (像素风常用色)
    ground_concrete: '#e0e4e8', // 干净的水泥 (加亮)
    ground_asphalt: '#2a2f3c',  // 深色柏油路 (更深)
    ground_pave: '#9ca6b4',     // 人行道铺装
    ground_grass_light: '#6cff8c', // 鲜艳草绿
    ground_grass_dark: '#28c75d',  // 深草绿
    ground_water: '#5a8fff',    // 像素湖水蓝
    ground_wood_light: '#f5d867', // 浅木地板
    ground_wood_dark: '#d4a024',  // 深木地板
    ground_tile_warm: '#f58c6d', // 暖色地砖
    ground_tile_cool: '#cff2f5', // 冷色地砖
    
    // 建筑色 (像素风格)
    build_glass: '#cff2f5',     // 玻璃幕墙
    build_brick_red: '#ff6b6b', // 红砖 (更鲜艳)
    build_brick_white: '#fff9e8', // 白墙 (偏暖)
    build_modern_dark: '#4a5568', // 现代暗色建筑
    
    // 像素风点缀色
    deco_plant: '#1eb85c',      // 植物绿
    deco_flower_rose: '#ff4757', // 玫瑰红
    deco_flower_sun: '#ffd32a', // 向日葵黄
    deco_wood_cherry: '#a83232', // 樱桃木
    deco_rug_royal: '#2a2f7c',   // 皇家蓝地毯
    deco_rug_warm: '#d94cfb',    // 暖色地毯
    deco_tech_glow: '#6cffec',   // 科技蓝光
    deco_gold: '#ffb142',        // 金色
    deco_neon_pink: '#ff7ce5',   // 霓虹粉
    deco_neon_blue: '#3dd5f7',   // 霓虹蓝
    deco_wood_red: '#8b4513',   // 红木色 (像素风棕)
    deco_rug_persian: '#c23636', // 波斯地毯红
    deco_flower_red: '#ff6b81', // 花朵红
    deco_flower_yellow: '#ffdd59', // 花朵黄
    
    // 功能色
    utility_warning: '#ff9f1a',
    utility_info: '#1a9bb3',
    
    // 像素风强调色
    accent_red: '#ff5252',
    accent_blue: '#4a7dff',
    accent_yellow: '#ffb142',
    accent_purple: '#7158e2',
    accent_green: '#1dd1a1',
    accent_dark: '#1a1e2c',
    accent_metal: '#7a8ca3',
    
    // 像素阴影色
    shadow_dark: '#1e222e',
    shadow_medium: '#353b4a',
    shadow_light: '#4a5263',
    
    // 像素高光色
    highlight_white: '#ffffff',
    highlight_light: '#f8f9fa',
    highlight_warm: '#fff9e8',
};

// 像素风光影氛围配置
export const PALETTES: any = {
    earlyMorning: { 
        zone1: '#f0f8ff', 
        zone2: '#e6f0fa', 
        zone3: '#dce8f5', 
        wall: '#7fa5b8', 
        bg: '#2a3240', 
        overlay: 'rgba(163, 203, 255, 0.25)', 
        furniture_shadow: 'rgba(40, 45, 60, 0.3)',
        pixel_glow: 'rgba(100, 150, 255, 0.1)' 
    },
    noon: { 
        zone1: '#ffffff', 
        zone2: '#f5f7fa', 
        zone3: '#ebf0f5', 
        wall: '#8a9ca6', 
        bg: '#2a3240', 
        overlay: 'rgba(255, 250, 240, 0.1)', 
        furniture_shadow: 'rgba(40, 45, 60, 0.25)',
        pixel_glow: 'rgba(255, 255, 200, 0.05)'
    },
    afternoon: { 
        zone1: '#fff8f0', 
        zone2: '#faf0e6', 
        zone3: '#f5e8dc', 
        wall: '#9ca6b4', 
        bg: '#2a3240', 
        overlay: 'rgba(255, 200, 150, 0.15)', 
        furniture_shadow: 'rgba(40, 45, 60, 0.25)',
        pixel_glow: 'rgba(255, 180, 100, 0.1)'
    },
    dusk: { 
        zone1: '#ffe8cc', 
        zone2: '#ffd89c', 
        zone3: '#ffb894', 
        wall: '#5a6572', 
        bg: '#252a36', 
        overlay: 'rgba(140, 100, 255, 0.3)', 
        furniture_shadow: 'rgba(35, 40, 50, 0.4)',
        pixel_glow: 'rgba(255, 100, 100, 0.2)'
    },
    night: { 
        zone1: '#303848', 
        zone2: '#2a3240', 
        zone3: '#242a35', 
        wall: '#1a1e2c', 
        bg: '#0a0a14', 
        overlay: 'rgba(20, 35, 70, 0.5)', 
        furniture_shadow: 'rgba(0, 0, 0, 0.6)',
        pixel_glow: 'rgba(0, 100, 255, 0.3)'
    },
    lateNight: { 
        zone1: '#2a3240', 
        zone2: '#252a36', 
        zone3: '#202530', 
        wall: '#000010', 
        bg: '#000000', 
        overlay: 'rgba(0, 0, 20, 0.7)', 
        furniture_shadow: 'rgba(0, 0, 0, 0.7)',
        pixel_glow: 'rgba(50, 0, 100, 0.4)'
    }
};

// ==========================================
// 🗺️ 房间区域定义 (像素风优化)
// ==========================================
const ROAD_W = 100;

export const ROOMS = [
    // === 🛣️ 基础设施层 ===
    { id: 'road_h_top', x: 0, y: 380, w: 2400, h: ROAD_W, label: '', color: PALETTE.ground_asphalt, pixelPattern: 'stripes' }, 
    { id: 'road_h_bot', x: 0, y: 1150, w: 2400, h: ROAD_W, label: '', color: PALETTE.ground_asphalt, pixelPattern: 'stripes' }, 
    { id: 'road_v_left', x: 500, y: 0, w: ROAD_W, h: 1800, label: '', color: PALETTE.ground_asphalt, pixelPattern: 'stripes' }, 
    { id: 'road_v_right', x: 1600, y: 0, w: ROAD_W, h: 1800, label: '', color: PALETTE.ground_asphalt, pixelPattern: 'stripes' },

    // === 🏙️ 北部：CBD ===
    { id: 'cbd_plaza_ground', x: 580, y: 20, w: 1020, h: 360, label: '', color: '#f0f5ff', pixelPattern: 'grid' },
    { id: 'office_tower_a', x: 20, y: 20, w: 460, h: 360, label: '科技大厦', color: '#d4e0f0', pixelPattern: 'windows' },
    { id: 'office_carpet_work', x: 40, y: 40, w: 400, h: 300, label: '', color: '#c4d0e4', pixelPattern: 'dots' },
    
    { id: 'office_tower_b', x: 620, y: 40, w: 450, h: 320, label: '环球金融中心', color: '#ffffff', pixelPattern: 'checker' },
    { id: 'design_studio', x: 1100, y: 40, w: 380, h: 280, label: '像素艺术工作室', color: PALETTE.build_brick_white, pixelPattern: 'brush' },
    // [扩建] 扩大北部区域宽度以容纳新澡堂
    { id: 'talent_ground_n', x: 1480, y: 20, w: 900, h: 360, label: '', color: '#f0f2f8', pixelPattern: 'simple' },
    { id: 'talent_apt_n1', x: 1500, y: 40, w: 350, h: 320, label: '人才公寓 N1', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
    { id: 'talent_apt_n2', x: 1870, y: 40, w: 350, h: 320, label: '人才公寓 N2', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
    // === 🌳 中部：中央公园 ===
    { id: 'park_base', x: 600, y: 480, w: 1000, h: 670, label: '', color: PALETTE.ground_grass_dark, pixelPattern: 'grass' },
    { id: 'park_lawn_main', x: 650, y: 530, w: 900, h: 570, label: '中央公园绿地', color: PALETTE.ground_grass_light, pixelPattern: 'grass_dense' },
    { id: 'park_lake_border', x: 840, y: 640, w: 520, h: 320, label: '', color: '#8a7cff', pixelPattern: 'wave' }, 
    { id: 'park_lake', x: 850, y: 650, w: 500, h: 300, label: '镜湖', color: PALETTE.ground_water, pixelPattern: 'water' },
    { id: 'park_pave_cross', x: 600, y: 800, w: 1000, h: 40, label: '', color: PALETTE.ground_pave, pixelPattern: 'stone' },

    // === 🏘️ 西部：居住区 ===
    { id: 'res_ground', x: 20, y: 480, w: 480, h: 1320, label: '', color: '#f0f2f8', pixelPattern: 'simple' },
    { id: 'res_block_a', x: 40, y: 500, w: 440, h: 300, label: '人才公寓 A座', color: PALETTE.build_brick_white, pixelPattern: 'brick' },
    { id: 'res_block_b', x: 40, y: 820, w: 440, h: 300, label: '幸福家园 B座', color: PALETTE.build_brick_red, pixelPattern: 'brick_red' },
    { id: 'res_block_c', x: 40, y: 1140, w: 440, h: 300, label: '青年旅社', color: '#dce4f0', pixelPattern: 'concrete' },
    { id: 'community_center', x: 40, y: 1460, w: 440, h: 320, label: '市民活动中心', color: '#8a7cff', pixelPattern: 'community' },

    // === 🛍️ 南部：商业娱乐 ===
    { id: 'commercial_pave', x: 580, y: 1250, w: 1020, h: 550, label: '', color: PALETTE.ground_pave, pixelPattern: 'pave_fancy' },
    { id: 'mall_main', x: 600, y: 1250, w: 600, h: 530, label: '大型商场', color: '#ffd93d', pixelPattern: 'mall' },
    { id: 'entertainment_complex', x: 1230, y: 1250, w: 370, h: 530, label: 'IMAX 影城', color: '#252a36', pixelPattern: 'cinema' },

    // === 🏥 东部：公共服务 ===
    { id: 'public_ground', x: 1680, y: 480, w: 720, h: 1320, label: '', color: '#fff9e8', pixelPattern: 'public' },
    { id: 'hospital_main', x: 1700, y: 500, w: 680, h: 320, label: '餐厅', color: '#7ce8ff', pixelPattern: 'hospital' },
    { id: 'library_complex', x: 1700, y: 850, w: 680, h: 350, label: '市图书馆', color: '#ffffff', pixelPattern: 'library' },
    { id: 'gym_complex', x: 2000, y: 1250, w: 380, h: 530, label: '健身房', color: '#a8b4c8', pixelPattern: 'gym' },
    { id: 'arcade_zone', x: 1680, y: 1250, w: 300, h: 250, label: '赛博电玩城', color: '#5a6572', pixelPattern: 'arcade' },
    { id: 'night_club', x: 1680, y: 1520, w: 300, h: 260, label: '霓虹夜店', color: '#162056', pixelPattern: 'neon' },
    { id: 'netcafe_ground', x: 2450, y: 1250, w: 400, h: 530, label: '星际网咖', color: '#1e272e', pixelPattern: 'simple' },
    { id: 'art_gallery_ground', x: 2450, y: 50, w: 400, h: 500, label: '美术馆', color: '#f7f1e3', pixelPattern: 'simple' },

];

// ==========================================
// 🛠️ 辅助生成函数 (添加像素风细节)
// ==========================================
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

// 像素风细节函数
const addPixelDetail = (baseProps: any, detailType: string = 'shadow') => {
    const props = { ...baseProps };
    switch(detailType) {
        case 'shadow':
            props.pixelShadow = true;
            props.shadowColor = PALETTE.shadow_dark;
            break;
        case 'highlight':
            props.pixelHighlight = true;
            props.highlightColor = PALETTE.highlight_light;
            break;
        case 'outline':
            props.pixelOutline = true;
            props.outlineColor = PALETTE.accent_dark;
            break;
        case 'glow':
            props.pixelGlow = true;
            props.glowColor = PALETTE.deco_neon_blue;
            break;
    }
    return props;
};

// ==========================================
// 🪑 像素风RPG家具与装饰
// ==========================================
export const FURNITURE: Furniture[] = [
    // -----------------------------------------------------
    // 🌳 城市街道设施 - 像素风优化
    // -----------------------------------------------------
    // 像素风梧桐行道树
    ...createRow('tree_rd_top', 620, 460, 10, 100, 0, { 
        w: 42, h: 42, 
        color: '#253048', 
        label: '梧桐树', 
        utility: 'none', 
        dir: 'down', 
        multiUser: false,
        pixelPattern: 'tree_pixel',
        pixelOutline: true
    }),
    ...createRow('tree_rd_bot', 620, 1100, 10, 100, 0, { 
        w: 42, h: 42, 
        color: '#253048', 
        label: '梧桐树', 
        utility: 'none', 
        dir: 'up', 
        multiUser: false,
        pixelPattern: 'tree_pixel',
        pixelOutline: true
    }),
    
    // 像素风路灯
    ...createRow('light_v_l', 580, 520, 7, 0, 100, { 
        w: 12, h: 12, 
        color: '#ffd93d', 
        label: '路灯', 
        utility: 'none', 
        dir: 'left', 
        multiUser: false,
        pixelGlow: true,
        glowColor: '#fff9a8'
    }),
    ...createRow('light_v_r', 1610, 520, 7, 0, 100, { 
        w: 12, h: 12, 
        color: '#ffd93d', 
        label: '路灯', 
        utility: 'none', 
        dir: 'right', 
        multiUser: false,
        pixelGlow: true,
        glowColor: '#fff9a8'
    }),

    // 斑马线 (像素风格)
    ...createRow('zebra_cross_1', 500, 380, 8, 0, 12, { 
        w: 84, h: 6, 
        color: '#f8f9fa', 
        label: '', 
        utility: 'none',
        pixelPattern: 'zebra'
    }),
    ...createRow('zebra_cross_2', 1200, 1160, 8, 0, 12, { 
        w: 84, h: 6, 
        color: '#f8f9fa', 
        label: '', 
        utility: 'none',
        pixelPattern: 'zebra'
    }),

    // 街道杂物 (像素风)
    { id: 'hydrant_1', x: 590, y: 340, w: 18, h: 18, color: '#ff5252', label: '消防栓', utility: 'none', pixelOutline: true },
    { id: 'trash_can_1', x: 590, y: 300, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
    { id: 'trash_can_2', x: 1150, y: 330, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
    { id: 'manhole_1', x: 600, y: 440, w: 24, h: 24, color: '#5a6572', label: '窨井盖', utility: 'none', pixelPattern: 'manhole' },

    // 像素风自动贩卖机
    { id: 'vending_h1', x: 400, y: 460, w: 44, h: 34, color: '#ff5252', label: '可乐贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'vending_h2', x: 450, y: 460, w: 44, h: 34, color: '#4a7dff', label: '矿泉水贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'vending_h3', x: 1100, y: 330, w: 44, h: 34, color: '#ff9f1a', label: '零食贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    

    // -----------------------------------------------------
    // 🏢 北部 CBD - 像素科技风
    // -----------------------------------------------------
    // Tech Tower - 像素办公桌
    // [优化] 增加一列工位，确保员工有地方坐
    ...createGrid('tech_desk', 50, 50, 7, 4, 60, 65, { 
        w: 48, h: 32, 
        color: '#2c3e50', 
        label: '升降办公桌', 
        utility: 'none', 
        dir: 'down',
        pixelPattern: 'desk_pixel'
    }),
    ...createGrid('monitor_l', 60, 50, 7, 4, 60, 65, { 
        w: 16, h: 6, 
        color: PALETTE.deco_tech_glow, 
        label: '', 
        utility: 'none',
        pixelGlow: true
    }),
    ...createGrid('monitor_r', 70, 50, 7, 4, 60, 65, { 
        w: 16, h: 6, 
        color: PALETTE.deco_tech_glow, 
        label: '', 
        utility: 'none',
        pixelGlow: true
    }),
    ...createGrid('tech_chair', 65, 70, 7, 4, 60, 65, { 
        w: 22, h: 22, 
        color: '#8a9ca6', 
        label: '码农工位', 
        utility: 'work', 
        pixelPattern: 'chair_pixel'
    }),
    
    // 像素服务器组
    ...createRow('server_rack', 50, 300, 3, 75, 0, { 
        w: 64, h: 38, 
        color: '#253048', 
        label: '服务器组', 
        utility: 'none', 
        dir: 'left',
        pixelPattern: 'server',
        pixelGlow: true,
        glowColor: '#00ffaa'
    }),
    { id: 'boss_chair', x: 300, y: 300, w: 44, h: 44, color: '#253048', label: '老板椅', utility: 'work', pixelPattern: 'chair_boss' },

    { id: 'server_console', x: 350, y: 310, w: 34, h: 24, color: '#a8b4c8', label: '控制台', utility: 'work', pixelPattern: 'console' },
    
    // 像素休闲区
    { id: 'water_cooler', x: 410, y: 300, w: 24, h: 24, color: '#00d2d3', label: '饮水机', utility: 'drink', pixelPattern: 'water_cooler' },
    { id: 'coffee_maker', x: 440, y: 300, w: 24, h: 24, color: '#ff6b6b', label: '意式咖啡机', utility: 'drink', pixelPattern: 'coffee_machine' },
    { id: 'office_sofa_l', x: 390, y: 330, w: 84, h: 34, color: '#6c7a8a', label: '休息沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
    { id: 'office_plant_1', x: 30, y: 350, w: 18, h: 18, color: PALETTE.deco_plant, label: '龟背竹', utility: 'none', pixelPattern: 'plant_pixel' },

    // Finance Center - 像素会议区
    { id: 'conf_rug', x: 650, y: 65, w: 290, h: 180, color: '#a8b4c8', label: '地毯', utility: 'none', pixelPattern: 'rug_fancy' },
    { id: 'conf_table', x: 720, y: 110, w: 168, h: 84, color: '#f0f5ff', label: '大理石会议桌', utility: 'work_group', dir: 'down', multiUser: true, pixelPattern: 'table_marble' },
    { id: 'conf_projector', x: 680, y: 120, w: 12, h: 64, color: '#253048', label: '投影仪', utility: 'none', pixelPattern: 'tech' },
    ...createRow('conf_chair_t', 730, 80, 4, 44, 0, { w: 22, h: 22, color: '#253048', label: '商务工位', utility: 'work', pixelPattern: 'chair_leather' }),
    ...createRow('conf_chair_b', 730, 200, 4, 44, 0, { w: 22, h: 22, color: '#253048', label: '商务工位', utility: 'work', pixelPattern: 'chair_leather' }),
    
    // 像素总裁办公室
    { id: 'boss_area_rug', x: 830, y: 245, w: 230, h: 108, color: PALETTE.deco_rug_persian, label: '波斯地毯', utility: 'none', pixelPattern: 'rug_persian' },
    { id: 'boss_desk', x: 880, y: 250, w: 126, h: 54, color: PALETTE.deco_wood_red, label: '红木班台', utility: 'none', pixelPattern: 'desk_wood' },
    { id: 'boss_pc', x: 900, y: 270, w: 44, h: 12, color: '#1a1e2c', label: '一体机', utility: 'none', pixelPattern: 'pc_pixel' },
    { id: 'boss_chair', x: 900, y: 300, w: 44, h: 44, color: '#253048', label: '老板椅', utility: 'work', pixelPattern: 'chair_boss' },
    { id: 'boss_bookshelf', x: 1020, y: 250, w: 24, h: 80, color: PALETTE.deco_wood_red, label: '藏书架', utility: 'none', pixelPattern: 'bookshelf' },
    { id: 'boss_safe', x: 840, y: 310, w: 34, h: 34, color: '#5a6572', label: '保险柜', utility: 'none', pixelPattern: 'safe' },
    
    // Pixel Studio - 像素艺术区
    { id: 'messy_rug', x: 1350, y: 80, w: 108, h: 108, color: '#ff9c8a', label: '艺术地毯', utility: 'none', pixelPattern: 'rug_art' },
    ...createGrid('art_easel', 1120, 80, 3, 3, 90, 80, { 
        w: 44, h: 54, 
        color: PALETTE.accent_red, 
        label: '画架', 
        utility: 'paint',
        pixelPattern: 'easel'
    }),
    { id: 'plaster_statue', x: 1410, y: 80, w: 34, h: 34, color: '#ffffff', label: '石膏像', utility: 'none', pixelPattern: 'statue' },
    { id: 'paint_buckets', x: 1270, y: 170, w: 24, h: 24, color: '#ff6b81', label: '颜料桶', utility: 'none', pixelPattern: 'paint' },
    { id: 'coffee_corner', x: 1400, y: 250, w: 44, h: 44, color: '#ff5252', label: '咖啡角', utility: 'drink', pixelPattern: 'coffee_corner' },
    { id: 'bean_bag_1', x: 1350, y: 100, w: 44, h: 44, color: '#ff7aa8', label: '懒人沙发', utility: 'comfort', pixelPattern: 'beanbag' },
    { id: 'bean_bag_2', x: 1390, y: 120, w: 44, h: 44, color: '#8a7cff', label: '懒人沙发', utility: 'comfort', pixelPattern: 'beanbag' },

    // -----------------------------------------------------
    // 🏠 人才公寓 (北) - 改造自原豪华公寓
    // -----------------------------------------------------
    // N1 Block (原 Apt 1)
    ...createGrid('dorm_bed_n1', 1520, 80, 3, 2, 120, 120, { 
        w: 54, h: 84, 
        color: '#ffb142', 
        label: '上下铺', 
        utility: 'energy',
        pixelPattern: 'bed_bunk'
    }),
    ...createGrid('dorm_desk_n1', 1590, 80, 2, 2, 120, 120, { 
        w: 34, h: 34, 
        color: '#a8b4c8', 
        label: '书桌', 
        utility: 'work',
        pixelPattern: 'desk_simple'
    }),
    
    // N2 Block (原 Apt 2)
    ...createGrid('dorm_bed_n2', 1890, 80, 3, 2, 120, 120, { 
        w: 54, h: 84, 
        color: '#1dd1a1', 
        label: '上下铺', 
        utility: 'energy',
        pixelPattern: 'bed_bunk'
    }),
    ...createGrid('dorm_desk_n2', 1960, 80, 2, 2, 120, 120, { 
        w: 34, h: 34, 
        color: '#a8b4c8', 
        label: '书桌', 
        utility: 'work',
        pixelPattern: 'desk_simple'
    }),

    { id: 'ne_bath_wall', x: 2240, y: 40, w: 100, h: 340, color: '#dce4f0', label: '公共大澡堂', utility: 'none', pixelPattern: 'simple' },
    ...createRow('ne_toilet', 2250, 50, 6, 0, 50, { 
        w: 34, h: 34, 
        color: '#5a8fff', 
        label: '公厕', 
        utility: 'bladder',
        pixelPattern: 'toilet'
    }),
    ...createRow('ne_shower', 2300, 50, 6, 0, 50, { 
        w: 34, h: 44, 
        color: '#81ecec', 
        label: '淋浴', 
        utility: 'hygiene',
        pixelPattern: 'shower_stall'
    }),
    
    
    // -----------------------------------------------------
    // 🌳 中央公园 - 像素自然风
    // -----------------------------------------------------
    { id: 'park_fountain_base', x: 1040, y: 750, w: 126, h: 126, color: '#a8b4c8', label: '喷泉池', utility: 'none', pixelPattern: 'fountain_base' },
    { id: 'park_fountain_water', x: 1060, y: 770, w: 84, h: 84, color: '#5a8fff', label: '喷泉水景', utility: 'none', pixelPattern: 'water_anim' },
    
    ...createGrid('flower_bed_red', 680, 560, 2, 2, 80, 80, { 
        w: 44, h: 44, 
        color: PALETTE.deco_flower_red, 
        label: '玫瑰花坛', 
        utility: 'gardening',
        pixelPattern: 'flower_rose'
    }),
    ...createGrid('flower_bed_yel', 1400, 560, 2, 2, 80, 80, { 
        w: 44, h: 44, 
        color: PALETTE.deco_flower_yellow, 
        label: '郁金香花坛', 
        utility: 'gardening',
        pixelPattern: 'flower_tulip'
    }),

    { id: 'duck_boat_1', x: 900, y: 700, w: 44, h: 34, color: '#ffdd59', label: '小黄鸭船', utility: 'play', pixelPattern: 'boat_duck' },
    { id: 'duck_boat_2', x: 1200, y: 750, w: 44, h: 34, color: '#ffdd59', label: '小黄鸭船', utility: 'play', pixelPattern: 'boat_duck' },
    { id: 'wooden_pier', x: 1050, y: 890, w: 108, h: 64, color: '#d4bcaa', label: '亲水平台', utility: 'play', pixelPattern: 'pier_wood' },
    
    ...createRow('park_bench_t', 850, 580, 5, 110, 0, { 
        w: 54, h: 24, 
        color: '#e17055', 
        label: '公园长椅', 
        utility: 'comfort',
        pixelPattern: 'bench_park'
    }),

    ...createRow('fishing_spot', 870, 930, 4, 40, 0, { 
        w: 24, h: 24, 
        color: '#74b9ff', 
        label: '钓鱼位', 
        utility: 'fishing', 
        dir: 'down',
        pixelPattern: 'fishing_rod' // 需确保 assets 或绘制逻辑支持，或者用 generic
    }),

    ...createRow('fishing_spot', 1190, 930, 4, 40, 0, { 
        w: 24, h: 24, 
        color: '#74b9ff', 
        label: '钓鱼位', 
        utility: 'fishing', 
        dir: 'down',
        pixelPattern: 'fishing_rod' // 需确保 assets 或绘制逻辑支持，或者用 generic
    }),
    
    { id: 'picnic_mat_a', x: 700, y: 900, w: 108, h: 84, color: '#ff6b81', label: '野餐垫', utility: 'hunger', pixelPattern: 'picnic_mat' },
    { id: 'picnic_basket', x: 720, y: 920, w: 34, h: 24, color: '#d4bcaa', label: '野餐篮', utility: 'hunger', pixelPattern: 'basket' },
    { id: 'picnic_mat_b', x: 820, y: 1000, w: 108, h: 84, color: '#5a8fff', label: '野餐垫', utility: 'hunger', pixelPattern: 'picnic_mat' },
    
    { id: 'food_cart_1', x: 980, y: 980, w: 64, h: 44, color: '#d35400', label: '热狗餐车', utility: 'buy_food', pixelPattern: 'food_cart' },
    { id: 'food_cart_umbrella', x: 1100, y: 980, w: 44, h: 44, color: '#ff9c8a', label: '遮阳伞', utility: 'none', pixelPattern: 'umbrella' },
    { id: 'icecream_cart', x: 1150, y: 980, w: 64, h: 44, color: '#ffd166', label: '冰淇淋车', utility: 'buy_food', pixelPattern: 'icecream_cart' },
    
    { id: 'park_restroom_struct', x: 1350, y: 1020, w: 180, h: 60, color: '#b2bec3', label: '公园公厕', utility: 'none', pixelPattern: 'simple' },
    ...createRow('park_toilet', 1365, 1030, 4, 40, 0, { 
        w: 30, h: 30, 
        color: '#5a8fff', 
        label: '公厕', 
        utility: 'bladder',
        pixelPattern: 'toilet'
    }),
    ...createGrid('forest_dense', 1380, 850, 4, 3, 40, 40, { 
        w: 34, h: 34, 
        color: '#00b894', 
        label: '灌木丛', 
        utility: 'gardening',
        pixelPattern: 'bush'
    }),

    // -----------------------------------------------------
    // 🏘️ 居住区 - 像素生活风
    // -----------------------------------------------------
    // Block A
    ...createGrid('dorm_bed', 60, 520, 3, 3, 100, 90, { 
        w: 54, h: 84, 
        color: '#4a7dff', 
        label: '上下铺', 
        utility: 'energy',
        pixelPattern: 'bed_bunk'
    }),
    ...createGrid('dorm_desk', 120, 520, 2, 3, 100, 90, { 
        w: 34, h: 34, 
        color: '#a8b4c8', 
        label: '书桌', 
        utility: 'work',
        pixelPattern: 'desk_simple'
    }),
    { id: 'dorm_toilet_block', x: 400, y: 520, w: 64, h: 258, color: '#ffffff', label: '公共卫浴', utility: 'hygiene', pixelPattern: 'toilet_block' },
    ...createRow('dorm_toilet', 410, 530, 4, 0, 60, { 
        w: 34, h: 34, 
        color: '#5a8fff', 
        label: '马桶', 
        utility: 'bladder',
        pixelPattern: 'toilet'
    }),
    ...createRow('dorm_shower', 350, 550, 4, 0, 50, {
        w: 34, h: 44,
        color: '#81ecec',
        label: '公共淋浴',
        utility: 'hygiene',
        pixelPattern: 'shower_stall'
    }),
    
    // Block B
    ...createGrid('apt_kitchen', 60, 840, 2, 2, 200, 140, { 
        w: 108, h: 34, 
        color: '#5a6572', 
        label: '整体厨房', 
        utility: 'cook',
        pixelPattern: 'kitchen'
    }),
    ...createGrid('apt_fridge', 160, 840, 2, 2, 200, 140, { 
        w: 34, h: 34, 
        color: '#ffffff', 
        label: '冰箱', 
        utility: 'hunger',
        pixelPattern: 'fridge'
    }),
    ...createGrid('apt_table', 80, 890, 2, 2, 200, 140, { 
        w: 64, h: 64, 
        color: '#ffd166', 
        label: '餐桌', 
        utility: 'hunger',
        pixelPattern: 'table_kitchen'
    }),
    
    // Youth Apt
    ...createGrid('lazy_sofa', 60, 1200, 4, 3, 90, 80, { 
        w: 54, h: 44, 
        color: '#7158e2', 
        label: '懒人沙发', 
        utility: 'comfort',
        pixelPattern: 'sofa_lazy'
    }),
    { id: 'pizza_box', x: 80, y: 1210, w: 24, h: 24, color: '#ff9c8a', label: '披萨盒', utility: 'hunger', pixelPattern: 'pizza_box' },
    { id: 'gaming_tv_wall', x: 250, y: 1150, w: 158, h: 12, color: '#1a1e2c', label: '电视墙', utility: 'play', pixelPattern: 'tv_wall' },
    { id: 'console_ps5', x: 260, y: 1170, w: 34, h: 24, color: '#ffffff', label: '游戏主机', utility: 'play', pixelPattern: 'console_game' },
    
    // Community Center
    ...createGrid('mahjong', 80, 1500, 3, 2, 110, 100, { 
        w: 74, h: 74, 
        color: '#27ae60', 
        label: '自动麻将机', 
        utility: 'play', 
        multiUser: true,
        pixelPattern: 'mahjong_table'
    }),
    { id: 'pingpong', x: 350, y: 1700, w: 94, h: 54, color: '#4a7dff', label: '乒乓球桌', utility: 'play', pixelPattern: 'pingpong_table' },
    { id: 'community_notice', x: 350, y: 1480, w: 64, h: 12, color: '#8a7cff', label: '公告栏', utility: 'none', pixelPattern: 'notice_board' },

    // -----------------------------------------------------
    // 🛍️ 商业街 - 像素购物风
    // -----------------------------------------------------
    // Mall
    ...createGrid('cosmetic_cnt', 620, 1300, 4, 2, 80, 60, { 
        w: 54, h: 34, 
        color: '#ff7aa8', 
        label: '美妆柜台', 
        utility: 'buy_item',
        pixelPattern: 'counter_cosmetic'
    }),
    ...createGrid('cosmetic_mirror', 635, 1310, 4, 2, 80, 60, { 
        w: 24, h: 6, 
        color: '#5a8fff', 
        label: '试妆镜', 
        utility: 'none',
        pixelPattern: 'mirror'
    }),
    
    ...createGrid('clothes_rack', 1000, 1270, 3, 3, 70, 80, { 
        w: 12, h: 64, 
        color: '#e17055', 
        label: '当季新款', 
        utility: 'buy_item',
        pixelPattern: 'clothes_rack'
    }),
    { id: 'mannequin_1', x: 950, y: 1280, w: 24, h: 24, color: '#ffdd59', label: '模特', utility: 'none', pixelPattern: 'mannequin' },
    { id: 'mannequin_2', x: 950, y: 1350, w: 24, h: 24, color: '#ffdd59', label: '模特', utility: 'none', pixelPattern: 'mannequin' },
    { id: 'fitting_room', x: 1100, y: 1550, w: 44, h: 108, color: '#a8b4c8', label: '试衣间', utility: 'none', pixelPattern: 'fitting_room' },

    // [优化] 服务台改为多人使用，防止员工没地方站
    { id: 'cashier_mall_1', x: 800, y: 1500, w: 60, h: 44, color: '#2c3e50', label: '服务台', utility: 'work', multiUser: true, pixelPattern: 'cashier' },
    { id: 'cashier_mall_2', x: 880, y: 1500, w: 60, h: 44, color: '#2c3e50', label: '服务台', utility: 'work', multiUser: true, pixelPattern: 'cashier' },

    ...createGrid('market_shelf_food', 620, 1600, 5, 1, 80, 40, { 
        w: 64, h: 28, 
        color: '#ffdd59', 
        label: '零食货架', 
        utility: 'buy_item',
        pixelPattern: 'shelf_food'
    }),
    ...createGrid('market_shelf_veg', 620, 1660, 5, 1, 80, 40, { 
        w: 64, h: 28, 
        color: '#55efc4', 
        label: '蔬菜货架', 
        utility: 'buy_item',
        pixelPattern: 'shelf_veg'
    }),
    ...createGrid('market_shelf_meat', 620, 1720, 5, 1, 80, 40, { 
        w: 64, h: 28, 
        color: '#ff6b81', 
        label: '生鲜货架', 
        utility: 'buy_item',
        pixelPattern: 'shelf_meat'
    }),
    ...createRow('park_toilet', 1100, 1730, 2, 40, 0, { 
        w: 30, h: 30, 
        color: '#5a8fff', 
        label: '公厕', 
        utility: 'bladder',
        pixelPattern: 'toilet'
    }),

    // Cinema - 像素影院风
    // [优化] 影院服务台允许多人工作
    { id: 'ticket_booth_work', x: 1350, y: 1280, w: 44, h: 44, color: '#ff5252', label: '影院服务台', utility: 'work', multiUser: true, pixelPattern: 'ticket_booth' },
    { id: 'ticket_booth', x: 1250, y: 1280, w: 84, h: 44, color: '#ff5252', label: '售票处', utility: 'work', pixelPattern: 'ticket_booth' },
    { id: 'popcorn_machine', x: 1500, y: 1280, w: 44, h: 44, color: '#ffd32a', label: '爆米花机', utility: 'buy_food', pixelPattern: 'popcorn_machine' },
    { id: 'claw_machine_1', x: 1450, y: 1280, w: 44, h: 44, color: '#ff7aa8', label: '抓娃娃机', utility: 'play', pixelPattern: 'claw_machine' },
    
    { id: 'screen_imax', x: 1260, y: 1350, w: 316, h: 12, color: '#ffffff', label: 'IMAX 巨幕', utility: 'none', pixelPattern: 'screen_cinema' },
    ...createGrid('seat_imax_vip', 1280, 1400, 6, 2, 45, 50, { 
        w: 38, h: 38, 
        color: '#ff5252', 
        label: 'VIP沙发', 
        utility: 'cinema_3d',
        pixelPattern: 'seat_vip'
    }),
    ...createGrid('seat_imax_reg', 1280, 1550, 6, 4, 45, 40, { 
        w: 34, h: 34, 
        color: '#c0392b', 
        label: '普通座', 
        utility: 'cinema_3d',
        pixelPattern: 'seat_reg'
    }),
    ...createRow('park_toilet', 1280, 1730, 4, 40, 0, { 
        w: 30, h: 30, 
        color: '#5a8fff', 
        label: '公厕', 
        utility: 'bladder',
        pixelPattern: 'toilet'
    }),

    // -----------------------------------------------------
    // 🏥 公共服务区 - 像素功能风
    // -----------------------------------------------------
    //餐厅
    // 前台/接待 (服务员工作位) - [优化] 允许多人
    { id: 'rest_reception', x: 1820, y: 520, w: 126, h: 44, color: '#e17055', label: '餐厅前台', utility: 'work', multiUser: true, pixelPattern: 'reception' },
    
    // 雅座 (顾客用餐 + 服务员工作覆盖区)
    ...createGrid('rest_table_2', 1720, 600, 3, 2, 120, 100, { 
        w: 84, h: 64, 
        color: '#fab1a0', 
        label: '豪华雅座', 
        utility: 'eat_out', // 外出就餐交互
        pixelPattern: 'table_dining',
        cost: 60 // 吃饭要花钱
    }),

    // 后厨区域 (厨师工作位)
    ...createGrid('kitchen_counter_1', 2100, 520, 1, 4, 0, 70, { 
        w: 34, h: 54, 
        color: '#b2bec3', 
        label: '后厨备菜台', 
        utility: 'work', 
        pixelPattern: 'kitchen_counter'
    }),

    ...createGrid('kitchen_stove', 2200, 520, 2, 4, 80, 70, { 
        w: 44, h: 64, 
        color: '#d63031', 
        label: '后厨灶台', 
        utility: 'work', 
        pixelPattern: 'stove'
    }),

    // Library
    ...createGrid('book_row_hist', 1720, 900, 8, 1, 60, 0, { 
        w: 44, h: 108, 
        color: '#e67e22', 
        label: '历史类书架', 
        utility: 'buy_book',
        pixelPattern: 'bookshelf_hist'
    }),
    ...createGrid('book_row_sci', 1720, 1050, 8, 1, 60, 0, { 
        w: 44, h: 108, 
        color: '#4a7dff', 
        label: '科技类书架', 
        utility: 'buy_book',
        pixelPattern: 'bookshelf_sci'
    }),
    ...createGrid('read_desk', 2300, 880, 1, 4, 0, 80, { 
        w: 40, h: 60, 
        color: '#d35400', 
        label: '自习长桌', 
        utility: 'work',
        pixelPattern: 'desk_library'
    }),
    { id: 'librarian_desk', x: 2200, y: 1000, w: 64, h: 44, color: '#5a6572', label: '管理员', utility: 'work', pixelPattern: 'desk_librarian' },

    // -----------------------------------------------------
    // 🏋️‍♀️ 健身与夜生活 - 像素动感风
    // -----------------------------------------------------
    // Gym
    ...createRow('treadmill', 2020, 1300, 5, 60, 0, { 
        w: 44, h: 84, 
        color: '#2c3e50', 
        label: '跑步机', 
        utility: 'run', 
        dir: 'up',
        pixelPattern: 'treadmill'
    }),
    { id: 'yoga_area', x: 2020, y: 1430, w: 208, h: 84, color: '#ff9c8a', label: '瑜伽区', utility: 'stretch', pixelPattern: 'yoga_mat' },
    ...createGrid('weights', 2050, 1550, 3, 2, 60, 60, { 
        w: 44, h: 44, 
        color: '#5a6572', 
        label: '哑铃架', 
        utility: 'lift',
        pixelPattern: 'weights_rack'
    }),
    { id: 'water_station_gym', x: 2300, y: 1400, w: 34, h: 34, color: '#5a8fff', label: '直饮水', utility: 'drink', pixelPattern: 'water_station' },
    
    ...createGrid('gym_shower', 2280, 1500, 2, 4, 50,70, { 
        w: 34, h: 44, 
        color: '#81ecec', 
        label: '淋浴间', 
        utility: 'hygiene', // 新增交互类型
        dir: 'left',
        pixelPattern: 'shower_stall'
    }),
    
    // Arcade
    ...createGrid('arcade_racing', 1700, 1270, 4, 1, 60, 0, { 
        w: 54, h: 74, 
        color: '#8a7cff', 
        label: '赛车模拟', 
        utility: 'play',
        pixelPattern: 'arcade_racing',
        pixelGlow: true
    }),
    ...createGrid('arcade_fight', 1700, 1360, 4, 2, 50, 60, { 
        w: 44, h: 54, 
        color: '#e84393', 
        label: '格斗机台', 
        utility: 'play',
        pixelPattern: 'arcade_fight',
        pixelGlow: true
    }),
    { id: 'dance_machine', x: 1900, y: 1400, w: 64, h: 64, color: '#ff7aa8', label: '跳舞机', utility: 'dance', pixelPattern: 'dance_machine', pixelGlow: true },

    // Night Club - 像素霓虹风
    { id: 'bar_counter_long', x: 1690, y: 1530, w: 34, h: 208, color: '#e84393', label: '发光吧台', utility: 'buy_drink', pixelPattern: 'bar_counter', pixelGlow: true },
    ...createRow('bar_stool', 1725, 1540, 6, 0, 34, { 
        w: 24, h: 24, 
        color: '#ffffff', 
        label: '高脚凳', 
        utility: 'sit',
        pixelPattern: 'stool_bar'
    }),
    { id: 'dj_stage', x: 1820, y: 1520, w: 126, h: 54, color: '#7158e2', label: 'DJ台', utility: 'music', pixelPattern: 'dj_stage', pixelGlow: true },
    { id: 'dance_floor', x: 1800, y: 1600, w: 158, h: 108, color: '#2c3e50', label: '舞池', utility: 'dance', pixelPattern: 'dance_floor', pixelGlow: true },
    { id: 'speaker_l', x: 1780, y: 1520, w: 44, h: 64, color: '#1a1e2c', label: '低音炮', utility: 'none', pixelPattern: 'speaker' },
    { id: 'speaker_r', x: 1930, y: 1520, w: 44, h: 64, color: '#1a1e2c', label: '低音炮', utility: 'none', pixelPattern: 'speaker' },
    { id: 'vip_sofa', x: 1835, y: 1720, w: 84, h: 44, color: '#ff5252', label: '卡座', utility: 'comfort', pixelPattern: 'sofa_vip' },

    // -----------------------------------------------------
    // 🎮 星际网咖 (Internet Cafe) - 新增区域
    // -----------------------------------------------------
    // 1. 建筑外观与装饰
    { id: 'netcafe_sign', x: 2500, y: 1230, w: 300, h: 20, color: '#00d2d3', label: 'INTERNET CAFE', utility: 'none', pixelPattern: 'neon' },
    { id: 'netcafe_carpet', x: 2470, y: 1350, w: 360, h: 400, color: '#2f3542', label: '吸音地毯', utility: 'none', pixelPattern: 'rug_fancy' },
    
    // 2. 网管前台
    { id: 'netcafe_counter', x: 2550, y: 1280, w: 120, h: 44, color: '#57606f', label: '网管前台', utility: 'work', multiUser: true, pixelPattern: 'reception' },
    { id: 'netcafe_server', x: 2680, y: 1270, w: 44, h: 54, color: '#2ed573', label: '服务器', utility: 'none', pixelPattern: 'server', pixelGlow: true },
    
    // 3. 大厅普通区 (高性能电脑 - 这里的 label 包含 "电脑"，可以被 side hustle 逻辑找到)
    ...createGrid('netcafe_pc_std', 2480, 1400, 4, 4, 60, 80, { 
        w: 44, h: 34, 
        color: '#3742fa', 
        label: '网吧电脑',  // [关键] 包含"电脑"二字
        utility: 'work',    // [关键] 允许进行工作/赚外快交互
        cost: 5,           // [关键] 上机费 $5
        pixelPattern: 'pc_pixel',
        pixelGlow: true,
        glowColor: '#3742fa'
    }),
    ...createGrid('netcafe_chair_std', 2490, 1435, 4, 4, 60, 80, { 
        w: 24, h: 24, 
        color: '#747d8c', 
        label: '电竞椅', 
        utility: 'none',
        pixelPattern: 'chair_pixel'
    }),

    // 4. VIP 包厢区 (更贵的配置)
    ...createGrid('netcafe_pc_vip', 2740, 1400, 1, 4, 70, 90, { 
        w: 54, h: 34, 
        color: '#ff4757', 
        label: '顶配电脑', // [关键] 包含"电脑"
        utility: 'work', 
        cost: 25,         // VIP 上机费 $25
        pixelPattern: 'pc_pixel',
        pixelGlow: true,
        glowColor: '#ff4757'
    }),
    ...createGrid('netcafe_sofa_vip', 2745, 1435, 1, 4, 70, 90, { 
        w: 44, h: 34, 
        color: '#2f3542', 
        label: '真皮沙发', 
        utility: 'comfort', // 累了可以直接睡
        pixelPattern: 'sofa_pixel'
    }),

    // 5. 补给站
    { id: 'vending_netcafe', x: 2460, y: 1300, w: 44, h: 34, color: '#ffa502', label: '能量饮料', utility: 'buy_drink', pixelPattern: 'vending' },
    { id: 'toilet_netcafe_m', x: 2800, y: 1300, w: 34, h: 34, color: '#5a8fff', label: '公厕', utility: 'bladder', pixelPattern: 'toilet' },

    // -----------------------------------------------------
    // 🎨 MOMA 美术馆 (Art Gallery)
    // -----------------------------------------------------
    { id: 'gallery_sign', x: 2500, y: 30, w: 300, h: 20, color: '#2f3542', label: 'MODERN ART', utility: 'none', pixelPattern: 'simple' },
    
    // 1. 接待大厅
    { id: 'gallery_desk', x: 2550, y: 400, w: 80, h: 40, color: '#dfe4ea', label: '导览台', utility: 'work', pixelPattern: 'reception' },
    
    // 2. 雕塑展区 (中央)
    { id: 'statue_venus', x: 2630, y: 200, w: 40, h: 60, color: '#ffffff', label: '维纳斯像', utility: 'art', pixelPattern: 'statue', pixelShadow: true },
    { id: 'statue_thinker', x: 2530, y: 200, w: 40, h: 60, color: '#ffffff', label: '沉思者', utility: 'art', pixelPattern: 'statue', pixelShadow: true },

    // 3. 墙面画廊 (四周)
    ...createRow('painting_wall_top', 2460, 60, 5, 80, 0, { 
        w: 50, h: 60, 
        color: '#ff6b6b', 
        label: '抽象画作', 
        utility: 'art', 
        pixelPattern: 'painting'
    }),
    
    ...createGrid('painting_wall_left', 2460, 150, 1, 3, 0, 80, { 
        w: 50, h: 60, 
        color: '#54a0ff', 
        label: '风景画', 
        utility: 'art', 
        pixelPattern: 'painting'
    }),
    
    ...createGrid('painting_wall_right', 2780, 150, 1, 3, 0, 80, { 
        w: 50, h: 60, 
        color: '#feca57', 
        label: '肖像画', 
        utility: 'art', 
        pixelPattern: 'painting'
    }),

    // 4. 珍宝展区 (展示柜)
    { id: 'display_diamond', x: 2600, y: 300, w: 40, h: 40, color: '#00d2d3', label: '希望蓝钻', utility: 'art', pixelPattern: 'display_case', pixelGlow: true },
    { id: 'display_gold', x: 2700, y: 300, w: 40, h: 40, color: '#ff9f43', label: '黄金面具', utility: 'art', pixelPattern: 'display_case', pixelGlow: true },

    // 5. 休息长椅
    { id: 'gallery_bench_1', x: 2600, y: 480, w: 100, h: 20, color: '#a4b0be', label: '观展长椅', utility: 'comfort', pixelPattern: 'bench_park' },

];