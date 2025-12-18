import { WorldPlot, Furniture } from '../types';

// ==========================================
// 🗺️ 3200x2147 地图坐标映射
// ==========================================

const BUILDINGS: WorldPlot[] = [];

// ------------------------------------------
// 1. 中央区域 (The Heart) - 1 Plot
// ------------------------------------------
// 对应图中正中央的绿色花园区域
BUILDINGS.push(
    { id: "p_center", templateId: "park_center", x: 1325, y: 850, customType: "public", customName: "中央纪念公园" }
);

// ------------------------------------------
// 2. 内环区域 (Inner Ring) - 10 Plots
// 对应围绕公园的一圈建筑：上下各2个宽块，左右各1个长块，四角各1个小块
// ------------------------------------------

// 上方 (North) - 商务核心
BUILDINGS.push(
    { id: "p_in_n1", templateId: "tech_hq", x: 1100, y: 510, customType: "work", customName: "云端科技" },
    { id: "p_in_n2", templateId: "tech_hq", x: 1720, y: 510, customType: "work", customName: "联合办公空间" } // 复用hq模板作为通用办公
);

// 下方 (South) - 商业核心
BUILDINGS.push(
    { id: "p_in_s1", templateId: "mall_wide", x: 1100, y: 1330, customType: "commercial", customName: "时代广场" },
    { id: "p_in_s2", templateId: "mall_wide", x: 1720, y: 1330, customType: "commercial", customName: "百货大楼" } // 超市逻辑可复用mall
);

// 左侧 (West) - 市政/设计
BUILDINGS.push(
    { id: "p_in_w", templateId: "design_v", x: 720, y: 850, customType: "work", customName: "市民中心" }
);

// 右侧 (East) - 医疗中心
BUILDINGS.push(
    { id: "p_in_e", templateId: "hospital_l", x: 2120, y: 880, customType: "public", customName: "中心医院" }
);

// 内环四角 (Inner Corners) - 小店/配套
BUILDINGS.push(
    { id: "p_in_c1", templateId: "shop_s", x: 860, y: 620, customType: "commercial", customName: "咖啡屋" },   // NW
    { id: "p_in_c2", templateId: "shop_s", x: 2140, y: 620, customType: "commercial", customName: "书店" },     // NE
    { id: "p_in_c3", templateId: "shop_s", x: 860, y: 1330, customType: "commercial", customName: "夜店" },     // SW
    { id: "p_in_c4", templateId: "shop_s", x: 2140, y: 1330, customType: "commercial", customName: "药房" }    // SE
);


// ------------------------------------------
// 3. 外环区域 (Outer Ring) - 28 Plots
// ------------------------------------------

// --- A. 左上角群落 (NW Cluster) --- 
// 图片左上角的大方块区域，细分为居住和教育
// 这里的 "大方块" 我们拆成4个小公寓，外加旁边的学校
BUILDINGS.push(
    // 角落居住群 (4个紧凑公寓)
    { id: "p_nw_1", templateId: "apt_small", x: 60, y: 60, customType: "residential", customName: "学府一号A" },
    { id: "p_nw_2", templateId: "apt_small", x: 380, y: 60, customType: "residential", customName: "学府一号B" },
    { id: "p_nw_3", templateId: "apt_small", x: 60, y: 380, customType: "residential", customName: "学府一号C" },
    { id: "p_nw_4", templateId: "apt_small", x: 380, y: 380, customType: "residential", customName: "学府一号D" },
    // 往右延伸的学校区
    { id: "p_edu_1", templateId: "school_l", x: 750, y: 60, customType: "public", customName: "第一中学" },
    { id: "p_edu_2", templateId: "school_l", x: 1400, y: 60, customType: "public", customName: "实验小学" }
);

// --- B. 右上角群落 (NE Cluster) ---
// 图片右上角，设定为混合居住与高端配套
BUILDINGS.push(
    // 往左延伸的区域
    { id: "p_ne_mix1", templateId: "dorm_std", x: 2050, y: 60, customType: "residential", customName: "青年公寓A" },
    // 角落居住群 (4个紧凑公寓)
    { id: "p_ne_1", templateId: "apt_small", x: 2520, y: 60, customType: "residential", customName: "滨江苑A" },
    { id: "p_ne_2", templateId: "apt_small", x: 2840, y: 60, customType: "residential", customName: "滨江苑B" },
    { id: "p_ne_3", templateId: "apt_small", x: 2520, y: 380, customType: "residential", customName: "滨江苑C" },
    { id: "p_ne_4", templateId: "apt_small", x: 2840, y: 380, customType: "residential", customName: "滨江苑D" }
);

