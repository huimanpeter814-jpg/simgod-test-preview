import { WorldPlot, Furniture } from '../types';

// 定义路边的装饰物
export const STREET_PROPS: Furniture[] = [
    { id: 'vending_h1', x: 1100, y: 500, w: 44, h: 34, color: '#ff5252', label: '可乐贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'vending_h2', x: 1150, y: 500, w: 44, h: 34, color: '#4a7dff', label: '矿泉水贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'hydrant_1', x: 900, y: 460, w: 18, h: 18, color: '#ff5252', label: '消防栓', utility: 'none', pixelOutline: true },
    { id: 'trash_can_1', x: 900, y: 420, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
];

// 重新规划的布局：避免重叠，预留道路空间
// 假设标准地皮宽度 ~500，道路宽 ~100，间隔 ~20
export const WORLD_LAYOUT: WorldPlot[] = [
    // === 第一排 (Y=20): 核心商务区 & 创意区 ===
    // 1. 科技大厦 (500w) [20, 520]
    { id: 'plot_tech', templateId: 'tech', x: 20, y: 20 },
    // Gap 20
    // 2. 金融中心 (500w) [540, 1040]
    { id: 'plot_finance', templateId: 'finance', x: 540, y: 20 },
    
    // 纵向道路 1 (100w) [1060, 1160] -> 对应 road_v1
    
    // 3. 创意园 (440w) [1180, 1620]
    { id: 'plot_design', templateId: 'design', x: 1180, y: 20 },
    // 4. 人才公寓 (900w) [1640, 2540]
    { id: 'plot_dorm', templateId: 'dorm', x: 1640, y: 20 },
    
    // 纵向道路 2 (100w) [2560, 2660] -> 对应 road_v2

    // === 教育园区 (独立区域，避免拥挤) ===
    // 5. 幼儿园 (440w)
    { id: 'plot_kg', templateId: 'kindergarten', x: 2680, y: 20 },
    // 6. 小学 (900w)
    { id: 'plot_elem', templateId: 'elementary', x: 3140, y: 20 },
    
    // 横向道路 H1 (Y=480) [高度100] -> 覆盖 Y=480~580
    // 这样避开了上方最高的建筑 (KG 440高, 20+440=460)

    // === 第二排 (Y=600): 居住 & 休闲 ===
    // 7. 公寓楼 (600w)
    { id: 'plot_apt', templateId: 'apartment', x: 20, y: 600 },
    // 8. 中央公园 (1000w)
    { id: 'plot_park', templateId: 'park', x: 640, y: 600 },
    
    // 纵向道路 1 穿过这里 x=1060 (但在公园内部不好，所以公园放左边点或者路断开)
    // 这里把公园放在路左边，路在 1660 (对应上方布局)
    
    // 9. 公共服务区 (720w)
    { id: 'plot_serv', templateId: 'service', x: 1780, y: 600 }, // 避开 road_v2 (2560)
    
    // 10. 中学 (1340w) - 放在较远侧
    { id: 'plot_high', templateId: 'high_school', x: 2680, y: 600 },

    // 横向道路 H2 (Y=1340) -> 覆盖 1340~1440

    // === 第三排 (Y=1460): 商业 & 豪宅 ===
    // 11. 商业广场 (1020w)
    { id: 'plot_comm', templateId: 'commercial', x: 20, y: 1460 },
    // 12. 不夜城 (720w)
    { id: 'plot_night', templateId: 'nightlife', x: 1060, y: 1460 },
    // 13. 别墅 (600w)
    { id: 'plot_villa', templateId: 'villa', x: 1800, y: 1460 },
    // 14. 网咖 (400w)
    { id: 'plot_netcafe', templateId: 'netcafe', x: 2420, y: 1460 },
    // 15. 美术馆 (400w)
    { id: 'plot_gallery', templateId: 'gallery', x: 2840, y: 1460 },

    // === 道路系统 (Grid System) ===
    // 横向主干道 1 (Y=480)
    { id: 'road_h1_1', templateId: 'road_h', x: 0, y: 480 },
    { id: 'road_h1_2', templateId: 'road_h', x: 500, y: 480 },
    { id: 'road_h1_3', templateId: 'road_h', x: 1000, y: 480 }, // Cross at 1060
    { id: 'road_h1_4', templateId: 'road_h', x: 1500, y: 480 },
    { id: 'road_h1_5', templateId: 'road_h', x: 2000, y: 480 },
    { id: 'road_h1_6', templateId: 'road_h', x: 2500, y: 480 }, // Cross at 2560
    { id: 'road_h1_7', templateId: 'road_h', x: 3000, y: 480 },
    { id: 'road_h1_8', templateId: 'road_h', x: 3500, y: 480 },

    // 横向主干道 2 (Y=1340)
    { id: 'road_h2_1', templateId: 'road_h', x: 0, y: 1340 },
    { id: 'road_h2_2', templateId: 'road_h', x: 500, y: 1340 },
    { id: 'road_h2_3', templateId: 'road_h', x: 1000, y: 1340 },
    { id: 'road_h2_4', templateId: 'road_h', x: 1500, y: 1340 },
    { id: 'road_h2_5', templateId: 'road_h', x: 2000, y: 1340 },
    { id: 'road_h2_6', templateId: 'road_h', x: 2500, y: 1340 },
    { id: 'road_h2_7', templateId: 'road_h', x: 3000, y: 1340 },
    
    // 纵向道路 1 (X=1060) - 连接办公区和商业区
    { id: 'road_v1_1', templateId: 'road_v', x: 1060, y: 0 },
    // 交叉口 1 (1060, 480)
    { id: 'cross_1', templateId: 'road_cross', x: 1060, y: 480 },
    { id: 'road_v1_2', templateId: 'road_v', x: 1060, y: 580 }, // 穿过中间层
    { id: 'road_v1_3', templateId: 'road_v', x: 1060, y: 1080 },
    // 交叉口 2 (1060, 1340)
    { id: 'cross_2', templateId: 'road_cross', x: 1060, y: 1340 },

    // 纵向道路 2 (X=2560) - 教育和公寓区
    { id: 'road_v2_1', templateId: 'road_v', x: 2560, y: 0 },
    // 交叉口 3 (2560, 480)
    { id: 'cross_3', templateId: 'road_cross', x: 2560, y: 480 },
    { id: 'road_v2_2', templateId: 'road_v', x: 2560, y: 580 },
    { id: 'road_v2_3', templateId: 'road_v', x: 2560, y: 1080 },
    // 交叉口 4 (2560, 1340)
    { id: 'cross_4', templateId: 'road_cross', x: 2560, y: 1340 },
];