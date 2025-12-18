import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { SimAction, JobType, NeedType, AgeStage, Furniture } from '../../types';
import { CareerLogic } from './career';
import { DecisionLogic } from './decision';
import { SocialLogic } from './social';
import { SchoolLogic } from './school';
import { INTERACTIONS, RESTORE_TIMES } from './interactionRegistry';
import { hasRequiredTags } from '../simulationHelpers'; // 需确保 simulationHelpers.ts 中已导出此函数

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

// --- 🆕 重构版通勤状态：全自动查找工位 + 修复站位 ---
export class CommutingState extends BaseState {
    actionName = SimAction.Commuting;
    phase: 'to_plot' | 'to_station' = 'to_station';

    enter(sim: Sim) {
        sim.path = [];
        
        // 尝试基于 Tags 查找工位
        const station = this.findWorkstation(sim);
        
        if (station) {
            this.phase = 'to_station';
            // [修复] 关键修改：站位偏移
            // 让小人站在家具的"前方"（Y轴下方），而不是中心
            // 这避免了小人和家具在同一 Y 坐标导致的图层排序闪烁（抖动）
            sim.target = { 
                x: station.x + station.w/2, 
                y: station.y + station.h + 5 
            };
            sim.interactionTarget = { ...station, utility: 'work' };
            sim.say("去工位...", 'act');
        } 
        else if (sim.workplaceId) {
            // 没找到具体工位，先去地皮
            this.phase = 'to_plot';
            const plot = GameStore.worldLayout.find(p => p.id === sim.workplaceId);
            if (plot) {
                sim.target = { 
                    x: plot.x + (plot.width||300)/2 + (Math.random()-0.5)*50, 
                    y: plot.y + (plot.height||300)/2 + (Math.random()-0.5)*50 
                };
                sim.say("去单位...", 'act');
            } else {
                sim.say("公司倒闭了?!", 'bad');
                sim.changeState(new IdleState());
            }
        } 
        else {
            // 自由职业者无固定地点，直接开始工作（原地或回家）
            sim.say("开始搬砖", 'act');
            sim.changeState(new WorkingState());
        }
    }

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        const arrived = sim.moveTowardsTarget(dt);

