import { WorldPlot, Furniture } from '../types';

// 定义路边的装饰物
export const STREET_PROPS: Furniture[] = [
    { id: 'vending_h1', x: 960, y: 460, w: 44, h: 34, color: '#ff5252', label: '可乐贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'vending_h2', x: 1010, y: 460, w: 44, h: 34, color: '#4a7dff', label: '矿泉水贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'hydrant_1', x: 820, y: 420, w: 18, h: 18, color: '#ff5252', label: '消防栓', utility: 'none', pixelOutline: true },
    { id: 'trash_can_1', x: 820, y: 380, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
    { id: 'trash_can_2', x: 1890, y: 1300, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
];

export const WORLD_LAYOUT: WorldPlot[] = [
    // === 第一排 (Top Row): 办公与居住 ===
    { id: 'plot_tech', templateId: 'tech', x: 20, y: 20 },          // 科技大厦 (Tech Tower)
    { id: 'plot_finance', templateId: 'finance', x: 540, y: 20 },   // 金融中心 (Finance)
    { id: 'plot_design', templateId: 'design', x: 1060, y: 20 },    // 创意园 (Creative)
    { id: 'plot_dorm', templateId: 'dorm', x: 1550, y: 20 },        // 人才公寓 (Dorm)
    
    // === 教育园区 (Separate Plots) ===
    { id: 'plot_kg', templateId: 'kindergarten', x: 2500, y: 20 },  // 幼儿园 (KG)
    { id: 'plot_elem', templateId: 'elementary', x: 3000, y: 20 },  // 小学 (Elem)
    { id: 'plot_high', templateId: 'high_school', x: 2500, y: 550 },// 中学 (High) - 放在幼儿园下方

    // === 第二排 (Middle Row): 居住与休闲 ===
    { id: 'plot_apt', templateId: 'apartment', x: 20, y: 560 },
    { id: 'plot_park', templateId: 'park', x: 920, y: 560 }, 
    { id: 'plot_serv', templateId: 'service', x: 2050, y: 560 },
    
    // === 第三排 (Bottom Row): 商业与豪华居住 ===
    { id: 'plot_comm', templateId: 'commercial', x: 20, y: 1440 },
    { id: 'plot_night', templateId: 'nightlife', x: 1100, y: 1440 },
    { id: 'plot_villa', templateId: 'villa', x: 1900, y: 1440 },
    
    // === 远东新区 (独立设施) ===
    { id: 'plot_gallery', templateId: 'gallery', x: 4100, y: 50 },
    { id: 'plot_netcafe', templateId: 'netcafe', x: 4100, y: 1250 },
    
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
    { id: 'road_v1_3', templateId: 'road_v', x: 840, y: 600 }, 
    { id: 'road_v1_4', templateId: 'road_v', x: 840, y: 1100 }, 

    // 纵向道路 (X=1910)
    { id: 'road_v2_1', templateId: 'road_v', x: 1910, y: 0 },
    { id: 'road_v2_2', templateId: 'road_v', x: 1910, y: 600 },
    { id: 'road_v2_3', templateId: 'road_v', x: 1910, y: 1100 },

    // 交叉口
    { id: 'cross_1', templateId: 'road_cross', x: 840, y: 440 },
    { id: 'cross_2', templateId: 'road_cross', x: 1910, y: 440 },
    { id: 'cross_3', templateId: 'road_cross', x: 840, y: 1320 },
    { id: 'cross_4', templateId: 'road_cross', x: 1910, y: 1320 },
];