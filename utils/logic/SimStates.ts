import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { SimAction, JobType, NeedType, AgeStage } from '../../types'; // ✅ 引入 AgeStage
import { CareerLogic } from './career';
import { DecisionLogic } from './decision';
import { SocialLogic } from './social';
import { SchoolLogic } from './school'; // ✅ 引入 SchoolLogic
import { INTERACTIONS, RESTORE_TIMES } from './interactionRegistry'; // ✅ 引入 INTERACTIONS, RESTORE_TIMES

// === 1. 状态接口定义 ===
export interface SimState {
    actionName: SimAction | string; 
    enter(sim: Sim): void;
    update(sim: Sim, dt: number): void;
    exit(sim: Sim): void;
}

// === 2. 基础状态 (提供默认行为) ===
export abstract class BaseState implements SimState {
    abstract actionName: string;

    enter(sim: Sim): void {}
    
    update(sim: Sim, dt: number): void {
        this.decayNeeds(sim, dt);
    }

    exit(sim: Sim): void {}

    protected decayNeeds(sim: Sim, dt: number, exclude: NeedType[] = []) {
        sim.decayNeeds(dt, exclude);
    }
}

// === 3. 具体状态实现 ===

// --- 空闲状态 (Idle) ---
export class IdleState extends BaseState {
    actionName = SimAction.Idle;

    enter(sim: Sim) {
        sim.target = null;
        sim.interactionTarget = null;
        sim.path = [];
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);

        if (sim.decisionTimer > 0) {
            sim.decisionTimer -= dt;
        } else {
            // 只有非工作状态且空闲时才做决策
            if (sim.job.id !== 'unemployed' || ![AgeStage.Infant, AgeStage.Toddler].includes(sim.ageStage)) {
                 DecisionLogic.decideAction(sim);
                 sim.decisionTimer = 30 + Math.random() * 30;
            } else {
                 DecisionLogic.decideAction(sim);
                 sim.decisionTimer = 30 + Math.random() * 30;
            }
        }
    }
}

// 原地等待状态
export class WaitingState extends BaseState {
    actionName = SimAction.Waiting;
    
    enter(sim: Sim) {
        sim.target = null;
        sim.path = [];
        sim.say("...", 'sys');
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
    }
}

// --- 移动状态 ---
export class MovingState extends BaseState {
    actionName: string;
    moveTimeout: number = 0;

    constructor(actionName: string = SimAction.Moving) {
        super();
        this.actionName = actionName;
    }

    enter(sim: Sim) {
        super.enter(sim);
        this.moveTimeout = 0;
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        this.moveTimeout += dt;
        
        if (this.moveTimeout > 1500 && sim.target) {
            sim.pos = { ...sim.target };
            this.handleArrival(sim);
            return;
        }

        const arrived = sim.moveTowardsTarget(dt);
        if (arrived) {
            this.handleArrival(sim);
        }
    }

    private handleArrival(sim: Sim) {
        if (this.actionName === SimAction.MovingHome) {
            sim.changeState(new IdleState());
        } else if (sim.interactionTarget) {
            sim.startInteraction(); 
        } else {
            sim.changeState(new IdleState());
        }
    }
}

// --- 🆕 增强版通勤状态：先去地块入口 -> 再找具体设施 ---
export class CommutingState extends BaseState {
    actionName = SimAction.Commuting;
    phase: 'to_plot' | 'to_station' = 'to_plot';

    enter(sim: Sim) {
        sim.path = [];
        this.phase = 'to_plot';
        
        if (!sim.workplaceId) {
            // 没有固定单位，直接取消
            sim.changeState(new IdleState());
            return;
        }

        const plot = GameStore.worldLayout.find(p => p.id === sim.workplaceId);
        if (plot) {
            // 阶段1: 走到地块边缘/入口 (简单模拟)
            sim.target = { 
                x: plot.x + (plot.width||300)/2 + (Math.random()-0.5)*50, 
                y: plot.y + (plot.height||300)/2 + (Math.random()-0.5)*50 
            };
        } else {
            sim.changeState(new IdleState());
        }
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        const arrived = sim.moveTowardsTarget(dt);

        if (arrived) {
            if (this.phase === 'to_plot') {
                // 到达单位门口 -> 打卡 -> 找工位
                this.phase = 'to_station';
                sim.lastPunchInTime = GameStore.time.hour + GameStore.time.minute / 60;
                
                // 迟到判定
                if (sim.lastPunchInTime > sim.job.startHour + 0.1) {
                    sim.say("迟到了！😱", 'bad');
                    sim.workPerformance -= 5;
                } else {
                    sim.say("打卡成功", 'sys');
                }

                // 寻找专属工位
                const station = this.findWorkstation(sim);
                if (station) {
                    sim.target = { x: station.x + station.w/2, y: station.y + station.h/2 };
                    sim.interactionTarget = { ...station, utility: 'work' };
                } else {
                    // 没工位，原地进入工作状态 (站立办公)
                    sim.say("没抢到位置...", 'bad');
                    sim.changeState(new WorkingState());
                }
            } else {
                // 到达工位 -> 开始工作
                sim.changeState(new WorkingState());
            }
        }
    }