        if (arrived) {
            if (this.phase === 'to_plot') {
                // 到达单位门口 -> 打卡
                sim.lastPunchInTime = GameStore.time.hour + GameStore.time.minute / 60;
                
                if (sim.lastPunchInTime > sim.job.startHour + 0.1) {
                    sim.say("迟到了！😱", 'bad');
                    sim.workPerformance -= 5;
                } else {
                    sim.say("打卡成功", 'sys');
                }

                // 再次尝试寻找工位
                const station = this.findWorkstation(sim);
                if (station) {
                    this.phase = 'to_station';
                    sim.target = { 
                        x: station.x + station.w/2, 
                        y: station.y + station.h + 5 // [修复] 偏移
                    };
                    sim.interactionTarget = { ...station, utility: 'work' };
                } else {
                    sim.say("没位置了...", 'bad');
                    // 没工位也进入工作状态（站立摸鱼）
                    sim.changeState(new WorkingState());
                }
            } else {
                // 到达工位 -> 开始工作
                sim.changeState(new WorkingState());
            }
        }
    }

    private findWorkstation(sim: Sim): Furniture | null {
        const requiredTags = sim.job.requiredTags || ['work'];

        // 1. 【公司员工】如果有固定工作地点，严禁去别处！
        if (sim.workplaceId) {
            // 直接从索引里取，不需要遍历全图！
            const plotFurniture = GameStore.furnitureByPlot.get(sim.workplaceId) || [];
            
            // 筛选符合职业需求的家具
            const candidates = plotFurniture.filter(f => hasRequiredTags(f, requiredTags));
            
            // 筛选未被占用的
            const free = candidates.filter(f => !this.isOccupied(f, sim.id));

            if (free.length > 0) return this.selectBest(sim, free);

            // ❌ 如果公司里没位置，直接返回 null。
            // 绝对不要回退到全图搜索，否则他就会去隔壁老王家上班。
            // 可以在这里加个气泡提示
            if (Math.random() < 0.1) sim.say("公司没位置了...", 'bad');
            return null; 
        }

        // 2. 【自由职业/无固定地点】
        // 这种情况下，我们只允许在“自己家”或者“公共办公场所（如图书馆/网吧）”寻找
        
        let validCandidates: Furniture[] = [];

        // A. 在自己家找 (SOHO)
        if (sim.homeId) {
            // 需要你在 GameStore.housingUnits 里反查属于该 housingUnit 的家具
            // 或者简单点，利用 GameStore.furniture 的 homeId 属性 (如果有的话)
            const homeFurniture = GameStore.furniture.filter(f => f.homeId === sim.homeId);
            validCandidates = validCandidates.concat(homeFurniture.filter(f => hasRequiredTags(f, requiredTags)));
        }

        // B. 在公共商业区找 (网吧/咖啡厅)
        // 我们可以定义哪些 Plot 是公共办公区
        const publicWorkPlots = GameStore.worldLayout.filter(p => 
            p.templateId === 'netcafe' || 
            p.templateId === 'library' || 
            p.customName?.includes('网咖')
        );

        publicWorkPlots.forEach(plot => {
            const furnitureInPlot = GameStore.furnitureByPlot.get(plot.id) || [];
            validCandidates = validCandidates.concat(furnitureInPlot.filter(f => hasRequiredTags(f, requiredTags)));
        });

        // 过滤占用
        const allFree = validCandidates.filter(f => !this.isOccupied(f, sim.id));

        if (allFree.length > 0) return this.selectBest(sim, allFree);

        return null;
    }

    private isOccupied(f: Furniture, selfId: string): boolean {
        if (f.multiUser) return false;
        // 检查是否有人正在使用，或者正走在去使用的路上
        return GameStore.sims.some(s => 
            s.id !== selfId && 
            (s.interactionTarget?.id === f.id || (s.target && s.target.x === f.x + f.w/2 && Math.abs(s.target.y - (f.y + f.h)) < 10))
        );
    }

    private selectBest(sim: Sim, candidates: Furniture[]): Furniture {
        // 如果候选很少，随机选一个防止拥挤
        if (candidates.length < 5) return candidates[Math.floor(Math.random() * candidates.length)];
        
        // 否则选最近的
        let best = candidates[0];
        let minDist = Number.MAX_VALUE;
        
        candidates.forEach(f => {
            const dist = Math.pow(f.x - sim.pos.x, 2) + Math.pow(f.y - sim.pos.y, 2);
            if (dist < minDist) {
                minDist = dist;
                best = f;
            }
        });
        return best;
    }
}

// --- 增强版工作状态 ---
export class WorkingState extends BaseState {
    actionName = SimAction.Working;
    subStateTimer = 0;

    update(sim: Sim, dt: number) {
        super.update(sim, dt);
        this.gainSkills(sim, dt);

        if (Math.random() < 0.0005 * dt) {
            this.tryColleagueInteraction(sim);
        }

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
        // 允许自由职业
        const plot = sim.workplaceId ? GameStore.worldLayout.find(p => p.id === sim.workplaceId) : null;

        // 巡逻模式 (服务员/护士/店员/护工)
        if (plot && (
            (jobType === JobType.Restaurant && jobTitle.includes('服务')) ||
            (jobType === JobType.Store && !jobTitle.includes('收银')) ||
            (jobType === JobType.Hospital && jobTitle.includes('护士')) ||
            (jobType === JobType.ElderCare)
        )) {
            const tx = plot.x + 20 + Math.random() * ((plot.width||300) - 40);
            const ty = plot.y + 20 + Math.random() * ((plot.height||300) - 40);
            sim.target = { x: tx, y: ty };
            sim.moveTowardsTarget(dt);
            
            // ⚠️ [修复] 不要修改 action 字符串，否则 checkSchedule 会误判为没在工作，导致无限循环
            // if (sim.target) sim.action = "working_patrol"; 
        }
        // 教师
        else if (jobType === JobType.School && (jobTitle.includes('师') || jobTitle.includes('教'))) {
            if (Math.random() > 0.7) sim.say("同学们看黑板...", 'act');
        }
        // 医生巡房
        else if (jobType === JobType.Hospital && jobTitle.includes('医')) {
             if (Math.random() > 0.8 && sim.workplaceId) {
                 const bed = GameStore.furniture.find(f => f.id.startsWith(sim.workplaceId!) && f.label.includes('病床'));
                 if (bed) {
                     // [修复] 医生巡房站在床边，不进去
                     sim.target = { x: bed.x + 20, y: bed.y + bed.h + 5 };
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