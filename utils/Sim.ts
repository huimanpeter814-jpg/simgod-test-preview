import { CONFIG, BASE_DECAY, LIFE_GOALS, MBTI_TYPES, SURNAMES, GIVEN_NAMES, ZODIACS, JOBS, ITEMS, BUFFS, ASSET_CONFIG, AGE_CONFIG } from '../constants';
import { Vector2, Job, Buff, SimAppearance, Furniture, Memory, Relationship, AgeStage, SimAction, JobType, NeedType } from '../types';
import { GameStore } from './simulation'; 
import { minutes } from './simulationHelpers';
import { SocialLogic } from './logic/social';
import { CareerLogic } from './logic/career';
import { DecisionLogic } from './logic/decision';
import { INTERACTIONS, RESTORE_TIMES, InteractionHandler } from './logic/interactionRegistry';
import { SchoolLogic } from './logic/school';
import { LifeCycleLogic } from './logic/LifeCycleLogic'; 
import { EconomyLogic } from './logic/EconomyLogic';     

interface SimInitConfig {
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
}

export class Sim {
    id: string;
    familyId: string;
    homeId: string | null = null;
    pos: Vector2;
    prevPos: Vector2; 
    target: Vector2 | null = null;
    
    path: Vector2[] = [];
    currentPathIndex: number = 0;
    
    speed: number;
    gender: 'M' | 'F';
    name: string;
    surname: string;
    
    skinColor: string;
    hairColor: string;
    clothesColor: string;
    pantsColor: string;
    appearance: SimAppearance;

    mbti: string;
    zodiac: any;
    age: number;
    ageStage: AgeStage; // 使用 Enum
    health: number;

    partnerId: string | null = null;
    fatherId: string | null = null;
    motherId: string | null = null;
    childrenIds: string[] = [];

    isPregnant: boolean = false;
    pregnancyTimer: number = 0;
    partnerForBabyId: string | null = null;

    lifeGoal: string;
    orientation: string;
    faithfulness: number;

    height: number;
    weight: number;
    appearanceScore: number;
    luck: number;
    constitution: number;    
    eq: number;              
    iq: number;              
    reputation: number;      
    morality: number;        
    creativity: number;      

    needs: any; // Ideally typed as Needs
    skills: any;
    relationships: Record<string, Relationship> = {};
    
    buffs: Buff[];
    mood: number;
    
    money: number;
    dailyBudget: number;
    workPerformance: number;
    job: Job; 
    dailyExpense: number;
    dailyIncome: number; 
    isSideHustle: boolean = false;
    currentShiftStart: number = 0;

    schoolPerformance: number = 60; 
    
    hasLeftWorkToday: boolean = false;

    metabolism: any;
    skillModifiers: Record<string, number>;
    socialModifier: number;

    memories: Memory[] = [];

    action: SimAction | string; // 使用 Enum
    actionTimer: number;
    interactionTarget: any = null;
    bubble: { text: string | null; timer: number; type: string } = { text: null, timer: 0, type: 'normal' };

    commuteTimer: number = 0;

    // 决策冷却计时器
    decisionTimer: number = 0; 

