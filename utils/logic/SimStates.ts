import type { Sim } from '../Sim';
import { SimAction, AgeStage, NeedType } from '../../types';
import { GameStore } from '../simulation';
import { DecisionLogic } from './decision';
import { INTERACTIONS, RESTORE_TIMES } from './interactionRegistry';
import { SchoolLogic } from './school';

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

// 🆕 原地等待状态 (防止被接送时乱跑)
export class WaitingState extends BaseState {
    actionName = 'waiting';
    
    enter(sim: Sim) {
        sim.target = null;
        sim.path = [];
        sim.say("...", 'sys');
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        // 稍微降低需求衰减，表示处于待机模式
        // 不做任何移动决策
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

// 🆕 上学状态 (修复：不再卡死，可以在校内自由活动)
export class SchoolingState extends BaseState {
    actionName = SimAction.Schooling;
    wanderTimer = 0;

    update(sim: Sim, dt: number) {
        // 需求衰减 (稍慢)
        sim.needs[NeedType.Fun] -= 0.002 * dt;
        sim.skills.logic += 0.002 * dt;

        // 如果正在去某个设施的路上
        if (sim.target) {
            const arrived = sim.moveTowardsTarget(dt);
            if (arrived) {
                // 到达目的地，如果是设施则互动一会
                if (sim.interactionTarget) {
                    // 模拟简单的使用设施，不切换状态，只停留
                    sim.actionTimer = 200; 
                    sim.target = null;
                }
            }
            return;
        }

        // 如果正在使用设施/发呆
        if (sim.actionTimer > 0) {
            sim.actionTimer -= dt;
            return;
        }

        // 决策：在校内活动
        this.wanderTimer -= dt;
        if (this.wanderTimer <= 0) {
            this.wanderTimer = 300 + Math.random() * 300; // 每隔一会活动一次
            
            // 确定学校类型和区域
            let schoolType = 'high_school';
            if (sim.ageStage === AgeStage.Child) schoolType = 'elementary';
            if ([AgeStage.Infant, AgeStage.Toddler].includes(sim.ageStage)) schoolType = 'kindergarten';

            const plot = GameStore.worldLayout.find(p => p.templateId === schoolType);
            if (plot) {
                // 50% 概率找设施，50% 概率瞎逛
                if (Math.random() > 0.5) {
                    const area = { 
                        minX: plot.x, maxX: plot.x + (plot.width||300), 
                        minY: plot.y, maxY: plot.y + (plot.height||300) 
                    };
                    SchoolLogic.findObjectInArea(sim, 'play', area); // 泛指找好玩的
                } else {
                    // 随机移动
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

// 🆕 改进的跟随状态
export class FollowingState extends BaseState {
    actionName = SimAction.Following;
    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        
        const parent = GameStore.sims.find(s => s.id === sim.motherId) || GameStore.sims.find(s => s.id === sim.fatherId);
        
        // 1. 停止跟随条件：
        // - 父母在忙
        // - 父母在睡觉
        // - 孩子自己状态良好且不需要照顾 (减少粘人频率)
        // - 🆕 如果有人正在来接我 (PickingUpState)，原地等待
        if (sim.carriedBySimId) { // 虽然 PickingUp 阶段 carriedBySimId 还没设，但如果被抱起了就不用跟随了
             return; 
        }

        const isParentBusy = !parent || 
            parent.action === SimAction.Working || 
            parent.action === SimAction.Commuting || 
            parent.action === SimAction.Sleeping ||
            (parent.interactionTarget && parent.interactionTarget.type === 'human');

        // 只有心情不好、饥饿或者随机小概率才会粘人
        const isNeedy = sim.mood < 40 || sim.needs[NeedType.Hunger] < 50 || Math.random() < 0.001;

        if (isParentBusy || !isNeedy) {
            // 不跟随了，自己玩
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

// 🆕 家长去接孩子 (PickingUp)
export class PickingUpState extends BaseState {
    actionName = SimAction.PickingUp;
    // 增加一个计时器，避免每帧都重算寻路，优化性能
    repathTimer = 0; 
    
    update(sim: Sim, dt: number) {
        super.update(sim, dt);

        if (sim.carryingSimId) {
            const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
            if (child) {
                // 1. 实时更新目标
                sim.target = { x: child.pos.x, y: child.pos.y };

                // 2. 修复闪现 Bug：检查目标是否移动太远
                // 如果当前路径的终点 和 现在的孩子位置 距离超过 20px，说明孩子跑远了
                // 清空路径，强迫 moveTowardsTarget 在下一帧重新寻路
                if (sim.path.length > 0) {
                    const lastNode = sim.path[sim.path.length - 1];
                    const distToPathEnd = Math.sqrt(Math.pow(lastNode.x - child.pos.x, 2) + Math.pow(lastNode.y - child.pos.y, 2));
                    
                    if (distToPathEnd > 40) { // 阈值可以根据需要调整
                        sim.path = []; 
                    }
                }
            }
        }

        // 执行移动
        const arrived = sim.moveTowardsTarget(dt);
        
        // 判定距离而不是依靠 path 结束
        if (sim.carryingSimId) {
            const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
            if (child) {
                const dist = Math.sqrt(Math.pow(sim.pos.x - child.pos.x, 2) + Math.pow(sim.pos.y - child.pos.y, 2));
                
                // 判定接触范围
                if (dist < 20) { 
                    // 切换到护送状态
                    const schoolPlot = GameStore.worldLayout.find(p => p.templateId === 'kindergarten');
                    if (schoolPlot) {
                        const tx = schoolPlot.x + (schoolPlot.width || 300)/2;
                        const ty = schoolPlot.y + (schoolPlot.height || 300)/2;
                        
                        // 设置新目标：学校
                        sim.target = { x: tx, y: ty };
                        // 🚩 关键修复：切换目标地点后，必须清空旧路径！
                        // 否则 Sim 会认为"我已经走完路径了"，直接瞬移到新 Target
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
            // 目标丢失
            sim.changeState(new IdleState());
        }
    }
}

// 🆕 家长护送/抱着孩子 (Escorting)
export class EscortingState extends BaseState {
    actionName = SimAction.Escorting;

    // 🚩 关键修复：进入状态时确保路径为空，强制重新计算去学校的路
    enter(sim: Sim) {
        sim.path = [];
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        const arrived = sim.moveTowardsTarget(dt);

        // 同步孩子位置
        if (sim.carryingSimId) {
            const child = GameStore.sims.find(s => s.id === sim.carryingSimId);
            if (child) {
                // 渲染层级修复：位置稍微偏移
                child.pos.x = sim.pos.x + 6; 
                child.pos.y = sim.pos.y - 12; 
                // 也要把孩子的目标和路径清空，防止孩子逻辑干扰
                child.target = null;
                child.path = [];
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

// 孩子被抱着 (BeingEscorted)
export class BeingEscortedState extends BaseState {
    actionName = SimAction.BeingEscorted;

    update(sim: Sim, dt: number) {
        // 被抱着时，位置完全由 EscortingState 控制
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