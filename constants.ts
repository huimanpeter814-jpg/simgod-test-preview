/// <reference types="vite/client" />
import { Furniture, Job } from './types';

// 1. 资源加载
const faceFiles = import.meta.glob('/public/assets/face/*.{png,jpg,jpeg,webp}', { eager: true });
const hairFiles = import.meta.glob('/public/assets/hair/*.{png,jpg,jpeg,webp}', { eager: true });
const clothesFiles = import.meta.glob('/public/assets/clothes/*.{png,jpg,jpeg,webp}', { eager: true });
const pantsFiles = import.meta.glob('/public/assets/pants/*.{png,jpg,jpeg,webp}', { eager: true });

function getPathsFromGlob(globResult: Record<string, unknown>): string[] {
    return Object.keys(globResult).map(path => path.replace(/^\/public/, ''));
}

export const ASSET_CONFIG = {
    face: getPathsFromGlob(faceFiles),
    hair: getPathsFromGlob(hairFiles),
    clothes: getPathsFromGlob(clothesFiles),
    pants: getPathsFromGlob(pantsFiles)
};

// ==========================================
// 🎨 审美核心：高级像素配色 (Premium Pixel Palette)
// ==========================================

const PALETTE = {
    // 基础环境色 (低饱和，耐看)
    ground_concrete: '#e3e4e8', // 浅灰水泥地
    ground_asphalt: '#3d404b',  // 深蓝灰柏油路
    ground_grass_light: '#9bc5a2', // 清新草绿
    ground_grass_dark: '#7fb088',  // 深草绿
    ground_water: '#89ccd9',    // 通透水蓝
    ground_wood: '#dcc6aa',     // 温暖木地板
    
    // 建筑色 (带情绪倾向)
    build_glass: '#d4e4ed',     // 办公楼玻璃感
    build_brick: '#e8d3c5',     // 住宅暖砖
    build_dark: '#2c3e50',      // 商业区暗色调
    
    // 点缀色 (用于家具和道具)
    accent_red: '#e07b7b',      // 柔和红
    accent_blue: '#7dafd9',     // 灰蓝
    accent_yellow: '#ebd388',   // 奶酪黄
    accent_purple: '#bcaad6',   // 香芋紫
    accent_green: '#8ec7b6',    // 薄荷绿
};

export const CONFIG = {
    CANVAS_W: 3000,
    CANVAS_H: 1800,
    // 人物外观配色优化
    COLORS: {
        skin: ['#fcece3', '#f0d3c3', '#e0bda5', '#bfa088', '#8f6e56'], // 更真实的肤色梯度
        hair: ['#2b2b2b', '#4a3b32', '#8c6b5d', '#d9c2a3', '#a83f3f', '#3e5f8a'], // 降低纯黑，增加质感
        clothes: [
            '#e66767', // 珊瑚红
            '#f19066', // 蜜桃橙
            '#f5cd79', // 柔光黄
            '#63cdda', // 蒂芙尼蓝
            '#cf6a87', // 胭脂粉
            '#786fa6', // 薰衣草
            '#546de5'  // 矢车菊蓝
        ]
    }
};

// 2. 场景数据导出 (从单独文件引入)
// ==========================================
// 这里直接导出，保持对外接口不变，但数据源已迁移至 data/scene.ts
export { PALETTES, ROOMS, FURNITURE } from './data/scene';

export const ITEMS = [
    { id: 'drink', label: '冰美式', cost: 15, needs: { hunger: 2, fun: 5 }, trigger: 'street' },
    { id: 'book', label: '设计年鉴', cost: 60, needs: { fun: 10 }, skill: 'logic', skillVal: 5, trigger: 'smart' },
    { id: 'cinema_2d', label: '文艺片票', cost: 30, needs: { fun: 40 }, trigger: 'bored' },
    { id: 'cinema_3d', label: 'IMAX大片', cost: 60, needs: { fun: 60 }, trigger: 'rich' },
    { id: 'museum_ticket', label: '特展门票', cost: 50, buff: 'art_inspired', needs: { fun: 50 }, trigger: 'smart' },
    { id: 'gym_pass', label: '私教课', cost: 100, needs: { energy: -20 }, skill: 'athletics', skillVal: 5, trigger: 'active' },
    { id: 'medicine', label: '布洛芬', cost: 25, buff: 'well_rested', trigger: 'sad' },
    { id: 'game_coin', label: '代币', cost: 5, needs: { fun: 20 }, trigger: 'bored' },
];

