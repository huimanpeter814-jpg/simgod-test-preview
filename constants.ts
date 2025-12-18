/// <reference types="vite/client" />
import { Job, JobType, AgeStage, NeedType } from './types';

// 1. 资源加载
const faceFiles = import.meta.glob('/src/assets/face/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
const hairFiles = import.meta.glob('/src/assets/hair/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
const clothesFiles = import.meta.glob('/src/assets/clothes/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
const pantsFiles = import.meta.glob('/src/assets/pants/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
const bgFiles = import.meta.glob('/src/assets/bg/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });

function getValues(globResult: Record<string, unknown>): string[] {
    return Object.values(globResult) as string[];
}

export const ASSET_CONFIG = {
    face: getValues(faceFiles),
    hair: getValues(hairFiles),
    clothes: getValues(clothesFiles),
    pants: getValues(pantsFiles),
    bg: getValues(bgFiles)
};

export const CONFIG = {
    CANVAS_W: 3280, 
    CANVAS_H: 2200, 
    COLORS: {
        skin: ['#fcece3', '#f0d3c3', '#e0bda5', '#bfa088', '#8f6e56'],
        hair: ['#2b2b2b', '#4a3b32', '#8c6b5d', '#d9c2a3', '#a83f3f', '#3e5f8a'], 
        clothes: [
            '#e66767', '#f19066', '#f5cd79', '#63cdda', '#cf6a87', '#786fa6', '#546de5'
        ],
        pants: [
            '#2d3436', '#636e72', '#0984e3', '#74b9ff', '#d63031', '#e17055', '#fdcb6e', '#6c5ce7', '#00b894'
        ]
    }
};

export { PALETTES } from './data/scene';

export const AGE_CONFIG: Record<AgeStage, { min: number, max: number, label: string, color: string, width: number, height: number, headSize: number }> = {
    [AgeStage.Infant]: { min: 0, max: 2, label: '婴儿', color: '#ffbdcb', width: 12, height: 16, headSize: 8 },
    [AgeStage.Toddler]: { min: 3, max: 5, label: '幼儿', color: '#ff9ff3', width: 14, height: 22, headSize: 10 },
    [AgeStage.Child]: { min: 6, max: 12, label: '儿童', color: '#54a0ff', width: 16, height: 30, headSize: 11 },
    [AgeStage.Teen]: { min: 13, max: 18, label: '青少年', color: '#5f27cd', width: 18, height: 38, headSize: 12 },
    [AgeStage.Adult]: { min: 19, max: 39, label: '成年', color: '#1dd1a1', width: 20, height: 42, headSize: 13 },
    [AgeStage.MiddleAged]: { min: 40, max: 59, label: '中年', color: '#ff9f43', width: 22, height: 42, headSize: 13 },
    [AgeStage.Elder]: { min: 60, max: 120, label: '老年', color: '#8395a7', width: 20, height: 40, headSize: 13 }
};

export const HAIR_STYLE_NAMES = [
    '普通短发', '波波头', '刺猬头', '侧分背头', '丸子头', '姬发式长直', '蓬松爆炸头',
    '莫霍克', '双马尾', '地中海', '中分窗帘头', '高马尾', '狼尾鲻鱼头', '遮眼侧刘海',
    '脏辫', '波浪长卷发', '半扎公主头'
];

export const ITEMS = [
    { id: 'drink', label: '冰美式', cost: 15, needs: { [NeedType.Hunger]: 2, [NeedType.Fun]: 5 }, trigger: 'street' },
    { id: 'book', label: '设计年鉴', cost: 60, needs: { [NeedType.Fun]: 10 }, skill: 'logic', skillVal: 5, attribute: 'iq', attrVal: 2, trigger: 'smart' },
    { id: 'cinema_2d', label: '文艺片票', cost: 30, needs: { [NeedType.Fun]: 40 }, trigger: 'bored' },
    { id: 'cinema_3d', label: 'IMAX大片', cost: 60, needs: { [NeedType.Fun]: 60 }, trigger: 'rich' },
    { id: 'museum_ticket', label: '特展门票', cost: 50, buff: 'art_inspired', needs: { [NeedType.Fun]: 50 }, attribute: 'creativity', attrVal: 3, trigger: 'smart' },
    { id: 'gym_pass', label: '私教课', cost: 100, needs: { [NeedType.Energy]: -20 }, skill: 'athletics', skillVal: 5, attribute: 'constitution', attrVal: 4, trigger: 'active' },
    { id: 'medicine', label: '急救包', cost: 100, buff: 'healing', trigger: 'sick' },
    { id: 'game_coin', label: '代币', cost: 5, needs: { [NeedType.Fun]: 20 }, trigger: 'bored' },
    { id: 'cosmetic_set', label: '高级美妆', cost: 150, needs: { [NeedType.Fun]: 20 }, attribute: 'appearanceScore', attrVal: 5, trigger: 'beauty' },
    { id: 'protein_powder', label: '蛋白粉', cost: 80, needs: { [NeedType.Hunger]: 10 }, attribute: 'constitution', attrVal: 3, trigger: 'active' },
    { id: 'puzzle_game', label: '益智模型', cost: 50, needs: { [NeedType.Fun]: 20 }, attribute: 'iq', attrVal: 2, trigger: 'smart' },
    { id: 'fashion_mag', label: '时尚杂志', cost: 25, needs: { [NeedType.Fun]: 10 }, attribute: 'creativity', attrVal: 2, trigger: 'art' },
    { id: 'gift_chocolates', label: '进口巧克力', cost: 40, needs: { [NeedType.Hunger]: 10, [NeedType.Fun]: 10 }, rel: true, trigger: 'love' },
    { id: 'protection', label: '安全措施', cost: 20, trigger: 'safe_sex' },
];

export const SKILLS = [
    { id: 'cooking', label: '烹饪' }, { id: 'athletics', label: '健身' }, { id: 'music', label: '乐理' },
    { id: 'dancing', label: '舞感' }, { id: 'logic', label: '编程' }, { id: 'creativity', label: '审美' },
    { id: 'gardening', label: '种植' }, { id: 'fishing', label: '钓鱼' }
];

// 🆕 更新：所有职业现在包含 requiredTags 字段
export const JOBS: Job[] = [
    { id: 'unemployed', title: '自由职业', level: 0, salary: 0, startHour: 0, endHour: 0, companyType: JobType.Unemployed },

    // Internet Co (需要电脑)
    { id: 'dev_intern', title: '初级码农', level: 1, salary: 400, startHour: 10, endHour: 19, companyType: JobType.Internet, requiredTags: ['computer'] },
    { id: 'developer', title: '全栈开发', level: 2, salary: 800, startHour: 10, endHour: 20, companyType: JobType.Internet, requiredTags: ['computer'] },
    { id: 'senior_dev', title: '架构师', level: 3, salary: 1500, startHour: 10, endHour: 18, companyType: JobType.Internet, requiredTags: ['computer'] },
    { id: 'cto', title: '合伙人', level: 4, salary: 3000, startHour: 11, endHour: 16, companyType: JobType.Internet, requiredTags: ['computer', 'meeting'] },

    // Design Co (需要画架或电脑)
    { id: 'design_intern', title: '绘图员', level: 1, salary: 300, startHour: 9, endHour: 18, companyType: JobType.Design, requiredTags: ['easel', 'computer'] },
    { id: 'designer', title: '视觉设计', level: 2, salary: 600, startHour: 10, endHour: 19, companyType: JobType.Design, requiredTags: ['computer', 'easel'] },
    { id: 'senior_designer', title: '主美', level: 3, salary: 1000, startHour: 10, endHour: 18, companyType: JobType.Design, requiredTags: ['computer'] },
    { id: 'art_director', title: '创意总监', level: 4, salary: 2000, startHour: 11, endHour: 16, companyType: JobType.Design, requiredTags: ['desk', 'meeting'] },

    // Business Co (需要办公桌)
    { id: 'biz_intern', title: '行政专员', level: 1, salary: 250, startHour: 9, endHour: 17, companyType: JobType.Business, requiredTags: ['desk'] },
    { id: 'clerk_biz', title: '客户经理', level: 2, salary: 500, startHour: 9, endHour: 17, companyType: JobType.Business, requiredTags: ['desk', 'computer'] },
    { id: 'biz_supervisor', title: '运营总监', level: 3, salary: 1000, startHour: 9, endHour: 17, companyType: JobType.Business, requiredTags: ['desk'] },
    { id: 'manager', title: 'CEO', level: 4, salary: 2500, startHour: 10, endHour: 16, companyType: JobType.Business, requiredTags: ['boss_chair', 'desk'] },

    // Services (Store) (需要收银台或理货)
    { id: 'store_trainee', title: '理货员', level: 1, salary: 180, startHour: 8, endHour: 16, companyType: JobType.Store, requiredTags: ['shelf', 'cashier'] },
    { id: 'clerk_book', title: '导购', level: 2, salary: 300, startHour: 9, endHour: 17, companyType: JobType.Store, requiredTags: ['shelf', 'counter'] },
    { id: 'store_supervisor', title: '值班经理', level: 3, salary: 500, startHour: 9, endHour: 18, companyType: JobType.Store, requiredTags: ['cashier', 'desk'] },
    { id: 'store_manager', title: '店长', level: 4, salary: 800, startHour: 10, endHour: 17, companyType: JobType.Store, requiredTags: ['desk'] },

    // Services (Restaurant) (需要灶台)
    { id: 'kitchen_helper', title: '打杂', level: 1, salary: 200, startHour: 10, endHour: 20, companyType: JobType.Restaurant, requiredTags: ['stove', 'sink'] },
    { id: 'waiter', title: '服务员', level: 2, salary: 350, startHour: 11, endHour: 20, companyType: JobType.Restaurant, requiredTags: ['table', 'counter'] },
    { id: 'cook', title: '厨师', level: 3, salary: 600, startHour: 10, endHour: 20, companyType: JobType.Restaurant, requiredTags: ['stove'] },
    { id: 'head_chef', title: '行政主厨', level: 4, salary: 1200, startHour: 10, endHour: 19, companyType: JobType.Restaurant, requiredTags: ['stove', 'desk'] },

    // Library
    { id: 'library_staff', title: '图书管理员', level: 1, salary: 220, startHour: 9, endHour: 18, companyType: JobType.Library, vacationMonths: [2, 7], requiredTags: ['desk', 'bookshelf'] },

    // Education (School) (需要黑板或讲台)
    { id: 'teacher_kg_intern', title: '幼教实习', level: 1, salary: 300, startHour: 8, endHour: 17, companyType: JobType.School, vacationMonths: [2, 7], requiredTags: ['blackboard', 'desk'] },
    { id: 'teacher_kg', title: '幼师', level: 2, salary: 500, startHour: 8, endHour: 17, companyType: JobType.School, vacationMonths: [2, 7], requiredTags: ['blackboard'] },
    { id: 'teacher_intern', title: '实习教师', level: 1, salary: 350, startHour: 8, endHour: 17, companyType: JobType.School, vacationMonths: [2, 7], requiredTags: ['desk'] },
    { id: 'teacher_elem', title: '小学教师', level: 2, salary: 600, startHour: 8, endHour: 16, companyType: JobType.School, vacationMonths: [2, 7], requiredTags: ['blackboard'] },
    { id: 'teacher_pe', title: '体育老师', level: 2, salary: 600, startHour: 8, endHour: 16, companyType: JobType.School, vacationMonths: [2, 7], requiredTags: ['sports'] },
    { id: 'teacher_high', title: '中学教师', level: 3, salary: 700, startHour: 7.5, endHour: 17, companyType: JobType.School, vacationMonths: [2, 7], requiredTags: ['blackboard', 'desk'] },
    { id: 'principal', title: '校长', level: 4, salary: 1500, startHour: 8, endHour: 16, companyType: JobType.School, vacationMonths: [2, 7], requiredTags: ['desk'] },
    { id: 'school_chef_helper', title: '食堂帮厨', level: 1, salary: 300, startHour: 6, endHour: 14, companyType: JobType.School, requiredTags: ['stove'] },
    { id: 'school_chef', title: '饭堂厨师', level: 2, salary: 550, startHour: 6, endHour: 14, companyType: JobType.School, requiredTags: ['stove'] },
    { id: 'school_security', title: '学校保安', level: 1, salary: 400, startHour: 7, endHour: 19, companyType: JobType.School, requiredTags: ['gate', 'desk'] },

    // Nightlife
    { id: 'bartender', title: '调酒师', level: 1, salary: 400, startHour: 19, endHour: 3, companyType: JobType.Nightlife, requiredTags: ['bar', 'counter'] },
    { id: 'dj', title: 'DJ', level: 2, salary: 800, startHour: 20, endHour: 4, companyType: JobType.Nightlife, requiredTags: ['dj_booth'] },

    // Hospital Careers (需要医疗设备或办公桌)
    { id: 'nurse_intern', title: '实习护士', level: 1, salary: 300, startHour: 8, endHour: 18, companyType: JobType.Hospital, requiredTags: ['desk', 'medical_bed'] },
    { id: 'nurse', title: '注册护士', level: 2, salary: 600, startHour: 8, endHour: 18, companyType: JobType.Hospital, requiredTags: ['desk', 'medical_bed'] },
    { id: 'doctor_resident', title: '住院医师', level: 3, salary: 1200, startHour: 9, endHour: 19, companyType: JobType.Hospital, requiredTags: ['desk'] },
    { id: 'doctor_chief', title: '主任医师', level: 4, salary: 2500, startHour: 9, endHour: 17, companyType: JobType.Hospital, requiredTags: ['desk'] },

    // Elder Care
    { id: 'caregiver_intern', title: '见习护工', level: 1, salary: 250, startHour: 7, endHour: 16, companyType: JobType.ElderCare, requiredTags: ['bed', 'desk'] },
    { id: 'caregiver', title: '护工', level: 2, salary: 450, startHour: 7, endHour: 16, companyType: JobType.ElderCare, requiredTags: ['bed'] },
    { id: 'care_manager', title: '护理主管', level: 3, salary: 800, startHour: 8, endHour: 17, companyType: JobType.ElderCare, requiredTags: ['desk'] },
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

    festive_joy: { id: 'festive_joy', label: '过节啦!', type: 'good' as const, duration: 300 },
    social_pressure: { id: 'social_pressure', label: '社交恐惧', type: 'bad' as const, duration: 240 },
    shopping_spree: { id: 'shopping_spree', label: '剁手快乐', type: 'good' as const, duration: 180 },
    vacation_chill: { id: 'vacation_chill', label: '悠长假期', type: 'good' as const, duration: 400 },

    pregnant: { id: 'pregnant', label: '孕育新生命', type: 'good' as const, duration: 1440 },
    new_parent: { id: 'new_parent', label: '初为人父/母', type: 'good' as const, duration: 600 },
    married: { id: 'married', label: '新婚燕尔', type: 'good' as const, duration: 600 },
    divorced: { id: 'divorced', label: '婚姻破裂', type: 'bad' as const, duration: 600 },
    mourning: { id: 'mourning', label: '哀悼逝者', type: 'bad' as const, duration: 480 },
    sick: { id: 'sick', label: '身体抱恙', type: 'bad' as const, duration: 240 },
    healing: { id: 'healing', label: '正在恢复', type: 'good' as const, duration: 120 },
};

export const HOLIDAYS: Record<number, { name: string, type: 'traditional' | 'love' | 'shopping' | 'break' | 'party' }> = {
    2: { name: "春节", type: 'traditional' },      
    5: { name: "恋爱季", type: 'love' },           
    7: { name: "夏日祭", type: 'party' },          
    10: { name: "黄金周", type: 'break' },         
    11: { name: "购物节", type: 'shopping' },      
    12: { name: "跨年", type: 'party' }            
};

export const LIFE_GOALS = [
    '财富自由', '行业大牛', '万人迷', '灵魂伴侣', '岁月静好',
    '上市敲钟', '诺贝尔奖', '顶级黑客', '米其林主厨', '全网爆红', 
    '政坛领袖', '地产大亨', '畅销书作家', '金牌制作人',
    '环游世界', '猫狗双全', '隐居山林', '极简主义', '海岛庄园主',
    '派对之王', '美食探店', '健身狂魔', '游戏全成就',
    '摸鱼之王', '外星接触', '长生不老', '收集癖', '八卦队长',
    '统治世界', '只想睡个好觉', '子孙满堂', '完美家庭',
    '桃李满天下'
];

export const MBTI_TYPES = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
    'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP',
    'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

export const TRAIT_POOL = {
    social: ['外向', '独行侠', '万人迷', '社恐', '刻薄'], 
    lifestyle: ['活力', '懒惰', '洁癖', '邋遢', '吃货'],   
    mental: ['有创意', '逻辑强', '天才', '开心果', '严肃'] 
};

export const TRAIT_CONFLICTS: Record<string, string[]> = {
    '外向': ['独行侠', '社恐'],
    '独行侠': ['外向', '万人迷', '派对动物'],
    '万人迷': ['刻薄', '社恐'],
    '刻薄': ['万人迷'],
    '社恐': ['万人迷', '外向'],
    
    '活力': ['懒惰'],
    '懒惰': ['活力'],
    '洁癖': ['邋遢'],
    '邋遢': ['洁癖'],
    
    '逻辑强': ['开心果', '有创意'], 
    '有创意': ['逻辑强', '严肃'],
    '天才': ['开心果'],
    '开心果': ['严肃', '天才', '逻辑强'],
    '严肃': ['开心果']
};

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
    { id: 'woohoo', label: '嘿咻', val: 40, type: 'romance', minVal: 80, maxVal: 100, logType: 'love', special: 'woohoo' }, 
    { id: 'confess', label: '表白', val: 30, type: 'romance', minVal: 40, maxVal: 100, logType: 'love', special: 'confess' },
    { id: 'propose', label: '求婚', val: 50, type: 'romance', minVal: 90, maxVal: 100, logType: 'love', special: 'propose' },
    { id: 'marriage', label: '结婚', val: 100, type: 'romance', minVal: 95, maxVal: 100, logType: 'rel_event', special: 'marriage' }, 
    { id: 'try_baby', label: '备孕', val: 20, type: 'romance', minVal: 90, maxVal: 100, logType: 'family', special: 'try_baby' }, 
    { id: 'breakup', label: '分手', val: -50, type: 'romance', minVal: -100, maxVal: -60, logType: 'bad', special: 'breakup' },
    { id: 'divorce', label: '离婚', val: -100, type: 'romance', minVal: -100, maxVal: -80, logType: 'bad', special: 'divorce' },
    { id: 'argue', label: '吵架', val: -15, type: 'friendship', minVal: -100, maxVal: 100, logType: 'bad' }
];

export const BASE_DECAY: Record<NeedType, number> = {
    [NeedType.Energy]: 0.8,
    [NeedType.Hunger]: 1.0,
    [NeedType.Fun]: 0.8,
    [NeedType.Social]: 0.8,
    [NeedType.Bladder]: 0.8,
    [NeedType.Hygiene]: 0.5,
    [NeedType.Comfort]: 0.0 
};

export const ORIENTATIONS = [
    { type: 'hetero', label: '异性恋' },
    { type: 'homo', label: '同性恋' },
    { type: 'bi', label: '双性恋' }
];

export const SCHOOL_CONFIG = {
    kindergarten: {
        id: 'kindergarten',
        label: '向日葵幼儿园',
        startHour: 8,
        endHour: 17,
        stages: [AgeStage.Infant, AgeStage.Toddler]
    },
    elementary: {
        id: 'elementary',
        label: '第一小学',
        startHour: 8,
        endHour: 15,
        stages: [AgeStage.Child],
        allowanceBase: 20
    },
    high_school: {
        id: 'high_school',
        label: '第一中学',
        startHour: 7.5,
        endHour: 18, 
        stages: [AgeStage.Teen],
        allowanceBase: 50
    }
};

export const FAMILY_LORE_TEMPLATES = {
    poor: {
        origins: [
            "这是一个在城市边缘挣扎求生的家庭，祖上曾是流浪艺人。",
            "来自偏远乡村的移民家庭，带着全部家当来到大城市闯荡。",
            "因为一场突如其来的大火失去了家园，被迫从零开始。",
            "曾经也是体面人家，但因沉迷赌博败光了家产。",
            "一个普普通通的打工家庭，在这个繁华都市里寻找立足之地。"
        ],
        events: [
            "因为交不起房租搬了三次家，但依然没有放弃希望。",
            "最近因为生病花光了积蓄，生活变得更加拮据。",
            "捡到了一只流浪狗，虽然自己都吃不饱，还是收养了它。",
            "因为一次意外的失业，全家人不得不勒紧裤腰带过日子。",
            "在旧货市场淘到了一本古书，希望能卖个好价钱。"
        ],
        vibes: [
            "虽然拮据但充满爱。",
            "相信勤劳能致富。",
            "每个人都在为了生存而努力。",
            "有些许的无奈，但更多的是坚韧。",
            "在这个冷漠的城市里抱团取暖。"
        ]
    },
    middle: {
        origins: [
            "世代经营着一家小书店，书香门第，安贫乐道。",
            "典型的中产家庭，在这个城市扎根已久，生活平稳。",
            "父母都是教师，对子女的教育非常重视。",
            "一个普通的公务员家庭，过着朝九晚五的规律生活。",
            "从祖辈开始就在这里生活，见证了城市的变迁。"
        ],
        events: [
            "最近正在计划一次全家旅行，目的地还在争论中。",
            "为了孩子的学区房问题，全家人都在焦虑。",
            "因为一次成功的投资，家里的生活水平有了小幅提升。",
            "正在筹备家庭聚会，邀请亲朋好友来做客。",
            "最近迷上了园艺，把阳台打造成了小花园。"
        ],
        vibes: [
            "平凡而温馨。",
            "追求稳定的小确幸。",
            "注重生活品质。",
            "充满了烟火气。",
            "有些许的焦虑，但更多的是安稳。"
        ]
    },
    rich: {
        origins: [
            "古老的商业巨擘分支，拥有庞大的家族资产。",
            "依靠科技专利发家的新贵，充满了创新精神。",
            "著名的艺术世家，家中收藏了无数珍品。",
            "早期房地产开发的受益者，坐拥半个城市的房产。",
            "神秘的隐形富豪，低调而奢华。"
        ],
        events: [
            "刚刚收购了一家竞争对手的公司，正在庆祝胜利。",
            "因为一次慈善晚宴上的大手笔捐赠而登上了头条。",
            "正在筹备一场盛大的艺术展览，展示家族收藏。",
            "因为家族内部的继承权纷争，气氛有些紧张。",
            "最近迷上了极限运动，经常飞往世界各地。"
        ],
        vibes: [
            "充满着野心与荣耀。",
            "每一刻都在创造历史。",
            "优雅而从容。",
            "被金钱和权力包围。",
            "有些许的冷漠，但更多的是自信。"
        ]
    }
};