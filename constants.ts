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

const PALETTE = {
    ground_concrete: '#e3e4e8', 
    ground_asphalt: '#3d404b',
    ground_grass_light: '#9bc5a2', 
    ground_grass_dark: '#7fb088',
    ground_water: '#89ccd9',    
    ground_wood: '#dcc6aa',     
    build_glass: '#d4e4ed',     
    build_brick: '#e8d3c5',     
    build_dark: '#2c3e50',      
    accent_red: '#e07b7b',      
    accent_blue: '#7dafd9',     
    accent_yellow: '#ebd388',   
    accent_purple: '#bcaad6',   
    accent_green: '#8ec7b6',    
};

export const CONFIG = {
    CANVAS_W: 3000,
    CANVAS_H: 1800,
    COLORS: {
        skin: ['#fcece3', '#f0d3c3', '#e0bda5', '#bfa088', '#8f6e56'],
        hair: ['#2b2b2b', '#4a3b32', '#8c6b5d', '#d9c2a3', '#a83f3f', '#3e5f8a'], 
        clothes: [
            '#e66767', '#f19066', '#f5cd79', '#63cdda', '#cf6a87', '#786fa6', '#546de5'
        ]
    }
};

export { PALETTES, ROOMS, FURNITURE } from './data/scene';

export const ITEMS = [
    { id: 'drink', label: '冰美式', cost: 15, needs: { hunger: 2, fun: 5 }, trigger: 'street' },
    { id: 'book', label: '设计年鉴', cost: 60, needs: { fun: 10 }, skill: 'logic', skillVal: 5, attribute: 'iq', attrVal: 2, trigger: 'smart' },
    { id: 'cinema_2d', label: '文艺片票', cost: 30, needs: { fun: 40 }, trigger: 'bored' },
    { id: 'cinema_3d', label: 'IMAX大片', cost: 60, needs: { fun: 60 }, trigger: 'rich' },
    { id: 'museum_ticket', label: '特展门票', cost: 50, buff: 'art_inspired', needs: { fun: 50 }, attribute: 'creativity', attrVal: 3, trigger: 'smart' },
    { id: 'gym_pass', label: '私教课', cost: 100, needs: { energy: -20 }, skill: 'athletics', skillVal: 5, attribute: 'constitution', attrVal: 4, trigger: 'active' },
    { id: 'medicine', label: '布洛芬', cost: 25, buff: 'well_rested', trigger: 'sad' },
    { id: 'game_coin', label: '代币', cost: 5, needs: { fun: 20 }, trigger: 'bored' },
    { id: 'cosmetic_set', label: '高级美妆', cost: 150, needs: { fun: 20 }, attribute: 'appearanceScore', attrVal: 5, trigger: 'beauty' },
    { id: 'protein_powder', label: '蛋白粉', cost: 80, needs: { hunger: 10 }, attribute: 'constitution', attrVal: 3, trigger: 'active' },
    { id: 'puzzle_game', label: '益智模型', cost: 50, needs: { fun: 20 }, attribute: 'iq', attrVal: 2, trigger: 'smart' },
    { id: 'fashion_mag', label: '时尚杂志', cost: 25, needs: { fun: 10 }, attribute: 'creativity', attrVal: 2, trigger: 'art' },
    { id: 'gift_chocolates', label: '进口巧克力', cost: 40, needs: { hunger: 10, fun: 10 }, rel: true, trigger: 'love' },
];

export const SKILLS = [
    { id: 'cooking', label: '烹饪' }, { id: 'athletics', label: '健身' }, { id: 'music', label: '乐理' },
    { id: 'dancing', label: '舞感' }, { id: 'logic', label: '编程' }, { id: 'creativity', label: '审美' },
    { id: 'gardening', label: '种植' }, { id: 'fishing', label: '钓鱼' }
];