    constructor(config: SimInitConfig = {}) {
        this.job = JOBS.find(j => j.id === 'unemployed')!;

        this.id = Math.random().toString(36).substring(2, 11);
        this.familyId = config.familyId || this.id;
        this.homeId = config.homeId || null;

        this.pos = {
            x: config.x ?? (50 + Math.random() * (CONFIG.CANVAS_W - 100)),
            y: config.y ?? (50 + Math.random() * (CONFIG.CANVAS_H - 100))
        };
        this.prevPos = { ...this.pos }; 
        
        this.speed = (5.0 + Math.random() * 2.0) * 2.0;

        this.gender = config.gender || (Math.random() > 0.5 ? 'M' : 'F');

        this.ageStage = config.ageStage || AgeStage.Adult;
        const stageConfig = AGE_CONFIG[this.ageStage];
        this.age = stageConfig.min + Math.floor(Math.random() * (stageConfig.max - stageConfig.min));

        if (this.ageStage === AgeStage.Infant) {
            this.height = 50 + Math.random() * 25; 
            this.weight = 3 + Math.random() * 7;   
        } else if (this.ageStage === AgeStage.Toddler) {
            this.height = 80 + Math.random() * 20; 
            this.weight = 10 + Math.random() * 6;  
        } else if (this.ageStage === AgeStage.Child) {
            this.height = 110 + Math.random() * 30;
            this.weight = 20 + Math.random() * 15; 
        } else if (this.ageStage === AgeStage.Teen) {
            this.height = 150 + Math.random() * 25; 
            this.weight = 40 + Math.random() * 25;  
        } else {
            const baseHeight = this.gender === 'M' ? 175 : 163;
            this.height = baseHeight + Math.floor((Math.random() - 0.5) * 20); 
            const bmi = 18 + Math.random() * 8; 
            this.weight = Math.floor((this.height / 100) * (this.height / 100) * bmi);
        }
        
        this.height = Math.floor(this.height);
        this.weight = Math.floor(this.weight);
        
        const rand = (Math.random() + Math.random() + Math.random()) / 3;
        this.appearanceScore = Math.floor(rand * 100);
        this.luck = Math.floor(Math.random() * 100);
        const constRand = (Math.random() + Math.random()) / 2;
        this.constitution = Math.floor(constRand * 100);
        this.eq = Math.floor(Math.random() * 100);
        const iqRand = (Math.random() + Math.random() + Math.random()) / 3;
        this.iq = Math.floor(iqRand * 100);
        this.reputation = Math.floor(Math.random() * 40); 
        this.morality = Math.floor(Math.random() * 100);
        this.creativity = Math.floor(Math.random() * 100);
        
        this.surname = config.surname || SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
        this.name = this.surname + GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
        
        this.skinColor = CONFIG.COLORS.skin[Math.floor(Math.random() * CONFIG.COLORS.skin.length)];
        this.hairColor = CONFIG.COLORS.hair[Math.floor(Math.random() * CONFIG.COLORS.hair.length)];
        this.clothesColor = CONFIG.COLORS.clothes[Math.floor(Math.random() * CONFIG.COLORS.clothes.length)];
        this.pantsColor = CONFIG.COLORS.pants[Math.floor(Math.random() * CONFIG.COLORS.pants.length)];

        this.appearance = {
            face: ASSET_CONFIG.face.length > 0 ? ASSET_CONFIG.face[Math.floor(Math.random() * ASSET_CONFIG.face.length)] : '',
            hair: ASSET_CONFIG.hair.length > 0 ? ASSET_CONFIG.hair[Math.floor(Math.random() * ASSET_CONFIG.hair.length)] : '',
            clothes: ASSET_CONFIG.clothes.length > 0 ? ASSET_CONFIG.clothes[Math.floor(Math.random() * ASSET_CONFIG.clothes.length)] : '',
            pants: ASSET_CONFIG.pants.length > 0 ? ASSET_CONFIG.pants[Math.floor(Math.random() * ASSET_CONFIG.pants.length)] : '',
        };

        this.mbti = MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)];
        this.zodiac = ZODIACS[Math.floor(Math.random() * ZODIACS.length)];
        
        this.health = 90 + Math.random() * 10; 

        this.lifeGoal = LIFE_GOALS[Math.floor(Math.random() * LIFE_GOALS.length)];

        this.partnerId = config.partnerId || null;
        this.fatherId = config.fatherId || null;
        this.motherId = config.motherId || null;

        if (config.orientation) {
            this.orientation = config.orientation;
        } else {
            const r = Math.random();
            this.orientation = r < 0.7 ? 'hetero' : (r < 0.85 ? 'homo' : 'bi');
        }

        let baseFaith = this.mbti.includes('J') ? 70 : 40;
        this.faithfulness = Math.min(100, Math.max(0, baseFaith + (Math.random() * 40 - 20)));

        const randNeed = () => 60 + Math.floor(Math.random() * 40);
        this.needs = { 
            [NeedType.Hunger]: randNeed(), 
            [NeedType.Energy]: randNeed(), 
            [NeedType.Fun]: randNeed(), 
            [NeedType.Social]: randNeed(), 
            [NeedType.Bladder]: randNeed(), 
            [NeedType.Hygiene]: randNeed() 
        };
        this.skills = { cooking: 0, athletics: 0, music: 0, dancing: 0, logic: 0, creativity: 0, gardening: 0, fishing: 0 };
        this.relationships = {};

        if (config.money !== undefined) {
            this.money = config.money;
        } else {
            this.money = 500 + Math.floor(Math.random() * 1000);
        }
        
        if ([AgeStage.Infant, AgeStage.Toddler, AgeStage.Child, AgeStage.Teen].includes(this.ageStage)) {
            this.money = 50 + Math.floor(Math.random() * 50);
        }

        this.metabolism = {};
        for (let key in BASE_DECAY) this.metabolism[key] = 1.0;
        this.skillModifiers = {};
        for (let key in this.skills) this.skillModifiers[key] = 1.0;
        this.socialModifier = 1.0;

        this.applyTraits();

        if ([AgeStage.Adult, AgeStage.MiddleAged].includes(this.ageStage)) {
            this.assignJob();
        } else {
            this.job = JOBS.find(j => j.id === 'unemployed')!;
        }
        
        this.dailyExpense = 0;
        this.dailyIncome = 0;
        this.dailyBudget = 0;
        this.workPerformance = 0;

        this.buffs = [];
        this.mood = 80;

        this.action = SimAction.Idle;
        this.actionTimer = 0;

        this.calculateDailyBudget();
    }

    assignJob() {
        CareerLogic.assignJob(this);
    }

    // 经济：支付房租 (代理到 EconomyLogic)
    payRent() {
        EconomyLogic.payRent(this);
    }

    getHomeLocation(): Vector2 | null {
        if (!this.homeId) return null;
        const home = GameStore.housingUnits.find(u => u.id === this.homeId);
        if (!home) return null;
        return { x: home.x + home.area.w / 2, y: home.y + home.area.h / 2 };
    }

    isAtHome(): boolean {
        if (!this.homeId) return false;
        const home = GameStore.housingUnits.find(u => u.id === this.homeId);
        if (!home) return false;
        return (
            this.pos.x >= home.x && this.pos.x <= home.x + home.area.w &&
            this.pos.y >= home.y && this.pos.y <= home.y + home.area.h
        );
    }

    addMemory(text: string, type: Memory['type'], relatedSimId?: string) {
        const timeStr = `Y${GameStore.time.year} M${GameStore.time.month} | ${String(GameStore.time.hour).padStart(2, '0')}:${String(GameStore.time.minute).padStart(2, '0')}`;
        const newMemory: Memory = {
            id: Math.random().toString(36).substring(2, 9),
            time: timeStr,
            type: type,
            text: text,
            relatedSimId: relatedSimId
        };
        this.memories.unshift(newMemory);
        if (this.memories.length > 50) {
            this.memories.pop();
        }
    }

    applyTraits() {
        if (this.mbti.includes('E')) { 
            this.metabolism.social = 1.6; 
            this.socialModifier *= 1.2; 
        } else { 
            this.metabolism.social = 0.6; 
            this.socialModifier *= 0.9;
        }

        if (this.mbti.includes('N')) { this.skillModifiers.logic = 1.3; this.skillModifiers.creativity = 1.3; this.skillModifiers.music = 1.2; }
        else { this.skillModifiers.cooking = 1.3; this.skillModifiers.athletics = 1.3; this.skillModifiers.gardening = 1.3; }
        
        if (this.mbti.includes('F')) { this.socialModifier *= 1.3; this.skillModifiers.dancing = 1.2; }
        else { this.socialModifier *= 0.8; this.skillModifiers.logic *= 1.2; }
        
        if (this.mbti.includes('J')) { this.metabolism.hygiene = 0.8; this.metabolism.energy = 0.9; }
        else { this.metabolism.fun = 1.4; this.skillModifiers.creativity *= 1.1; }

        const el = this.zodiac.element;
        if (el === 'fire') { this.skillModifiers.athletics *= 1.2; this.metabolism.energy *= 0.9; this.metabolism.social *= 1.2; }
        else if (el === 'earth') { this.skillModifiers.gardening *= 1.2; this.skillModifiers.cooking *= 1.2; this.metabolism.hunger *= 0.8; this.metabolism.social *= 0.9; }
        else if (el === 'air') { this.skillModifiers.logic *= 1.1; this.skillModifiers.music *= 1.2; this.metabolism.social *= 1.4; }
        else if (el === 'water') { this.skillModifiers.creativity *= 1.3; this.skillModifiers.dancing *= 1.1; this.socialModifier *= 1.2; }

        if (this.lifeGoal.includes('万人迷') || this.lifeGoal.includes('派对')) { this.metabolism.social *= 1.5; this.socialModifier *= 1.2; }
        if (this.lifeGoal.includes('隐居') || this.lifeGoal.includes('独处')) { this.metabolism.social *= 0.4; }
        if (this.lifeGoal.includes('富翁') || this.lifeGoal.includes('大亨')) { this.metabolism.fun *= 1.2; }
    }

    applyMonthlyEffects(month: number, holiday?: { name: string, type: string }) {
        this.age += 0.1;
        // 生命周期：检查年龄阶段 (代理到 LifeCycleLogic)
        LifeCycleLogic.checkAgeStage(this);

        if (!holiday) return;

        if (holiday.type === 'traditional') {
            if (this.mbti.includes('E') || Object.keys(this.relationships).length > 5) {
                this.addBuff(BUFFS.festive_joy);
                this.say("过年啦！热闹热闹！🧨", 'act');
            } else if (this.mbti.includes('I')) {
                this.addBuff(BUFFS.social_pressure); 
                this.say("亲戚好多...我想静静...", 'bad');
            } else {
                this.addBuff(BUFFS.vacation_chill);
            }
        }
        else if (holiday.type === 'love') {
            const hasLover = Object.values(this.relationships).some((r: Relationship) => r.isLover);
            if (hasLover) {
                this.addBuff(BUFFS.sweet_date);
                this.say("这个月要好好陪TA ❤️", 'love');
            } else {
                if (this.faithfulness > 60 || this.age > 28) {
                    this.addBuff(BUFFS.lonely);
                    this.say("又是一个人过节...", 'bad');
                } else {
                    this.addBuff(BUFFS.playful); 
                    this.say("单身万岁！🍺", 'act');
                }
            }
        }
        else if (holiday.type === 'shopping') {
            this.addBuff(BUFFS.shopping_spree);
            if (this.money > 2000) {
                this.say("买买买！清空购物车！🛒", 'money');
                this.dailyBudget += 500;
            } else {
                this.addBuff(BUFFS.broke);
                this.say("想买但没钱... 💸", 'bad');
            }
        }
        else if (holiday.type === 'break') {
            this.addBuff(BUFFS.vacation_chill);
            this.say("终于放长假了！🌴", 'act');
            this.needs.fun = Math.max(50, this.needs.fun);
        }
    }

    checkDeath(dt: number) {
        LifeCycleLogic.checkDeath(this, dt);
    }

    // 死亡处理已移动到 LifeCycleLogic，这里只是为了兼容旧代码调用
    die(cause: string) {
        LifeCycleLogic.die(this, cause);
    }

    // 遗产处理已移动到 LifeCycleLogic
    handleInheritance() {
        LifeCycleLogic.handleInheritance(this);
    }

    // 经济：计算预算 (代理到 EconomyLogic)
    calculateDailyBudget() {
        EconomyLogic.calculateDailyBudget(this);
    }

    // 经济：检查消费 (代理到 EconomyLogic)
    checkSpending() {
        EconomyLogic.checkSpending(this);
    }
    
    checkCareerSatisfaction() {
        CareerLogic.checkCareerSatisfaction(this);
    }

    // 经济：购买物品 (代理到 EconomyLogic)
    buyItem(item: any) {
        EconomyLogic.buyItem(this, item);
    }

    // 经济：赚钱 (代理到 EconomyLogic)
    earnMoney(amount: number, source: string) {
        EconomyLogic.earnMoney(this, amount, source);
    }

    leaveWorkEarly() {
        CareerLogic.leaveWorkEarly(this);
    }

    update(dt: number, minuteChanged: boolean) {
        this.prevPos = { ...this.pos };
        const f = 0.0008 * dt;

        if (minuteChanged) {
            SchoolLogic.checkKindergarten(this);
            this.updateBuffs(1);
            this.updateMood();
            this.checkDeath(dt); 
            this.checkSchedule();

            if (this.isPregnant) {
                this.pregnancyTimer -= 1; 
                if (this.pregnancyTimer <= 0) {
                    this.giveBirth();
                } else if (this.pregnancyTimer % 60 === 0) {
                    if(Math.random() > 0.8) this.say("宝宝踢我了...", 'act');
                }
            }
            if (GameStore.time.hour === 6 && GameStore.time.minute === 0) {
                SchoolLogic.giveAllowance(this);
            }

            if (this.needs.social < 20 && !this.hasBuff('lonely')) {
                this.addBuff(BUFFS.lonely);
                this.say("好孤独...", 'bad');
            }
            if (this.needs.fun < 20 && !this.hasBuff('bored')) {
                this.addBuff(BUFFS.bored);
                this.say("无聊透顶...", 'bad');
            }
            if (this.needs.hygiene < 20 && !this.hasBuff('smelly')) {
                this.addBuff(BUFFS.smelly);
                this.say("身上有味了...", 'bad');
            }
        }

        // 家具移动追踪逻辑
        if (this.interactionTarget && this.interactionTarget.type !== 'human') {
            const obj = this.interactionTarget as Furniture;
            const currentTargetX = obj.x + obj.w / 2;
            const currentTargetY = obj.y + obj.h / 2;

            if (this.target && (Math.abs(this.target.x - currentTargetX) > 1 || Math.abs(this.target.y - currentTargetY) > 1)) {
                this.target = { x: currentTargetX, y: currentTargetY };
                this.path = []; 
                this.currentPathIndex = 0;
            }

            if ((this.action === SimAction.Using || this.action === SimAction.Working || this.action === SimAction.Eating || this.action === SimAction.Sleeping) && !this.target) {
                const distToObj = Math.sqrt(Math.pow(this.pos.x - currentTargetX, 2) + Math.pow(this.pos.y - currentTargetY, 2));
                if (distToObj > 10) { 
                     this.pos = { x: currentTargetX, y: currentTargetY };
                }
            }
        }

        if (this.action === SimAction.CommutingSchool) {
            this.commuteTimer += dt;
            if (this.commuteTimer > 1200 && this.target) {
                this.pos = { ...this.target };
                this.action = SimAction.Schooling;
                this.say("上课中...", 'act');
            }
        } else if (this.action === SimAction.Schooling) {
            this.needs.fun -= 0.005 * dt; 
            this.skills.logic += 0.002 * dt;
        }

        if (this.needs.energy <= 0 || this.needs.hunger <= 0) {
            this.health -= 0.05 * f * 10; 
            if (Math.random() > 0.95) this.say("感觉快不行了...", 'bad');
        } else if (this.health < 100 && this.needs.energy > 80 && this.needs.hunger > 80) {
            this.health += 0.01 * f;
        }

        if ([AgeStage.Infant, AgeStage.Toddler].includes(this.ageStage)) {
            const isSchoolTime = GameStore.time.hour >= 8 && GameStore.time.hour < 18;

            if (this.homeId && !this.isAtHome()) {
                if (!isSchoolTime && this.action !== SimAction.Schooling && this.action !== SimAction.CommutingSchool) {
                    if (!this.target || this.action !== SimAction.MovingHome) {
                        const homePos = this.getHomeLocation();
                        if (homePos) {
                            this.target = homePos;
                            this.action = SimAction.MovingHome;
                            this.path = []; 
                        }
                    }
                }
            } 
            else if (this.homeId && this.isAtHome()) {
                if (!this.target && Math.random() > 0.95) {
                    const home = GameStore.housingUnits.find(u => u.id === this.homeId);
                    if (home) {
                        const tx = home.x + Math.random() * home.area.w;
                        const ty = home.y + Math.random() * home.area.h;
                        this.target = { x: tx, y: ty };
                        this.action = SimAction.PlayingHome;
                    }
                }
                if (this.needs.hunger < 40) {
                    this.say("饿饿饿...", 'bad');
                    const father = GameStore.sims.find(s => s.id === this.fatherId && s.homeId === this.homeId);
                    const mother = GameStore.sims.find(s => s.id === this.motherId && s.homeId === this.homeId);
                    if ((father && father.isAtHome()) || (mother && mother.isAtHome())) {
                        this.needs.hunger += 30;
                        this.say("好次！", 'love');
                    }
                }
            }
            else if (!isSchoolTime && this.action !== SimAction.Schooling && this.action !== SimAction.CommutingSchool) { 
                const parent = GameStore.sims.find(s => s.id === this.motherId) || GameStore.sims.find(s => s.id === this.fatherId);
                if (parent) {
                    const dist = Math.sqrt(Math.pow(this.pos.x - parent.pos.x, 2) + Math.pow(this.pos.y - parent.pos.y, 2));
                    if (dist > 50) {
                        this.target = { x: parent.pos.x, y: parent.pos.y };
                        this.action = SimAction.Following;
                    }
                }
            }
        }

        if (this.action !== SimAction.Sleeping) this.needs.energy -= BASE_DECAY.energy * this.metabolism.energy * f;
        if (this.action !== SimAction.Eating) this.needs.hunger -= BASE_DECAY.hunger * this.metabolism.hunger * f;
        if (this.action !== SimAction.WatchingMovie) this.needs.fun -= BASE_DECAY.fun * this.metabolism.fun * f;
        this.needs.bladder -= BASE_DECAY.bladder * this.metabolism.bladder * f;
        this.needs.hygiene -= BASE_DECAY.hygiene * this.metabolism.hygiene * f;
        if (this.action !== SimAction.Talking && this.action !== SimAction.WatchingMovie) this.needs.social -= BASE_DECAY.social * this.metabolism.social * f;

        const getRate = (mins: number) => (100 / (mins * 60)) * dt;

        if (this.action === SimAction.Working && !this.isSideHustle) {
            if (this.needs.hunger < 20) {
                this.needs.hunger = 80;
                this.say("摸鱼吃零食 🍫", 'act');
            }
            if (this.needs.bladder < 20) {
                this.needs.bladder = 80;
                this.say("带薪如厕 🚽", 'act');
            }

            const fatigueFactor = 1 + (50 - this.constitution) * 0.01;
            this.needs.energy -= 0.01 * f * Math.max(0.5, fatigueFactor);

            if (this.needs.energy < 15) {
                this.leaveWorkEarly();
            }
        }

        if (this.action === SimAction.Talking) {
            this.needs.social += getRate(RESTORE_TIMES.social);
        }
        else if (this.action === SimAction.Commuting) {
            this.commuteTimer += dt;
            if (this.commuteTimer > 1200 && this.target) {
                this.pos = { ...this.target };
                this.startInteraction();
            }
        }
        else if (this.interactionTarget) {
            const obj = this.interactionTarget;
            
            if (obj.type === 'human' || !obj.utility) {
            } 
            else if (obj.utility === 'work') {
                if (this.action !== SimAction.Working) this.action = SimAction.Working;
            } else {
                let handler = INTERACTIONS[obj.utility];
                if (!handler) {
                     const prefixKey = Object.keys(INTERACTIONS).find(k => k.endsWith('_') && obj.utility && obj.utility.startsWith(k));
                     if (prefixKey) handler = INTERACTIONS[prefixKey];
                }
                if (!handler) handler = INTERACTIONS['default'];

                if (handler && handler.onUpdate) {
                    handler.onUpdate(this, obj, 0.0008 * dt, getRate);
                }
            }
        }

        for (let k in this.needs) this.needs[k] = Math.max(0, Math.min(100, this.needs[k]));

        if (this.actionTimer > 0) {
            this.actionTimer -= dt;
            if (this.actionTimer <= 0) this.finishAction();
        } 
        else if (!this.target) {
            if (this.decisionTimer > 0) {
                this.decisionTimer -= dt;
            } else {
                if (this.job.id !== 'unemployed') {
                    if (this.action !== SimAction.Commuting && this.action !== SimAction.Working && this.action !== SimAction.Schooling) {
                         if (this.action === SimAction.Moving) this.action = SimAction.Idle;
                         DecisionLogic.decideAction(this);
                         this.decisionTimer = 30 + Math.random() * 30; 
                    }
                } else {
                    if (this.action !== SimAction.Commuting && this.action !== SimAction.Working && this.action !== SimAction.Schooling) {
                        if (this.action === SimAction.Moving) this.action = SimAction.Idle;
                        DecisionLogic.decideAction(this);
                        this.decisionTimer = 30 + Math.random() * 30; 
                    }
                }
            }
        }

        if (this.target) {
            const distToTarget = Math.sqrt(Math.pow(this.target.x - this.pos.x, 2) + Math.pow(this.target.y - this.pos.y, 2));
             if (distToTarget <= 10) {
                this.pos = { ...this.target }; 
                this.target = null;
                this.path = []; 
                this.currentPathIndex = 0;
                this.commuteTimer = 0;
                if (this.action === SimAction.CommutingSchool) {
                    this.action = SimAction.Schooling; 
                    this.say("乖乖上学", 'act');
                } 
                else if (this.action !== SimAction.MovingHome) {
                    this.startInteraction();
                } else {
                    this.action = SimAction.Idle; 
                }
            } else {
                if (this.path.length === 0) {
                    this.path = GameStore.pathFinder.findPath(this.pos.x, this.pos.y, this.target.x, this.target.y);
                    this.currentPathIndex = 0;
                    if (this.path.length === 0) {
                        this.decisionTimer = 60; 
                        this.path.push({ x: this.target.x, y: this.target.y }); 
                    }
                }

                if (this.currentPathIndex < this.path.length) {
                    const nextNode = this.path[this.currentPathIndex];
                    const dx = nextNode.x - this.pos.x;
                    const dy = nextNode.y - this.pos.y;
                    const distToNext = Math.sqrt(dx * dx + dy * dy);
                    
                    let speedMod = 1.0;
                    if (this.ageStage === AgeStage.Infant) speedMod = 0.3; 
                    if (this.ageStage === AgeStage.Toddler) speedMod = 0.5;
                    if (this.ageStage === AgeStage.Elder) speedMod = 0.7;
                    if (this.isPregnant) speedMod = 0.6; 

                    const moveStep = this.speed * speedMod * (dt * 0.1);

                    if (distToNext <= moveStep) {
                        this.pos = { x: nextNode.x, y: nextNode.y };
                        this.currentPathIndex++;
                    } else {
                        const angle = Math.atan2(dy, dx);
                        this.pos.x += Math.cos(angle) * moveStep;
                        this.pos.y += Math.sin(angle) * moveStep;
                    }
                    if (this.action !== SimAction.Commuting && this.action !== SimAction.MovingHome) this.action = SimAction.Moving;
                } else {
                    this.pos = { ...this.target };
                    this.target = null;
                    this.path = [];
                    if (this.action !== SimAction.MovingHome) this.startInteraction();
                    else this.action = SimAction.Idle;
                }
            }
            
        }
        if (this.bubble.timer > 0) this.bubble.timer -= dt;
    }

    giveBirth() {
        LifeCycleLogic.giveBirth(this);
    }

    checkSchedule() {
        CareerLogic.checkSchedule(this);
        SchoolLogic.checkSchoolSchedule(this);
    }

    updateBuffs(minutesPassed: number) {
        this.buffs.forEach(b => {
            b.duration -= minutesPassed;
        });
        this.buffs = this.buffs.filter(b => b.duration > 0);
    }

    removeBuff(id: string) {
        this.buffs = this.buffs.filter(b => b.id !== id);
    }

    addBuff(buffDef: any) {
        if (this.hasBuff(buffDef.id)) {
            const b = this.buffs.find(b => b.id === buffDef.id);
            if (b) b.duration = buffDef.duration;
        } else {
            this.buffs.push({ ...buffDef, source: 'system' });
        }
    }

    hasBuff(id: string) { return this.buffs.some(b => b.id === id); }

    updateMood() {
        let total = 0;
        let count = 0;
        for (let k in this.needs) { total += this.needs[k]; count++; }
        let base = total / count;
        this.buffs.forEach(b => {
            if (b.type === 'good') base += 15;
            if (b.type === 'bad') base -= 15;
        });
        this.mood = Math.max(0, Math.min(100, base));
    }

    getRelLabel(rel: any) {
        return SocialLogic.getRelLabel(rel);
    }

    getDialogue(typeId: string, target: Sim) {
        return SocialLogic.getDialogue(this, typeId, target);
    }

    triggerJealousy(actor: Sim, target: Sim) {
        SocialLogic.triggerJealousy(this, actor, target);
    }
    
    updateRelationship(target: Sim, type: string, delta: number) {
        SocialLogic.updateRelationship(this, target, type, delta);
    }

    startInteraction() {
        if (!this.interactionTarget) return;

        if (this.interactionTarget.type === 'human') {
            let partner = this.interactionTarget.ref;
            const dist = Math.sqrt(Math.pow(this.pos.x - partner.pos.x, 2) + Math.pow(this.pos.y - partner.pos.y, 2));
            if (dist > 80 || partner.action === SimAction.Sleeping || partner.action === SimAction.Working) {
                this.reset();
                DecisionLogic.wander(this);
                return;
            }
            this.action = SimAction.Talking;
            this.actionTimer = minutes(40);
            if (partner.action !== SimAction.Talking) {
                partner.reset();
                partner.action = SimAction.Talking;
                partner.actionTimer = minutes(40);
            }
            SocialLogic.performSocial(this, partner);
        } else {
            let obj = this.interactionTarget as Furniture;

            if (obj.cost) {
                if (this.money < obj.cost) {
                    this.say("太贵了...", 'bad');
                    this.reset();
                    return;
                }
                this.money -= obj.cost;
                this.dailyExpense += obj.cost;
                this.dailyBudget -= obj.cost;
                
                GameStore.addLog(this, `消费: ${obj.label} -$${obj.cost}`, 'money');
                this.say(`买! -${obj.cost}`, 'money');
                
                const itemDef = ITEMS.find(i => i.label === obj.label);
                if(itemDef && itemDef.attribute) {
                     this.buyItem(itemDef);
                }
            }

            let handler: InteractionHandler | null = null;
            if (INTERACTIONS && obj.utility) {
                handler = INTERACTIONS[obj.utility];
                if (!handler) {
                     const prefixKey = Object.keys(INTERACTIONS).find(k => k.endsWith('_') && obj.utility && obj.utility.startsWith(k));
                     if (prefixKey) handler = INTERACTIONS[prefixKey];
                }
                if (!handler) handler = INTERACTIONS['default'];
            }

            if (handler && handler.onStart) {
                const success = handler.onStart(this, obj);
                if (!success) {
                    this.reset();
                    return;
                }
            } else {
                this.action = SimAction.Using;
            }

            let durationMinutes = 30;
            if (handler && handler.getDuration) durationMinutes = handler.getDuration(this, obj);
            else if (handler && handler.duration) durationMinutes = handler.duration;
            
            if (handler && !handler.getDuration && !handler.duration) {
                const u = obj.utility;
                const timePer100 = RESTORE_TIMES[u] || RESTORE_TIMES.default;
                if (this.needs[u] !== undefined) {
                    const missing = 100 - this.needs[u];
                    durationMinutes = (missing / 100) * timePer100 * 1.1; 
                }
                durationMinutes = Math.max(10, durationMinutes);
            }

            this.actionTimer = minutes(durationMinutes);

            let verb = handler ? handler.verb : "使用";
            if (Math.random() < 0.8) this.say(verb, 'act');
            if (handler && handler.getVerb) verb = handler.getVerb(this, obj);
            
            if (durationMinutes < 400 && Math.random() < 0.5) this.say(verb, 'act');
        }
    }

    reset() {
        this.target = null;
        this.interactionTarget = null;
        this.action = SimAction.Idle;
        this.actionTimer = 0;
        this.isSideHustle = false;
        this.commuteTimer = 0;
        this.path = []; 
    }

    finishAction() {
        if (this.action === SimAction.Sleeping) {
            this.needs.energy = 100;
            this.addBuff(BUFFS.well_rested);
        }
        if (this.action === SimAction.Eating) this.needs.hunger = 100;
        
        if (this.action === SimAction.Using && this.interactionTarget) {
            let u = this.interactionTarget.utility;
            let obj = this.interactionTarget;

            if (!u) {
                this.reset();
                return;
            }

            let handler = INTERACTIONS[u];
            if (!handler) {
                 const prefixKey = Object.keys(INTERACTIONS).find(k => k.endsWith('_') && u.startsWith(k));
                 if (prefixKey) handler = INTERACTIONS[prefixKey];
            }
            
            if (handler && handler.onFinish) {
                handler.onFinish(this, obj);
            }

            if (!u.startsWith('buy_') && this.needs[u] !== undefined && this.needs[u] > 90) this.needs[u] = 100;
        }
        
        if (this.action === SimAction.Talking) this.needs.social = 100;
        this.reset();
    }

    say(text: string, type: string = 'normal') {
        this.bubble.text = text;
        this.bubble.timer = 150;
        this.bubble.type = type;
    }

    getDaySummary(monthIndex: number) {
        const recentMemories = this.memories
            .slice(0, 5) 
            .map(m => m.text);

        const activeBuffs = this.buffs.map(b => b.label).join(', ');

        let partnerName = "无";
        const partnerId = Object.keys(this.relationships).find(id => this.relationships[id].isLover);
        if (partnerId) {
            const partner = GameStore.sims.find(s => s.id === partnerId);
            if (partner) partnerName = partner.name;
        }

        return {
            id: this.id,
            name: this.name,
            age: this.age,
            mbti: this.mbti, 
            job: this.job.title,
            lifeGoal: this.lifeGoal, 
            money: this.money, 
            buffs: activeBuffs, 
            partner: partnerName, 
            events: recentMemories 
        };
    }

    addDiary(content: string) {
        this.addMemory(`📔 [日记] ${content}`, 'life'); 
        
        if (Math.random() > 0.7) {
            this.say("写完了月度总结...", 'sys');
        }
    }
}