import { WorldPlot, Furniture } from '../types';

// 城市规划网格：6列 x 5行
// 坐标系：
// X: 60, 700, 1340, 1980, 2620, 3260
// Y: 60, 600, 1140, 1680, 2220
const C = [60, 700, 1340, 1980, 2620, 3260];
const R = [60, 600, 1140, 1680, 2220];

export const WORLD_LAYOUT: WorldPlot[] = [
    // === 第一区：中央商务区 (CBD) & 医疗 ===
    // 聚集了高薪产业和核心服务
    { id: "p_tech", templateId: "tech", x: C[0], y: R[0], customType: "work", customName: "硅谷科技园" },
    { id: "p_fin", templateId: "finance", x: C[1], y: R[0], customType: "work", customName: "环球金融中心" },
    { id: "p_hosp", templateId: "hospital", x: C[2], y: R[0], customType: "public", customName: "圣心综合医院" },
    { id: "p_des", templateId: "design", x: C[3], y: R[0], customType: "work", customName: "798创意工坊" },
    { id: "p_serv1", templateId: "service", x: C[4], y: R[0], customType: "public", customName: "市民办事大厅" },

    // === 第二区：高密度居住区 & 养老 ===
    // 主要是单身公寓和老人院，紧邻CBD，方便上班/就医
    { id: "p_dorm1", templateId: "dorm", x: C[0], y: R[1], customType: "residential", customName: "青年公寓A" },
    { id: "p_dorm2", templateId: "dorm", x: C[1], y: R[1], customType: "residential", customName: "青年公寓B" },
    { id: "p_elder", templateId: "elder_care", x: C[2], y: R[1], customType: "residential", customName: "松鹤养老院" }, // 养老院在居住区中心，靠近医院
    { id: "p_dorm3", templateId: "dorm", x: C[3], y: R[1], customType: "residential", customName: "青年公寓C" },
    { id: "p_dorm4", templateId: "dorm", x: C[4], y: R[1], customType: "residential", customName: "青年公寓D" },

    // === 第三区：家庭居住区 & 超市 ===
    // 公寓楼集中，配套大型超市，生活气息浓厚
    { id: "p_apt1", templateId: "apartment", x: C[0], y: R[2], customType: "residential", customName: "阳光小区1号楼" },
    { id: "p_apt2", templateId: "apartment", x: C[1], y: R[2], customType: "residential", customName: "阳光小区2号楼" },
    { id: "p_super", templateId: "supermarket", x: C[2], y: R[2], customType: "commercial", customName: "沃尔玛特超市" }, // 核心商业配套
    { id: "p_apt3", templateId: "apartment", x: C[3], y: R[2], customType: "residential", customName: "阳光小区3号楼" },
    { id: "p_apt4", templateId: "apartment", x: C[4], y: R[2], customType: "residential", customName: "阳光小区4号楼" },

    // === 第四区：教育学区 ===
    // 幼儿园、小学、中学一条龙，还有学区房
    { id: "p_apt5", templateId: "apartment", x: C[0], y: R[3], customType: "residential", customName: "学区房A" },
    { id: "p_kg", templateId: "kindergarten", x: C[1], y: R[3], customType: "public", customName: "花朵幼儿园" },
    { id: "p_elem", templateId: "elementary", x: C[2], y: R[3], customType: "public", customName: "实验小学" },
    { id: "p_high", templateId: "high_school", x: C[3], y: R[3], customType: "public", customName: "第一中学" },
    { id: "p_apt6", templateId: "apartment", x: C[4], y: R[3], customType: "residential", customName: "学区房B" },

    // === 第五区：休闲娱乐区 & 富人区 ===
    // 远离喧嚣，靠近公园和湖泊
    { id: "p_villa1", templateId: "villa", x: C[0], y: R[4], customType: "residential", customName: "云顶别墅" },
    { id: "p_park", templateId: "park", x: C[1], y: R[4], customType: "public", customName: "中央公园" },
    { id: "p_comm1", templateId: "commercial", x: C[2], y: R[4], customType: "commercial", customName: "万达广场" },
    { id: "p_comm2", templateId: "commercial", x: C[3], y: R[4], customType: "commercial", customName: "银泰城" },
    { id: "p_villa2", templateId: "villa", x: C[4], y: R[4], customType: "residential", customName: "湖畔官邸" },
    
    // 补充：角落里的夜生活/服务
    { id: "p_night", templateId: "nightlife", x: C[5], y: R[4], customType: "commercial", customName: "兰桂坊" },
    { id: "p_serv2", templateId: "service", x: C[5], y: R[0], customType: "public", customName: "社区图书馆" },
];

// --- 道路网络生成 ---
const ROAD_Y = [480, 1020, 1560, 2100];
const ROAD_X = [580, 1220, 1860, 2500, 3140];

// 水平道路
ROAD_Y.forEach((y, idx) => {
    const width = 3800; // 覆盖所有列
    const segs = Math.ceil(width / 500);
    for(let i=0; i<segs; i++) {
        WORLD_LAYOUT.push({ id: `rh_${idx}_${i}`, templateId: 'road_h', x: i*500, y });
    }
});

// 垂直道路
ROAD_X.forEach((x, idx) => {
    const height = 2800;
    const segs = Math.ceil(height / 500);
    for(let i=0; i<segs; i++) {
        WORLD_LAYOUT.push({ id: `rv_${idx}_${i}`, templateId: 'road_v', x, y: i*500 });
    }
});

// 十字路口
ROAD_Y.forEach((y, ry) => {
    ROAD_X.forEach((x, rx) => {
        WORLD_LAYOUT.push({ id: `cross_${ry}_${rx}`, templateId: 'road_cross', x, y });
    });
});

export const STREET_PROPS: Furniture[] = [
    // CBD区：现代感
    { id: "v1", x: 590, y: 490, w: 44, h: 34, color: "#ff5252", label: "咖啡机", utility: "buy_drink", pixelPattern: "vending" },
    { id: "t1", x: 640, y: 490, w: 24, h: 24, color: "#2c3e50", label: "垃圾桶", utility: "none", pixelPattern: "trash" },
    
    // 居住区：生活感
    { id: "bench_1", x: 590, y: 1030, w: 50, h: 24, color: "#e17055", label: "长椅", utility: "comfort", pixelPattern: "bench_park" },
    { id: "tree_1", x: 1230, y: 1030, w: 42, h: 42, color: "#253048", label: "梧桐", utility: "none", pixelPattern: "tree_pixel", pixelOutline: true },
    
    // 商业区：热闹
    { id: "v2", x: 1230, y: 1570, w: 44, h: 34, color: "#ffdd59", label: "零食机", utility: "buy_food", pixelPattern: "vending" },
    { id: "hydrant", x: 1870, y: 1570, w: 18, h: 18, color: "#ff5252", label: "消防栓", utility: "none", pixelOutline: true },
    
    // 学区：安全
    { id: "tree_2", x: 1230, y: 2110, w: 42, h: 42, color: "#253048", label: "梧桐", utility: "none", pixelPattern: "tree_pixel", pixelOutline: true },
];