// --- C. 左下角群落 (SW Cluster) ---
// 设定为普通居民区
BUILDINGS.push(
    // 角落居住群
    { id: "p_sw_1", templateId: "apt_small", x: 60, y: 1450, customType: "residential", customName: "幸福里A" },
    { id: "p_sw_2", templateId: "apt_small", x: 380, y: 1450, customType: "residential", customName: "幸福里B" },
    { id: "p_sw_3", templateId: "apt_small", x: 60, y: 1770, customType: "residential", customName: "幸福里C" },
    { id: "p_sw_4", templateId: "apt_small", x: 380, y: 1770, customType: "residential", customName: "幸福里D" },
    // 往右延伸的配套
    { id: "p_serv_sw", templateId: "dorm_std", x: 750, y: 1700, customType: "residential", customName: "职工宿舍" },
    { id: "p_gym_sw", templateId: "school_l", x: 1200, y: 1700, customType: "public", customName: "体育中心" } // 复用学校模板作为体育馆
);

// --- D. 右下角群落 (SE Cluster) ---
// 设定为富人区/养老区 (风景好)
BUILDINGS.push(
    // 往左延伸的区域
    { id: "p_se_mix", templateId: "dorm_std", x: 2000, y: 1700, customType: "residential", customName: "夕阳红养老院" },
    // 角落别墅群 (这里用稍大的地块)
    { id: "p_se_1", templateId: "villa_wide", x: 2520, y: 1450, customType: "residential", customName: "湖畔别墅1" },
    { id: "p_se_2", templateId: "villa_wide", x: 2520, y: 1820, customType: "residential", customName: "湖畔别墅2" }
);

// --- E. 左右两侧垂直填充 (Vertical Fillers) ---
// 对应图片最左和最右中间的竖向长条区域

// 左侧 (West Edge)
BUILDINGS.push(
    { id: "p_w_edge1", templateId: "design_v", x: 150, y: 750, customType: "work", customName: "SOHO办公A" },
    { id: "p_w_edge2", templateId: "design_v", x: 150, y: 1220, customType: "work", customName: "SOHO办公B" }
);

// 右侧 (East Edge)
BUILDINGS.push(
    { id: "p_e_edge1", templateId: "design_v", x: 2700, y: 750, customType: "work", customName: "创意工坊A" },
    { id: "p_e_edge2", templateId: "design_v", x: 2700, y: 1220, customType: "work", customName: "创意工坊B" }
);

// 统计 check:
// Center: 1
// Inner: 2(N) + 2(S) + 1(W) + 1(E) + 4(Corners) = 10
// Outer NW: 4(Apt) + 2(Edu) = 6
// Outer NE: 1(Dorm) + 4(Apt) = 5
// Outer SW: 4(Apt) + 2(Mix) = 6
// Outer SE: 1(Elder) + 2(Villa) = 3
// Outer Sides: 2(W) + 2(E) = 4
// Total: 1 + 10 + 6 + 5 + 6 + 3 + 4 = 35 Plots.
// 还需要4个? 我们在上下两排的大空地再加塞几个。

BUILDINGS.push(
    { id: "p_fill_n", templateId: "dorm_std", x: 1800, y: 60, customType: "public", customName: "图书馆" }, // Top row filler
    { id: "p_fill_s", templateId: "dorm_std", x: 1650, y: 1700, customType: "commercial", customName: "电影院" }, // Bottom row filler
    { id: "p_fill_w", templateId: "shop_s", x: 500, y: 880, customType: "commercial", customName: "报刊亭" }, // West gap
    { id: "p_fill_e", templateId: "shop_s", x: 2550, y: 880, customType: "commercial", customName: "花店" } // East gap
);
// Total = 39 Plots. Perfect.

export const WORLD_LAYOUT = BUILDINGS;
export const STREET_PROPS: Furniture[] = []; // 可根据需要添加路灯/长椅