export const SKILLS = [
    { id: 'cooking', label: '烹饪' }, { id: 'athletics', label: '健身' }, { id: 'music', label: '乐理' },
    { id: 'dancing', label: '舞感' }, { id: 'logic', label: '编程' }, { id: 'creativity', label: '审美' },
    { id: 'gardening', label: '种植' }, { id: 'fishing', label: '钓鱼' }
];

export const JOBS: Job[] = [
    { id: 'unemployed', title: '自由职业', level: 0, salary: 0, startHour: 0, endHour: 0, workDays: [] },

    // Internet Co
    { id: 'dev_intern', title: '初级码农', level: 1, salary: 400, startHour: 10, endHour: 19, companyType: 'internet', workDays: [1, 2, 3, 4, 5] },
    { id: 'developer', title: '全栈开发', level: 2, salary: 800, startHour: 10, endHour: 20, companyType: 'internet', workDays: [1, 2, 3, 4, 5] },
    { id: 'senior_dev', title: '架构师', level: 3, salary: 1500, startHour: 10, endHour: 18, companyType: 'internet', workDays: [1, 2, 3, 4, 5] },
    { id: 'cto', title: '合伙人', level: 4, salary: 3000, startHour: 11, endHour: 16, companyType: 'internet', workDays: [1, 2, 3, 4, 5] },

    // Design Co
    { id: 'design_intern', title: '绘图员', level: 1, salary: 300, startHour: 9, endHour: 18, companyType: 'design', workDays: [1, 2, 3, 4, 5] },
    { id: 'designer', title: '视觉设计', level: 2, salary: 600, startHour: 10, endHour: 19, companyType: 'design', workDays: [1, 2, 3, 4, 5] },
    { id: 'senior_designer', title: '主美', level: 3, salary: 1000, startHour: 10, endHour: 18, companyType: 'design', workDays: [1, 2, 3, 4, 5] },
    { id: 'art_director', title: '创意总监', level: 4, salary: 2000, startHour: 11, endHour: 16, companyType: 'design', workDays: [1, 2, 3, 4] },

    // Business Co
    { id: 'biz_intern', title: '行政专员', level: 1, salary: 250, startHour: 9, endHour: 17, companyType: 'business', workDays: [1, 2, 3, 4, 5] },
    { id: 'clerk_biz', title: '客户经理', level: 2, salary: 500, startHour: 9, endHour: 17, companyType: 'business', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'biz_supervisor', title: '运营总监', level: 3, salary: 1000, startHour: 9, endHour: 17, companyType: 'business', workDays: [1, 2, 3, 4, 5] },
    { id: 'manager', title: 'CEO', level: 4, salary: 2500, startHour: 10, endHour: 16, companyType: 'business', workDays: [1, 2, 3, 4, 5] },

    // Services (Store)
    { id: 'store_trainee', title: '理货员', level: 1, salary: 180, startHour: 8, endHour: 16, companyType: 'store', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'clerk_book', title: '导购', level: 2, salary: 300, startHour: 9, endHour: 17, companyType: 'store', workDays: [1, 2, 3, 4, 5, 6, 7] },
    { id: 'store_supervisor', title: '值班经理', level: 3, salary: 500, startHour: 9, endHour: 18, companyType: 'store', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'store_manager', title: '店长', level: 4, salary: 800, startHour: 10, endHour: 17, companyType: 'store', workDays: [1, 2, 3, 4, 5] },

    // Cinema
    { id: 'cinema_trainee', title: '检票员', level: 1, salary: 220, startHour: 10, endHour: 18, companyType: 'store', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'cinema_staff', title: '售票员', level: 2, salary: 380, startHour: 10, endHour: 19, companyType: 'store', workDays: [1, 2, 3, 4, 5, 6, 7] },

    // Services (Restaurant)
    { id: 'kitchen_helper', title: '打杂', level: 1, salary: 200, startHour: 10, endHour: 20, companyType: 'restaurant', workDays: [1, 2, 3, 4, 5, 6, 7] },
    { id: 'waiter', title: '服务员', level: 2, salary: 350, startHour: 11, endHour: 20, companyType: 'restaurant', workDays: [1, 2, 3, 4, 5, 6, 7] },
    { id: 'cook', title: '厨师', level: 3, salary: 600, startHour: 10, endHour: 20, companyType: 'restaurant', workDays: [1, 2, 3, 4, 5, 6] },
    { id: 'head_chef', title: '行政主厨', level: 4, salary: 1200, startHour: 10, endHour: 19, companyType: 'restaurant', workDays: [1, 2, 3, 4, 5] },

    //Library
    {id: 'library_staff', title: '图书管理员', level: 1, salary: 220, startHour: 9, endHour: 18, companyType: 'library', workDays: [1, 2, 3, 4, 5, 6, 7]}
];

