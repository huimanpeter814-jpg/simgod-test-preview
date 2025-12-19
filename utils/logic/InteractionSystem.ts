import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { SimAction, NeedType, Furniture } from '../../types';
import { INTERACTIONS, RESTORE_TIMES, InteractionHandler } from './interactionRegistry';
import { ITEMS, BUFFS } from '../../constants';
import { IdleState, WorkingState, InteractionState, TransitionState } from './SimStates';
import { getInteractionPos, minutes } from '../simulationHelpers';
import { SocialLogic } from './social';

export const InteractionSystem = {
    /**
     * 开始交互逻辑 (Sim 调用此方法)
     */
    startInteraction(sim: Sim) {
        if (!sim.interactionTarget) {
            sim.changeState(new IdleState());
            return;
        }

        // 1. 人际交互
        if (sim.interactionTarget.type === 'human') {
            sim.changeState(new InteractionState(SimAction.Talking));
            sim.actionTimer = minutes(40);
            
            const partner = sim.interactionTarget.ref as Sim;
            // 确保对方也进入聊天状态
            if (partner.action !== SimAction.Talking) {
                partner.interactionTarget = { type: 'human', ref: sim };
                partner.changeState(new InteractionState(SimAction.Talking));
                partner.actionTimer = minutes(40);
            }
            SocialLogic.performSocial(sim, partner);
        } 
        // 2. 物体/家具交互
        else {
            const obj = sim.interactionTarget as Furniture;
            
            // 检查位置：是否需要平滑过渡动画 (Transition)
            const { interact } = getInteractionPos(obj);
            const dist = Math.sqrt(Math.pow(sim.pos.x - interact.x, 2) + Math.pow(sim.pos.y - interact.y, 2));
            
            // 如果距离交互点过远（比如站在家具前，但要躺在床上），插入过渡状态
            if (dist > 5) {
                sim.changeState(new TransitionState(interact, () => {
                    // 动画结束后，执行真正的业务逻辑
                    InteractionSystem.performInteractionLogic(sim, obj);
                    return sim.state; // 返回新设置的状态
                }));
                return;
            }

            // 直接执行
            InteractionSystem.performInteractionLogic(sim, obj);
        }
    },

    /**
     * 执行具体的物体交互逻辑
     */
    performInteractionLogic(sim: Sim, obj: Furniture) {
        // 1. 扣钱逻辑
        if (obj.cost) {
            if (sim.money < obj.cost) {
                sim.say("太贵了...", 'bad');
                InteractionSystem.finishAction(sim);
                return;
            }
            sim.money -= obj.cost;
            sim.dailyExpense += obj.cost;
            sim.dailyBudget -= obj.cost;
            GameStore.addLog(sim, `消费: ${obj.label} -$${obj.cost}`, 'money');
            sim.say(`买! -${obj.cost}`, 'money');
            
            // 购买物品的特殊效果
            const itemDef = ITEMS.find(i => i.label === obj.label);
            if (itemDef && itemDef.attribute) {
                sim.buyItem(itemDef);
            }
        }

        // 2. 获取交互处理器
        let handler: InteractionHandler | null = null;
        if (INTERACTIONS && obj.utility) {
            handler = INTERACTIONS[obj.utility];
            // 模糊匹配 (例如 cinema_3d -> cinema_)
            if (!handler) {
                const prefixKey = Object.keys(INTERACTIONS).find(k => k.endsWith('_') && obj.utility && obj.utility.startsWith(k));
                if (prefixKey) handler = INTERACTIONS[prefixKey];
            }
            if (!handler) handler = INTERACTIONS['default'];
        }

        // 3. 执行 onStart
        if (handler && handler.onStart) {
            const success = handler.onStart(sim, obj);
            if (!success) {
                InteractionSystem.finishAction(sim);
                return;
            }
        }

        // 4. 确定动作类型与时长
        let actionType = SimAction.Using;
        if (obj.utility === 'energy') actionType = SimAction.Sleeping;
        else if (obj.utility === 'hunger' || obj.utility === 'eat_out') actionType = SimAction.Eating;
        else if (obj.utility === 'work') actionType = SimAction.Working;
        
        let durationMinutes = 30;
        if (handler && handler.getDuration) durationMinutes = handler.getDuration(sim, obj);
        else if (handler && handler.duration) durationMinutes = handler.duration;
        else {
            // 默认根据需求缺口计算时长
            const u = obj.utility;
            const timePer100 = RESTORE_TIMES[u] || RESTORE_TIMES.default;
            const needKey = u as NeedType;
            if (sim.needs[needKey] !== undefined) {
                const missing = 100 - sim.needs[needKey];
                durationMinutes = (missing / 100) * timePer100 * 1.1; 
            }
            durationMinutes = Math.max(10, durationMinutes);
        }

        sim.actionTimer = minutes(durationMinutes);
        
        // 5. 切换状态
        if (actionType === SimAction.Working) {
            sim.changeState(new WorkingState()); 
        } else {
            sim.changeState(new InteractionState(actionType));
        }

        // 6. 气泡反馈
        let verb = handler ? handler.verb : "使用";
        if (handler && handler.getVerb) verb = handler.getVerb(sim, obj);
        if (Math.random() < 0.8) sim.say(verb, 'act');
    },

    /**
     * 结束交互
     */
    finishAction(sim: Sim) {
        // 1. 强制补满主要需求（防止死循环）
        if (sim.action === SimAction.Sleeping) {
            sim.needs[NeedType.Energy] = 100;
            sim.addBuff(BUFFS.well_rested);
        }
        if (sim.action === SimAction.Eating) sim.needs[NeedType.Hunger] = 100;
        
        // 2. 执行 onFinish 回调
        if (sim.interactionTarget && sim.interactionTarget.type !== 'human') {
            let u = sim.interactionTarget.utility;
            let obj = sim.interactionTarget;
            let handler = INTERACTIONS[u] || INTERACTIONS['default'];
            if (handler && handler.onFinish) handler.onFinish(sim, obj);
            
            // 通用补满逻辑
            const needKey = u as NeedType;
            if (!u.startsWith('buy_') && sim.needs[needKey] !== undefined && sim.needs[needKey] > 90) {
                sim.needs[needKey] = 100;
            }
        }
        
        if (sim.action === SimAction.Talking) sim.needs[NeedType.Social] = 100;
        
        // 3. 清理状态
        sim.target = null;
        sim.interactionTarget = null;
        sim.path = [];
        sim.isSideHustle = false;
        sim.commuteTimer = 0;
        
        // 4. 回归空闲
        sim.changeState(new IdleState());
    }
};