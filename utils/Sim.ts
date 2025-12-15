import { CONFIG, BASE_DECAY, LIFE_GOALS, MBTI_TYPES, SURNAMES, GIVEN_NAMES, ZODIACS, JOBS, ITEMS, BUFFS, ASSET_CONFIG, HOLIDAYS } from '../constants';
import { Vector2, Job, Buff, SimAppearance, Furniture, Memory, Relationship } from '../types';
import { GameStore } from './simulation'; 
import { minutes, getJobCapacity } from './simulationHelpers';
import { SocialLogic } from './logic/social';
import { DecisionLogic } from './logic/decision';
import { INTERACTIONS, RESTORE_TIMES, InteractionHandler } from './logic/interactionRegistry';

export class Sim {
    id: string;
    pos: Vector2;
    prevPos: Vector2; 
    target: Vector2 | null = null;
    
    path: Vector2[] = [];
    currentPathIndex: number = 0;
    
    speed: number;
    gender: 'M' | 'F';
    name: string;
    
    skinColor: string;
    hairColor: string;
    clothesColor: string;
    appearance: SimAppearance;

    mbti: string;
    zodiac: any;
    age: number;
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
    // [修复] 明确类型，避免 Object.values 推断为 unknown[]
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

    constructor(x?: number, y?: number) {
        this.id = Math.random().toString(36).substring(2, 11);
        this.pos = {
            x: x ?? (50 + Math.random() * (CONFIG.CANVAS_W - 100)),
            y: y ?? (50 + Math.random() * (CONFIG.CANVAS_H - 100))
        };
        this.prevPos = { ...this.pos }; 
        
        this.speed = (5.0 + Math.random() * 2.0) * 2.0;

        this.gender = Math.random() > 0.5 ? 'M' : 'F';

        const baseHeight = this.gender === 'M' ? 175 : 163;
        this.height = baseHeight + Math.floor((Math.random() - 0.5) * 20); 
        
        const bmi = 18 + Math.random() * 8; 
        this.weight = Math.floor((this.height / 100) * (this.height / 100) * bmi);
        
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
        
        this.name = this.generateName();
        this.skinColor = CONFIG.COLORS.skin[Math.floor(Math.random() * CONFIG.COLORS.skin.length)];
        this.hairColor = CONFIG.COLORS.hair[Math.floor(Math.random() * CONFIG.COLORS.hair.length)];
        this.clothesColor = CONFIG.COLORS.clothes[Math.floor(Math.random() * CONFIG.COLORS.clothes.length)];

        this.appearance = {
            face: ASSET_CONFIG.face.length > 0 ? ASSET_CONFIG.face[Math.floor(Math.random() * ASSET_CONFIG.face.length)] : '',
            hair: ASSET_CONFIG.hair.length > 0 ? ASSET_CONFIG.hair[Math.floor(Math.random() * ASSET_CONFIG.hair.length)] : '',
            clothes: ASSET_CONFIG.clothes.length > 0 ? ASSET_CONFIG.clothes[Math.floor(Math.random() * ASSET_CONFIG.clothes.length)] : '',
            pants: ASSET_CONFIG.pants.length > 0 ? ASSET_CONFIG.pants[Math.floor(Math.random() * ASSET_CONFIG.pants.length)] : '',
        };

        this.mbti = MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)];
        this.zodiac = ZODIACS[Math.floor(Math.random() * ZODIACS.length)];
        this.age = 20 + Math.floor(Math.random() * 10);
        this.lifeGoal = LIFE_GOALS[Math.floor(Math.random() * LIFE_GOALS.length)];

        const r = Math.random();
        this.orientation = r < 0.7 ? 'hetero' : (r < 0.85 ? 'homo' : 'bi');

        let baseFaith = this.mbti.includes('J') ? 70 : 40;
        this.faithfulness = Math.min(100, Math.max(0, baseFaith + (Math.random() * 40 - 20)));

        const randNeed = () => 60 + Math.floor(Math.random() * 40);
        this.needs = { hunger: randNeed(), energy: randNeed(), fun: randNeed(), social: randNeed(), bladder: randNeed(), hygiene: randNeed() };
        this.skills = { cooking: 0, athletics: 0, music: 0, dancing: 0, logic: 0, creativity: 0, gardening: 0, fishing: 0 };
        this.relationships = {};

        this.money = 1000 + Math.floor(Math.random() * 2000);

        this.metabolism = {};
        for (let key in BASE_DECAY) this.metabolism[key] = 1.0;
        this.skillModifiers = {};
        for (let key in this.skills) this.skillModifiers[key] = 1.0;
        this.socialModifier = 1.0;

        this.applyTraits();

        let preferredType = '';
        if (this.lifeGoal.includes('富翁') || this.mbti.includes('T')) preferredType = 'internet';
        else if (this.lifeGoal.includes('博学') || this.mbti.includes('N')) preferredType = 'design';
        else if (this.mbti.includes('E')) preferredType = 'business';
        else preferredType = Math.random() > 0.5 ? 'store' : 'restaurant';

        const validJobs = JOBS.filter(j => {
            if (j.id === 'unemployed') return true;
            if (j.level !== 1) return false; 
            if (preferredType && j.companyType !== preferredType) return false;
            
            const capacity = getJobCapacity(j);
            const currentCount = GameStore.sims.filter(s => s.job.id === j.id).length;
            return currentCount < capacity;
        });

        let finalJobChoice: Job | undefined = validJobs.length > 0 ? validJobs[Math.floor(Math.random() * validJobs.length)] : undefined;
        if (!finalJobChoice) finalJobChoice = JOBS.find(j => j.id === 'unemployed')!;
        
        this.job = finalJobChoice!;
        this.dailyExpense = 0;
        this.dailyIncome = 0;
        this.dailyBudget = 0;
        this.workPerformance = 0;

        this.buffs = [];
        this.mood = 80;

        this.action = 'idle';
        this.actionTimer = 0;

        this.calculateDailyBudget();
        GameStore.addLog(this, `搬进了社区。职位: ${this.job.title}`, 'sys');
        
        this.addMemory(`搬进了社区，开始了新生活。`, 'life');
        if (this.job.id !== 'unemployed') {
            this.addMemory(`找到了一份新工作：${this.job.title}`, 'job');
        }
    }

    // [新增] ageGroup Getter，修复 Inspector 报错
    get ageGroup(): string {
        if (this.age < 25) return '青年';
        if (this.age < 45) return '壮年';
        if (this.age < 65) return '中年';
        return '老年';
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

    generateName() { return SURNAMES[Math.floor(Math.random() * SURNAMES.length)] + GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)]; }

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
        if (!holiday) return;

        // 1. 春节 (Traditional)
        if (holiday.type === 'traditional') {
            // [修复] 使用 Object.keys().length 而不是直接 .length
            if (this.mbti.includes('E') || Object.keys(this.relationships).length > 5) {
                this.addBuff(BUFFS.festive_joy);
                this.say("过年啦！热闹热闹！🧨", 'act');
            } else if (this.mbti.includes('I')) {
                this.addBuff(BUFFS.social_pressure); // I人社恐
                this.say("亲戚好多...我想静静...", 'bad');
            } else {
                this.addBuff(BUFFS.vacation_chill);
            }
        }
        
        // 2. 恋爱季 (Love)
        else if (holiday.type === 'love') {
            // [修复] 显式类型声明 (r: Relationship) 避免 unknown 错误
            const hasLover = Object.values(this.relationships).some((r: Relationship) => r.isLover);
            if (hasLover) {
                this.addBuff(BUFFS.sweet_date);
                this.say("这个月要好好陪TA ❤️", 'love');
            } else {
                if (this.faithfulness > 60 || this.age > 28) {
                    this.addBuff(BUFFS.lonely);
                    this.say("又是一个人过节...", 'bad');
                } else {
                    this.addBuff(BUFFS.playful); // 单身贵族
                    this.say("单身万岁！🍺", 'act');
                }
            }
        }

        // 3. 购物节 (Shopping)
        else if (holiday.type === 'shopping') {
            this.addBuff(BUFFS.shopping_spree);
            if (this.money > 2000) {
                this.say("买买买！清空购物车！🛒", 'money');
                // 提高预算
                this.dailyBudget += 500;
            } else {
                this.addBuff(BUFFS.broke);
                this.say("想买但没钱... 💸", 'bad');
            }
        }

        // 4. 黄金周/假期 (Break)
        else if (holiday.type === 'break') {
            this.addBuff(BUFFS.vacation_chill);
            this.say("终于放长假了！🌴", 'act');
            this.needs.fun = Math.max(50, this.needs.fun);
        }
    }

    calculateDailyBudget() {
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
        if (this.hasBuff('shopping_spree')) propensity = 0.8; // 购物节加成
        if (this.hasBuff('stressed')) propensity = 0.4;

        this.dailyBudget = Math.floor(disposable * propensity);
    }

    checkSpending() {
        if (this.action !== 'wandering' && this.action !== 'idle') {
            return;
        }

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

            // [修改] 购物狂欢节逻辑
            if (this.hasBuff('shopping_spree')) {
                score += 50; // 什么都想买
                if (item.cost > 100) score += 30; // 越贵越想买
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
        if (this.job.id === 'unemployed') return;
        
        let quitScore = 0;
        if (this.mood < 30) quitScore += 20;
        if (this.hasBuff('stressed') || this.hasBuff('anxious')) quitScore += 30;
        if (this.money > 10000) quitScore += 10; 
        
        if (this.job.companyType === 'internet' && this.mbti.includes('F')) quitScore += 10;
        if (this.job.companyType === 'business' && this.mbti.includes('I')) quitScore += 15;
        
        if (Math.random() * 100 < quitScore && quitScore > 50) {
            GameStore.addLog(this, `决定辞职... "这工作不适合我"`, 'sys');
            this.addMemory(`辞去了 ${this.job.title} 的工作，想要休息一段时间。`, 'job');
            
            this.job = JOBS.find(j => j.id === 'unemployed')!;
            this.workPerformance = 0;
            this.say("我不干了! 💢", 'bad');
            this.addBuff(BUFFS.well_rested);
        }
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
        const currentHour = GameStore.time.hour + GameStore.time.minute / 60;
        let startHour = this.currentShiftStart || this.job.startHour;
        const totalDuration = this.job.endHour - this.job.startHour;

        let workedDuration = currentHour - startHour;
        if (workedDuration < 0) workedDuration += 24;

        const workRatio = Math.max(0, Math.min(1, workedDuration / totalDuration));
        
        const actualPay = Math.floor(this.job.salary * workRatio);
        this.money += actualPay;
        this.dailyIncome += actualPay;

        this.action = 'idle';
        this.actionTimer = 0; 
        this.target = null;
        this.interactionTarget = null;
        this.hasLeftWorkToday = true;

        this.addBuff(BUFFS.stressed);
        this.needs.fun = Math.max(0, this.needs.fun - 20);
        
        GameStore.addLog(this, `因精力耗尽早退。实发工资: $${actualPay} (占比 ${(workRatio*100).toFixed(0)}%)`, 'money');
        this.say("太累了，先溜了... 😓", 'bad');
    }

    update(dt: number, minuteChanged: boolean) {
        this.prevPos = { ...this.pos };
        const f = 0.0008 * dt;

        if (minuteChanged) {
            this.updateBuffs(1);
        }

        this.checkSchedule();
        this.updateMood();

        if (minuteChanged) { 
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
            if (this.job.id !== 'unemployed') {
                if (this.action !== 'commuting' && this.action !== 'working') {
                     if (this.action === 'moving') this.action = 'idle';
                     DecisionLogic.decideAction(this);
                }
            } else {
                if (this.action !== 'commuting' && this.action !== 'working') {
                    if (this.action === 'moving') this.action = 'idle';
                    DecisionLogic.decideAction(this);
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
                this.startInteraction();
            } else {
                if (this.path.length === 0) {
                    this.path = GameStore.pathFinder.findPath(this.pos.x, this.pos.y, this.target.x, this.target.y);
                    this.currentPathIndex = 0;
                    if (this.path.length === 0) {
                        this.path.push({ x: this.target.x, y: this.target.y });
                    }
                }

                if (this.currentPathIndex < this.path.length) {
                    const nextNode = this.path[this.currentPathIndex];
                    const dx = nextNode.x - this.pos.x;
                    const dy = nextNode.y - this.pos.y;
                    const distToNext = Math.sqrt(dx * dx + dy * dy);
                    
                    let speedMod = 1.0;
                    if (this.mood > 90) speedMod = 1.3;
                    if (this.mood < 30) speedMod = 0.7;
                    speedMod += (this.constitution - 50) * 0.005;
                    
                    const moveStep = this.speed * speedMod * (dt * 0.1);

                    if (distToNext <= moveStep) {
                        this.pos = { x: nextNode.x, y: nextNode.y };
                        this.currentPathIndex++;
                    } else {
                        const angle = Math.atan2(dy, dx);
                        this.pos.x += Math.cos(angle) * moveStep;
                        this.pos.y += Math.sin(angle) * moveStep;
                    }
                    
                    if (this.action !== 'commuting') {
                        this.action = 'moving';
                    }
                } else {
                    this.pos = { ...this.target };
                    this.target = null;
                    this.path = [];
                    this.startInteraction();
                }
            }
        }
        
        if (this.bubble.timer > 0) this.bubble.timer -= dt;
    }

    checkSchedule() {
        if (this.job.id === 'unemployed') return;

        const currentMonth = GameStore.time.month;
        const holiday = HOLIDAYS[currentMonth];
        
        const isVacationMonth = this.job.vacationMonths?.includes(currentMonth);

        const isPublicHoliday = holiday && (holiday.type === 'traditional' || holiday.type === 'break');

        if (isPublicHoliday || isVacationMonth) return;

        const currentHour = GameStore.time.hour;
        const isWorkTime = currentHour >= this.job.startHour && currentHour < this.job.endHour;

        if (isWorkTime) {
            if (this.hasLeftWorkToday) return;

            if (this.action === 'working') return;
            if (this.action === 'commuting' && this.interactionTarget?.utility === 'work') return;
            
            this.isSideHustle = false; 
            this.currentShiftStart = GameStore.time.hour + GameStore.time.minute / 60;

            let searchLabels: string[] = [];
            let searchCategories: string[] = ['work', 'work_group']; 

            if (this.job.companyType === 'internet') {
                searchLabels = this.job.level >= 4 ? ['老板椅'] : ['码农工位', '控制台'];
            } else if (this.job.companyType === 'design') {
                searchLabels = ['画架'];
                searchCategories.push('paint'); 
            } else if (this.job.companyType === 'business') {
                searchLabels = this.job.level >= 4 ? ['老板椅'] : ['商务工位'];
            } else if (this.job.companyType === 'store') {
                searchLabels = ['服务台', '影院服务台', '售票处']; 
            } else if (this.job.companyType === 'restaurant') {
                if (this.job.title.includes('厨') || this.job.title === '打杂') {
                    searchLabels = ['后厨', '灶台'];
                } else {
                    searchLabels = ['餐厅前台'];
                }
            } else if (this.job.companyType === 'library') {
                searchLabels = ['管理员'];
            }

            let candidateFurniture: Furniture[] = [];
            searchCategories.forEach(cat => {
                const list = GameStore.furnitureIndex.get(cat);
                if (list) candidateFurniture = candidateFurniture.concat(list);
            });

            const validDesks = candidateFurniture.filter(f =>
                searchLabels.some(l => f.label.includes(l))
            );

            if (validDesks.length > 0) {
                const desk = validDesks[Math.floor(Math.random() * validDesks.length)];
                
                let targetX = desk.x + desk.w / 2;
                let targetY = desk.y + desk.h / 2;
                
                targetX += (Math.random() - 0.5) * 15;
                targetY += (Math.random() - 0.5) * 15;

                this.target = { x: targetX, y: targetY };
                this.interactionTarget = { ...desk, utility: 'work' };
                this.action = 'commuting';
                this.actionTimer = 0; 
                this.commuteTimer = 0;
                this.say("去上班 💼", 'act');
            } else {
                const randomSpot = { x: 100 + Math.random()*200, y: 100 + Math.random()*200 };
                this.target = randomSpot;
                this.interactionTarget = {
                    id: `virtual_work_${this.id}`,
                    utility: 'work',
                    label: '站立办公',
                    type: 'virtual'
                };
                this.action = 'commuting';
                this.actionTimer = 0;
                this.commuteTimer = 0;
                this.say("站着上班 💼", 'bad');
            }
        } 
        else {
            this.hasLeftWorkToday = false;

            if (this.action === 'working' || this.action === 'commuting') {
                 if (this.action === 'commuting' && this.interactionTarget?.utility !== 'work') return;

                this.action = 'idle';
                this.target = null;
                this.interactionTarget = null;
                this.path = []; // Reset Path
                
                this.money += this.job.salary;
                this.dailyIncome += this.job.salary;
                this.say(`下班! +$${this.job.salary}`, 'money');
                this.addBuff(BUFFS.stressed);

                let dailyPerf = 5; 
                if (this.job.companyType === 'internet') {
                    if (this.iq > 70) dailyPerf += 5;
                    if (this.skills.logic > 50) dailyPerf += 3;
                } else if (this.job.companyType === 'design') {
                    if (this.creativity > 70) dailyPerf += 5;
                    if (this.skills.creativity > 50) dailyPerf += 3;
                } else if (this.job.companyType === 'business') {
                    if (this.eq > 70) dailyPerf += 5;
                    if (this.appearanceScore > 70) dailyPerf += 3;
                } else if (this.job.companyType === 'restaurant') {
                    if (this.constitution > 70) dailyPerf += 5;
                    if (this.skills.cooking > 50) dailyPerf += 3;
                }

                if (this.mood > 80) dailyPerf += 2;

                this.workPerformance += dailyPerf;

                if (this.workPerformance > 500 && this.job.level < 4) {
                    this.promote();
                    this.workPerformance = 100;
                }
            }
        }
    }

    promote() {
        const nextLevel = JOBS.find(j => j.companyType === this.job.companyType && j.level === this.job.level + 1);
        if (!nextLevel) return;

        const cap = getJobCapacity(nextLevel);
        const currentHolders = GameStore.sims.filter(s => s.job.id === nextLevel.id);
        
        if (currentHolders.length < cap) {
            this.job = nextLevel;
            this.money += 1000;
            this.dailyIncome += 1000; 
            GameStore.addLog(this, `升职了！现在是 ${nextLevel.title} (Lv.${nextLevel.level})`, 'sys');
            this.say("升职啦! 🚀", 'act');
            this.addBuff(BUFFS.promoted);
            this.addMemory(`因为表现优异，升职为 ${nextLevel.title}！`, 'job');
        } else {
            const victim = currentHolders.sort((a, b) => a.workPerformance - b.workPerformance)[0];
            if (this.workPerformance + this.mood > victim.workPerformance + victim.mood) {
                const oldJob = this.job;
                this.job = nextLevel;
                victim.job = oldJob; 
                victim.workPerformance = 0; 
                this.money += 1000;
                this.dailyIncome += 1000;
                this.addBuff(BUFFS.promoted);
                victim.addBuff(BUFFS.demoted);
                GameStore.addLog(this, `PK 成功！取代了 ${victim.name} 成为 ${nextLevel.title}`, 'sys');
                this.say("我赢了! 👑", 'act');
                victim.say("可恶... 😭", 'bad');
                this.addMemory(`在职场竞争中击败了 ${victim.name}，成功晋升为 ${nextLevel.title}。`, 'job', victim.id);
                victim.addMemory(`在职场竞争中输给了 ${this.name}，被降职了...`, 'bad', this.id);
            } else {
                GameStore.addLog(this, `尝试晋升 ${nextLevel.title} 但 PK 失败了。`, 'sys');
                this.workPerformance -= 100; 
                this.say("还需要努力...", 'bad');
            }
        }
    }

    updateBuffs(minutesPassed: number) {
        this.buffs.forEach(b => {
            b.duration -= minutesPassed;
        });
        this.buffs = this.buffs.filter(b => b.duration > 0);
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
        this.path = []; // Clear Path
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
        const timePrefix = `Y${GameStore.time.year} M${GameStore.time.month}`;
        
        // 1. 获取近期记忆 (Events)
        // 过滤掉一些太琐碎的系统日志，保留生活相关的
        const recentMemories = this.memories
            .slice(0, 5) // 取最近5条
            .map(m => m.text);

        // 2. 获取当前状态 (Buffs) - 这非常关键！
        // 比如 "恋爱脑, 社畜过劳, 暴富幻觉"
        const activeBuffs = this.buffs.map(b => b.label).join(', ');

        // 3. 获取伴侣名字 (如果有)
        let partnerName = "无";
        const partnerId = Object.keys(this.relationships).find(id => this.relationships[id].isLover);
        if (partnerId) {
            const partner = GameStore.sims.find(s => s.id === partnerId);
            if (partner) partnerName = partner.name;
        }

        // 4. 返回更丰富的数据包
        return {
            id: this.id,
            name: this.name,
            age: this.age,
            mbti: this.mbti, // 性格决定语气
            job: this.job.title,
            lifeGoal: this.lifeGoal, // 人生目标，AI 可以用来写感慨
            money: this.money, // 存款，AI 可以写哭穷或炫富
            buffs: activeBuffs, // 当前状态，决定日记基调
            partner: partnerName, // 提到伴侣
            events: recentMemories // 发生的具体事件
        };
    }

    addDiary(content: string) {
        this.addMemory(`📔 [日记] ${content}`, 'life'); 
        
        if (Math.random() > 0.7) {
            this.say("写完了月度总结...", 'sys');
        }
    }
}