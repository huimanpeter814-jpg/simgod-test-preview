import { CONFIG, BASE_DECAY, LIFE_GOALS, MBTI_TYPES, SURNAMES, GIVEN_NAMES, ZODIACS, JOBS, ITEMS, BUFFS, ASSET_CONFIG, AGE_CONFIG } from '../constants';
import { Vector2, Job, Buff, SimAppearance, Furniture, Memory, Relationship, AgeStage } from '../types';
import { GameStore } from './simulation'; 
import { minutes, getJobCapacity } from './simulationHelpers';
import { SocialLogic } from './logic/social';
import { CareerLogic } from './logic/career';
import { DecisionLogic } from './logic/decision';
import { INTERACTIONS, RESTORE_TIMES, InteractionHandler } from './logic/interactionRegistry';
import { SchoolLogic } from './logic/school';

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
    ageStage: AgeStage;
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

    needs: any;
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

    action: string;
    actionTimer: number;
    interactionTarget: any = null;
    bubble: { text: string | null; timer: number; type: string } = { text: null, timer: 0, type: 'normal' };

    commuteTimer: number = 0;

    // [优化] 决策冷却计时器，防止每帧都进行复杂寻路和决策
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

        this.ageStage = config.ageStage || 'Adult';
        const stageConfig = AGE_CONFIG[this.ageStage];
        this.age = stageConfig.min + Math.floor(Math.random() * (stageConfig.max - stageConfig.min));

        if (this.ageStage === 'Infant') {
            this.height = 50 + Math.random() * 25; 
            this.weight = 3 + Math.random() * 7;   
        } else if (this.ageStage === 'Toddler') {
            this.height = 80 + Math.random() * 20; 
            this.weight = 10 + Math.random() * 6;  
        } else if (this.ageStage === 'Child') {
            this.height = 110 + Math.random() * 30;
            this.weight = 20 + Math.random() * 15; 
        } else if (this.ageStage === 'Teen') {
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
        this.needs = { hunger: randNeed(), energy: randNeed(), fun: randNeed(), social: randNeed(), bladder: randNeed(), hygiene: randNeed() };
        this.skills = { cooking: 0, athletics: 0, music: 0, dancing: 0, logic: 0, creativity: 0, gardening: 0, fishing: 0 };
        this.relationships = {};

        if (config.money !== undefined) {
            this.money = config.money;
        } else {
            this.money = 500 + Math.floor(Math.random() * 1000);
        }
        
        if (['Infant', 'Toddler', 'Child', 'Teen'].includes(this.ageStage)) {
            this.money = 50 + Math.floor(Math.random() * 50);
        }

        this.metabolism = {};
        for (let key in BASE_DECAY) this.metabolism[key] = 1.0;
        this.skillModifiers = {};
        for (let key in this.skills) this.skillModifiers[key] = 1.0;
        this.socialModifier = 1.0;

        this.applyTraits();

        if (['Adult', 'MiddleAged'].includes(this.ageStage)) {
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

        this.action = 'idle';
        this.actionTimer = 0;

        this.calculateDailyBudget();
    }

    assignJob() {
        CareerLogic.assignJob(this);
    }

    payRent() {
        if (!this.homeId) return; 
        if (this.ageStage === 'Infant' || this.ageStage === 'Toddler' || this.ageStage === 'Child') return;

        const home = GameStore.housingUnits.find(u => u.id === this.homeId);
        if (!home) return;

        const adultRoommates = GameStore.sims.filter(s => s.homeId === this.homeId && !['Infant', 'Toddler', 'Child'].includes(s.ageStage));
        const share = Math.ceil(home.cost / (adultRoommates.length || 1));

        if (this.money >= share) {
            this.money -= share;
            this.dailyExpense += share;
        } else {
            this.addBuff(BUFFS.broke);
            this.say("房租要交不起了...", 'bad');
        }
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
        this.checkAgeStage();

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

    checkAgeStage() {
        const currentStageConf = AGE_CONFIG[this.ageStage];
        if (this.age > currentStageConf.max) {
            const stages: AgeStage[] = ['Infant', 'Toddler', 'Child', 'Teen', 'Adult', 'MiddleAged', 'Elder'];
            const idx = stages.indexOf(this.ageStage);
            if (idx < stages.length - 1) {
                this.ageStage = stages[idx + 1];
                this.say(`我长大了！变成 ${AGE_CONFIG[this.ageStage].label} 了`, 'sys');
                this.addMemory(`在这个月，我成长为了 ${AGE_CONFIG[this.ageStage].label}。`, 'life');
                
                if (this.ageStage === 'Toddler') { this.height += 30; this.weight += 7; }
                else if (this.ageStage === 'Child') { this.height += 30; this.weight += 15; }
                else if (this.ageStage === 'Teen') { this.height += 30; this.weight += 20; }
                else if (this.ageStage === 'Adult') { this.height += 5; this.weight += 5; }

                if (this.ageStage === 'Adult' && this.job.id === 'unemployed') {
                    this.assignJob();
                    this.say("该找份工作养活自己了！", 'sys');
                }
            }
        }
    }

    checkDeath(dt: number) {
        if (this.health <= 0) {
            this.die("健康耗尽");
            return;
        }
        if (this.ageStage === 'Elder') {
            let deathProb = 0.00001 * (this.age - 60) * dt; 
            deathProb *= (1.5 - this.constitution / 100);
            deathProb *= (1.5 - this.luck / 100);

            if (Math.random() < deathProb) {
                this.die("寿终正寝");
            }
        }
    }

    die(cause: string) {
        GameStore.addLog(this, `[讣告] ${this.name} 因 ${cause} 离世了，享年 ${Math.floor(this.age)} 岁。`, 'bad');
        GameStore.sims.forEach(s => {
            if (s.id === this.id) return;
            const rel = s.relationships[this.id];
            if ((rel && rel.friendship > 60) || this.familyId === s.familyId) {
                s.addBuff(BUFFS.mourning);
                s.addMemory(`${this.name} 离开了我们... R.I.P.`, 'family');
                s.say("R.I.P...", 'bad');
            }
            delete s.relationships[this.id];
        });
        GameStore.removeSim(this.id);
    }

    calculateDailyBudget() {
        if (['Infant', 'Toddler', 'Child', 'Teen'].includes(this.ageStage)) {
            this.dailyBudget = 0;
            return;
        }

        let safetyPercent = 0.2;
        const isEarth = this.zodiac.element === 'earth';
        const isFire = this.zodiac.element === 'fire';
        const isJ = this.mbti.includes('J');

        if (isEarth || isJ) safetyPercent = 0.4;
        if (isFire || !isJ) safetyPercent = 0.1;

        const safetyMargin = this.money * safetyPercent;
        let disposable = Math.max(0, this.money - safetyMargin);

        let propensity = 0.2;
        if (this.hasBuff('rich_feel')) propensity = 0.5;
        if (this.hasBuff('shopping_spree')) propensity = 0.8; 
        if (this.hasBuff('stressed')) propensity = 0.4;

        this.dailyBudget = Math.floor(disposable * propensity);
    }

    checkSpending() {
        if (this.action !== 'wandering' && this.action !== 'idle') {
            return;
        }
        if (this.money <= 0) return;

        if (this.money < 100) {
            if (!this.hasBuff('broke') && !this.hasBuff('anxious')) {
                this.addBuff(BUFFS.broke);
                this.addBuff(BUFFS.anxious);
            }
            return;
        }

        const affordable = ITEMS.filter(item => item.cost <= this.dailyBudget && item.cost <= this.money);
        let bestItem: any = null;
        let maxScore = 0;

        affordable.forEach(item => {
            let score = 0;
            if (item.needs) {
                if (item.needs.hunger && this.needs.hunger < 60) score += item.needs.hunger * 2;
                if (item.needs.fun && this.needs.fun < 60) score += item.needs.fun * 2;
                if (item.needs.energy && this.needs.energy < 50 && item.needs.energy > 0) score += 20;
            }
            if (item.id === 'museum_ticket' && (this.mbti.includes('N') || this.skills.creativity > 20)) {
                score += 40;
            }
            
            if (item.skill) {
                if (this.lifeGoal.includes('博学') || this.lifeGoal.includes('富翁')) score += 30;
                if (this.mbti.includes('N') && item.skill === 'logic') score += 20;
                if (this.zodiac.element === 'fire' && item.skill === 'athletics') score += 20;
            }

            if (item.attribute) {
                const currentVal = (this as any)[item.attribute] || 0;
                if (currentVal < 40) score += 30;

                if (item.attribute === 'iq' && this.job.companyType === 'internet') score += 40;
                if (item.attribute === 'creativity' && this.job.companyType === 'design') score += 40;
                if ((item.attribute === 'appearanceScore' || item.attribute === 'eq') && this.job.companyType === 'business') score += 40;
                if (item.attribute === 'constitution' && this.job.companyType === 'restaurant') score += 30;

                if (this.lifeGoal.includes('万人迷') && item.attribute === 'appearanceScore') score += 50;
                if (this.lifeGoal.includes('大牛') && item.attribute === 'iq') score += 50;
                if (this.lifeGoal.includes('健身') && item.attribute === 'constitution') score += 50;
            }

            if (this.hasBuff('shopping_spree')) {
                score += 50; 
                if (item.cost > 100) score += 30; 
            }

            if (item.trigger === 'rich_hungry' && this.money > 5000) score += 50;
            if (item.trigger === 'addicted' && this.mbti.includes('P') && this.needs.fun < 30) score += 100;
            if (item.trigger === 'love' && this.hasBuff('in_love')) score += 80;
            if (item.trigger === 'beauty' && this.appearanceScore < 50) score += 30; 

            score += Math.random() * 20;

            if (score > 50 && score > maxScore) {
                maxScore = score;
                bestItem = item;
            }
        });

        if (bestItem) {
            this.buyItem(bestItem);
        }
        
        this.checkCareerSatisfaction();
    }
    
    checkCareerSatisfaction() {
        CareerLogic.checkCareerSatisfaction(this);
    }

    buyItem(item: any) {
        this.money -= item.cost;
        this.dailyExpense += item.cost;
        this.dailyBudget -= item.cost;

        if (item.needs) {
            for (let k in item.needs) {
                if (this.needs[k] !== undefined) this.needs[k] = Math.min(100, this.needs[k] + item.needs[k]);
            }
        }

        if (item.skill) {
            let val = item.skillVal || 5;
            this.skills[item.skill] = Math.min(100, this.skills[item.skill] + val);
            this.say("📚 涨知识", 'act');
        }

        if (item.attribute) {
            let val = item.attrVal || 2;
            const current = (this as any)[item.attribute] || 0;
            (this as any)[item.attribute] = Math.min(100, current + val);
            
            let emoji = '✨';
            if (item.attribute === 'appearanceScore') emoji = '💅';
            if (item.attribute === 'constitution') emoji = '💪';
            if (item.attribute === 'iq') emoji = '🧠';
            
            this.say(`${emoji} 提升!`, 'act');
        }

        if (item.buff) this.addBuff(BUFFS[item.buff as keyof typeof BUFFS]);

        if (item.id === 'museum_ticket') {
             this.say("买票去看展 🎨", 'act');
             this.addBuff(BUFFS.art_inspired);
             DecisionLogic.findObject(this, 'art'); 
        }

        let logSuffix = "";
        if (item.rel) {
            const loverId = Object.keys(this.relationships).find(id => this.relationships[id].isLover);
            if (loverId) {
                const lover = GameStore.sims.find(s => s.id === loverId);
                if (lover) {
                    let relBonus = 15;
                    if (lover.lifeGoal.includes('富翁')) relBonus += 10;
                    
                    SocialLogic.updateRelationship(lover, this, 'romance', relBonus);
                    lover.needs.fun = Math.min(100, lover.needs.fun + 20);
                    logSuffix = ` (送给 ${lover.name})`;
                    this.addMemory(`给 ${lover.name} 买了 ${item.label}，希望Ta喜欢。`, 'social', lover.id);
                }
            }
        }

        if (item.id !== 'museum_ticket') this.say(`💸 ${item.label}`, 'act');
        GameStore.addLog(this, `购买了 ${item.label} -$${item.cost}${logSuffix}`, 'money');
    }

    earnMoney(amount: number, source: string) {
        const earned = Math.floor(amount);
        this.money += earned;
        this.dailyIncome += earned; 
        GameStore.addLog(this, `通过 ${source} 赚了 $${earned}`, 'money');
        this.say(`赚到了! +$${earned}`, 'money');
        this.addBuff(BUFFS.side_hustle_win);
    }


    leaveWorkEarly() {
        CareerLogic.leaveWorkEarly(this);
    }

    update(dt: number, minuteChanged: boolean) {
        this.prevPos = { ...this.pos };
        const f = 0.0008 * dt;

        // [优化] 分时处理逻辑，大量低频逻辑移入 minuteChanged
        if (minuteChanged) {
            SchoolLogic.checkKindergarten(this);
            this.updateBuffs(1);
            this.updateMood(); // 心情计算不用每帧进行
            this.checkDeath(dt); // 死亡判定每分钟一次足矣
            
            // [优化] 工作日程检查每分钟一次即可
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

            // 分钟级的状态检查
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
        // ==========================================
        // [修复] 动态追踪逻辑：检查家具是否移动了
        // ==========================================
        if (this.interactionTarget && this.interactionTarget.type !== 'human') {
            const obj = this.interactionTarget as Furniture;
            // 计算家具当前的中心点
            const currentTargetX = obj.x + obj.w / 2;
            const currentTargetY = obj.y + obj.h / 2;

            // 1. 如果正在路上 (moving/commuting)，发现目标变了，更新目标并重置路径
            if (this.target && (Math.abs(this.target.x - currentTargetX) > 1 || Math.abs(this.target.y - currentTargetY) > 1)) {
                // console.log(`[Sim] 目标家具 ${obj.label} 移动了，重新寻路...`);
                this.target = { x: currentTargetX, y: currentTargetY };
                this.path = []; // 清空路径，触发下一帧的重新 A* 寻路
                this.currentPathIndex = 0;
            }

            // 2. 如果正在使用中 (using/working)，发现家具移走了，强制中断或瞬移
            // 这里选择瞬移跟随，保持视觉连贯性
            if ((this.action === 'using' || this.action === 'working' || this.action === 'eating' || this.action === 'sleeping') && !this.target) {
                const distToObj = Math.sqrt(Math.pow(this.pos.x - currentTargetX, 2) + Math.pow(this.pos.y - currentTargetY, 2));
                if (distToObj > 10) { // 如果距离家具中心超过10像素
                     // 选择 A: 瞬移跟随 (看起来像被家具带着走)
                     this.pos = { x: currentTargetX, y: currentTargetY };
                     
                     // 选择 B: 或者中断动作 (如果觉得瞬移太怪)
                     // this.reset();
                     // this.say("诶？椅子呢？", "bad");
                }
            }
        }

        if (this.action === 'commuting_school') {
            this.commuteTimer += dt;
            if (this.commuteTimer > 1200 && this.target) {
                this.pos = { ...this.target };
                this.action = 'schooling';
                this.say("上课中...", 'act');
            }
        } else if (this.action === 'schooling') {
            this.needs.fun -= 0.005 * dt; 
            this.skills.logic += 0.002 * dt;
        }

        // [优化] 移除原本每帧调用的 checkSchedule / updateMood / checkDeath
        // 这些已经移入 minuteChanged 块中

        if (this.needs.energy <= 0 || this.needs.hunger <= 0) {
            this.health -= 0.05 * f * 10; 
            if (Math.random() > 0.95) this.say("感觉快不行了...", 'bad');
        } else if (this.health < 100 && this.needs.energy > 80 && this.needs.hunger > 80) {
            this.health += 0.01 * f;
        }

        // [修复] 优化婴幼儿行为逻辑，防止与幼儿园托管逻辑冲突
        if (['Infant', 'Toddler'].includes(this.ageStage)) {
            // [新增] 检查当前是否为上学时间 (8点到18点)
            const isSchoolTime = GameStore.time.hour >= 8 && GameStore.time.hour < 18;

            // 1. 如果不在家
            if (this.homeId && !this.isAtHome()) {
                // 如果不是上学时间 (或没去上学)，且不在家，才尝试回家
                // 如果是上学时间，SchoolLogic 会负责传送，Sim.ts 里的回家逻辑会被屏蔽
                if (!isSchoolTime && this.action !== 'schooling' && this.action !== 'commuting_school') {
                    if (!this.target || this.action !== 'moving_home') {
                        const homePos = this.getHomeLocation();
                        if (homePos) {
                            this.target = homePos;
                            this.action = 'moving_home';
                            this.path = []; 
                        }
                    }
                }
            } 
            // 2. 如果在家
            else if (this.homeId && this.isAtHome()) {
                if (!this.target && Math.random() > 0.95) {
                    const home = GameStore.housingUnits.find(u => u.id === this.homeId);
                    if (home) {
                        const tx = home.x + Math.random() * home.area.w;
                        const ty = home.y + Math.random() * home.area.h;
                        this.target = { x: tx, y: ty };
                        this.action = 'playing_home';
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
            // 3. 其他情况 (比如无家可归，跟随父母)
            // [修复] 同样增加 !isSchoolTime 限制，上学期间不跟随
            else if (!isSchoolTime && this.action !== 'schooling' && this.action !== 'commuting_school') { 
                const parent = GameStore.sims.find(s => s.id === this.motherId) || GameStore.sims.find(s => s.id === this.fatherId);
                if (parent) {
                    const dist = Math.sqrt(Math.pow(this.pos.x - parent.pos.x, 2) + Math.pow(this.pos.y - parent.pos.y, 2));
                    if (dist > 50) {
                        this.target = { x: parent.pos.x, y: parent.pos.y };
                        this.action = 'following';
                    }
                }
            }
        }

        if (this.action !== 'sleeping') this.needs.energy -= BASE_DECAY.energy * this.metabolism.energy * f;
        if (this.action !== 'eating') this.needs.hunger -= BASE_DECAY.hunger * this.metabolism.hunger * f;
        if (this.action !== 'watching_movie') this.needs.fun -= BASE_DECAY.fun * this.metabolism.fun * f;
        this.needs.bladder -= BASE_DECAY.bladder * this.metabolism.bladder * f;
        this.needs.hygiene -= BASE_DECAY.hygiene * this.metabolism.hygiene * f;
        if (this.action !== 'talking' && this.action !== 'watching_movie') this.needs.social -= BASE_DECAY.social * this.metabolism.social * f;

        const getRate = (mins: number) => (100 / (mins * 60)) * dt;

        if (this.action === 'working' && !this.isSideHustle) {
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

        if (this.action === 'talking') {
            this.needs.social += getRate(RESTORE_TIMES.social);
        }
        else if (this.action === 'commuting') {
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
                if (this.action !== 'working') this.action = 'working';
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
            // [优化] 决策冷却逻辑，防止每帧都在进行寻路计算
            if (this.decisionTimer > 0) {
                this.decisionTimer -= dt;
            } else {
                // 只有当没有目标、没有正在进行动作、且冷却时间到了的时候，才做决策
                if (this.job.id !== 'unemployed') {
                    if (this.action !== 'commuting' && this.action !== 'working' && this.action !== 'schooling') {
                         if (this.action === 'moving') this.action = 'idle';
                         DecisionLogic.decideAction(this);
                         this.decisionTimer = 30 + Math.random() * 30; // 决策后休息 1-2 秒 (30-60 ticks)
                    }
                } else {
                    if (this.action !== 'commuting' && this.action !== 'working' && this.action !== 'schooling') {
                        if (this.action === 'moving') this.action = 'idle';
                        DecisionLogic.decideAction(this);
                        this.decisionTimer = 30 + Math.random() * 30; // 决策后休息 1-2 秒
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
                if (this.action === 'commuting_school') {
                    this.action = 'schooling'; 
                    this.say("乖乖上学", 'act');
                } 
                else if (this.action !== 'moving_home') {
                    this.startInteraction();
                } else {
                    this.action = 'idle'; 
                }
            } else {
                if (this.path.length === 0) {
                    this.path = GameStore.pathFinder.findPath(this.pos.x, this.pos.y, this.target.x, this.target.y);
                    this.currentPathIndex = 0;
                    if (this.path.length === 0) {
                        // [优化] 如果寻路失败，稍微等待再重试，防止每帧都寻路
                        this.decisionTimer = 60; 
                        this.path.push({ x: this.target.x, y: this.target.y }); // 降级为直线
                    }
                }

                if (this.currentPathIndex < this.path.length) {
                    const nextNode = this.path[this.currentPathIndex];
                    const dx = nextNode.x - this.pos.x;
                    const dy = nextNode.y - this.pos.y;
                    const distToNext = Math.sqrt(dx * dx + dy * dy);
                    
                    let speedMod = 1.0;
                    if (this.ageStage === 'Infant') speedMod = 0.3; 
                    if (this.ageStage === 'Toddler') speedMod = 0.5;
                    if (this.ageStage === 'Elder') speedMod = 0.7;
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
                    if (this.action !== 'commuting' && this.action !== 'moving_home') this.action = 'moving';
                } else {
                    this.pos = { ...this.target };
                    this.target = null;
                    this.path = [];
                    if (this.action !== 'moving_home') this.startInteraction();
                    else this.action = 'idle';
                }
            }
            
        }
        if (this.bubble.timer > 0) this.bubble.timer -= dt;
    }

    giveBirth() {
        this.isPregnant = false;
        this.pregnancyTimer = 0;
        this.removeBuff('pregnant');
        this.addBuff(BUFFS.new_parent);

        const gender: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
        
        let babySurname = this.surname;
        if (this.partnerForBabyId) {
            const partner = GameStore.sims.find(s => s.id === this.partnerForBabyId);
            if (partner && Math.random() > 0.5) {
                babySurname = partner.surname;
            }
        }

        const baby = new Sim({
            x: this.pos.x + 20,
            y: this.pos.y + 20,
            surname: babySurname, 
            familyId: this.familyId,
            ageStage: 'Infant',
            gender: gender,
            motherId: this.id, 
            fatherId: this.partnerForBabyId || undefined,
            homeId: this.homeId, 
        });

        if (Math.random() > 0.5) baby.skinColor = this.skinColor;
        baby.hairColor = this.hairColor;

        GameStore.sims.push(baby);
        this.childrenIds.push(baby.id);

        if (this.partnerForBabyId) {
            const partner = GameStore.sims.find(s => s.id === this.partnerForBabyId);
            if (partner) {
                partner.childrenIds.push(baby.id);
                partner.addBuff(BUFFS.new_parent);
                partner.addMemory(`我们有孩子了！取名叫 ${baby.name}`, 'family', baby.id);
                
                SocialLogic.setKinship(partner, baby, 'child');
                SocialLogic.setKinship(baby, partner, 'parent');
            }
        }

        SocialLogic.setKinship(this, baby, 'child');
        SocialLogic.setKinship(baby, this, 'parent');

        GameStore.addLog(this, `生下了一个健康的${gender==='M'?'男':'女'}婴：${baby.name}！👶`, 'family');
        this.addMemory(`我的孩子 ${baby.name} 出生了！`, 'family', baby.id);
        this.say("是个可爱的宝宝！", 'love');
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
            if (dist > 80 || partner.action === 'sleeping' || partner.action === 'working') {
                this.reset();
                DecisionLogic.wander(this);
                return;
            }
            this.action = 'talking';
            this.actionTimer = minutes(40);
            if (partner.action !== 'talking') {
                partner.reset();
                partner.action = 'talking';
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
                this.action = 'using';
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
        this.action = 'idle';
        this.actionTimer = 0;
        this.isSideHustle = false;
        this.commuteTimer = 0;
        this.path = []; 
    }

    finishAction() {
        if (this.action === 'sleeping') {
            this.needs.energy = 100;
            this.addBuff(BUFFS.well_rested);
        }
        if (this.action === 'eating') this.needs.hunger = 100;
        
        if (this.action === 'using' && this.interactionTarget) {
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
        
        if (this.action === 'talking') this.needs.social = 100;
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