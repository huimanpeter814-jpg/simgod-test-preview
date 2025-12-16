import { WorldPlot, Furniture } from '../types';

// [修改] 移除静态 ROADS 数组，将其转化为 plot 形式在 WORLD_LAYOUT 中定义
export const ROADS = []; // 保持导出为空数组以兼容旧代码引用，但不再实际使用

// 定义路边的装饰物 (作为独立家具存在，不依附于特定 plot，或者可以在初始化时添加到全局家具列表)
export const STREET_PROPS: Furniture[] = [
    // 十字路口附近的贩卖机
    { id: 'vending_h1', x: 960, y: 460, w: 44, h: 34, color: '#ff5252', label: '可乐贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'vending_h2', x: 1010, y: 460, w: 44, h: 34, color: '#4a7dff', label: '矿泉水贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    
    // 消防栓与垃圾桶
    { id: 'hydrant_1', x: 820, y: 420, w: 18, h: 18, color: '#ff5252', label: '消防栓', utility: 'none', pixelOutline: true },
    { id: 'trash_can_1', x: 820, y: 380, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
    { id: 'trash_can_2', x: 1890, y: 1300, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
];

// [修改] 重新规划世界布局，消除重叠，并将道路转化为地皮
export const WORLD_LAYOUT: WorldPlot[] = [
    // === 第一排 (Top Row) ===
    { id: 'plot_cbd', templateId: 'cbd', x: 20, y: 20 },
    { id: 'plot_dorm', templateId: 'dorm', x: 1550, y: 20 },
    
    // === 第二排 (Middle Row) ===
    { id: 'plot_apt', templateId: 'apartment', x: 20, y: 560 },
    { id: 'plot_park', templateId: 'park', x: 920, y: 560 }, 
    { id: 'plot_serv', templateId: 'service', x: 2050, y: 560 },
    
    // === 第三排 (Bottom Row) ===
    { id: 'plot_comm', templateId: 'commercial', x: 20, y: 1440 },
    { id: 'plot_night', templateId: 'nightlife', x: 1100, y: 1440 },
    { id: 'plot_villa', templateId: 'villa', x: 1900, y: 1440 },
    
    // === 远东新区 (拆分为独立的 Gallery 和 NetCafe) ===
    { id: 'plot_gallery', templateId: 'gallery', x: 4100, y: 50 },
    { id: 'plot_netcafe', templateId: 'netcafe', x: 4100, y: 1250 },
    
    // 教育园区
    { id: 'plot_edu', templateId: 'education', x: 2850, y: 20 },

    // === 道路系统 (Roads as Plots) ===
    // 横向主干道 1 (Y=440)
    { id: 'road_h1_1', templateId: 'road_h', x: 0, y: 440 },
    { id: 'road_h1_2', templateId: 'road_h', x: 500, y: 440 },
    { id: 'road_h1_3', templateId: 'road_h', x: 1000, y: 440 },
    { id: 'road_h1_4', templateId: 'road_h', x: 1500, y: 440 },
    { id: 'road_h1_5', templateId: 'road_h', x: 2000, y: 440 },
    { id: 'road_h1_6', templateId: 'road_h', x: 2500, y: 440 },
    { id: 'road_h1_7', templateId: 'road_h', x: 3000, y: 440 },

    // 横向主干道 2 (Y=1320)
    { id: 'road_h2_1', templateId: 'road_h', x: 0, y: 1320 },
    { id: 'road_h2_2', templateId: 'road_h', x: 500, y: 1320 },
    { id: 'road_h2_3', templateId: 'road_h', x: 1000, y: 1320 },
    { id: 'road_h2_4', templateId: 'road_h', x: 1500, y: 1320 },
    { id: 'road_h2_5', templateId: 'road_h', x: 2000, y: 1320 },
    { id: 'road_h2_6', templateId: 'road_h', x: 2500, y: 1320 },
    
    // 纵向道路 (X=840)
    { id: 'road_v1_1', templateId: 'road_v', x: 840, y: 0 },
    // { id: 'road_v1_2', templateId: 'road_v', x: 840, y: 500 }, // 与横路交叉处留给 Crossroad 或直接覆盖
    { id: 'road_v1_3', templateId: 'road_v', x: 840, y: 600 }, // 跳过交叉口
    { id: 'road_v1_4', templateId: 'road_v', x: 840, y: 1100 }, 

    // 纵向道路 (X=1910)
    { id: 'road_v2_1', templateId: 'road_v', x: 1910, y: 0 },
    { id: 'road_v2_2', templateId: 'road_v', x: 1910, y: 600 },
    { id: 'road_v2_3', templateId: 'road_v', x: 1910, y: 1100 },

    // 交叉口 (可选，增强视觉效果)
    { id: 'cross_1', templateId: 'road_cross', x: 840, y: 440 },
    { id: 'cross_2', templateId: 'road_cross', x: 1910, y: 440 },
    { id: 'cross_3', templateId: 'road_cross', x: 840, y: 1320 },
    { id: 'cross_4', templateId: 'road_cross', x: 1910, y: 1320 },
];