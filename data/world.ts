import { WorldPlot, Furniture } from '../types';

// ==========================================
// 🗺️ 39 格地图完整布局 (恢复版)
// 画布尺寸: 3280 x 2200
// ==========================================

const BUILDINGS: WorldPlot[] = [];

// ==========================================
// 第 1 层: 北部 (教育与居住) - Y: 50
// ==========================================
BUILDINGS.push(
    // 🏫 教育区
    { id: "edu_high", templateId: "school_high", x: 50, y: 50, customType: "public", customName: "第一中学" },
    { id: "edu_elem", templateId: "school_elem", x: 700, y: 50, customType: "public", customName: "实验小学" },
    { id: "edu_kg", templateId: "kindergarten", x: 1350, y: 50, customType: "public", customName: "向日葵幼儿园" },
    { id: "lib", templateId: "library", x: 1800, y: 50, customType: "public", customName: "市图书馆" },
    
    // 🏡 豪宅区
    { id: "villa_1", templateId: "villa_wide", x: 2350, y: 50, customType: "residential", customName: "山顶别墅A" },
    { id: "villa_2", templateId: "villa_wide", x: 3000, y: 50, customType: "residential", customName: "山顶别墅B" } // 稍微出界，但画布够大
);

// ==========================================
// 第 2 层: 核心商务区 (CBD) - Y: 600
// ==========================================
BUILDINGS.push(
    // 🏢 办公楼群
    { id: "tech_1", templateId: "tech_hq", x: 50, y: 600, customType: "work", customName: "字节跳动大厦" },
    { id: "fin_1", templateId: "finance_center", x: 700, y: 600, customType: "work", customName: "环球金融中心" },
    { id: "cre_1", templateId: "creative_park", x: 1250, y: 600, customType: "work", customName: "798创意园" },
    
    // ☕ 配套商业
    { id: "cafe_cbd", templateId: "cafe", x: 1800, y: 650, customType: "commercial", customName: "星巴克" },
    { id: "apt_cbd1", templateId: "apt_luxury", x: 2150, y: 600, customType: "residential", customName: "人才公寓A" },
    { id: "apt_cbd2", templateId: "apt_luxury", x: 2600, y: 600, customType: "residential", customName: "人才公寓B" }
);

// ==========================================
// 第 3 层: 医疗与健康 (Health) - Y: 1150
// ==========================================
BUILDINGS.push(
    // 🏥 医院 & 健身
    { id: "hosp_1", templateId: "hospital_l", x: 50, y: 1150, customType: "public", customName: "三甲医院" },
    { id: "gym_1", templateId: "gym_center", x: 700, y: 1150, customType: "public", customName: "24h健身房" },
    
    // 👴 养老区
    { id: "elder_1", templateId: "elder_home", x: 1250, y: 1150, customType: "residential", customName: "夕阳红养老院" },
    
    // 🍔 生活区
    { id: "rest_1", templateId: "restaurant", x: 1800, y: 1200, customType: "commercial", customName: "海底捞" },
    { id: "apt_mid1", templateId: "apt_luxury", x: 2250, y: 1150, customType: "residential", customName: "中产小区A" },
    { id: "apt_mid2", templateId: "apt_luxury", x: 2700, y: 1150, customType: "residential", customName: "中产小区B" }
);

// ==========================================
// 第 4 层: 娱乐与商业 (Entertainment) - Y: 1650
// ==========================================
BUILDINGS.push(
    // 🛍️ 商圈
    { id: "mall_1", templateId: "super_l", x: 50, y: 1650, customType: "commercial", customName: "万达广场" },
    { id: "cinema_1", templateId: "cinema", x: 700, y: 1650, customType: "commercial", customName: "IMAX影城" },
    { id: "club_1", templateId: "nightclub", x: 1150, y: 1650, customType: "commercial", customName: "Space Club" },
    
    // 🎮 休闲
    { id: "net_1", templateId: "netcafe", x: 1700, y: 1700, customType: "commercial", customName: "极速网咖" },
    
    // 🏘️ 廉租区
    { id: "apt_low1", templateId: "apt_luxury", x: 2050, y: 1650, customType: "residential", customName: "青年旅社A" },
    { id: "apt_low2", templateId: "apt_luxury", x: 2500, y: 1650, customType: "residential", customName: "青年旅社B" }
);

export const WORLD_LAYOUT = BUILDINGS;
export const STREET_PROPS: Furniture[] = [];