import { WorldPlot, Furniture } from '../types';

// ==========================================
// 🗺️ 39 格地图完整布局 (优化版 v2)
// 画布尺寸参考: 3200 x 2200
// 布局策略: 分为 5 个纵向层级 (Y-Bands)，横向分散排列，杜绝重叠
// ==========================================

const BUILDINGS: WorldPlot[] = [];

// ==========================================
// 第 1 层: 北部边缘 (Y: 50) - 教育与居住
// ==========================================
BUILDINGS.push(
    // 西北角居住群 (Apt Cheap: 300x300)
    { id: "p_nw_1", templateId: "apt_cheap", x: 50, y: 50, customType: "residential", customName: "学区房A栋" },
    { id: "p_nw_2", templateId: "apt_cheap", x: 380, y: 50, customType: "residential", customName: "学区房B栋" },
    
    // 教育区 (School: 600x400 / 500x400)
    { id: "p_edu_1", templateId: "school_high", x: 750, y: 50, customType: "public", customName: "第一中学" },
    { id: "p_edu_2", templateId: "school_elem", x: 1400, y: 50, customType: "public", customName: "实验小学" },
    
    // 东北配套 (Kindergarten: 400x300)
    { id: "p_ne_mix1", templateId: "kindergarten", x: 1950, y: 50, customType: "public", customName: "双语幼儿园" },
    
    // 东北居住群 (Apt Luxury: 400x350)
    { id: "p_ne_1", templateId: "apt_luxury", x: 2400, y: 50, customType: "residential", customName: "汤臣一品A" },
    { id: "p_ne_2", templateId: "apt_luxury", x: 2850, y: 50, customType: "residential", customName: "汤臣一品B" }
);

// ==========================================
// 第 2 层: 上部核心 (Y: 500) - 商务与内环北
// ==========================================
BUILDINGS.push(
    // 西北下居住 (Apt Cheap: 300x300)
    { id: "p_nw_3", templateId: "apt_cheap", x: 50, y: 500, customType: "residential", customName: "学区房C栋" },
    { id: "p_nw_4", templateId: "apt_cheap", x: 380, y: 500, customType: "residential", customName: "学区房D栋" },
    
    // 内环西北角 (Cafe: 300x300)
    { id: "p_in_c1", templateId: "cafe", x: 750, y: 550, customType: "commercial", customName: "星巴克" },
    
    // 内环北 (IT/Biz Large: 600x400)
    { id: "p_in_n1", templateId: "it_l", x: 1100, y: 500, customType: "work", customName: "字节跳动大厦" },
    { id: "p_in_n2", templateId: "biz_l", x: 1750, y: 500, customType: "work", customName: "环球金融中心" },
    
    // 内环东北角 (Bookstore: 300x300)
    { id: "p_in_c2", templateId: "store_book", x: 2400, y: 550, customType: "commercial", customName: "新华书店" },
    
    // 东北居住群延伸 (Apt Luxury: 400x350)
    { id: "p_ne_3", templateId: "apt_luxury", x: 2800, y: 500, customType: "residential", customName: "汤臣一品C" }
);

// ==========================================
// 第 3 层: 中央腰部 (Y: 950) - 核心地标
// ==========================================
BUILDINGS.push(
    // 西侧边缘 (Design S: 400x300)
    { id: "p_w_edge1", templateId: "design_s", x: 50, y: 950, customType: "work", customName: "设计工作室" },
    
    // 内环西 (Design L: 600x400)
    { id: "p_in_w", templateId: "design_l", x: 500, y: 950, customType: "work", customName: "4A广告公司" },
    
    // ⭐ 中央地标 (Gallery: 400x300) -> 居中
    { id: "p_center", templateId: "gallery", x: 1300, y: 1000, customType: "public", customName: "市美术馆" },
    
    // 内环东 (Hospital: 600x400)
    { id: "p_in_e", templateId: "hospital", x: 1800, y: 950, customType: "public", customName: "三甲医院" },
    
    // 东侧边缘 (Library: 400x300)
    { id: "p_e_edge1", templateId: "library", x: 2450, y: 950, customType: "public", customName: "社区图书馆" },
    
    // 东北居住尾部 (Apt Luxury: 400x350)
    { id: "p_ne_4", templateId: "apt_luxury", x: 2900, y: 950, customType: "residential", customName: "汤臣一品D" }
);

// ==========================================
// 第 4 层: 下部核心 (Y: 1400) - 商业与娱乐
// ==========================================
BUILDINGS.push(
    // 西南居住/办公 (IT S: 400x300)
    { id: "p_sw_1", templateId: "it_s", x: 50, y: 1400, customType: "work", customName: "创业孵化器" },
    
    // 内环西南角 (Netcafe: 300x300)
    { id: "p_in_c3", templateId: "netcafe", x: 500, y: 1450, customType: "commercial", customName: "极速网咖" },
    
    // 内环南 (Super L / Cinema: 600x400 / 400x400)
    { id: "p_in_s1", templateId: "super_l", x: 900, y: 1400, customType: "commercial", customName: "沃尔玛超市" },
    { id: "p_in_s2", templateId: "cinema", x: 1550, y: 1400, customType: "commercial", customName: "万达影城" },
    
    // 内环东南角 (Clothes: 300x300)
    { id: "p_in_c4", templateId: "store_clothes", x: 2000, y: 1450, customType: "commercial", customName: "优衣库" },
    
    // 东南别墅区 (Villa: 500x400)
    { id: "p_se_1", templateId: "villa", x: 2400, y: 1400, customType: "residential", customName: "半山别墅1号" }
);

// ==========================================
// 第 5 层: 南部边缘 (Y: 1850) - 混合生活区
// ==========================================
BUILDINGS.push(
    // 西南混合区 (Biz S / Super M / Restaurant)
    { id: "p_sw_2", templateId: "biz_s", x: 50, y: 1800, customType: "work", customName: "事务所" },
    { id: "p_sw_3", templateId: "super_m", x: 500, y: 1800, customType: "commercial", customName: "便利蜂" },
    { id: "p_sw_4", templateId: "restaurant", x: 950, y: 1800, customType: "commercial", customName: "中华料理" },
    
    // 南部填充 (Apt Cheap: 300x300)
    { id: "p_fill_s", templateId: "apt_cheap", x: 1400, y: 1850, customType: "residential", customName: "青年旅社" },
    
    // 东南养老区 (Elder: 500x400)
    { id: "p_se_mix", templateId: "elder_home", x: 1750, y: 1800, customType: "residential", customName: "夕阳红养老院" },
    
    // 东南别墅 (Villa: 500x400)
    { id: "p_se_2", templateId: "villa", x: 2300, y: 1800, customType: "residential", customName: "半山别墅2号" },
    
    // 东南角娱乐 (Nightclub: 400x400)
    { id: "p_e_edge2", templateId: "nightclub_full", x: 2850, y: 1800, customType: "commercial", customName: "不夜城" }
);

// 填充物：可选的道路或小装饰
// BUILDINGS.push({ id: "road_1", templateId: "road_h", x: 0, y: 400, customType: "public", customName: "主干道" });

export const WORLD_LAYOUT = BUILDINGS;
export const STREET_PROPS: Furniture[] = [];