    private findWorkstation(sim: Sim) {
        if (!sim.workplaceId) return null;
        
        const plotFurniture = GameStore.furniture.filter(f => f.id.startsWith(sim.workplaceId!));
        
        let keywords: string[] = [];
        const type = sim.job.companyType;
        const title = sim.job.title;

        if (type === JobType.School) {
            if (title.includes('厨')) keywords = ['灶', '厨'];
            else if (title.includes('师')) keywords = ['讲台', '黑板', '办公桌'];
            else keywords = ['保安'];
        } else if (type === JobType.Hospital) {
            if (title.includes('医')) keywords = ['办公桌', '电脑', '病床'];
            else keywords = ['护士站', '柜台', '病床'];
        } else if (type === JobType.ElderCare) {
            keywords = ['床', '柜台', '沙发'];
        } else if (type === JobType.Restaurant) {
            if (title.includes('厨')) keywords = ['灶'];
            else keywords = ['前台', '收银'];
        } else if (type === JobType.Nightlife) {
            if (title.includes('DJ')) keywords = ['DJ'];
            else keywords = ['吧台'];
        } else {
            keywords = ['工位', '电脑', '桌'];
        }

        const candidates = plotFurniture.filter(f => keywords.some(k => f.label.includes(k)));
        const free = candidates.filter(f => !GameStore.sims.some(s => s.id !== sim.id && s.interactionTarget?.id === f.id));
        
        if (free.length > 0) return free[Math.floor(Math.random() * free.length)];
        if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)];
        return null;
    }
}

// --- 🆕 增强版工作状态：职业专属行为 & 同事社交 ---
export class WorkingState extends BaseState {
    actionName = SimAction.Working;
    subStateTimer = 0;

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        
        // 1. 技能提升
        this.gainSkills(sim, dt);

        // 2. 同事社交
        if (Math.random() < 0.0005 * dt) {
            this.tryColleagueInteraction(sim);
        }

        // 3. 职业专属行为模式
        this.handleJobBehavior(sim, dt);
    }

    private gainSkills(sim: Sim, dt: number) {
        const rate = 0.005 * dt;
        switch (sim.job.companyType) {
            case JobType.Internet: sim.skills.logic += rate; break;
            case JobType.Design: sim.skills.creativity += rate; break;
            case JobType.Restaurant: sim.skills.cooking += rate; break;
            case JobType.Nightlife: sim.skills.music += rate; sim.skills.dancing += rate; break;
            case JobType.Hospital: sim.skills.logic += rate; break;
            case JobType.Store: sim.eq = Math.min(100, sim.eq + rate); break;
        }
    }

    private tryColleagueInteraction(sim: Sim) {
        const nearby = GameStore.sims.find(s => 
            s.id !== sim.id && 
            s.workplaceId === sim.workplaceId && 
            Math.abs(s.pos.x - sim.pos.x) < 80 && 
            Math.abs(s.pos.y - sim.pos.y) < 80
        );

        if (nearby) {
            const topics = ["在那边怎么样？", "老板今天很凶...", "中午吃啥？", "周末去哪玩？", "这项目真难搞"];
            sim.say(topics[Math.floor(Math.random() * topics.length)], 'normal');
            SocialLogic.updateRelationship(sim, nearby, 'friendship', 1);
            if (Math.random() < 0.1 && sim.orientation !== 'aro') {
                SocialLogic.triggerJealousy(sim, nearby, sim);
            }
        }
    }

    private handleJobBehavior(sim: Sim, dt: number) {
        this.subStateTimer -= dt;
        if (this.subStateTimer > 0) return;

        this.subStateTimer = 300 + Math.random() * 300; 

        const jobType = sim.job.companyType;
        const jobTitle = sim.job.title;
        const plot = GameStore.worldLayout.find(p => p.id === sim.workplaceId);
        if (!plot) return;

        // 巡逻模式 (服务员/护士/店员/护工)
        if (
            (jobType === JobType.Restaurant && jobTitle.includes('服务')) ||
            (jobType === JobType.Store && !jobTitle.includes('收银')) ||
            (jobType === JobType.Hospital && jobTitle.includes('护士')) ||
            (jobType === JobType.ElderCare)
        ) {
            const tx = plot.x + 20 + Math.random() * ((plot.width||300) - 40);
            const ty = plot.y + 20 + Math.random() * ((plot.height||300) - 40);
            sim.target = { x: tx, y: ty };
            sim.moveTowardsTarget(dt);
            if (sim.target) sim.action = "working_patrol"; 
        }
        // 教师
        else if (jobType === JobType.School && (jobTitle.includes('师') || jobTitle.includes('教'))) {
            if (Math.random() > 0.7) sim.say("同学们看黑板...", 'act');
        }
        // 医生
        else if (jobType === JobType.Hospital && jobTitle.includes('医')) {
             if (Math.random() > 0.8) {
                 const bed = GameStore.furniture.find(f => f.id.startsWith(sim.workplaceId!) && f.label.includes('病床'));
                 if (bed) {
                     sim.target = { x: bed.x + 20, y: bed.y };
                 }
             }
        }
    }
}