export const BUFFS = {
    well_rested: { id: 'well_rested', label: '元气满满', type: 'good' as const, duration: 180 },
    stressed: { id: 'stressed', label: '社畜过劳', type: 'bad' as const, duration: 120 },
    in_love: { id: 'in_love', label: '恋爱脑', type: 'good' as const, duration: 300 },
    heartbroken: { id: 'heartbroken', label: '网抑云', type: 'bad' as const, duration: 400 },
    broke: { id: 'broke', label: '吃土焦虑', type: 'bad' as const, duration: 120 },
    rich_feel: { id: 'rich_feel', label: '暴富幻觉', type: 'good' as const, duration: 120 },
    gamer_joy: { id: 'gamer_joy', label: '高玩时刻', type: 'good' as const, duration: 90 },
    anxious: { id: 'anxious', label: '精神内耗', type: 'bad' as const, duration: 60 },
    movie_fun: { id: 'movie_fun', label: '精彩电影', type: 'good' as const, duration: 120 },
    good_meal: { id: 'good_meal', label: '碳水快乐', type: 'good' as const, duration: 120 },
    holiday_joy: { id: 'holiday_joy', label: '节日氛围', type: 'good' as const, duration: 240 },
    weekend_vibes: { id: 'weekend_vibes', label: '周末快乐', type: 'good' as const, duration: 200 },
    side_hustle_win: { id: 'side_hustle_win', label: '赚外快', type: 'good' as const, duration: 90 },
    promoted: { id: 'promoted', label: '升职加薪', type: 'good' as const, duration: 240 },
    demoted: { id: 'demoted', label: '背锅降职', type: 'bad' as const, duration: 240 },
    fired: { id: 'fired', label: '毕业优化', type: 'bad' as const, duration: 300 },
    art_inspired: { id: 'art_inspired', label: '缪斯降临', type: 'good' as const, duration: 150 },
    playful: { id: 'playful', label: '童心未泯', type: 'good' as const, duration: 90 },
    
    // [新] 负面状态 Buff
    lonely: { id: 'lonely', label: '孤独', type: 'bad' as const, duration: 60 },
    bored: { id: 'bored', label: '无聊', type: 'bad' as const, duration: 60 },
    smelly: { id: 'smelly', label: '邋遢', type: 'bad' as const, duration: 60 },
};

export const HOLIDAYS = [
    // --- 第一季度 ---
    { month: 1, day: 1, name: "元旦" },
    { month: 1, day: 15, name: "元宵灯会" }, // 农历模拟
    { month: 2, day: 14, name: "情人节" },
    { month: 3, day: 8, name: "女神节" },
    { month: 3, day: 12, name: "植树节" },
    
    // --- 第二季度 ---
    { month: 4, day: 1, name: "愚人节" },
    { month: 4, day: 5, name: "清明踏青" },
    { month: 5, day: 1, name: "劳动节" },
    { month: 5, day: 20, name: "网络情人节" }, // 520
    { month: 6, day: 1, name: "儿童节" },
    { month: 6, day: 18, name: "年中大促" }, // 618剁手
    
    // --- 第三季度 ---
    { month: 7, day: 7, name: "七夕" }, // 农历模拟
    { month: 8, day: 15, name: "中秋节" }, // 农历模拟
    { month: 9, day: 10, name: "教师节" },
    
    // --- 第四季度 ---
    { month: 10, day: 1, name: "国庆长假" },
    { month: 10, day: 24, name: "程序员节" }, // 1024
    { month: 10, day: 31, name: "万圣夜" },
    { month: 11, day: 11, name: "光棍节" }, // 双11
    { month: 12, day: 25, name: "圣诞节" },
    { month: 12, day: 31, name: "跨年夜" },
];

export const LIFE_GOALS = [
    // --- 经典追求 ---
    '财富自由', '行业大牛', '万人迷', '灵魂伴侣', '岁月静好',
    
    // --- 事业与名望 ---
    '上市敲钟', '诺贝尔奖', '顶级黑客', '米其林主厨', '全网爆红', 
    '政坛领袖', '地产大亨', '畅销书作家', '金牌制作人',
    
    // --- 生活方式 ---
    '环游世界', '猫狗双全', '隐居山林', '极简主义', '海岛庄园主',
    '派对之王', '美食探店', '健身狂魔', '游戏全成就',
    
    // --- 奇葩与特殊 ---
    '摸鱼之王', '外星接触', '长生不老', '收集癖', '八卦队长',
    '统治世界', '只想睡个好觉'
];

