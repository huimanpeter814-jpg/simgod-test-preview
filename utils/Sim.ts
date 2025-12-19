
import { CONFIG, BASE_DECAY, LIFE_GOALS, MBTI_TYPES, SURNAMES, GIVEN_NAMES, ZODIACS, JOBS, ITEMS, BUFFS, ASSET_CONFIG, AGE_CONFIG } from '../constants';
import { Vector2, Job, Buff, SimAppearance, Furniture, Memory, Relationship, AgeStage, SimAction, JobType, NeedType } from '../types';
import { GameStore } from './simulation'; 
import { minutes, getInteractionPos } from './simulationHelpers'; // 🆕 引入
import { SocialLogic } from './logic/social';
import { CareerLogic } from './logic/career';
import { DecisionLogic } from './logic/decision';
import { INTERACTIONS, RESTORE_TIMES, InteractionHandler } from './logic/interactionRegistry';
import { SchoolLogic } from './logic/school';
import { LifeCycleLogic } from './logic/LifeCycleLogic'; 
import { EconomyLogic } from './logic/EconomyLogic';     
import { 
    SimState, 
    IdleState, 
    WorkingState, 
    MovingState, 
    CommutingState, 
    InteractionState, 
    FollowingState,
    CommutingSchoolState,
    SchoolingState,
    PlayingHomeState,
    PickingUpState,
    EscortingState,
    BeingEscortedState,
    NannyState,
    TransitionState // 🆕 引入
} from './logic/SimStates';

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
    traits?: string[]; 
    familyLore?: string; 
    workplaceId?: string; 
}

export class Sim {
    id: string;
    familyId: string;
    homeId: string | null = null;
    workplaceId?: string; 
    commutePreTime: number = 30; 
    lastPunchInTime?: number;    
    
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
    
    traits: string[];
    familyLore?: string;

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

    needs: Record<NeedType, number>; 
    skills: any;
    relationships: Record<string, Relationship> = {};
    
    buffs: Buff[];
    mood: number;
    
    money: number;
    dailyBudget: number;
    workPerformance: number;
    consecutiveAbsences: number = 0; 

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

    state: SimState;
    action: SimAction | string; 
    
    actionTimer: number;
    interactionTarget: any = null;
    bubble: { text: string | null; timer: number; type: string } = { text: null, timer: 0, type: 'normal' };

    commuteTimer: number = 0;
    decisionTimer: number = 0; 

    carryingSimId: string | null = null; 
    carriedBySimId: string | null = null; 

    isTemporary: boolean = false; 