// [修改] 职业配置：移除 workDays，所有职业默认每天(每月)工作
// 部分职业可能有特殊的放假月 (vacationMonths)
export const JOBS: Job[] = [
    { id: 'unemployed', title: '自由职业', level: 0, salary: 0, startHour: 0, endHour: 0 },

    // Internet Co
    { id: 'dev_intern', title: '初级码农', level: 1, salary: 400, startHour: 10, endHour: 19, companyType: 'internet' },
    { id: 'developer', title: '全栈开发', level: 2, salary: 800, startHour: 10, endHour: 20, companyType: 'internet' },
    { id: 'senior_dev', title: '架构师', level: 3, salary: 1500, startHour: 10, endHour: 18, companyType: 'internet' },
    { id: 'cto', title: '合伙人', level: 4, salary: 3000, startHour: 11, endHour: 16, companyType: 'internet' },

    // Design Co
    { id: 'design_intern', title: '绘图员', level: 1, salary: 300, startHour: 9, endHour: 18, companyType: 'design' },
    { id: 'designer', title: '视觉设计', level: 2, salary: 600, startHour: 10, endHour: 19, companyType: 'design' },
    { id: 'senior_designer', title: '主美', level: 3, salary: 1000, startHour: 10, endHour: 18, companyType: 'design' },
    { id: 'art_director', title: '创意总监', level: 4, salary: 2000, startHour: 11, endHour: 16, companyType: 'design' },

    // Business Co
    { id: 'biz_intern', title: '行政专员', level: 1, salary: 250, startHour: 9, endHour: 17, companyType: 'business' },
    { id: 'clerk_biz', title: '客户经理', level: 2, salary: 500, startHour: 9, endHour: 17, companyType: 'business' },
    { id: 'biz_supervisor', title: '运营总监', level: 3, salary: 1000, startHour: 9, endHour: 17, companyType: 'business' },
    { id: 'manager', title: 'CEO', level: 4, salary: 2500, startHour: 10, endHour: 16, companyType: 'business' },

    // Services (Store)
    { id: 'store_trainee', title: '理货员', level: 1, salary: 180, startHour: 8, endHour: 16, companyType: 'store' },
    { id: 'clerk_book', title: '导购', level: 2, salary: 300, startHour: 9, endHour: 17, companyType: 'store' },
    { id: 'store_supervisor', title: '值班经理', level: 3, salary: 500, startHour: 9, endHour: 18, companyType: 'store' },
    { id: 'store_manager', title: '店长', level: 4, salary: 800, startHour: 10, endHour: 17, companyType: 'store' },

    // Cinema
    { id: 'cinema_trainee', title: '检票员', level: 1, salary: 220, startHour: 10, endHour: 18, companyType: 'store' },
    { id: 'cinema_staff', title: '售票员', level: 2, salary: 380, startHour: 10, endHour: 19, companyType: 'store' },

    // Services (Restaurant)
    { id: 'kitchen_helper', title: '打杂', level: 1, salary: 200, startHour: 10, endHour: 20, companyType: 'restaurant' },
    { id: 'waiter', title: '服务员', level: 2, salary: 350, startHour: 11, endHour: 20, companyType: 'restaurant' },
    { id: 'cook', title: '厨师', level: 3, salary: 600, startHour: 10, endHour: 20, companyType: 'restaurant' },
    { id: 'head_chef', title: '行政主厨', level: 4, salary: 1200, startHour: 10, endHour: 19, companyType: 'restaurant' },

    // Library - 比如老师或管理员在寒暑假(2月, 7月)放假
    { id: 'library_staff', title: '图书管理员', level: 1, salary: 220, startHour: 9, endHour: 18, companyType: 'library', vacationMonths: [2, 7] }
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
    side_hustle_win: { id: 'side_hustle_win', label: '赚外快', type: 'good' as const, duration: 90 },
    promoted: { id: 'promoted', label: '升职加薪', type: 'good' as const, duration: 240 },
    demoted: { id: 'demoted', label: '背锅降职', type: 'bad' as const, duration: 240 },
    fired: { id: 'fired', label: '毕业优化', type: 'bad' as const, duration: 300 },
    art_inspired: { id: 'art_inspired', label: '缪斯降临', type: 'good' as const, duration: 150 },
    playful: { id: 'playful', label: '童心未泯', type: 'good' as const, duration: 90 },
    
    lonely: { id: 'lonely', label: '孤独', type: 'bad' as const, duration: 60 },
    bored: { id: 'bored', label: '无聊', type: 'bad' as const, duration: 60 },
    smelly: { id: 'smelly', label: '邋遢', type: 'bad' as const, duration: 60 },

    cheated: { id: 'cheated', label: '被背叛', type: 'bad' as const, duration: 480 },
    jealous: { id: 'jealous', label: '吃醋生气', type: 'bad' as const, duration: 90 },
    rejected: { id: 'rejected', label: '被拒', type: 'bad' as const, duration: 120 },
    crush: { id: 'crush', label: '心动瞬间', type: 'good' as const, duration: 90 },
    sweet_date: { id: 'sweet_date', label: '甜蜜蜜', type: 'good' as const, duration: 180 },

    // [新增] 节日相关 Buff
    festive_joy: { id: 'festive_joy', label: '过节啦!', type: 'good' as const, duration: 300 },
    social_pressure: { id: 'social_pressure', label: '社交恐惧', type: 'bad' as const, duration: 240 }, // I人过年
    shopping_spree: { id: 'shopping_spree', label: '剁手快乐', type: 'good' as const, duration: 180 },
    vacation_chill: { id: 'vacation_chill', label: '悠长假期', type: 'good' as const, duration: 400 },
};

