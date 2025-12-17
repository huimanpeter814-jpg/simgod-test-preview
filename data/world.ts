import { WorldPlot, Furniture } from '../types';

// ==========================================
// 🏙️ 城市布局配置 (World Layout Configuration)
// ==========================================

// 基础网格参数
const COL_X = [60, 700, 1340, 1980, 2620, 3260]; // 6列 (最后1列用于溢出建筑)
const ROW_Y = [60, 600, 1140, 1680, 2220];       // 5行

// 道路位置参数 (位于地块之间)
// Horizontal Roads (Y坐标): 位于 Row 1, 2, 3, 4 下方
const ROAD_H_Y = [480, 1020, 1560, 2100]; 
// Vertical Roads (X坐标): 位于 Col 1, 2, 3, 4, 5 右侧
const ROAD_V_X = [580, 1220, 1860, 2500, 3140];

// ==========================================
// 1. 建筑地块列表 (Buildings)
// ==========================================
const BUILDINGS: WorldPlot[] = [
    // --- Row 1: CBD & Medical (工作重心) ---
    { id: "p_tech", templateId: "tech", x: COL_X[0], y: ROW_Y[0], customType: "work", customName: "科技园区" },
    { id: "p_fin", templateId: "finance", x: COL_X[1], y: ROW_Y[0], customType: "work", customName: "金融中心" },
    { id: "p_des", templateId: "design", x: COL_X[2], y: ROW_Y[0], customType: "work", customName: "创意园" },
    { id: "p_hosp", templateId: "hospital", x: COL_X[3], y: ROW_Y[0], customType: "public", customName: "市第一医院" }, // 🆕 医院
    { id: "p_serv1", templateId: "service", x: COL_X[4], y: ROW_Y[0], customType: "public", customName: "市政服务A" },
    { id: "p_serv2", templateId: "service", x: COL_X[5], y: ROW_Y[0], customType: "public", customName: "公共服务B" }, // 溢出的服务区

    // --- Row 2: Residential High Density (人才公寓 x4 + 养老) ---
    { id: "p_dorm1", templateId: "dorm", x: COL_X[0], y: ROW_Y[1], customType: "residential", customName: "人才公寓1期" },
    { id: "p_dorm2", templateId: "dorm", x: COL_X[1], y: ROW_Y[1], customType: "residential", customName: "人才公寓2期" },
    { id: "p_dorm3", templateId: "dorm", x: COL_X[2], y: ROW_Y[1], customType: "residential", customName: "人才公寓3期" },
    { id: "p_dorm4", templateId: "dorm", x: COL_X[3], y: ROW_Y[1], customType: "residential", customName: "人才公寓4期" },
    { id: "p_elder", templateId: "elder_care", x: COL_X[4], y: ROW_Y[1], customType: "residential", customName: "夕阳红养老院" }, // 🆕 养老院

    // --- Row 3: Residential Medium (公寓 x5) ---
    { id: "p_apt1", templateId: "apartment", x: COL_X[0], y: ROW_Y[2], customType: "residential", customName: "幸福公寓A" },
    { id: "p_apt2", templateId: "apartment", x: COL_X[1], y: ROW_Y[2], customType: "residential", customName: "幸福公寓B" },
    { id: "p_apt3", templateId: "apartment", x: COL_X[2], y: ROW_Y[2], customType: "residential", customName: "幸福公寓C" },
    { id: "p_apt4", templateId: "apartment", x: COL_X[3], y: ROW_Y[2], customType: "residential", customName: "幸福公寓D" },
    { id: "p_apt5", templateId: "apartment", x: COL_X[4], y: ROW_Y[2], customType: "residential", customName: "幸福公寓E" },

    // --- Row 4: Commercial & Kids (商业 x2 + 超市 + 幼儿园 + 小学) ---
    { id: "p_comm1", templateId: "commercial", x: COL_X[0], y: ROW_Y[3], customType: "commercial", customName: "万达广场" },
    { id: "p_comm2", templateId: "commercial", x: COL_X[1], y: ROW_Y[3], customType: "commercial", customName: "银泰城" },
    { id: "p_super", templateId: "supermarket", x: COL_X[2], y: ROW_Y[3], customType: "commercial", customName: "沃尔玛特" }, // 🆕 超市
    { id: "p_kg", templateId: "kindergarten", x: COL_X[3], y: ROW_Y[3], customType: "public", customName: "向日葵幼儿园" },
    { id: "p_elem", templateId: "elementary", x: COL_X[4], y: ROW_Y[3], customType: "public", customName: "第一小学" },

    // --- Row 5: Leisure & Education (别墅 x2 + 公园 + 中学 + 公寓 x1 + 夜生活) ---
    { id: "p_villa1", templateId: "villa", x: COL_X[0], y: ROW_Y[4], customType: "residential", customName: "湖畔别墅A" },
    { id: "p_villa2", templateId: "villa", x: COL_X[1], y: ROW_Y[4], customType: "residential", customName: "湖畔别墅B" },
    { id: "p_park", templateId: "park", x: COL_X[2], y: ROW_Y[4], customType: "public", customName: "中央公园" },
    { id: "p_high", templateId: "high_school", x: COL_X[3], y: ROW_Y[4], customType: "public", customName: "星海中学" },
    { id: "p_apt6", templateId: "apartment", x: COL_X[4], y: ROW_Y[4], customType: "residential", customName: "学区公寓" }, // 第6栋公寓
    { id: "p_night", templateId: "nightlife", x: COL_X[5], y: ROW_Y[4], customType: "commercial", customName: "不夜城" }, // 娱乐区放在角落
];

