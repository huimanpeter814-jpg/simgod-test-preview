import type { Sim } from '../Sim';
import { SimAction, AgeStage, NeedType } from '../../types';
import { GameStore } from '../simulation';
import { DecisionLogic } from './decision';
import { CareerLogic } from './career';
import { SchoolLogic } from './school';
import { INTERACTIONS, RESTORE_TIMES } from './interactionRegistry';
import { minutes } from '../simulationHelpers';
import { BUFFS } from '../../constants';

// === 1. 状态接口定义 ===
export interface SimState {
    actionName: SimAction | string; // 对应原本的 sim.action 字符串，用于 UI 显示
    enter(sim: Sim): void;
    update(sim: Sim, dt: number): void;
    exit(sim: Sim): void;
}

// === 2. 基础状态 (提供默认行为) ===
export abstract class BaseState implements SimState {
    abstract actionName: string;

    enter(sim: Sim): void {}
    
    update(sim: Sim, dt: number): void {
        // 默认行为：衰减需求
        this.decayNeeds(sim, dt);
    }

    exit(sim: Sim): void {}

    // 提取出的通用需求衰减逻辑
    // [优化] 使用 NeedType[] 类型
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
            // 注意：职业相关的 schedule 检查在 Sim.update 的全局层进行
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

// --- 移动状态 (Moving / Wandering / Following) ---
export class MovingState extends BaseState {
    actionName: string;

    constructor(actionName: string = SimAction.Moving) {
        super();
        this.actionName = actionName;
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        
        // 执行移动逻辑
        const arrived = sim.moveTowardsTarget(dt);
        
        if (arrived) {
            // 到达目的地后的处理
            if (this.actionName === SimAction.MovingHome) {
                sim.changeState(new IdleState());
            } else if (sim.interactionTarget) {
                sim.startInteraction(); // 自动根据 interactionTarget 切换到 Using/Talking 等状态
            } else {
                sim.changeState(new IdleState());
            }
        }
    }
}

// --- 通勤状态 (Commuting) ---
export class CommutingState extends BaseState {
    actionName = SimAction.Commuting;

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        
        sim.commuteTimer += dt;
        
        // 防卡死/强制传送逻辑
        if (sim.commuteTimer > 1200 && sim.target) {
            sim.pos = { ...sim.target };
            sim.startInteraction(); // 强制进入交互
            return;
        }

        const arrived = sim.moveTowardsTarget(dt);
        if (arrived) {
            sim.startInteraction();
        }
    }
}

// --- 工作状态 (Working) ---
export class WorkingState extends BaseState {
    actionName = SimAction.Working;

    update(sim: Sim, dt: number) {
        // 工作时的特殊需求衰减 (不衰减 boredom/fun，或者有其他规则)
        // 这里我们简单调用通用衰减，但在 Sim 类中具体逻辑可能会针对 Working 调整
        // 为了复原原逻辑：Work 状态下 Hunger/Bladder 会自动解决，Energy 衰减不同
        
        // 原逻辑复刻：
        const f = 0.0008 * dt; // Sim.ts 中的系数
        
        // 摸鱼逻辑
        if (sim.needs[NeedType.Hunger] < 20) {
            sim.needs[NeedType.Hunger] = 80;
            sim.say("摸鱼吃零食 🍫", 'act');
        }
        if (sim.needs[NeedType.Bladder] < 20) {
            sim.needs[NeedType.Bladder] = 80;
            sim.say("带薪如厕 🚽", 'act');
        }

        // 精力衰减
        const fatigueFactor = 1 + (50 - sim.constitution) * 0.01;
        sim.needs[NeedType.Energy] -= 0.01 * f * Math.max(0.5, fatigueFactor);

        // 早退检查
        if (sim.needs[NeedType.Energy] < 15) {
            sim.leaveWorkEarly();
            return;
        }

        // 处理家具交互 (如：坐在椅子上)
        if (sim.interactionTarget) {
            this.handleInteractionUpdate(sim, dt);
        }

        // 处理 ActionTimer (下班倒计时由 Schedule 检查覆盖，这里主要处理兼职的 Timer)
        if (sim.isSideHustle) {
            sim.actionTimer -= dt;
            if (sim.actionTimer <= 0) {
                sim.finishAction();
            }
        }
    }

    private handleInteractionUpdate(sim: Sim, dt: number) {
        // 复用通用的交互更新逻辑，保持位置锁定等
        const obj = sim.interactionTarget;
        const getRate = (mins: number) => (100 / (mins * 60)) * dt;
        // 可以在这里调用 InteractionRegistry 的 update，或者简单处理
    }
}

// --- 上学通勤状态 (CommutingSchool) ---
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

// --- 上学状态 (Schooling) ---
export class SchoolingState extends BaseState {
    actionName = SimAction.Schooling;

    update(sim: Sim, dt: number) {
        // 上学时不衰减常规需求? 原逻辑只衰减 Fun
        sim.needs[NeedType.Fun] -= 0.005 * dt;
        sim.skills.logic += 0.002 * dt;
        
        // 保持在学校区域，防止乱跑
        // (原逻辑似乎没有强制位置，只是 actionTimer 或者是 schedule 控制退出)
    }
}

// --- 通用交互状态 (Using / Eating / Sleeping / Talking) ---
export class InteractionState extends BaseState {
    actionName: string;

    constructor(actionName: string) {
        super();
        this.actionName = actionName;
    }

    enter(sim: Sim) {
        // 可以在这里处理扣费逻辑，如果还没处理的话
    }

    update(sim: Sim, dt: number) {
        const obj = sim.interactionTarget;
        const f = 0.0008 * dt;
        const getRate = (mins: number) => (100 / (mins * 60)) * dt;

        // 特殊状态的需求衰减屏蔽
        // [优化] 使用 NeedType 替换字符串
        const excludeDecay: NeedType[] = [];
        if (this.actionName === SimAction.Sleeping) excludeDecay.push(NeedType.Energy);
        if (this.actionName === SimAction.Eating) excludeDecay.push(NeedType.Hunger);
        if (this.actionName === SimAction.Talking) excludeDecay.push(NeedType.Social);
        
        this.decayNeeds(sim, dt, excludeDecay);

        // 社交逻辑
        if (this.actionName === SimAction.Talking) {
            sim.needs[NeedType.Social] += getRate(RESTORE_TIMES[NeedType.Social]);
        }
        // 家具交互逻辑
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

        // 计时器检查
        sim.actionTimer -= dt;
        if (sim.actionTimer <= 0) {
            sim.finishAction();
        }
    }
}

// --- 婴儿特定状态 ---
export class PlayingHomeState extends BaseState {
    actionName = SimAction.PlayingHome;
    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        sim.actionTimer -= dt;
        if (sim.actionTimer <= 0) sim.finishAction();
    }
}

export class FollowingState extends BaseState {
    actionName = SimAction.Following;
    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        
        // 跟随逻辑：目标移动了要更新路径
        const parent = GameStore.sims.find(s => s.id === sim.motherId) || GameStore.sims.find(s => s.id === sim.fatherId);
        if (parent) {
            const dist = Math.sqrt(Math.pow(sim.pos.x - parent.pos.x, 2) + Math.pow(sim.pos.y - parent.pos.y, 2));
            if (dist > 60) {
                sim.target = { x: parent.pos.x, y: parent.pos.y };
                sim.moveTowardsTarget(dt);
            } else {
                // 追上了，发呆一会
            }
        } else {
            sim.changeState(new IdleState());
        }
    }
}