export const MBTI_TYPES = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

export const SURNAMES = [
    // --- Top 30 大姓 (覆盖率极高) ---
    '李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
    '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
    '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',

    // --- 常见姓氏 (补充) ---
    '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
    '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎',
    '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜',
    '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆',
    '郝', '孔', '崔', '康', '毛', '邱', '秦', '江', '史', '顾',
    '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤', '尹',
    '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文', '庞',

    // --- 文艺/小说/稀有姓 (增加格调) ---
    '欧阳', '上官', '慕容', '司徒', '皇甫', '诸葛', '南宫', '独孤',
    '霍', '裴', '阮', '祁', '虞', '岳', '梅', '童', '颜', '柳',
    '骆', '温', '莫', '蓝', '季', '安', '路', '穆', '艾', '卓',
    '向', '凌', '申', '屠', '詹', '关', '费', '纪', '屈', '项',
    '祝', '冷', '简', '饶', '空', '沙', '鞠', '丰', '暴', '琴'
];
export const GIVEN_NAMES = [
    // ====================
    // 🏷️ 单字区 (X) - 简洁有力
    // ====================
    // [自然意象]
    '风', '云', '雷', '雨', '雪', '霜', '雾', '电', '光', '影',
    '星', '辰', '月', '阳', '天', '地', '山', '川', '河', '海',
    '林', '森', '木', '叶', '花', '草', '竹', '梅', '兰', '菊',
    // [气质/美德]
    '仁', '义', '礼', '智', '信', '忠', '孝', '节', '勇', '和',
    '平', '安', '康', '健', '福', '禄', '寿', '喜', '乐', '欢',
    '真', '善', '美', '诚', '明', '哲', '理', '法', '文', '武',
    // [动作/状态]
    '飞', '翔', '腾', '跃', '奔', '跑', '走', '行', '立', '坐',
    '思', '想', '念', '感', '情', '爱', '恨', '愁', '苦', '痛',
    '起', '落', '沉', '浮', '进', '退', '攻', '守', '开', '合',
    // [修饰]
    '大', '小', '多', '少', '长', '短', '高', '低', '深', '浅',
    '红', '橙', '黄', '绿', '青', '蓝', '紫', '黑', '白', '灰',
    '金', '银', '铜', '铁', '玉', '石', '宝', '珠', '珍', '贵',
    // [特定风格]
    '坤', '策', '腾', '锋', '刚', '强', '伟', '杰', '涛', '超', // 经典男
    '娜', '静', '丽', '娟', '敏', '燕', '艳', '芳', '秀', '英', // 经典女
    '渊', '潜', '翎', '羽', '澜', '澈', '野', '阔', '修', '致', // 文艺
    '一', '三', '九', '百', '千', '万', '亿', '兆', '京', '垓', // 数字

    // ====================
    // 🏷️ 双字区 (XX) - 现代流行 & 古风
    // ====================
    // [现代流行 - 10后风格]
    '子轩', '梓涵', '一诺', '浩宇', '欣怡', '雨泽', '宇轩', '沐白',
    '诗涵', '依诺', '梓萱', '俊熙', '子墨', '梓豪', '亦辰', '语桐',
    '心悦', '晨曦', '若曦', '梦琪', '羽馨', '子睿', '梓睿', '嘉懿',
    // [都市言情/偶像剧]
    '星河', '云帆', '千寻', '若初', '顾北', '南风', '易之', '知行',
    '思远', '天佑', '安琪', '梦洁', '雅琪', '雨婷', '韵寒', '莉姿',
    '沛玲', '欣妍', '曼玉', '佳琦', '诗音', '采薇', '青鸟', '未央',
    // [武侠/古风/仙气]
    '无忌', '不悔', '逍遥', '灵儿', '月如', '长卿', '景天', '雪见',
    '飞蓬', '紫萱', '重楼', '龙葵', '怀瑾', '握瑜', '景行', '幼安',
    '清照', '去病', '弃疾', '乐天', '希文', '扶苏', '长庚', '晚吟',
    '听风', '望舒', '清欢', '半夏', '长安', '般若', '自在', '无缺',
    // [中二/幻想/游戏感]
    '夜神', '绯月', '幻羽', '零式', '绝影', '狂刀', '霸天', '傲世',
    '凌虚', '破军', '贪狼', '七杀', '紫薇', '天机', '太阳', '武曲',
    '虚鲲', '极光', '幻视', '雷霆', '暴风', '烈焰', '寒冰', '圣光',

    // ====================
    // 🏷️ 趣味/特殊区 (增加随机惊喜)
    // ====================
    // [接地气/村口系列]
    '狗蛋', '翠花', '二丫', '铁柱', '大强', '来福', '旺财',
    '大炮', '二牛', '三多', '四喜', '五福', '六顺', '七星', '八戒',
    // [食物系]
    '苹果', '草莓', '柠檬', '西瓜', '桃子', '葡萄', '荔枝', '芒果',
    '可乐', '雪碧', '奶茶', '咖啡', '馒头', '包子', '饺子', '汤圆',
    // [叠词卖萌]
    '通过', '团团', '圆圆', '乐乐', '可可', '爱爱', '亲亲', '抱抱',
    '奇奇', '蒂蒂', '波波', '拉拉', '迪迪', '西西', '多多', '少少'
];

