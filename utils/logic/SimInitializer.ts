import { Sim } from '../Sim';
import { SimData, AgeStage, NeedType, SimAppearance } from '../../types';
import { CONFIG, AGE_CONFIG, SURNAMES, GIVEN_NAMES, ASSET_CONFIG, MBTI_TYPES, ZODIACS, LIFE_GOALS, JOBS, BASE_DECAY } from '../../constants';

// 将 SimInitConfig 移到这里或保留在 Sim.ts 并导出
export interface SimInitConfig {
    x?: number;
    y?: number;
    surname?: string;
    familyId?: string;
    ageStage?: AgeStage;
    gender?: 'M' | 'F';
    partnerId?: string;
    fatherId?: string;
    motherId?: string;
    orientation?: string;
    homeId?: string | null;
    money?: number; 
    traits?: string[]; 
    familyLore?: string; 
    workplaceId?: string; 
}

export const SimInitializer = {
    initialize(sim: Sim, config: SimInitConfig) {
        sim.id = Math.random().toString(36).substring(2, 11);
        sim.familyId = config.familyId || sim.id;
        sim.homeId = config.homeId || null;
        sim.workplaceId = config.workplaceId; 

        sim.pos = {
            x: config.x ?? (50 + Math.random() * (CONFIG.CANVAS_W - 100)),
            y: config.y ?? (50 + Math.random() * (CONFIG.CANVAS_H - 100))
        };
        sim.prevPos = { ...sim.pos }; 
        
        sim.speed = (5.0 + Math.random() * 2.0) * 2.0;

        sim.gender = config.gender || (Math.random() > 0.5 ? 'M' : 'F');

        // 年龄与体型
        sim.ageStage = config.ageStage || AgeStage.Adult;
        const stageConfig = AGE_CONFIG[sim.ageStage];
        sim.age = stageConfig.min + Math.floor(Math.random() * (stageConfig.max - stageConfig.min));

        if (sim.ageStage === AgeStage.Infant) { sim.height = 50 + Math.random() * 25; sim.weight = 3 + Math.random() * 7; } 
        else if (sim.ageStage === AgeStage.Toddler) { sim.height = 80 + Math.random() * 20; sim.weight = 10 + Math.random() * 6; } 
        else if (sim.ageStage === AgeStage.Child) { sim.height = 110 + Math.random() * 30; sim.weight = 20 + Math.random() * 15; } 
        else if (sim.ageStage === AgeStage.Teen) { sim.height = 150 + Math.random() * 25; sim.weight = 40 + Math.random() * 25; } 
        else {
            const baseHeight = sim.gender === 'M' ? 175 : 163;
            sim.height = baseHeight + Math.floor((Math.random() - 0.5) * 20); 
            const bmi = 18 + Math.random() * 8; 
            sim.weight = Math.floor((sim.height / 100) * (sim.height / 100) * bmi);
        }
        sim.height = Math.floor(sim.height);
        sim.weight = Math.floor(sim.weight);
        
        // 属性
        const rand = (Math.random() + Math.random() + Math.random()) / 3;
        sim.appearanceScore = Math.floor(rand * 100);
        sim.luck = Math.floor(Math.random() * 100);
        const constRand = (Math.random() + Math.random()) / 2;
        sim.constitution = Math.floor(constRand * 100);
        sim.eq = Math.floor(Math.random() * 100);
        const iqRand = (Math.random() + Math.random() + Math.random()) / 3;
        sim.iq = Math.floor(iqRand * 100);
        sim.reputation = Math.floor(Math.random() * 40); 
        sim.morality = Math.floor(Math.random() * 100);
        sim.creativity = Math.floor(Math.random() * 100);
        
        // 身份
        sim.surname = config.surname || SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
        sim.name = sim.surname + GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
        
        // 外观
        sim.skinColor = CONFIG.COLORS.skin[Math.floor(Math.random() * CONFIG.COLORS.skin.length)];
        sim.hairColor = CONFIG.COLORS.hair[Math.floor(Math.random() * CONFIG.COLORS.hair.length)];
        sim.clothesColor = CONFIG.COLORS.clothes[Math.floor(Math.random() * CONFIG.COLORS.clothes.length)];
        sim.pantsColor = CONFIG.COLORS.pants[Math.floor(Math.random() * CONFIG.COLORS.pants.length)];

        sim.appearance = {
            face: ASSET_CONFIG.face.length > 0 ? ASSET_CONFIG.face[Math.floor(Math.random() * ASSET_CONFIG.face.length)] : '',
            hair: ASSET_CONFIG.hair.length > 0 ? ASSET_CONFIG.hair[Math.floor(Math.random() * ASSET_CONFIG.hair.length)] : '',
            clothes: ASSET_CONFIG.clothes.length > 0 ? ASSET_CONFIG.clothes[Math.floor(Math.random() * ASSET_CONFIG.clothes.length)] : '',
            pants: ASSET_CONFIG.pants.length > 0 ? ASSET_CONFIG.pants[Math.floor(Math.random() * ASSET_CONFIG.pants.length)] : '',
        };

        // 性格
        sim.mbti = MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)];
        sim.zodiac = ZODIACS[Math.floor(Math.random() * ZODIACS.length)];
        sim.traits = config.traits || [];
        sim.familyLore = config.familyLore;

        sim.health = 90 + Math.random() * 10; 
        sim.lifeGoal = LIFE_GOALS[Math.floor(Math.random() * LIFE_GOALS.length)];

        // 关系
        sim.partnerId = config.partnerId || null;
        sim.fatherId = config.fatherId || null;
        sim.motherId = config.motherId || null;

        if (config.orientation) { sim.orientation = config.orientation; } 
        else { const r = Math.random(); sim.orientation = r < 0.7 ? 'hetero' : (r < 0.85 ? 'homo' : 'bi'); }

        let baseFaith = sim.mbti.includes('J') ? 70 : 40;
        sim.faithfulness = Math.min(100, Math.max(0, baseFaith + (Math.random() * 40 - 20)));

        // 需求与技能
        const randNeed = () => 60 + Math.floor(Math.random() * 40);
        sim.needs = { 
            [NeedType.Hunger]: randNeed(), 
            [NeedType.Energy]: randNeed(), 
            [NeedType.Fun]: randNeed(), 
            [NeedType.Social]: randNeed(), 
            [NeedType.Bladder]: randNeed(), 
            [NeedType.Hygiene]: randNeed(),
            [NeedType.Comfort]: 100
        };
        sim.skills = { cooking: 0, athletics: 0, music: 0, dancing: 0, logic: 0, creativity: 0, gardening: 0, fishing: 0 };
        sim.relationships = {};

        // 经济
        if (config.money !== undefined) { sim.money = config.money; } 
        else { sim.money = 500 + Math.floor(Math.random() * 1000); }
        
        if ([AgeStage.Infant, AgeStage.Toddler].includes(sim.ageStage)) { 
            sim.money = 0; 
        } else if ([AgeStage.Child, AgeStage.Teen].includes(sim.ageStage)) {
            sim.money = 50 + Math.floor(Math.random() * 50); 
        }

        // 初始化修饰符
        sim.metabolism = {};
        for (let key in BASE_DECAY) sim.metabolism[key] = 1.0;
        sim.skillModifiers = {};
        for (let key in sim.skills) sim.skillModifiers[key] = 1.0;
        sim.socialModifier = 1.0;

        sim.buffs = []; sim.mood = 80;

        // 应用特质影响
        sim.applyTraits();

        // 职业分配
        sim.job = JOBS.find(j => j.id === 'unemployed')!;
        if ([AgeStage.Adult, AgeStage.MiddleAged].includes(sim.ageStage)) { 
            // 在 Sim 类的方法中调用 CareerLogic，这里初始化先不做复杂逻辑，或者手动调用一次
            // 由于 CareerLogic 在 Sim.ts 中被引入，这里为了避免循环依赖，建议 Sim 构造后再调用 assignJob
        }
        
        sim.dailyExpense = 0; sim.dailyIncome = 0; sim.dailyBudget = 0; sim.workPerformance = 0;
        sim.actionTimer = 0;
    }
};