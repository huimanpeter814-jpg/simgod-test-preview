import type { Sim } from '../Sim';
import { SimAction, AgeStage, NeedType } from '../../types';
import { GameStore } from '../simulation';
import { DecisionLogic } from './decision';
import { INTERACTIONS, RESTORE_TIMES } from './interactionRegistry';

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

// --- 通勤状态 (强制移动) ---
export class CommutingState extends BaseState {
    actionName = SimAction.Commuting;

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        sim.commuteTimer += dt;
        
        if (sim.commuteTimer > 1200 && sim.target) {
            sim.pos = { ...sim.target };
            sim.startInteraction();
            return;
        }

        const arrived = sim.moveTowardsTarget(dt);
        if (arrived) {
            sim.startInteraction();
        }
    }
}

// --- 工作状态 ---
export class WorkingState extends BaseState {
    actionName = SimAction.Working;

    update(sim: Sim, dt: number) {
        const f = 0.0008 * dt; 
        
        // 摸鱼逻辑
        if (sim.needs[NeedType.Hunger] < 20) {
            sim.needs[NeedType.Hunger] = 80;
            sim.say("摸鱼吃零食 🍫", 'act');
        }
        if (sim.needs[NeedType.Bladder] < 20) {
            sim.needs[NeedType.Bladder] = 80;
            sim.say("带薪如厕 🚽", 'act');
        }

        const fatigueFactor = 1 + (50 - sim.constitution) * 0.01;
        sim.needs[NeedType.Energy] -= 0.01 * f * Math.max(0.5, fatigueFactor);

        if (sim.needs[NeedType.Energy] < 15) {
            // 需要引入 CareerLogic，这里用 import 解决循环依赖或 Sim.leaveWorkEarly
            sim.leaveWorkEarly();
            return;
        }

        if (sim.isSideHustle) {
            sim.actionTimer -= dt;
            if (sim.actionTimer <= 0) {
                sim.finishAction();
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

// --- 上学状态 ---
export class SchoolingState extends BaseState {
    actionName = SimAction.Schooling;

    update(sim: Sim, dt: number) {
        sim.needs[NeedType.Fun] -= 0.005 * dt;
        sim.skills.logic += 0.002 * dt;
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

// 🆕 改进的跟随状态：判断父母行为
export class FollowingState extends BaseState {
    actionName = SimAction.Following;
    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        
        const parent = GameStore.sims.find(s => s.id === sim.motherId) || GameStore.sims.find(s => s.id === sim.fatherId);
        
        // 1. 如果父母不存在，或在工作/通勤/睡觉/约会，停止跟随
        if (!parent || 
            parent.action === SimAction.Working || 
            parent.action === SimAction.Commuting || 
            parent.action === SimAction.Sleeping ||
            // 简单判断是否在约会：处于 InteractionState 且对象是人且不是孩子自己
            (parent.interactionTarget && parent.interactionTarget.type === 'human' && parent.interactionTarget.ref?.id !== sim.id)
        ) {
            sim.say("我要乖乖在家...", 'sys');
            sim.changeState(new PlayingHomeState());
            sim.actionTimer = 600; // 在家玩一会
            return;
        }

        const dist = Math.sqrt(Math.pow(sim.pos.x - parent.pos.x, 2) + Math.pow(sim.pos.y - parent.pos.y, 2));
        if (dist > 60) {
            sim.target = { x: parent.pos.x, y: parent.pos.y };
            sim.moveTowardsTarget(dt);
        }
    }
}

// 🆕 家长去接孩子 (PickingUp)
export class PickingUpState extends BaseState {
    actionName = SimAction.PickingUp;
    
    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        const arrived = sim.moveTowardsTarget(dt);
        
        if (arrived && sim.carryingSimId) {
            // 接到孩子了，切换到护送状态
            // 需要先计算学校坐标
            const schoolPlot = GameStore.worldLayout.find(p => p.templateId === 'kindergarten');
            if (schoolPlot) {
                const tx = schoolPlot.x + (schoolPlot.width || 300)/2;
                const ty = schoolPlot.y + (schoolPlot.height || 300)/2;
                sim.target = { x: tx, y: ty };
                
                // 将孩子状态设为被抱着
                const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
                if (child) {
                    child.carriedBySimId = sim.id;
                    child.changeState(new BeingEscortedState());
                }
                
                sim.changeState(new EscortingState());
                sim.say("走，上学去咯！", 'family');
            } else {
                // 找不到学校，放弃
                sim.carryingSimId = null;
                sim.changeState(new IdleState());
            }
        }
    }
}

// 🆕 家长护送/抱着孩子 (Escorting)
export class EscortingState extends BaseState {
    actionName = SimAction.Escorting;

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        const arrived = sim.moveTowardsTarget(dt);

        // 同步孩子位置
        if (sim.carryingSimId) {
            const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
            if (child) {
                // 孩子位置吸附在父母身上 (稍微偏上一点)
                child.pos.x = sim.pos.x;
                child.pos.y = sim.pos.y - 10;
            }
        }

        if (arrived) {
            // 到达学校
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

// 🆕 孩子被抱着 (BeingEscorted)
export class BeingEscortedState extends BaseState {
    actionName = SimAction.BeingEscorted;

    update(sim: Sim, dt: number) {
        // 被抱着时，位置完全由 EscortingState 控制，这里只做被动处理
        // 稍微回复一点 Social
        sim.needs[NeedType.Social] += 0.01 * dt;
        sim.needs[NeedType.Fun] += 0.01 * dt;
        
        // 兜底：如果抱我的人不见了/状态变了，自己恢复自由
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