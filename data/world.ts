import { WorldPlot } from '../types';

const ROAD_W = 100;

// [修改] 重新定义道路坐标以适应更大的地图布局
// 采用 "三横两纵" 或 "两横两纵" 布局来划分区域
export const ROADS = [
    // --- 横向道路 ---
    // 第一条横路：分隔 Top 和 Middle 区域 (Y=440)
    { id: 'road_h_top', x: 0, y: 440, w: 3400, h: ROAD_W, label: '', color: '#3d404b', pixelPattern: 'stripes' }, 
    // 第二条横路：分隔 Middle 和 Bottom 区域 (Y=1320)
    { id: 'road_h_bot', x: 0, y: 1320, w: 3400, h: ROAD_W, label: '', color: '#3d404b', pixelPattern: 'stripes' }, 
    
    // --- 纵向道路 ---
    // 第一条纵路：主要分隔左侧居住/商业区与中部 (X=840)
    { id: 'road_v_left', x: 840, y: 0, w: ROAD_W, h: 2200, label: '', color: '#3d404b', pixelPattern: 'stripes' }, 
    // 第二条纵路：分隔中部与东部区域 (X=1910)
    { id: 'road_v_right', x: 1910, y: 0, w: ROAD_W, h: 2200, label: '', color: '#3d404b', pixelPattern: 'stripes' },
    // 新增通往学校的横路 (Y=440延伸)
    { id: 'road_h_edu', x: 3400, y: 440, w: 1200, h: 100, label: '', color: '#3d404b', pixelPattern: 'stripes' },
    // 新增学校门前的纵路
    { id: 'road_v_edu', x: 3300, y: 0, w: 100, h: 2200, label: '', color: '#3d404b', pixelPattern: 'stripes' },

    // --- 斑马线 (交叉口优化) ---
    { id: 'zebra_1', x: 840, y: 440, w: 100, h: 6, color: '#f8f9fa', pixelPattern: 'zebra' },
    { id: 'zebra_2', x: 1910, y: 440, w: 100, h: 6, color: '#f8f9fa', pixelPattern: 'zebra' },
    { id: 'zebra_3', x: 840, y: 1320, w: 100, h: 6, color: '#f8f9fa', pixelPattern: 'zebra' },
    { id: 'zebra_4', x: 1910, y: 1320, w: 100, h: 6, color: '#f8f9fa', pixelPattern: 'zebra' }

];

// 定义路边的装饰物
export const STREET_PROPS = [
    // 十字路口附近的贩卖机
    { id: 'vending_h1', x: 960, y: 460, w: 44, h: 34, color: '#ff5252', label: '可乐贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    { id: 'vending_h2', x: 1010, y: 460, w: 44, h: 34, color: '#4a7dff', label: '矿泉水贩卖机', utility: 'buy_drink', dir: 'down', pixelPattern: 'vending' },
    
    // 消防栓与垃圾桶
    { id: 'hydrant_1', x: 820, y: 420, w: 18, h: 18, color: '#ff5252', label: '消防栓', utility: 'none', pixelOutline: true },
    { id: 'trash_can_1', x: 820, y: 380, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
    { id: 'trash_can_2', x: 1890, y: 1300, w: 24, h: 24, color: '#2c3e50', label: '分类垃圾桶', utility: 'none', pixelPattern: 'trash' },
];

// [修改] 重新规划世界布局，消除重叠
// 布局逻辑：
// Top Row (Y=20): CBD(宽1460) | Dorm(宽900)
// Middle Row (Y=560): Apt(宽800) | Park(宽1000) | Service(宽720)
// Bottom Row (Y=1440): Commercial(宽1020) | Nightlife(宽720) | Villa(宽800)
// Far East (Right Edge): FarEast(宽400)
export const WORLD_LAYOUT: WorldPlot[] = [
    // === 第一排 (Top Row) ===
    // CBD 占据左上角大片区域
    { id: 'plot_cbd', templateId: 'cbd', x: 20, y: 20 },
    // 宿舍区在中右侧 (避开纵向道路 V1 的切割，稍微右移)
    { id: 'plot_dorm', templateId: 'dorm', x: 1550, y: 20 },
    
    // === 第二排 (Middle Row) ===
    // 公寓楼放在左侧 (800宽，正好在 V1 道路左边)
    { id: 'plot_apt', templateId: 'apartment', x: 20, y: 560 },
    // 中央公园放在正中间 (V1 和 V2 之间)
    { id: 'plot_park', templateId: 'park', x: 920, y: 560 }, 
    // 公共服务区放在公园右侧
    { id: 'plot_serv', templateId: 'service', x: 2050, y: 560 },
    
    // === 第三排 (Bottom Row) ===
    // 商业区放在左下
    { id: 'plot_comm', templateId: 'commercial', x: 20, y: 1440 },
    // 夜生活区放在中间
    { id: 'plot_night', templateId: 'nightlife', x: 1100, y: 1440 },
    // 别墅区放在右下 (幽静)
    { id: 'plot_villa', templateId: 'villa', x: 1900, y: 1440 },
    
    // === 远东新区 (最右侧纵向长条) ===
    // 位于地图最右侧边缘，贯穿上下
    { id: 'plot_fareast', templateId: 'fareast', x: 4100, y: 50 },
    // 教育园区 (位于中间偏右，Service 右边)
    { id: 'plot_edu', templateId: 'education', x: 2850, y: 20 }
];