export const ELE_COMP: Record<string, string[]> = {
    fire: ['air', 'fire'],
    earth: ['water', 'earth'],
    air: ['fire', 'air'],
    water: ['earth', 'water']
};

export const ZODIACS = [
    { name: '白羊座', element: 'fire', icon: '♈' }, { name: '金牛座', element: 'earth', icon: '♉' },
    { name: '双子座', element: 'air', icon: '♊' }, { name: '巨蟹座', element: 'water', icon: '♋' },
    { name: '狮子座', element: 'fire', icon: '♌' }, { name: '处女座', element: 'earth', icon: '♍' },
    { name: '天秤座', element: 'air', icon: '♎' }, { name: '天蝎座', element: 'water', icon: '♏' },
    { name: '射手座', element: 'fire', icon: '♐' }, { name: '摩羯座', element: 'earth', icon: '♑' },
    { name: '水瓶座', element: 'air', icon: '♒' }, { name: '双鱼座', element: 'water', icon: '♓' }
];

export const SOCIAL_TYPES = [
    { id: 'greet', label: '打招呼', val: 3, type: 'friendship', minVal: -100, maxVal: 100, logType: 'chat' },
    { id: 'chat', label: '闲聊', val: 5, type: 'friendship', minVal: 10, maxVal: 100, logType: 'chat' },
    { id: 'joke', label: '讲冷笑话', val: 12, type: 'friendship', minVal: 30, maxVal: 100, logType: 'chat' },
    { id: 'gossip', label: '吃瓜', val: 8, type: 'friendship', minVal: 50, maxVal: 100, logType: 'chat' },
    { id: 'pickup', label: '搭讪', val: 5, type: 'romance', minVal: 0, maxVal: 20, logType: 'love', special: 'pickup' },
    { id: 'deep_talk', label: '深聊', val: 8, type: 'romance', minVal: 20, maxVal: 100, logType: 'love', special: 'deep_talk' },
    { id: 'flirt', label: '调情', val: 10, type: 'romance', minVal: 30, maxVal: 100, logType: 'love' },
    { id: 'hug', label: '抱抱', val: 15, type: 'romance', minVal: 50, maxVal: 100, logType: 'love', special: 'hug' },
    { id: 'kiss', label: '亲亲', val: 20, type: 'romance', minVal: 70, maxVal: 100, logType: 'love', special: 'kiss' },
    { id: 'confess', label: '表白', val: 30, type: 'romance', minVal: 40, maxVal: 100, logType: 'love', special: 'confess' },
    { id: 'propose', label: '求婚', val: 50, type: 'romance', minVal: 90, maxVal: 100, logType: 'love', special: 'propose' },
    { id: 'breakup', label: '分手', val: -50, type: 'romance', minVal: -100, maxVal: -60, logType: 'bad', special: 'breakup' },
    { id: 'argue', label: '吵架', val: -15, type: 'friendship', minVal: -100, maxVal: 100, logType: 'bad' }
];

export const BASE_DECAY = {
    energy: 0.8,
    hunger: 1.0,
    fun: 0.8,
    social: 0.8,
    bladder: 0.8,
    hygiene: 0.5
};

export const ORIENTATIONS = [
    { type: 'hetero', label: '异性恋' },
    { type: 'homo', label: '同性恋' },
    { type: 'bi', label: '双性恋' }
];