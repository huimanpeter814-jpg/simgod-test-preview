import { PlotTemplate, Furniture } from '../types';

// 🎨 室内设计配色方案
const PALETTE = {
    // 材质色
    wood_warm: '#d4a373',
    wood_dark: '#8b4513',
    floor_stone: '#dcdde1',
    floor_carpet: '#f5f6fa',
    
    // 装饰色
    plant_green: '#2ecc71',
    accent_blue: '#74b9ff',
    accent_pink: '#ff7675',
    accent_yellow: '#ffeaa7',
    
    // 科技感
    tech_blue: '#0984e3',
    tech_glow: '#81ecec',
};

// 辅助工具：快速生成行列，但这次我们会更灵活地使用
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
// 1. 人才公寓 (Dorm) - "胶囊生活"
// 设计理念：高密度但有序，公共区域居中
// ==========================================
const PLOT_DORM: PlotTemplate = {
    id: 'dorm_template',
    width: 500,
    height: 400,
    type: 'residential',
    housingUnits: [
        { id: 'unit_d1', name: '人才公寓A', capacity: 12, cost: 200, type: 'public_housing', area: { x: 10, y: 10, w: 480, h: 380 } }
    ],
    rooms: [
        { id: 'dorm_floor', x: 0, y: 0, w: 500, h: 400, label: '', color: '#b2bec3', pixelPattern: 'concrete' },
        { id: 'dorm_common', x: 180, y: 20, w: 140, h: 360, label: '公共大厅', color: '#fff', pixelPattern: 'tile' },
        { id: 'dorm_room_l', x: 20, y: 20, w: 150, h: 360, label: '寝室西', color: '#dff9fb', pixelPattern: 'wood' },
        { id: 'dorm_room_r', x: 330, y: 20, w: 150, h: 360, label: '寝室东', color: '#dff9fb', pixelPattern: 'wood' },
    ],
    furniture: [
        // 西寝室：6个床位，紧凑排列
        ...createRow('bed_l', 30, 40, 3, 0, 110, { w: 50, h: 80, color: '#74b9ff', label: '床位', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createRow('desk_l', 90, 40, 3, 0, 110, { w: 30, h: 30, color: '#636e72', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),
        
        // 东寝室：6个床位
        ...createRow('bed_r', 420, 40, 3, 0, 110, { w: 50, h: 80, color: '#74b9ff', label: '床位', utility: 'energy', pixelPattern: 'bed_bunk' }),
        ...createRow('desk_r', 380, 40, 3, 0, 110, { w: 30, h: 30, color: '#636e72', label: '书桌', utility: 'work', pixelPattern: 'desk_simple' }),

        // 中间公共区：社交与生活
        { id: 'vending', x: 220, y: 50, w: 60, h: 40, color: '#ff7675', label: '贩卖机', utility: 'buy_drink', pixelPattern: 'vending' },
        { id: 'common_table', x: 210, y: 150, w: 80, h: 60, color: '#fab1a0', label: '聚餐桌', utility: 'eat_out', pixelPattern: 'table_dining', multiUser: true },
        // 卫浴区设在底部
        ...createRow('shower', 200, 300, 2, 50, 0, { w: 40, h: 40, color: '#81ecec', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall' }),
        ...createRow('toilet', 200, 350, 2, 50, 0, { w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' }),
    ]
};

// ==========================================
// 2. 现代公寓 (Apartment) - "独立空间"
// 设计理念：户型规整，动静分离
// ==========================================
const PLOT_APARTMENT: PlotTemplate = {
    id: 'apartment_template',
    width: 400,
    height: 400,
    type: 'residential',
    housingUnits: [
        { id: 'apt_101', name: '101室', capacity: 2, cost: 1200, type: 'apartment', area: { x: 10, y: 10, w: 180, h: 180 } },
        { id: 'apt_102', name: '102室', capacity: 2, cost: 1200, type: 'apartment', area: { x: 210, y: 10, w: 180, h: 180 } },
        { id: 'apt_201', name: '201室', capacity: 2, cost: 1200, type: 'apartment', area: { x: 10, y: 210, w: 180, h: 180 } },
        { id: 'apt_202', name: '202室', capacity: 2, cost: 1200, type: 'apartment', area: { x: 210, y: 210, w: 180, h: 180 } },
    ],
    rooms: [
        { id: 'apt_g', x: 0, y: 0, w: 400, h: 400, label: '', color: '#b2bec3', pixelPattern: 'concrete' },
        // 十字走廊分割
        { id: 'room_101', x: 10, y: 10, w: 180, h: 180, label: '101', color: '#fff', pixelPattern: 'wood' },
        { id: 'room_102', x: 210, y: 10, w: 180, h: 180, label: '102', color: '#fff', pixelPattern: 'wood' },
        { id: 'room_201', x: 10, y: 210, w: 180, h: 180, label: '201', color: '#fff', pixelPattern: 'wood' },
        { id: 'room_202', x: 210, y: 210, w: 180, h: 180, label: '202', color: '#fff', pixelPattern: 'wood' },
    ],
    furniture: [
        // 101 & 102 (镜像布局)
        { id: 'bed_101', x: 20, y: 20, w: 60, h: 80, color: '#ff7675', label: '双人床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true },
        { id: 'sofa_101', x: 100, y: 20, w: 60, h: 30, color: '#74b9ff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
        { id: 'kitchen_101', x: 20, y: 140, w: 60, h: 30, color: '#b2bec3', label: '厨房', utility: 'cook', pixelPattern: 'kitchen' },
        
        { id: 'bed_102', x: 320, y: 20, w: 60, h: 80, color: '#ff7675', label: '双人床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true },
        { id: 'sofa_102', x: 240, y: 20, w: 60, h: 30, color: '#74b9ff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_pixel' },
        { id: 'kitchen_102', x: 320, y: 140, w: 60, h: 30, color: '#b2bec3', label: '厨房', utility: 'cook', pixelPattern: 'kitchen' },

        // 201 & 202 (带书房风格)
        { id: 'bed_201', x: 20, y: 220, w: 60, h: 80, color: '#a29bfe', label: '双人床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true },
        { id: 'pc_201', x: 100, y: 220, w: 40, h: 30, color: '#3742fa', label: '电脑桌', utility: 'play', pixelPattern: 'pc_pixel' },
        { id: 'toilet_201', x: 140, y: 350, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' },

        { id: 'bed_202', x: 320, y: 220, w: 60, h: 80, color: '#a29bfe', label: '双人床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true },
        { id: 'pc_202', x: 260, y: 220, w: 40, h: 30, color: '#3742fa', label: '电脑桌', utility: 'play', pixelPattern: 'pc_pixel' },
        { id: 'toilet_202', x: 230, y: 350, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet' },
    ]
};

// ==========================================
// 3. 湖畔别墅 (Villa) - "奢华庭院"
// 设计理念：大面积绿化，开放式起居，钢琴与艺术
// ==========================================
const PLOT_VILLA: PlotTemplate = {
    id: 'villa_template',
    width: 400,
    height: 400,
    type: 'residential',
    housingUnits: [
        { id: 'unit_villa', name: '湖畔豪宅', capacity: 4, cost: 5000, type: 'villa', area: { x: 10, y: 10, w: 380, h: 380 } }
    ],
    rooms: [
        { id: 'villa_lawn', x: 0, y: 0, w: 400, h: 400, label: '', color: PALETTE.plant_green, pixelPattern: 'grass_dense' },
        { id: 'villa_pool', x: 260, y: 30, w: 120, h: 180, label: '无边泳池', color: '#5a8fff', pixelPattern: 'water' },
        { id: 'villa_main', x: 30, y: 30, w: 220, h: 340, label: '主楼', color: '#fff', pixelPattern: 'pave_fancy' },
        { id: 'villa_bedroom', x: 30, y: 200, w: 220, h: 170, label: '休憩区', color: '#f5f6fa', pixelPattern: 'carpet' },
    ],
    furniture: [
        // 客厅区：钢琴 + 巨型沙发
        { id: 'piano', x: 50, y: 50, w: 60, h: 80, color: '#2d3436', label: '三角钢琴', utility: 'play', pixelPattern: 'piano' },
        { id: 'rug_main', x: 130, y: 60, w: 100, h: 60, color: '#a29bfe', label: '波斯地毯', utility: 'none', pixelPattern: 'rug_persian' },
        { id: 'sofa_l', x: 120, y: 60, w: 30, h: 80, color: '#fff', label: '沙发', utility: 'comfort', pixelPattern: 'sofa_vip' },
        { id: 'tv_unit', x: 220, y: 70, w: 10, h: 60, color: '#2d3436', label: '电视墙', utility: 'play', pixelPattern: 'tv_wall' },

        // 卧室区：两张King Size Bed
        { id: 'bed_master', x: 50, y: 220, w: 80, h: 100, color: '#ff7675', label: '主卧大床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true },
        { id: 'bed_guest', x: 150, y: 220, w: 80, h: 100, color: '#fab1a0', label: '次卧大床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true },
        
        // 浴室：大浴缸
        { id: 'bathtub', x: 180, y: 330, w: 60, h: 30, color: '#fff', label: '按摩浴缸', utility: 'hygiene', pixelPattern: 'bath_tub' },

        // 户外：泳池躺椅 & 花园
        { id: 'pool_chair_1', x: 270, y: 230, w: 20, h: 40, color: '#fff', label: '躺椅', utility: 'comfort', pixelPattern: 'bench_park' },
        { id: 'pool_chair_2', x: 300, y: 230, w: 20, h: 40, color: '#fff', label: '躺椅', utility: 'comfort', pixelPattern: 'bench_park' },
        { id: 'flower_1', x: 300, y: 300, w: 40, h: 40, color: '#ff6b81', label: '玫瑰', utility: 'gardening', pixelPattern: 'flower_rose' },
        { id: 'flower_2', x: 350, y: 300, w: 40, h: 40, color: '#ff6b81', label: '玫瑰', utility: 'gardening', pixelPattern: 'flower_rose' },
    ]
};

// ==========================================
// 4. 科技大厦 (Tech) - "开放式办公"
// 设计理念：岛式工位布局，中心化服务器，大量绿植
// ==========================================
const PLOT_TECH: PlotTemplate = {
    id: 'tech_template',
    width: 500,
    height: 400,
    type: 'work',
    rooms: [
        { id: 'tech_floor', x: 0, y: 0, w: 500, h: 400, label: '科技园', color: '#ecf0f1', pixelPattern: 'grid' },
        { id: 'tech_server_room', x: 20, y: 20, w: 100, h: 360, label: '机房', color: '#2c3e50', pixelPattern: 'stripes' },
        { id: 'tech_work_area', x: 140, y: 20, w: 340, h: 360, label: '办公区', color: '#fff', pixelPattern: 'tile' },
    ],
    furniture: [
        // 机房：服务器列阵
        ...createRow('server', 40, 40, 4, 0, 80, { w: 60, h: 40, color: '#00cec9', label: '服务器', utility: 'work', pixelPattern: 'server', pixelGlow: true }),
        
        // 办公区：岛式工位 (4人一组) - 24工位 total
        // 第一组岛 (左上)
        ...createRow('desk_isle1_a', 160, 50, 3, 50, 0, { w: 40, h: 30, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),
        ...createRow('desk_isle1_b', 160, 80, 3, 50, 0, { w: 40, h: 30, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),
        // 第二组岛 (左下)
        ...createRow('desk_isle2_a', 160, 200, 3, 50, 0, { w: 40, h: 30, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),
        ...createRow('desk_isle2_b', 160, 230, 3, 50, 0, { w: 40, h: 30, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),
        // 第三组岛 (右侧竖排)
        ...createRow('desk_isle3_a', 350, 50, 2, 50, 0, { w: 40, h: 30, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),
        ...createRow('desk_isle3_b', 350, 80, 2, 50, 0, { w: 40, h: 30, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),
        ...createRow('desk_isle4_a', 350, 200, 2, 50, 0, { w: 40, h: 30, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),
        ...createRow('desk_isle4_b', 350, 230, 2, 50, 0, { w: 40, h: 30, color: '#dfe6e9', label: '工位', utility: 'work', pixelPattern: 'desk_pixel' }),

        // 休闲区
        { id: 'coffee_tech', x: 420, y: 320, w: 40, h: 40, color: '#fab1a0', label: '咖啡角', utility: 'drink', pixelPattern: 'coffee_corner' },
        { id: 'beanbag', x: 360, y: 320, w: 40, h: 40, color: '#ff7675', label: '懒人沙发', utility: 'comfort', pixelPattern: 'beanbag' },
        
        // 老板位
        { id: 'cto_desk', x: 400, y: 140, w: 60, h: 40, color: '#2d3436', label: 'CTO工位', utility: 'work', pixelPattern: 'desk_wood' },
    ]
};

// ==========================================
// 5. 金融中心 (Finance) - "精英格调"
// 设计理念：独立办公室 + 高级会议室
// ==========================================
const PLOT_FINANCE: PlotTemplate = {
    id: 'finance_template',
    width: 400,
    height: 300,
    type: 'work',
    rooms: [
        { id: 'fin_floor', x: 0, y: 0, w: 400, h: 300, label: 'CBD', color: '#f5f6fa', pixelPattern: 'pave_fancy' },
        { id: 'ceo_room', x: 280, y: 20, w: 100, h: 120, label: '总裁办', color: '#dcdde1', pixelPattern: 'carpet' },
        { id: 'meeting_room', x: 20, y: 20, w: 240, h: 120, label: '会议室', color: '#fff', pixelPattern: 'wood' },
    ],
    furniture: [
        // 1. 总裁办
        { id: 'ceo_desk', x: 300, y: 40, w: 60, h: 40, color: '#8b4513', label: '红木班台', utility: 'work', pixelPattern: 'desk_wood' },
        { id: 'safe', x: 330, y: 90, w: 30, h: 30, color: '#2d3436', label: '保险柜', utility: 'none', pixelPattern: 'safe' },
        
        // 2. 商务区 (10工位)
        { id: 'conf_table', x: 60, y: 50, w: 160, h: 60, color: '#b2bec3', label: '大理石桌', utility: 'work_group', pixelPattern: 'table_marble' },
        // 围绕桌子的椅子
        ...createRow('chair_top', 70, 30, 4, 40, 0, { w: 20, h: 20, color: '#2c3e50', label: '工位', utility: 'work', pixelPattern: 'chair_leather' }),
        ...createRow('chair_bot', 70, 110, 4, 40, 0, { w: 20, h: 20, color: '#2c3e50', label: '工位', utility: 'work', pixelPattern: 'chair_leather' }),
        // 额外两个独立工位
        { id: 'vp_desk_1', x: 40, y: 180, w: 50, h: 30, color: '#636e72', label: '经理位', utility: 'work', pixelPattern: 'desk_simple' },
        { id: 'vp_desk_2', x: 120, y: 180, w: 50, h: 30, color: '#636e72', label: '经理位', utility: 'work', pixelPattern: 'desk_simple' },

        // 装饰
        { id: 'plant_corner', x: 360, y: 260, w: 20, h: 20, color: PALETTE.plant_green, label: '发财树', utility: 'none', pixelPattern: 'plant_pixel' },
    ]
};

// ==========================================
// 6. 创意园区 (Design) - "艺术工坊"
// 设计理念：散乱、自由、充满色彩
// ==========================================
const PLOT_DESIGN: PlotTemplate = {
    id: 'design_template',
    width: 300,
    height: 300,
    type: 'work',
    rooms: [
        { id: 'design_loft', x: 0, y: 0, w: 300, h: 300, label: 'LOFT', color: '#fff9e8', pixelPattern: 'wood' },
    ],
    furniture: [
        // 散落的画架 (10个)
        { id: 'easel_1', x: 30, y: 30, w: 40, h: 50, color: '#ff7675', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_2', x: 80, y: 40, w: 40, h: 50, color: '#fab1a0', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_3', x: 150, y: 20, w: 40, h: 50, color: '#ff7675', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_4', x: 40, y: 100, w: 40, h: 50, color: '#fab1a0', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_5', x: 100, y: 120, w: 40, h: 50, color: '#ff7675', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_6', x: 220, y: 50, w: 40, h: 50, color: '#fab1a0', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_7', x: 200, y: 150, w: 40, h: 50, color: '#ff7675', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_8', x: 50, y: 200, w: 40, h: 50, color: '#fab1a0', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_9', x: 120, y: 220, w: 40, h: 50, color: '#ff7675', label: '画架', utility: 'paint', pixelPattern: 'easel' },
        { id: 'easel_10', x: 240, y: 220, w: 40, h: 50, color: '#fab1a0', label: '画架', utility: 'paint', pixelPattern: 'easel' },

        // 装饰与灵感区
        { id: 'statue', x: 220, y: 100, w: 40, h: 40, color: '#fff', label: '石膏像', utility: 'art', pixelPattern: 'statue' },
        { id: 'paint_bucket', x: 160, y: 160, w: 30, h: 30, color: '#a29bfe', label: '颜料堆', utility: 'none', pixelPattern: 'paint' },
        { id: 'rug_art', x: 140, y: 80, w: 60, h: 60, color: '#fdcb6e', label: '地毯', utility: 'none', pixelPattern: 'rug_art' },
    ]
};

// ==========================================
// 7. 商业娱乐区 (Commercial) - "沉浸式消费"
// 设计理念：商场与影院结合，明确的消费动线
// ==========================================
const PLOT_COMMERCIAL: PlotTemplate = {
    id: 'commercial_template',
    width: 500,
    height: 400,
    type: 'commercial',
    rooms: [
        { id: 'mall_area', x: 0, y: 0, w: 300, h: 400, label: '购物中心', color: '#ffeaa7', pixelPattern: 'mall' },
        { id: 'cinema_area', x: 300, y: 0, w: 200, h: 400, label: 'IMAX影城', color: '#2d3436', pixelPattern: 'cinema' },
    ],
    furniture: [
        // 影城：阶梯座位
        { id: 'screen', x: 320, y: 20, w: 160, h: 10, color: '#fff', label: '银幕', utility: 'none' },
        ...createRow('seat_row1', 320, 80, 4, 40, 0, { w: 30, h: 30, color: '#d63031', label: 'VIP座', utility: 'cinema_3d', pixelPattern: 'seat_reg' }),
        ...createRow('seat_row2', 320, 130, 4, 40, 0, { w: 30, h: 30, color: '#d63031', label: 'VIP座', utility: 'cinema_3d', pixelPattern: 'seat_reg' }),
        ...createRow('seat_row3', 320, 180, 4, 40, 0, { w: 30, h: 30, color: '#d63031', label: 'VIP座', utility: 'cinema_3d', pixelPattern: 'seat_reg' }),
        // 售票处
        { id: 'ticket_counter', x: 350, y: 300, w: 100, h: 40, color: '#e17055', label: '售票处', utility: 'work', pixelPattern: 'ticket_booth' },

        // 商场：环形动线
        // 服装区
        { id: 'clothes_1', x: 40, y: 40, w: 10, h: 60, color: '#a29bfe', label: '衣架', utility: 'buy_item', pixelPattern: 'clothes_rack' },
        { id: 'clothes_2', x: 100, y: 40, w: 10, h: 60, color: '#a29bfe', label: '衣架', utility: 'buy_item', pixelPattern: 'clothes_rack' },
        { id: 'fitting_room', x: 240, y: 20, w: 40, h: 60, color: '#636e72', label: '试衣间', utility: 'none', pixelPattern: 'fitting_room' },
        
        // 餐饮区
        { id: 'food_counter', x: 20, y: 200, w: 80, h: 40, color: '#fdcb6e', label: '小吃摊', utility: 'buy_food', pixelPattern: 'food_cart' },
        { id: 'table_mall', x: 120, y: 200, w: 60, h: 40, color: '#fff', label: '餐桌', utility: 'eat_out', pixelPattern: 'table_dining' },

        // 收银台 (中心位置)
        { id: 'cashier_main', x: 100, y: 320, w: 80, h: 40, color: '#2c3e50', label: '服务台', utility: 'work', pixelPattern: 'cashier' },
    ]
};

// ==========================================
// 8. 综合医院 (Hospital) - "生命通道"
// 设计理念：分诊->治疗->住院，动线清晰
// ==========================================
const PLOT_HOSPITAL: PlotTemplate = {
    id: 'hospital_template',
    width: 500,
    height: 400,
    type: 'public',
    rooms: [
        { id: 'hosp_hall', x: 0, y: 0, w: 500, h: 400, label: '门诊大厅', color: '#f5f6fa', pixelPattern: 'tile' },
        { id: 'hosp_ward', x: 300, y: 20, w: 180, h: 360, label: '住院部', color: '#dff9fb', pixelPattern: 'simple' },
    ],
    furniture: [
        // 分诊台 (入口)
        { id: 'reception', x: 100, y: 320, w: 100, h: 40, color: '#74b9ff', label: '挂号处', utility: 'work', pixelPattern: 'reception' },
        
        // 诊室 (医生工位)
        { id: 'doc_room_1', x: 20, y: 20, w: 100, h: 80, color: '#fff', label: '内科诊室', utility: 'work', pixelPattern: 'desk_simple' },
        { id: 'doc_room_2', x: 20, y: 120, w: 100, h: 80, color: '#fff', label: '外科诊室', utility: 'work', pixelPattern: 'desk_simple' },
        
        // 医疗设备
        { id: 'ecg', x: 150, y: 50, w: 40, h: 40, color: '#2d3436', label: '检测仪', utility: 'none', pixelPattern: 'server', pixelGlow: true },
        
        // 住院病床 (healing)
        ...createRow('hosp_bed', 320, 50, 4, 0, 90, { w: 60, h: 70, color: '#81ecec', label: '病床', utility: 'healing', pixelPattern: 'bed_king' }),
        { id: 'nurse_station', x: 320, y: 350, w: 60, h: 30, color: '#fab1a0', label: '护士站', utility: 'work', pixelPattern: 'desk_simple' },
    ]
};

// ==========================================
// 9. 大型超市 (Supermarket) - "货架迷宫"
// 设计理念：整齐划一的货架，刺激购买欲
// ==========================================
const PLOT_SUPERMARKET: PlotTemplate = {
    id: 'supermarket_template',
    width: 500,
    height: 400,
    type: 'commercial',
    rooms: [
        { id: 'market_floor', x: 0, y: 0, w: 500, h: 400, label: '沃尔玛特', color: '#fff', pixelPattern: 'tile' }
    ],
    furniture: [
        // 收银线 (出口)
        ...createRow('checkout', 100, 330, 4, 80, 0, { w: 60, h: 40, color: '#2c3e50', label: '收银台', utility: 'work', pixelPattern: 'cashier' }),
        
        // 货架矩阵
        // 食品区
        ...createGrid('shelf_food', 50, 50, 4, 2, 100, 80, { w: 80, h: 40, color: '#ffdd59', label: '零食区', utility: 'buy_item', pixelPattern: 'shelf_food' }),
        // 生鲜区
        ...createGrid('shelf_veg', 50, 220, 4, 1, 100, 0, { w: 80, h: 40, color: '#55efc4', label: '生鲜区', utility: 'buy_item', pixelPattern: 'shelf_veg' }),
        
        // 购物车
        { id: 'carts', x: 20, y: 350, w: 40, h: 40, color: '#636e72', label: '购物车', utility: 'none', pixelPattern: 'box' },
    ]
};

// ==========================================
// 10. 养老社区 (Elder Care) - "安享晚年"
// 设计理念：无障碍设计，花园环绕，麻将社交
// ==========================================
const PLOT_ELDER_CARE: PlotTemplate = {
    id: 'elder_care_template',
    width: 400,
    height: 400,
    type: 'residential',
    housingUnits: [
        { id: 'unit_elder', name: '夕阳红养老院', capacity: 16, cost: 500, type: 'elder_care', area: { x: 10, y: 10, w: 380, h: 380 } }
    ],
    rooms: [
        { id: 'elder_garden', x: 0, y: 0, w: 400, h: 400, label: '养生花园', color: PALETTE.plant_green, pixelPattern: 'grass_dense' },
        { id: 'elder_house', x: 40, y: 40, w: 320, h: 320, label: '起居室', color: '#fff9e8', pixelPattern: 'wood' },
    ],
    furniture: [
        // 卧室区 (沿墙布置)
        ...createRow('elder_bed_t', 60, 50, 4, 70, 0, { w: 50, h: 70, color: '#fab1a0', label: '护理床', utility: 'energy', pixelPattern: 'bed_king' }),
        ...createRow('elder_bed_b', 60, 280, 4, 70, 0, { w: 50, h: 70, color: '#fab1a0', label: '护理床', utility: 'energy', pixelPattern: 'bed_king' }),
        
        // 中心社交区 (麻将桌!)
        { id: 'mahjong_1', x: 100, y: 160, w: 60, h: 60, color: '#00b894', label: '麻将桌', utility: 'play', pixelPattern: 'table_dining', multiUser: true },
        { id: 'mahjong_2', x: 240, y: 160, w: 60, h: 60, color: '#00b894', label: '麻将桌', utility: 'play', pixelPattern: 'table_dining', multiUser: true },
        
        // 摇椅区
        { id: 'rocker_1', x: 370, y: 100, w: 20, h: 40, color: '#8b4513', label: '摇椅', utility: 'comfort', pixelPattern: 'chair_pixel' },
        { id: 'rocker_2', x: 370, y: 150, w: 20, h: 40, color: '#8b4513', label: '摇椅', utility: 'comfort', pixelPattern: 'chair_pixel' },
    ]
};

// 保持其他基础模板 (Service, KG, Schools) 但进行微调...
const PLOT_SERVICE: PlotTemplate = {
    id: 'service_template',
    width: 500, height: 400, type: 'public',
    rooms: [{id:'s_f',x:0,y:0,w:500,h:400,label:'服务中心',color:'#fff',pixelPattern:'tile'}],
    furniture: [
        // 餐厅区
        ...createRow('stove', 20, 20, 4, 50, 0, {w:40,h:40,color:'#d63031',label:'灶台',utility:'work',pixelPattern:'stove'}),
        ...createGrid('dining', 20, 80, 3, 2, 60, 60, {w:40,h:40,color:'#ffeaa7',label:'餐桌',utility:'eat_out',pixelPattern:'table_dining'}),
        // 图书区
        ...createRow('shelf', 300, 20, 3, 50, 0, {w:40,h:80,color:'#e67e22',label:'书架',utility:'buy_book',pixelPattern:'bookshelf_hist'}),
        ...createRow('read_desk', 300, 120, 2, 80, 0, {w:60,h:40,color:'#d35400',label:'阅览桌',utility:'work',pixelPattern:'desk_library'}),
        // 前台
        {id:'recep',x:200,y:300,w:100,h:40,color:'#a29bfe',label:'综合服务台',utility:'work',pixelPattern:'reception'}
    ]
};

const PLOT_KINDERGARTEN: PlotTemplate = {
    id: 'kindergarten_template', width: 300, height: 300, type: 'public',
    rooms: [{id:'kg_r',x:10,y:10,w:280,h:280,label:'活动室',color:'#ffefc1',pixelPattern:'carpet'}],
    furniture: [
        {id:'slide',x:200,y:20,w:60,h:100,color:'#ff7675',label:'滑梯',utility:'play',pixelPattern:'slide'},
        ...createGrid('crib',20,200,4,1,60,0,{w:40,h:30,color:'#ff9ff3',label:'婴儿床',utility:'nap_crib',pixelPattern:'bed_crib'}),
        {id:'teacher',x:100,y:20,w:40,h:30,color:'#fab1a0',label:'讲台',utility:'work',pixelPattern:'desk_pixel'}
    ]
};

const PLOT_ELEMENTARY: PlotTemplate = {
    id: 'elementary_template', width: 400, height: 300, type: 'public',
    rooms: [{id:'el_r',x:10,y:10,w:380,h:280,label:'教室',color:'#dff9fb',pixelPattern:'wood'}],
    furniture: [
        ...createGrid('desk',40,60,4,3,60,50,{w:40,h:30,color:'#fdcb6e',label:'课桌',utility:'study',pixelPattern:'desk_school'}),
        {id:'board',x:100,y:10,w:200,h:10,color:'#2d3436',label:'黑板',utility:'none'},
        {id:'t_desk',x:180,y:30,w:40,h:30,color:'#b2bec3',label:'讲台',utility:'work',pixelPattern:'desk_simple'}
    ]
};

const PLOT_HIGHSCHOOL: PlotTemplate = {
    id: 'high_school_template', width: 500, height: 400, type: 'public',
    rooms: [
        {id:'hi_c',x:10,y:10,w:280,h:250,label:'教室',color:'#fff',pixelPattern:'wood'},
        {id:'hi_eat',x:300,y:10,w:190,h:250,label:'食堂',color:'#fab1a0',pixelPattern:'tile'},
        {id:'hi_gym',x:10,y:270,w:480,h:120,label:'操场',color:'#e55039',pixelPattern:'run_track'}
    ],
    furniture: [
        ...createGrid('hi_desk',40,50,3,3,70,60,{w:50,h:30,color:'#b2bec3',label:'课桌',utility:'study_high',pixelPattern:'desk_simple'}),
        {id:'hi_board',x:50,y:10,w:150,h:10,color:'#2d3436',label:'黑板',utility:'none'},
        ...createGrid('hi_food',320,50,2,2,60,60,{w:40,h:40,color:'#ffeaa7',label:'餐桌',utility:'eat_canteen',pixelPattern:'table_dining'}),
        {id:'hoop',x:420,y:300,w:20,h:40,color:'#e17055',label:'篮筐',utility:'play',pixelPattern:'hoop'},
        {id:'stove',x:350,y:200,w:40,h:40,color:'#d63031',label:'灶台',utility:'work',pixelPattern:'stove'}
    ]
};

// 简单的公园
const PLOT_PARK: PlotTemplate = {
    id: 'park_template', width: 500, height: 400, type: 'public',
    rooms: [{id:'p_g',x:0,y:0,w:500,h:400,label:'',color:PALETTE.plant_green,pixelPattern:'grass'}],
    furniture: [
        {id:'lake',x:150,y:150,w:200,h:150,color:'#5a8fff',label:'人工湖',utility:'fishing',pixelPattern:'water'},
        {id:'bench_1',x:100,y:100,w:50,h:20,color:'#e17055',label:'长椅',utility:'comfort',pixelPattern:'bench_park'},
        {id:'bench_2',x:350,y:100,w:50,h:20,color:'#e17055',label:'长椅',utility:'comfort',pixelPattern:'bench_park'},
        {id:'tree_1',x:50,y:50,w:40,h:40,color:'#2d3436',label:'树',utility:'none',pixelPattern:'tree_pixel', pixelOutline: true},
        {id:'tree_2',x:400,y:300,w:40,h:40,color:'#2d3436',label:'树',utility:'none',pixelPattern:'tree_pixel', pixelOutline: true},
    ]
};

const PLOT_NIGHTLIFE: PlotTemplate = {
    id: 'nightlife_template', width: 500, height: 400, type: 'commercial',
    rooms: [{id:'club_f',x:0,y:0,w:500,h:400,label:'夜店',color:'#2d3436',pixelPattern:'neon'}],
    furniture: [
        {id:'dj',x:200,y:50,w:100,h:40,color:'#a29bfe',label:'DJ台',utility:'music',pixelPattern:'dj_stage',pixelGlow:true},
        {id:'dance',x:150,y:100,w:200,h:150,color:'#636e72',label:'舞池',utility:'dance',pixelPattern:'dance_floor',pixelGlow:true},
        {id:'bar',x:100,y:300,w:300,h:40,color:'#e84393',label:'吧台',utility:'buy_drink',pixelPattern:'bar_counter'}
    ]
};

// 道路定义
const PLOT_ROAD_H: PlotTemplate = { id: 'road_h_template', width: 500, height: 100, type: 'public', rooms: [{ id: 'road_s', x: 0, y: 0, w: 500, h: 100, label: '', color: '#3d404b', pixelPattern: 'stripes' }], furniture: [] };
const PLOT_ROAD_V: PlotTemplate = { id: 'road_v_template', width: 100, height: 500, type: 'public', rooms: [{ id: 'road_s', x: 0, y: 0, w: 100, h: 500, label: '', color: '#3d404b', pixelPattern: 'stripes' }], furniture: [] };
const PLOT_ROAD_CROSS: PlotTemplate = { id: 'road_cross_template', width: 100, height: 100, type: 'public', rooms: [{ id: 'road_s', x: 0, y: 0, w: 100, h: 100, label: '', color: '#3d404b', pixelPattern: 'stripes' }, { id: 'z', x: 0, y: 0, w: 100, h: 100, label: '', color: 'rgba(255,255,255,0.2)', pixelPattern: 'zebra' }], furniture: [] };

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
    'hospital': PLOT_HOSPITAL,
    'elder_care': PLOT_ELDER_CARE,
    'supermarket': PLOT_SUPERMARKET,
    'nightlife': PLOT_NIGHTLIFE,
    'road_h': PLOT_ROAD_H,
    'road_v': PLOT_ROAD_V,
    'road_cross': PLOT_ROAD_CROSS
};