// --- 上学通勤 (保留给小学/中学) ---
export class CommutingSchoolState extends BaseState {
    actionName = SimAction.CommutingSchool;

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        sim.commuteTimer += dt;

        if (sim.commuteTimer > 1200 && sim.target) {
            sim.pos = { ...sim.target };
            sim.changeState(new SchoolingState());
            sim.say("上课中...", 'act');
            return;
        }

        const arrived = sim.moveTowardsTarget(dt);
        if (arrived) {
            sim.changeState(new SchoolingState());
            sim.say("乖乖上学", 'act');
        }
    }
}

// 上学状态
export class SchoolingState extends BaseState {
    actionName = SimAction.Schooling;
    wanderTimer = 0;

    update(sim: Sim, dt: number) {
        sim.needs[NeedType.Fun] -= 0.002 * dt;
        sim.skills.logic += 0.002 * dt;

        if (sim.target) {
            const arrived = sim.moveTowardsTarget(dt);
            if (arrived && sim.interactionTarget) {
                sim.actionTimer = 200; 
                sim.target = null;
            }
            return;
        }

        if (sim.actionTimer > 0) {
            sim.actionTimer -= dt;
            return;
        }

        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
            this.wanderTimer = 300 + Math.random() * 300; 
            
            let schoolType = 'high_school';
            if (sim.ageStage === AgeStage.Child) schoolType = 'elementary';
            if ([AgeStage.Infant, AgeStage.Toddler].includes(sim.ageStage)) schoolType = 'kindergarten';

            const plot = GameStore.worldLayout.find(p => p.templateId === schoolType);
            if (plot) {
                if (Math.random() > 0.5) {
                    const area = { 
                        minX: plot.x, maxX: plot.x + (plot.width||300), 
                        minY: plot.y, maxY: plot.y + (plot.height||300) 
                    };
                    SchoolLogic.findObjectInArea(sim, 'play', area); 
                } else {
                    const tx = plot.x + 20 + Math.random() * ((plot.width||300) - 40);
                    const ty = plot.y + 20 + Math.random() * ((plot.height||300) - 40);
                    sim.target = { x: tx, y: ty };
                }
            }
        }
    }
}

// --- 通用交互 ---
export class InteractionState extends BaseState {
    actionName: string;

    constructor(actionName: string) {
        super();
        this.actionName = actionName;
    }

    update(sim: Sim, dt: number) {
        const obj = sim.interactionTarget;
        const f = 0.0008 * dt;
        const getRate = (mins: number) => (100 / (mins * 60)) * dt;

        const excludeDecay: NeedType[] = [];
        if (this.actionName === SimAction.Sleeping) excludeDecay.push(NeedType.Energy);
        if (this.actionName === SimAction.Eating) excludeDecay.push(NeedType.Hunger);
        if (this.actionName === SimAction.Talking) excludeDecay.push(NeedType.Social);
        
        this.decayNeeds(sim, dt, excludeDecay);

        if (this.actionName === SimAction.Talking) {
            sim.needs[NeedType.Social] += getRate(RESTORE_TIMES[NeedType.Social]);
        }
        else if (obj) {
            let handler = INTERACTIONS[obj.utility];
            if (!handler) {
                 const prefixKey = Object.keys(INTERACTIONS).find(k => k.endsWith('_') && obj.utility && obj.utility.startsWith(k));
                 if (prefixKey) handler = INTERACTIONS[prefixKey];
            }
            if (!handler) handler = INTERACTIONS['default'];

            if (handler && handler.onUpdate) {
                handler.onUpdate(sim, obj, f, getRate);
            }
        }

        sim.actionTimer -= dt;
        if (sim.actionTimer <= 0) {
            sim.finishAction();
        }
    }
}

