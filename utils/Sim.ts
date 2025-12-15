import { CONFIG, BASE_DECAY, LIFE_GOALS, MBTI_TYPES, SURNAMES, GIVEN_NAMES, ZODIACS, JOBS, ITEMS, BUFFS, ASSET_CONFIG, HOLIDAYS } from '../constants';
import { Vector2, Job, Buff, SimAppearance, Furniture, Memory } from '../types';
import { GameStore } from './simulation'; // 需要引入 GameStore 来访问 pathFinder
import { minutes, getJobCapacity } from './simulationHelpers';
import { SocialLogic } from './logic/social';
import { DecisionLogic } from './logic/decision';
import { INTERACTIONS, RESTORE_TIMES, InteractionHandler } from './logic/interactionRegistry';

export class Sim {
    id: string;
    pos: Vector2;
    prevPos: Vector2; 
    target: Vector2 | null = null;
    
    // [新增] 路径相关属性
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

    needs: any;
    skills: any;
    relationships: any;
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

    addMemory(text: string, type: Memory['type'], relatedSimId?: string) {
        const timeStr = `Day ${GameStore.time.day} ${String(GameStore.time.hour).padStart(2, '0')}:${String(GameStore.time.minute).padStart(2, '0')}`;
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
            if (item.trigger === 'rich_hungry' && this.money > 5000) score += 50;
            if (item.trigger === 'addicted' && this.mbti.includes('P') && this.needs.fun < 30) score += 100;
            if (item.trigger === 'love' && this.hasBuff('in_love')) score += 80;

            score += Math.random() * 20;

            if (score > 50 && score > maxScore) {
                maxScore = score;
                bestItem = item;
            }
        });

        if (bestItem) {
            if (['drink', 'book', 'museum_ticket'].includes(bestItem.id)) {
                this.buyItem(bestItem);
            }
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
                    SocialLogic.updateRelationship(lover, this, 'romance', 10);
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
            const currentHour = GameStore.time.hour;
            const isWorkDay = this.job.workDays.includes(GameStore.time.weekday);
            const isWorkTime = this.job.id !== 'unemployed' && isWorkDay && 
                               currentHour >= this.job.startHour && currentHour < this.job.endHour;

            if (isWorkTime) {
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

        // [核心修改] 移动逻辑：如果设定了目标，则寻路
        // 这里的逻辑是：DecisionLogic 设定了 this.target
        // 我们需要检测到 this.target 变化，然后生成 path
        // 为了简化，我们在 update 中每帧检查
        
        if (this.target) {
            const distToTarget = Math.sqrt(Math.pow(this.target.x - this.pos.x, 2) + Math.pow(this.target.y - this.pos.y, 2));
            
            // 1. 如果离目标很近，直接结束移动
            if (distToTarget <= 10) {
                this.pos = { ...this.target }; 
                this.target = null;
                this.path = []; // 清空路径
                this.currentPathIndex = 0;
                this.commuteTimer = 0; 
                this.startInteraction();
            } else {
                // 2. 如果有目标但没有路径，或者路径的目标不匹配（这里简化，假设 target 一旦设定就不变直到到达或重置）
                // 实际上 target 变化时会先 reset() 清空 path
                if (this.path.length === 0) {
                    // 生成路径
                    this.path = GameStore.pathFinder.findPath(this.pos.x, this.pos.y, this.target.x, this.target.y);
                    this.currentPathIndex = 0;
                    
                    // 如果寻路失败（比如目标完全不可达），降级为直线移动
                    if (this.path.length === 0) {
                        this.path.push({ x: this.target.x, y: this.target.y });
                    }
                }

                // 3. 沿着路径移动
                if (this.currentPathIndex < this.path.length) {
                    const nextNode = this.path[this.currentPathIndex];
                    const dx = nextNode.x - this.pos.x;
                    const dy = nextNode.y - this.pos.y;
                    const distToNext = Math.sqrt(dx * dx + dy * dy);
                    
                    let speedMod = 1.0;
                    if (this.mood > 90) speedMod = 1.3;
                    if (this.mood < 30) speedMod = 0.7;
                    
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
                    // 路径走完了，但可能因为 float 精度还没完全重合 target，强制完成
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

        const isHoliday = HOLIDAYS.some(h => h.month === GameStore.time.month && h.day === GameStore.time.date);
        const isWorkDay = this.job.workDays.includes(GameStore.time.weekday);

        if (isHoliday || !isWorkDay) return;

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
                if (this.job.companyType === 'internet' && this.skills.logic > 50) dailyPerf += 5;
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
}