// ==========================================
// 2. 道路生成逻辑 (Roads)
// ==========================================
const ROADS: WorldPlot[] = [];

// 生成水平道路 (Horizontal Rows)
ROAD_H_Y.forEach((y, rIndex) => {
    // 覆盖整个宽度的道路段 (分段生成以便于管理点击事件，虽然道路目前不可点击)
    // 这里的长度覆盖所有列 + 额外区域
    const totalWidth = 3800; 
    const segmentWidth = 500;
    const segments = Math.ceil(totalWidth / segmentWidth);
    
    for (let i = 0; i < segments; i++) {
        ROADS.push({
            id: `road_h_${rIndex}_${i}`,
            templateId: "road_h",
            x: i * segmentWidth,
            y: y
        });
    }
});

// 生成垂直道路 (Vertical Columns)
ROAD_V_X.forEach((x, cIndex) => {
    // 覆盖整个高度的道路段
    const totalHeight = 2800;
    const segmentHeight = 500;
    const segments = Math.ceil(totalHeight / segmentHeight);

    for (let i = 0; i < segments; i++) {
        ROADS.push({
            id: `road_v_${cIndex}_${i}`,
            templateId: "road_v",
            x: x,
            y: i * segmentHeight
        });
    }
});

// 生成十字路口 (Intersections)
// 在水平路和垂直路的交汇处覆盖十字路口贴图
ROAD_H_Y.forEach((y, rIndex) => {
    ROAD_V_X.forEach((x, cIndex) => {
        ROADS.push({
            id: `cross_${rIndex}_${cIndex}`,
            templateId: "road_cross",
            x: x,
            y: y
        });
    });
});

// ==========================================
// 3. 装饰物与导出 (Exports)
// ==========================================

export const WORLD_LAYOUT: WorldPlot[] = [
    ...BUILDINGS,
    ...ROADS
];

// 预设的路边设施 (家具)
export const STREET_PROPS: Furniture[] = [
    // --- 第一排路边 (CBD区) ---
    { id: "vending_1", x: 590, y: 490, w: 44, h: 34, color: "#ff5252", label: "可乐机", utility: "buy_drink", pixelPattern: "vending" },
    { id: "trash_1", x: 640, y: 490, w: 24, h: 24, color: "#2c3e50", label: "垃圾桶", utility: "none", pixelPattern: "trash" },
    { id: "tree_1", x: 1230, y: 490, w: 42, h: 42, color: "#253048", label: "梧桐", utility: "none", pixelPattern: "tree_pixel", pixelOutline: true },
    { id: "bench_1", x: 1280, y: 490, w: 50, h: 24, color: "#e17055", label: "长椅", utility: "comfort", pixelPattern: "bench_park" },
    
    // --- 第二排路边 (居住区) ---
    { id: "vending_2", x: 590, y: 1030, w: 44, h: 34, color: "#4a7dff", label: "水机", utility: "buy_drink", pixelPattern: "vending" },
    { id: "hydrant_1", x: 1200, y: 1030, w: 18, h: 18, color: "#ff5252", label: "消防栓", utility: "none", pixelOutline: true },
    { id: "tree_2", x: 1870, y: 1030, w: 42, h: 42, color: "#253048", label: "梧桐", utility: "none", pixelPattern: "tree_pixel", pixelOutline: true },
    
    // --- 第三排路边 (商圈) ---
    { id: "bench_2", x: 590, y: 1570, w: 50, h: 24, color: "#e17055", label: "长椅", utility: "comfort", pixelPattern: "bench_park" },
    { id: "trash_2", x: 1230, y: 1570, w: 24, h: 24, color: "#2c3e50", label: "垃圾桶", utility: "none", pixelPattern: "trash" },
    { id: "vending_3", x: 1870, y: 1570, w: 44, h: 34, color: "#ffdd59", label: "零食机", utility: "buy_food", pixelPattern: "vending" },

    // --- 第四排路边 (休闲区) ---
    { id: "hydrant_2", x: 600, y: 2110, w: 18, h: 18, color: "#ff5252", label: "消防栓", utility: "none", pixelOutline: true },
    { id: "tree_3", x: 1230, y: 2110, w: 42, h: 42, color: "#253048", label: "梧桐", utility: "none", pixelPattern: "tree_pixel", pixelOutline: true },
    { id: "tree_4", x: 1870, y: 2110, w: 42, h: 42, color: "#253048", label: "梧桐", utility: "none", pixelPattern: "tree_pixel", pixelOutline: true },
];