// --- 婴儿/家庭相关 ---
export class PlayingHomeState extends BaseState {
    actionName = SimAction.PlayingHome;
    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        sim.actionTimer -= dt;
        if (sim.actionTimer <= 0) sim.finishAction();
    }
}

// 跟随状态
export class FollowingState extends BaseState {
    actionName = SimAction.Following;
    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        
        const parent = GameStore.sims.find(s => s.id === sim.motherId) || GameStore.sims.find(s => s.id === sim.fatherId);
        
        if (sim.carriedBySimId) return; 

        const isParentBusy = !parent || 
            parent.action === SimAction.Working || 
            parent.action === SimAction.Commuting || 
            parent.action === SimAction.Sleeping ||
            (parent.interactionTarget && parent.interactionTarget.type === 'human');

        const isNeedy = sim.mood < 40 || sim.needs[NeedType.Hunger] < 50 || Math.random() < 0.001;

        if (isParentBusy || !isNeedy) {
            sim.say("自己玩...", 'sys');
            sim.changeState(new PlayingHomeState());
            sim.actionTimer = 300; 
            return;
        }

        const dist = Math.sqrt(Math.pow(sim.pos.x - parent.pos.x, 2) + Math.pow(sim.pos.y - parent.pos.y, 2));
        if (dist > 60) {
            sim.target = { x: parent.pos.x, y: parent.pos.y };
            sim.moveTowardsTarget(dt);
        }
    }
}

// 家长去接孩子 (PickingUp)
export class PickingUpState extends BaseState {
    actionName = SimAction.PickingUp;
    
    update(sim: Sim, dt: number) {
        super.update(sim, dt);

        if (sim.carryingSimId) {
            const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
            if (child) {
                sim.target = { x: child.pos.x, y: child.pos.y };
                if (sim.path.length > 0) {
                    const lastNode = sim.path[sim.path.length - 1];
                    const distToPathEnd = Math.sqrt(Math.pow(lastNode.x - child.pos.x, 2) + Math.pow(lastNode.y - child.pos.y, 2));
                    if (distToPathEnd > 40) sim.path = []; 
                }
            }
        }

        const arrived = sim.moveTowardsTarget(dt);
        
        if (sim.carryingSimId) {
            const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
            if (child) {
                const dist = Math.sqrt(Math.pow(sim.pos.x - child.pos.x, 2) + Math.pow(sim.pos.y - child.pos.y, 2));
                
                if (dist < 20) { 
                    const schoolPlot = GameStore.worldLayout.find(p => p.templateId === 'kindergarten');
                    if (schoolPlot) {
                        const tx = schoolPlot.x + (schoolPlot.width || 300)/2;
                        const ty = schoolPlot.y + (schoolPlot.height || 300)/2;
                        
                        sim.target = { x: tx, y: ty };
                        sim.path = []; 
                        
                        child.carriedBySimId = sim.id;
                        child.changeState(new BeingEscortedState());
                        
                        sim.changeState(new EscortingState());
                        sim.say("抓到你了，上学去！", 'family');
                    } else {
                        sim.carryingSimId = null;
                        sim.changeState(new IdleState());
                    }
                }
            }
        } else if (arrived) {
            sim.changeState(new IdleState());
        }
    }
}

// 家长护送/抱着孩子 (Escorting)
export class EscortingState extends BaseState {
    actionName = SimAction.Escorting;

    enter(sim: Sim) {
        sim.path = [];
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        const arrived = sim.moveTowardsTarget(dt);

        if (sim.carryingSimId) {
            const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
            if (child) {
                child.pos.x = sim.pos.x + 6; 
                child.pos.y = sim.pos.y - 12; 
                child.target = null;
                child.path = [];
            }
        }

        if (arrived) {
            if (sim.carryingSimId) {
                const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
                if (child) {
                    child.carriedBySimId = null;
                    child.changeState(new SchoolingState()); 
                    child.say("拜拜~ 👋", 'family');
                }
                sim.carryingSimId = null;
            }
            sim.say("乖乖听话哦", 'family');
            sim.changeState(new IdleState());
        }
    }
}

// 孩子被抱着 (BeingEscorted)
export class BeingEscortedState extends BaseState {
    actionName = SimAction.BeingEscorted;

    update(sim: Sim, dt: number) {
        sim.needs[NeedType.Social] += 0.01 * dt;
        sim.needs[NeedType.Fun] += 0.01 * dt;
        
        if (sim.carriedBySimId) {
            const carrier = GameStore.sims.find(s => s.id === sim.carriedBySimId);
            if (!carrier || carrier.action !== SimAction.Escorting) {
                sim.carriedBySimId = null;
                sim.changeState(new IdleState());
            }
        } else {
            sim.changeState(new IdleState());
        }
    }
}