
import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { SCHOOL_CONFIG, BUFFS, HOLIDAYS } from '../../constants';
import { DecisionLogic } from './decision';
import { SimAction, AgeStage, NeedType } from '../../types';
import { SchoolingState, CommutingSchoolState, IdleState, PlayingHomeState, PickingUpState, WaitingState } from './SimStates';

export const SchoolLogic = {
    findObjectInArea(sim: Sim, utility: string, area: {minX: number, maxX: number, minY: number, maxY: number}) {
        const candidates = GameStore.furnitureIndex.get(utility) || [];
        const valid = candidates.filter(f => 
            f.x >= area.minX && f.x <= area.maxX && 
            f.y >= area.minY && f.y <= area.maxY
        );
        
        if (valid.length > 0) {
            const obj = valid[Math.floor(Math.random() * valid.length)];
            sim.target = { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
            sim.interactionTarget = obj;
        } else {
            const tx = area.minX + Math.random() * (area.maxX - area.minX);
            const ty = area.minY + Math.random() * (area.maxY - area.minY);
            sim.target = { x: tx, y: ty };
        }
    },
    
    isInSchoolArea(sim: Sim, type: string): boolean {
        const plot = GameStore.worldLayout.find(p => p.templateId === type);
        if (!plot) return false;

        const w = plot.width || 300;
        const h = plot.height || 300;

        return (
            sim.pos.x >= plot.x && sim.pos.x <= plot.x + w &&
            sim.pos.y >= plot.y && sim.pos.y <= plot.y + h
        );
    },

    // 🆕 增强版：安排接孩子 (放学)
    arrangePickup(sim: Sim) {
        // 如果已经有人来接了，就不要再派人了
        const incomingPicker = GameStore.sims.find(s => s.carryingSimId === sim.id && s.action === SimAction.PickingUp);
        if (incomingPicker) return;

        // 1. 尝试找父母
        const parents = GameStore.sims.filter(s => 
            (s.id === sim.fatherId || s.id === sim.motherId) &&
            !s.isTemporary && // 排除已有保姆
            s.action !== SimAction.Working && 
            s.action !== SimAction.Commuting &&
            s.action !== SimAction.Sleeping &&
            s.action !== SimAction.Escorting &&
            s.action !== SimAction.PickingUp
        );

        const carrier = parents.sort((a, b) => b.mood - a.mood)[0];

        if (carrier) {
            carrier.target = { x: sim.pos.x, y: sim.pos.y };
            carrier.carryingSimId = sim.id; 
            carrier.changeState(new PickingUpState());
            carrier.say("接宝宝放学咯~", 'family');
            sim.say("等爸爸/妈妈...", 'normal');
        } else {
            // 2. 父母没空，生成保姆接送
            if (sim.homeId) {
                GameStore.spawnNanny(sim.homeId, 'pick_up', sim.id);
                sim.say("等保姆阿姨...", 'normal');
            }
        }
    },

    sendToSchool(sim: Sim, type: string): boolean {
        const schoolPlot = GameStore.worldLayout.find(p => p.templateId === type);
        if (!schoolPlot) return false;

        const targetRoom = GameStore.rooms.find(r => r.id.startsWith(`${schoolPlot.id}_`));
        let targetX = 0, targetY = 0;
        if (targetRoom) {
            targetX = targetRoom.x + targetRoom.w / 2 + (Math.random() - 0.5) * 40;
            targetY = targetRoom.y + targetRoom.h / 2 + (Math.random() - 0.5) * 40;
        } else {
            const w = schoolPlot.width || 300;
            const h = schoolPlot.height || 300;
            targetX = schoolPlot.x + w / 2;
            targetY = schoolPlot.y + h / 2;
        }

        // 🆕 幼儿园送学逻辑
        if (type === 'kindergarten') {
            const parents = GameStore.sims.filter(s => 
                (s.id === sim.fatherId || s.id === sim.motherId) &&
                !s.isTemporary &&
                s.action !== SimAction.Working && 
                s.action !== SimAction.Commuting &&
                s.action !== SimAction.Sleeping &&
                s.action !== SimAction.Escorting &&
                s.action !== SimAction.PickingUp 
            );

            // 优先选心情好、空闲的父母
            const carrier = parents.sort((a, b) => b.mood - a.mood)[0];

            if (carrier) {
                // 1. 父母送
                carrier.target = { x: sim.pos.x, y: sim.pos.y };
                carrier.carryingSimId = sim.id; 
                carrier.changeState(new PickingUpState());
                carrier.say("送宝宝上学去~", 'family');
            } else {
                // 2. 父母没空，生成保姆送
                if (sim.homeId) {
                    GameStore.spawnNanny(sim.homeId, 'drop_off', sim.id);
                } else {
                    // 极端情况：无家可归，孩子自己玩
                    sim.changeState(new PlayingHomeState());
                    return false;
                }
            }

            // 孩子进入等待模式
            sim.say("准备上学...", 'normal');
            sim.changeState(new WaitingState()); 
            
            return true;
        }

        // 中小学自己去
        sim.target = { x: targetX, y: targetY };
        sim.changeState(new CommutingSchoolState());
        sim.say("去学校...", 'act');
        return true;
    },

    // 1. 幼儿园托管逻辑
    checkKindergarten(sim: Sim) {
        if (![AgeStage.Infant, AgeStage.Toddler].includes(sim.ageStage)) return;

        const currentHour = GameStore.time.hour;
        const isDaycareTime = currentHour >= 8 && currentHour < 18; // 8点-18点
        const inKindergarten = SchoolLogic.isInSchoolArea(sim, 'kindergarten');

        if (isDaycareTime) {
            // 如果不在幼儿园，且不在被护送/接送的状态
            if (!inKindergarten && 
                sim.action !== SimAction.BeingEscorted && 
                sim.action !== SimAction.Schooling &&
                sim.action !== SimAction.Waiting && // 等待中也不要打断
                sim.action !== SimAction.PickingUp // 正在被接也不要打断
            ) {
                // 尝试派送
                SchoolLogic.sendToSchool(sim, 'kindergarten');
            } 
            else if (inKindergarten) {
                if (sim.action === SimAction.Idle) sim.changeState(new SchoolingState());
                if (sim.needs.social < 80) sim.needs.social += 1; 
                SchoolLogic.autoReplenishNeeds(sim);
            }
        } 
        else {
            // 🆕 放学逻辑：如果在幼儿园，进入等待模式，呼叫家长/保姆来接
            if (inKindergarten) {
                if (sim.action !== SimAction.Waiting && sim.action !== SimAction.BeingEscorted) {
                    sim.changeState(new WaitingState());
                    SchoolLogic.arrangePickup(sim);
                } else if (sim.action === SimAction.Waiting) {
                    // 每隔一会检查是否有人来接，如果没有重新呼叫
                    if (Math.random() < 0.05) SchoolLogic.arrangePickup(sim);
                }
            }
        }
    },

    // 2. 中小学上课逻辑 (保持不变)
    checkSchoolSchedule(sim: Sim) {
        if (![AgeStage.Child, AgeStage.Teen].includes(sim.ageStage)) return;

        const config = sim.ageStage === AgeStage.Child ? SCHOOL_CONFIG.elementary : SCHOOL_CONFIG.high_school;
        const currentMonth = GameStore.time.month;
        const isWinterBreak = [1, 2].includes(currentMonth);
        const isSummerBreak = [7, 8].includes(currentMonth);

        if (isWinterBreak) { if (Math.random() < 0.001) sim.say("寒假快乐！❄️", 'act'); return; }
        if (isSummerBreak) { if (Math.random() < 0.001) sim.say("暑假万岁！🍉", 'act'); return; }
        if (HOLIDAYS[currentMonth]?.type === 'break') return;

        const hour = GameStore.time.hour + GameStore.time.minute/60;

        if (hour >= config.startHour && hour < config.endHour) {
            if (sim.action === SimAction.Schooling) return;
            if (sim.action === SimAction.CommutingSchool) return;
            if (sim.hasLeftWorkToday) return;

            // 逃课逻辑 (保持不变)
            let skipProb = 0.01; 
            if (sim.mbti.includes('P')) skipProb += 0.02; 
            if (sim.mbti.includes('J')) skipProb -= 0.02; 
            if (sim.morality < 30) skipProb += 0.05;      
            else if (sim.morality > 70) skipProb -= 0.1; 
            if (sim.iq > 80) skipProb -= 0.02;
            const grades = sim.schoolPerformance || 60;
            if (grades < 40) skipProb += 0.05;            
            else if (grades > 85) skipProb -= 0.05;       
            if (sim.ageStage === AgeStage.Teen) skipProb += 0.02;
            if (sim.needs.fun < 30) skipProb += 0.15;     
            if (sim.needs.energy < 20) skipProb += 0.10;  
            if (sim.mood < 30) skipProb += 0.03;          
            skipProb = Math.max(0, Math.min(0.8, skipProb));

            if (Math.random() < skipProb) {
                sim.hasLeftWorkToday = true;
                if (sim.needs.fun < 30) {
                    sim.say("学校太无聊了，去玩吧！🎮", 'bad');
                    GameStore.addLog(sim, "因忍受不了枯燥，决定逃学去玩！", 'bad');
                    DecisionLogic.findObject(sim, NeedType.Fun); 
                } else if (sim.needs.energy < 20) {
                    sim.say("太困了...再睡会 💤", 'bad');
                    GameStore.addLog(sim, "因精力不足，决定在宿舍补觉逃课。", 'bad');
                    if (sim.homeId) DecisionLogic.findObject(sim, NeedType.Energy);
                } else if (sim.morality < 30) {
                    sim.say("切，谁稀罕上学...", 'bad');
                    GameStore.addLog(sim, "作为不良少年，逃课是家常便饭。", 'bad');
                    sim.startWandering();
                } else {
                    sim.say("今天不想上学...", 'bad');
                    GameStore.addLog(sim, "心情不好，决定翘课。", 'bad');
                    sim.startWandering();
                }
                return;
            }

            const success = SchoolLogic.sendToSchool(sim, config.id);
            if (!success) {
                sim.hasLeftWorkToday = true; 
                sim.say("找不到学校...", 'sys');
            }
        } 
        else if (hour >= config.endHour && sim.action === SimAction.Schooling) {
            sim.hasLeftWorkToday = false;
            sim.say("放学啦！", 'act');
            sim.needs.fun -= 20;
            sim.needs.energy -= 30;
            SchoolLogic.calculateDailyPerformance(sim);
            sim.changeState(new IdleState());
        }
    },

    autoReplenishNeeds(sim: Sim) {
        [NeedType.Hunger, NeedType.Bladder, NeedType.Hygiene, NeedType.Energy].forEach(n => {
            if (sim.needs[n] < 30) { sim.needs[n] = 90; sim.say("老师帮忙...", 'sys'); }
        });
        if (sim.needs.fun < 60) sim.needs.fun += 0.5;
    },

    giveAllowance(sim: Sim) {
        if (![AgeStage.Child, AgeStage.Teen].includes(sim.ageStage)) return;
        
        const config = sim.ageStage === AgeStage.Child ? SCHOOL_CONFIG.elementary : SCHOOL_CONFIG.high_school;
        let amount = config.allowanceBase;
        const parents = GameStore.sims.filter(s => s.id === sim.fatherId || s.id === sim.motherId);
        let totalParentMoney = 0;
        parents.forEach(p => totalParentMoney += p.money);

        if (totalParentMoney > 10000) amount *= 3;
        else if (totalParentMoney > 3000) amount *= 1.5;
        else if (totalParentMoney < 500) amount = 0;

        if (amount > 0 && totalParentMoney >= amount) {
            sim.money += amount;
            parents.forEach(p => p.money = Math.max(0, p.money - amount/parents.length));
            sim.say(`零花钱 +$${amount}`, 'money');
        }
    },

    doHomework(sim: Sim) {
        if (![AgeStage.Child, AgeStage.Teen].includes(sim.ageStage)) return;
        const successChance = (sim.iq * 0.4 + sim.skills.logic * 0.6) / 100;
        sim.skills.logic += 0.2;
        sim.iq = Math.min(100, sim.iq + 0.05);
        
        if (Math.random() < successChance) {
            sim.say("题目好简单 ✏️", 'act');
            sim.schoolPerformance = Math.min(100, (sim.schoolPerformance || 60) + 5);
        } else {
            sim.say("这题太难了... 🤯", 'bad');
            sim.needs.fun -= 10;
            sim.schoolPerformance = Math.min(100, (sim.schoolPerformance || 60) + 2);
        }
    },

    calculateDailyPerformance(sim: Sim) {
        if (!sim.schoolPerformance) sim.schoolPerformance = 60;
        let delta = 0;
        if (sim.iq > 80) delta += 2;
        if (sim.mood > 70) delta += 1;
        sim.schoolPerformance = Math.max(0, Math.min(100, sim.schoolPerformance + delta));
        
        if (GameStore.time.totalDays % 30 > 25) {
            if (sim.schoolPerformance > 90) {
                sim.addBuff(BUFFS.promoted); 
                sim.addMemory("期末考试拿了满分！💯", 'achievement');
                sim.money += 100; 
            } else if (sim.schoolPerformance < 40) {
                sim.addBuff(BUFFS.stressed);
                sim.addMemory("期末考试挂科了... 怕被骂", 'bad');
            }
        }
    }
};