    constructor(config: SimInitConfig = {}) {
        this.job = JOBS.find(j => j.id === 'unemployed')!;

        this.id = Math.random().toString(36).substring(2, 11);
        this.familyId = config.familyId || this.id;
        this.homeId = config.homeId || null;
        this.workplaceId = config.workplaceId; 

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

        if (this.ageStage === AgeStage.Infant) { this.height = 50 + Math.random() * 25; this.weight = 3 + Math.random() * 7; } 
        else if (this.ageStage === AgeStage.Toddler) { this.height = 80 + Math.random() * 20; this.weight = 10 + Math.random() * 6; } 
        else if (this.ageStage === AgeStage.Child) { this.height = 110 + Math.random() * 30; this.weight = 20 + Math.random() * 15; } 
        else if (this.ageStage === AgeStage.Teen) { this.height = 150 + Math.random() * 25; this.weight = 40 + Math.random() * 25; } 
        else {
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
        
        this.traits = config.traits || [];
        this.familyLore = config.familyLore;

        this.health = 90 + Math.random() * 10; 
        this.lifeGoal = LIFE_GOALS[Math.floor(Math.random() * LIFE_GOALS.length)];

        this.partnerId = config.partnerId || null;
        this.fatherId = config.fatherId || null;
        this.motherId = config.motherId || null;

        if (config.orientation) { this.orientation = config.orientation; } 
        else { const r = Math.random(); this.orientation = r < 0.7 ? 'hetero' : (r < 0.85 ? 'homo' : 'bi'); }

        let baseFaith = this.mbti.includes('J') ? 70 : 40;
        this.faithfulness = Math.min(100, Math.max(0, baseFaith + (Math.random() * 40 - 20)));

        const randNeed = () => 60 + Math.floor(Math.random() * 40);
        this.needs = { 
            [NeedType.Hunger]: randNeed(), 
            [NeedType.Energy]: randNeed(), 
            [NeedType.Fun]: randNeed(), 
            [NeedType.Social]: randNeed(), 
            [NeedType.Bladder]: randNeed(), 
            [NeedType.Hygiene]: randNeed(),
            [NeedType.Comfort]: 100
        };
        this.skills = { cooking: 0, athletics: 0, music: 0, dancing: 0, logic: 0, creativity: 0, gardening: 0, fishing: 0 };
        this.relationships = {};

        if (config.money !== undefined) { this.money = config.money; } 
        else { this.money = 500 + Math.floor(Math.random() * 1000); }
        
        if ([AgeStage.Infant, AgeStage.Toddler].includes(this.ageStage)) { 
            this.money = 0; 
        } else if ([AgeStage.Child, AgeStage.Teen].includes(this.ageStage)) {
            this.money = 50 + Math.floor(Math.random() * 50); 
        }

        this.metabolism = {};
        for (let key in BASE_DECAY) this.metabolism[key] = 1.0;
        this.skillModifiers = {};
        for (let key in this.skills) this.skillModifiers[key] = 1.0;
        this.socialModifier = 1.0;

        this.buffs = []; this.mood = 80;

        this.applyTraits();

        if ([AgeStage.Adult, AgeStage.MiddleAged].includes(this.ageStage)) { this.assignJob(); } 
        else { this.job = JOBS.find(j => j.id === 'unemployed')!; }
        
        this.dailyExpense = 0; this.dailyIncome = 0; this.dailyBudget = 0; this.workPerformance = 0;


        this.actionTimer = 0;
        this.calculateDailyBudget();

        this.state = new IdleState();
        this.action = SimAction.Idle;
    }

    // === 核心状态机方法 ===

    changeState(newState: SimState) {
        if (this.state) {
            this.state.exit(this);
        }
        this.state = newState;
        this.action = newState.actionName; 
        this.state.enter(this);
    }

    startCommuting() {
        this.changeState(new CommutingState());
    }

    startMovingToInteraction() {
        this.changeState(new MovingState(SimAction.Moving));
    }

    startWandering() {
        this.changeState(new MovingState(SimAction.Wandering));
    }

    enterWorkingState() {
        this.changeState(new WorkingState());
    }

    enterInteractionState(actionName: string) {
        this.changeState(new InteractionState(actionName));
    }

    restoreState() {
        switch (this.action) {
            case SimAction.Idle: this.state = new IdleState(); break;
            case SimAction.Working: this.state = new WorkingState(); break;
            case SimAction.Commuting: this.state = new CommutingState(); break;
            case SimAction.CommutingSchool: this.state = new CommutingSchoolState(); break;
            case SimAction.Schooling: this.state = new SchoolingState(); break;
            case SimAction.Following: this.state = new FollowingState(); break;
            case SimAction.PlayingHome: this.state = new PlayingHomeState(); break;
            case SimAction.PickingUp: this.state = new PickingUpState(); break;
            case SimAction.Escorting: this.state = new EscortingState(); break;
            case SimAction.BeingEscorted: this.state = new BeingEscortedState(); break;
            case SimAction.NannyWork: this.state = new NannyState(); break; 
            
            case SimAction.Moving:
            case SimAction.Wandering:
            case SimAction.MovingHome:
                this.state = new MovingState(this.action);
                break;
            default:
                this.state = new InteractionState(this.action);
                break;
        }
        if (!this.state) {
            this.state = new IdleState();
            this.action = SimAction.Idle;
        }
    }

    startInteraction() {
        if (!this.interactionTarget) {
            this.changeState(new IdleState());
            return;
        }

        if (this.interactionTarget.type === 'human') {
            this.changeState(new InteractionState(SimAction.Talking));
            this.actionTimer = minutes(40);
            
            const partner = this.interactionTarget.ref as Sim;
            if (partner.action !== SimAction.Talking) {
                partner.interactionTarget = { type: 'human', ref: this };
                partner.changeState(new InteractionState(SimAction.Talking));
                partner.actionTimer = minutes(40);
            }
            SocialLogic.performSocial(this, partner);
        } 
        else {
            const obj = this.interactionTarget as Furniture;
            
            // 🆕 检查是否需要过渡动画 (Transition)
            // 如果市民当前位置和实际交互位置(actPos)距离超过阈值，则先进入 TransitionState
            const { interact } = getInteractionPos(obj);
            const dist = Math.sqrt(Math.pow(this.pos.x - interact.x, 2) + Math.pow(this.pos.y - interact.y, 2));
            
            if (dist > 5) {
                // 进入过渡状态，并在结束后递归调用自己 (或直接设置状态)
                // 这里我们使用闭包来捕获后续逻辑
                this.changeState(new TransitionState(interact, () => {
                    // Transition 完成后的回调：真正开始交互
                    this._performInteractionLogic(obj);
                    return this.state; // 返回新状态
                }));
                return;
            }

            this._performInteractionLogic(obj);
        }
    }

    // 将原有的交互逻辑抽离出来
    private _performInteractionLogic(obj: Furniture) {
        if (obj.cost) {
            if (this.money < obj.cost) {
                this.say("太贵了...", 'bad');
                this.finishAction();
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
                this.finishAction();
                return;
            }
        }

        let actionType = SimAction.Using;
        if (obj.utility === 'energy') actionType = SimAction.Sleeping;
        else if (obj.utility === 'hunger' || obj.utility === 'eat_out') actionType = SimAction.Eating;
        else if (obj.utility === 'work') actionType = SimAction.Working;
        
        let durationMinutes = 30;
        if (handler && handler.getDuration) durationMinutes = handler.getDuration(this, obj);
        else if (handler && handler.duration) durationMinutes = handler.duration;
        else {
            const u = obj.utility;
            const timePer100 = RESTORE_TIMES[u] || RESTORE_TIMES.default;
            const needKey = u as NeedType;
            if (this.needs[needKey] !== undefined) {
                const missing = 100 - this.needs[needKey];
                durationMinutes = (missing / 100) * timePer100 * 1.1; 
            }
            durationMinutes = Math.max(10, durationMinutes);
        }

        this.actionTimer = minutes(durationMinutes);
        
        if (actionType === SimAction.Working) {
            this.changeState(new WorkingState()); 
        } else {
            this.changeState(new InteractionState(actionType));
        }

        let verb = handler ? handler.verb : "使用";
        if (handler && handler.getVerb) verb = handler.getVerb(this, obj);
        if (Math.random() < 0.8) this.say(verb, 'act');
    }

    finishAction() {
        if (this.action === SimAction.Sleeping) {
            this.needs[NeedType.Energy] = 100;
            this.addBuff(BUFFS.well_rested);
        }
        if (this.action === SimAction.Eating) this.needs[NeedType.Hunger] = 100;
        
        if (this.interactionTarget && this.interactionTarget.type !== 'human') {
            let u = this.interactionTarget.utility;
            let obj = this.interactionTarget;
            let handler = INTERACTIONS[u] || INTERACTIONS['default'];
            if (handler && handler.onFinish) handler.onFinish(this, obj);
            
            const needKey = u as NeedType;
            if (!u.startsWith('buy_') && this.needs[needKey] !== undefined && this.needs[needKey] > 90) {
                this.needs[needKey] = 100;
            }
        }
        
        if (this.action === SimAction.Talking) this.needs[NeedType.Social] = 100;
        
        this.target = null;
        this.interactionTarget = null;
        this.path = [];
        this.isSideHustle = false;
        this.commuteTimer = 0;
        
        this.changeState(new IdleState());
    }

    // ... (rest of methods: moveTowardsTarget, decayNeeds, update, etc. are same as above)
    // 必须保留完整类定义，此处省略以节省空间，实际部署时请确保不丢失代码。
    // ...
    moveTowardsTarget(dt: number): boolean {
        if (!this.target) return true;
        const distToTarget = Math.sqrt(Math.pow(this.target.x - this.pos.x, 2) + Math.pow(this.target.y - this.pos.y, 2));
        if (distToTarget <= 10) { this.pos = { ...this.target }; this.target = null; this.path = []; this.currentPathIndex = 0; return true; }
        if (this.path.length === 0) { this.path = GameStore.pathFinder.findPath(this.pos.x, this.pos.y, this.target.x, this.target.y); this.currentPathIndex = 0; if (this.path.length === 0) { this.decisionTimer = 60; this.path.push({ x: this.target.x, y: this.target.y }); } }
        if (this.currentPathIndex < this.path.length) {
            const nextNode = this.path[this.currentPathIndex];
            const dx = nextNode.x - this.pos.x; const dy = nextNode.y - this.pos.y;
            const distToNext = Math.sqrt(dx * dx + dy * dy);
            let speedMod = 1.0;
            if (this.ageStage === AgeStage.Infant) speedMod = 0.3; 
            if (this.ageStage === AgeStage.Toddler) speedMod = 0.5;
            if (this.ageStage === AgeStage.Elder) speedMod = 0.7;
            if (this.isPregnant) speedMod = 0.6; 
            if (this.action === SimAction.Escorting) speedMod *= 0.8;
            const moveStep = this.speed * speedMod * (dt * 0.1);
            if (distToNext <= moveStep) { this.pos = { x: nextNode.x, y: nextNode.y }; this.currentPathIndex++; } 
            else { const angle = Math.atan2(dy, dx); this.pos.x += Math.cos(angle) * moveStep; this.pos.y += Math.sin(angle) * moveStep; }
        } else { this.pos = { ...this.target }; this.target = null; this.path = []; return true; }
        return false;
    }
    
    decayNeeds(dt: number, exclude: NeedType[] = []) {
        const f = 0.0008 * dt;
        if (!exclude.includes(NeedType.Energy)) this.needs[NeedType.Energy] -= BASE_DECAY[NeedType.Energy] * this.metabolism.energy * f;
        if (!exclude.includes(NeedType.Hunger)) this.needs[NeedType.Hunger] -= BASE_DECAY[NeedType.Hunger] * this.metabolism.hunger * f;
        if (!exclude.includes(NeedType.Fun)) this.needs[NeedType.Fun] -= BASE_DECAY[NeedType.Fun] * this.metabolism.fun * f;
        if (!exclude.includes(NeedType.Bladder)) this.needs[NeedType.Bladder] -= BASE_DECAY[NeedType.Bladder] * this.metabolism.bladder * f;
        if (!exclude.includes(NeedType.Hygiene)) this.needs[NeedType.Hygiene] -= BASE_DECAY[NeedType.Hygiene] * this.metabolism.hygiene * f;
        if (!exclude.includes(NeedType.Social)) this.needs[NeedType.Social] -= BASE_DECAY[NeedType.Social] * this.metabolism.social * f;
        (Object.keys(this.needs) as NeedType[]).forEach(k => { this.needs[k] = Math.max(0, Math.min(100, this.needs[k])); });
    }

    update(dt: number, minuteChanged: boolean) {
        this.prevPos = { ...this.pos };
        const f = 0.0008 * dt;
        if (minuteChanged) {
            SchoolLogic.checkKindergarten(this); this.updateBuffs(1); this.updateMood(); this.checkDeath(dt); this.checkSchedule();
            if (GameStore.time.hour === 0 && GameStore.time.minute === 0) { CareerLogic.checkFire(this); }
            if (this.isPregnant) { this.pregnancyTimer -= 1; if (this.pregnancyTimer <= 0) { this.giveBirth(); } else if (this.pregnancyTimer % 60 === 0) { if(Math.random() > 0.8) this.say("宝宝踢我了...", 'act'); } }
            if (GameStore.time.hour === 6 && GameStore.time.minute === 0) { SchoolLogic.giveAllowance(this); }
            if (this.needs[NeedType.Social] < 20 && !this.hasBuff('lonely')) { this.addBuff(BUFFS.lonely); this.say("好孤独...", 'bad'); }
            if (this.needs[NeedType.Fun] < 20 && !this.hasBuff('bored')) { this.addBuff(BUFFS.bored); this.say("无聊透顶...", 'bad'); }
            if (this.needs[NeedType.Hygiene] < 20 && !this.hasBuff('smelly')) { this.addBuff(BUFFS.smelly); this.say("身上有味了...", 'bad'); }
            if (this.homeId && [AgeStage.Infant, AgeStage.Toddler].includes(this.ageStage) && this.isAtHome() && !this.carriedBySimId && this.action !== SimAction.Waiting && this.action !== SimAction.BeingEscorted) {
                const parentsHome = GameStore.sims.some(s => (s.id === this.motherId || s.id === this.fatherId) && s.homeId === this.homeId && s.isAtHome());
                if (!parentsHome) { const hasNanny = GameStore.sims.some(s => s.homeId === this.homeId && s.isTemporary); if (!hasNanny) { GameStore.spawnNanny(this.homeId, 'home_care'); } }
            }
        }
        if (this.needs[NeedType.Energy] <= 0 || this.needs[NeedType.Hunger] <= 0) { this.health -= 0.05 * f * 10; if (Math.random() > 0.95) this.say("感觉快不行了...", 'bad'); } 
        else if (this.health < 100 && this.needs[NeedType.Energy] > 80 && this.needs[NeedType.Hunger] > 80) { this.health += 0.01 * f; }
        if ([AgeStage.Infant, AgeStage.Toddler].includes(this.ageStage)) { if (this.action === SimAction.Idle && !this.target && !this.interactionTarget) { if (this.isAtHome()) { this.changeState(new FollowingState()); } } }
        this.state.update(this, dt);
        if (this.bubble.timer > 0) this.bubble.timer -= dt;
    }

    assignJob() { CareerLogic.assignJob(this); }
    payRent() { EconomyLogic.payRent(this); }
    getHomeLocation(): Vector2 | null { if (!this.homeId) return null; const home = GameStore.housingUnits.find(u => u.id === this.homeId); if (!home) return null; return { x: home.x + home.area.w / 2, y: home.y + home.area.h / 2 }; }
    isAtHome(): boolean { if (!this.homeId) return false; const home = GameStore.housingUnits.find(u => u.id === this.homeId); if (!home) return false; return (this.pos.x >= home.x && this.pos.x <= home.x + home.area.w && this.pos.y >= home.y && this.pos.y <= home.y + home.area.h); }
    addMemory(text: string, type: Memory['type'], relatedSimId?: string) { const timeStr = `Y${GameStore.time.year} M${GameStore.time.month} | ${String(GameStore.time.hour).padStart(2, '0')}:${String(GameStore.time.minute).padStart(2, '0')}`; const newMemory: Memory = { id: Math.random().toString(36).substring(2, 9), time: timeStr, type: type, text: text, relatedSimId: relatedSimId }; this.memories.unshift(newMemory); if (this.memories.length > 50) { this.memories.pop(); } }
    applyTraits() { if (this.mbti.includes('E')) { this.metabolism.social = 1.6; this.socialModifier *= 1.2; } else { this.metabolism.social = 0.6; this.socialModifier *= 0.9; } if (this.mbti.includes('N')) { this.skillModifiers.logic = 1.3; this.skillModifiers.creativity = 1.3; this.skillModifiers.music = 1.2; } else { this.skillModifiers.cooking = 1.3; this.skillModifiers.athletics = 1.3; this.skillModifiers.gardening = 1.3; } if (this.mbti.includes('F')) { this.socialModifier *= 1.3; this.skillModifiers.dancing = 1.2; } else { this.socialModifier *= 0.8; this.skillModifiers.logic *= 1.2; } if (this.mbti.includes('J')) { this.metabolism.hygiene = 0.8; this.metabolism.energy = 0.9; } else { this.metabolism.fun = 1.4; this.skillModifiers.creativity *= 1.1; } const el = this.zodiac.element; if (el === 'fire') { this.skillModifiers.athletics *= 1.2; this.metabolism.energy *= 0.9; this.metabolism.social *= 1.2; } else if (el === 'earth') { this.skillModifiers.gardening *= 1.2; this.skillModifiers.cooking *= 1.2; this.metabolism.hunger *= 0.8; this.metabolism.social *= 0.9; } else if (el === 'air') { this.skillModifiers.logic *= 1.1; this.skillModifiers.music *= 1.2; this.metabolism.social *= 1.4; } else if (el === 'water') { this.skillModifiers.creativity *= 1.3; this.skillModifiers.dancing *= 1.1; this.socialModifier *= 1.2; } if (this.lifeGoal.includes('万人迷') || this.lifeGoal.includes('派对')) { this.metabolism.social *= 1.5; this.socialModifier *= 1.2; } if (this.lifeGoal.includes('隐居') || this.lifeGoal.includes('独处')) { this.metabolism.social *= 0.4; } if (this.lifeGoal.includes('富翁') || this.lifeGoal.includes('大亨')) { this.metabolism.fun *= 1.2; } if (this.traits.includes('活力')) { this.metabolism.energy *= 0.9; this.skillModifiers.athletics *= 1.3; } if (this.traits.includes('懒惰')) { this.metabolism.energy *= 1.2; this.skillModifiers.athletics *= 0.7; } if (this.traits.includes('独行侠')) { this.metabolism.social *= 0.5; this.socialModifier *= 0.8; } if (this.traits.includes('外向')) { this.metabolism.social *= 1.5; this.socialModifier *= 1.2; } if (this.traits.includes('吃货')) { this.metabolism.hunger *= 1.5; } if (this.traits.includes('天才')) { this.skillModifiers.logic *= 1.5; this.iq += 10; } if (this.traits.includes('有创意')) { this.skillModifiers.creativity *= 1.5; } if (this.traits.includes('洁癖')) { this.metabolism.hygiene *= 1.5; } }
    applyMonthlyEffects(month: number, holiday?: { name: string, type: string }) { this.age += 0.1; LifeCycleLogic.checkAgeStage(this); if (!holiday) return; if (holiday.type === 'traditional') { if (this.mbti.includes('E') || Object.keys(this.relationships).length > 5) { this.addBuff(BUFFS.festive_joy); this.say("过年啦！热闹热闹！🧨", 'act'); } else if (this.mbti.includes('I')) { this.addBuff(BUFFS.social_pressure); this.say("亲戚好多...我想静静...", 'bad'); } else { this.addBuff(BUFFS.vacation_chill); } } else if (holiday.type === 'love') { const hasLover = Object.values(this.relationships).some((r: Relationship) => r.isLover); if (hasLover) { this.addBuff(BUFFS.sweet_date); this.say("这个月要好好陪TA ❤️", 'love'); } else { if (this.faithfulness > 60 || this.age > 28) { this.addBuff(BUFFS.lonely); this.say("又是一个人过节...", 'bad'); } else { this.addBuff(BUFFS.playful); this.say("单身万岁！🍺", 'act'); } } } else if (holiday.type === 'shopping') { this.addBuff(BUFFS.shopping_spree); if (this.money > 2000) { this.say("买买买！清空购物车！🛒", 'money'); this.dailyBudget += 500; } else { this.addBuff(BUFFS.broke); this.say("想买但没钱... 💸", 'bad'); } } else if (holiday.type === 'break') { this.addBuff(BUFFS.vacation_chill); this.say("终于放长假了！🌴", 'act'); this.needs[NeedType.Fun] = Math.max(50, this.needs[NeedType.Fun]); } }
    checkDeath(dt: number) { LifeCycleLogic.checkDeath(this, dt); }
    die(cause: string) { LifeCycleLogic.die(this, cause); }
    handleInheritance() { LifeCycleLogic.handleInheritance(this); }
    calculateDailyBudget() { EconomyLogic.calculateDailyBudget(this); }
    checkSpending() { EconomyLogic.checkSpending(this); }
    checkCareerSatisfaction() { CareerLogic.checkCareerSatisfaction(this); }
    buyItem(item: any) { EconomyLogic.buyItem(this, item); }
    earnMoney(amount: number, source: string) { EconomyLogic.earnMoney(this, amount, source); }
    leaveWorkEarly() { CareerLogic.leaveWorkEarly(this); }
    giveBirth() { LifeCycleLogic.giveBirth(this); }
    checkSchedule() { CareerLogic.checkSchedule(this); SchoolLogic.checkSchoolSchedule(this); }
    updateBuffs(minutesPassed: number) { this.buffs.forEach(b => { b.duration -= minutesPassed; }); this.buffs = this.buffs.filter(b => b.duration > 0); }
    removeBuff(id: string) { this.buffs = this.buffs.filter(b => b.id !== id); }
    addBuff(buffDef: any) { if (this.hasBuff(buffDef.id)) { const b = this.buffs.find(b => b.id === buffDef.id); if (b) b.duration = buffDef.duration; } else { this.buffs.push({ ...buffDef, source: 'system' }); } }
    hasBuff(id: string) { return this.buffs.some(b => b.id === id); }
    updateMood() { let total = 0; let count = 0; (Object.keys(this.needs) as NeedType[]).forEach(k => { total += this.needs[k]; count++; }); let base = total / count; this.buffs.forEach(b => { if (b.type === 'good') base += 15; if (b.type === 'bad') base -= 15; }); this.mood = Math.max(0, Math.min(100, base)); }
    say(text: string, type: string = 'normal') { this.bubble.text = text; this.bubble.timer = 150; this.bubble.type = type; }
    getDaySummary(monthIndex: number) { const recentMemories = this.memories.slice(0, 5).map(m => m.text); const activeBuffs = this.buffs.map(b => b.label).join(', '); let partnerName = "无"; const partnerId = Object.keys(this.relationships).find(id => this.relationships[id].isLover); if (partnerId) { const partner = GameStore.sims.find(s => s.id === partnerId); if (partner) partnerName = partner.name; } return { id: this.id, name: this.name, age: this.age, mbti: this.mbti, job: this.job.title, lifeGoal: this.lifeGoal, money: this.money, buffs: activeBuffs, partner: partnerName, events: recentMemories }; }
    addDiary(content: string) { this.addMemory(`📔 [日记] ${content}`, 'life'); if (Math.random() > 0.7) { this.say("写完了月度总结...", 'sys'); } }
    
    getRelLabel(rel: any) { return SocialLogic.getRelLabel(rel); }
    getDialogue(typeId: string, target: Sim) { return SocialLogic.getDialogue(this, typeId, target); }
    triggerJealousy(actor: Sim, target: Sim) { SocialLogic.triggerJealousy(this, actor, target); }
    updateRelationship(target: Sim, type: string, delta: number) { SocialLogic.updateRelationship(this, target, type, delta); }
}