// [重构] 节日系统：Key 为月份 (1-12)
export const HOLIDAYS: Record<number, { name: string, type: 'traditional' | 'love' | 'shopping' | 'break' | 'party' }> = {
    2: { name: "春节", type: 'traditional' },      // 2月: 全员放假，家庭/社交
    5: { name: "恋爱季", type: 'love' },           // 5月(520): 恋爱月
    7: { name: "夏日祭", type: 'party' },          // 7月: 暑期，派对
    10: { name: "黄金周", type: 'break' },         // 10月: 旅游/休息
    11: { name: "购物节", type: 'shopping' },      // 11月: 双11
    12: { name: "跨年", type: 'party' }            // 12月: 总结，庆祝
};

export const LIFE_GOALS = [
    '财富自由', '行业大牛', '万人迷', '灵魂伴侣', '岁月静好',
    '上市敲钟', '诺贝尔奖', '顶级黑客', '米其林主厨', '全网爆红', 
    '政坛领袖', '地产大亨', '畅销书作家', '金牌制作人',
    '环游世界', '猫狗双全', '隐居山林', '极简主义', '海岛庄园主',
    '派对之王', '美食探店', '健身狂魔', '游戏全成就',
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
    '李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
    '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
    '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
    '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
    '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎',
    '欧阳', '上官', '慕容', '司徒', '皇甫'
];
export const GIVEN_NAMES = [
    '风', '云', '雷', '雨', '雪', '霜', '雾', '电', '光', '影',
    '星', '辰', '月', '阳', '天', '地', '山', '川', '河', '海',
    '仁', '义', '礼', '智', '信', '忠', '孝', '节', '勇', '和',
    '子轩', '梓涵', '一诺', '浩宇', '欣怡', '雨泽', '宇轩', '沐白',
    '诗涵', '依诺', '梓萱', '俊熙', '子墨', '梓豪', '亦辰', '语桐',
    '星河', '云帆', '千寻', '若初', '顾北', '南风', '易之', '知行',
    '无忌', '不悔', '逍遥', '灵儿', '月如', '长卿', '景天', '雪见',
    '狗蛋', '翠花', '二丫', '铁柱', '大强', '来福', '旺财'
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