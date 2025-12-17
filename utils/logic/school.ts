import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { SCHOOL_CONFIG, BUFFS, HOLIDAYS } from '../../constants';
import { DecisionLogic } from './decision';
import { SimAction, AgeStage, NeedType } from '../../types';
import { SchoolingState, CommutingSchoolState, IdleState, PlayingHomeState, FollowingState } from './SimStates';

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
            // 虽然这里设置了 interactionTarget，但因为是在 SchoolingState 下，
            // 只要 SchoolingState 的 update 不会覆盖这个逻辑，它就会生效
            // 不过更好的方式是切换到 Use 状态，但这会打破 Schooling 状态
            // 暂时保持 SchoolingState 并在那里处理微观行为，或者允许嵌套状态
            // 为了简单，我们让 Sim.startInteraction 自动切换状态，但这会退出 Schooling
            // [Fix] 保持在 SchoolingState，只是利用 interactionTarget 进行视觉定位
        } else {
            const tx = area.minX + Math.random() * (area.maxX - area.minX);
            const ty = area.minY + Math.random() * (area.maxY - area.minY);
            sim.target = { x: tx, y: ty };
        }
    },
    
    isInSchoolArea(sim: Sim, type: string): boolean {
        const keywords: Record<string, string> = {
            'kindergarten': '_kg_', 
            'elementary': '_elem_', 
            'high_school': '_high_' 
        };
        const keyword = keywords[type];
        if (!keyword) return false;
        return GameStore.rooms.some(r => 
            r.id.includes(keyword) && 
            sim.pos.x >= r.x && sim.pos.x <= r.x + r.w &&
            sim.pos.y >= r.y && sim.pos.y <= r.y + r.h
        );
    },

    sendToSchool(sim: Sim, type: string): boolean {
        const targetRoomSuffixes: Record<string, string> = {
            'kindergarten': '_kg_ground',
            'elementary': '_elem_ground',
            'high_school': '_high_ground'
        };
        const suffix = targetRoomSuffixes[type];
        let targetRoom = GameStore.rooms.find(r => r.id.endsWith(suffix));
        if (!targetRoom) {
            const keyword = { 'kindergarten': '_kg_', 'elementary': '_elem_', 'high_school': '_high_' }[type];
            targetRoom = GameStore.rooms.find(r => r.id.includes(keyword || '_____'));
        }

        let targetX = 0, targetY = 0;
        if (targetRoom) {
            targetX = targetRoom.x + targetRoom.w / 2 + (Math.random() - 0.5) * 40;
            targetY = targetRoom.y + targetRoom.h / 2 + (Math.random() - 0.5) * 40;
        } else {
            return false; 
        }

        if (type === 'kindergarten') {
            sim.pos = { x: targetX, y: targetY };
            sim.target = null;
            sim.path = [];
            sim.changeState(new SchoolingState());
            return true;
        }

        sim.target = { x: targetX, y: targetY };
        sim.changeState(new CommutingSchoolState());
        sim.say("去学校...", 'act');
        return true;
    },

    // 1. 幼儿园托管逻辑
    checkKindergarten(sim: Sim) {
        if (![AgeStage.Infant, AgeStage.Toddler].includes(sim.ageStage)) return;

        const currentHour = GameStore.time.hour;
        const isDaycareTime = currentHour >= 8 && currentHour < 18;
        const inKindergarten = SchoolLogic.isInSchoolArea(sim, 'kindergarten');

        if (isDaycareTime) {
            if (!inKindergarten && sim.action !== SimAction.CommutingSchool && sim.action !== SimAction.Schooling) {
                SchoolLogic.sendToSchool(sim, 'kindergarten');
                GameStore.addLog(sim, "到了上托儿所的时间，被送到了幼儿园", 'sys');
            } 
            else if (inKindergarten) {
                if (sim.action === SimAction.Idle) sim.changeState(new SchoolingState());
                if (sim.needs.social < 80) sim.needs.social += 1; 
                SchoolLogic.autoReplenishNeeds(sim);
                
                if (!sim.target && !sim.interactionTarget) {
                    const kgRoom = GameStore.rooms.find(r => r.id.includes('_kg_ground'));
                    if (kgRoom) {
                        const kgArea = { minX: kgRoom.x, maxX: kgRoom.x + kgRoom.w, minY: kgRoom.y, maxY: kgRoom.y + kgRoom.h };
                        const actionType = (sim.needs.energy < 60) ? 'nap_crib' : 'play_blocks';
                        SchoolLogic.findObjectInArea(sim, actionType, kgArea);
                    }
                }
            }
        } 
        else {
            if (inKindergarten) {
                const home = sim.getHomeLocation();
                if (home) {
                    sim.pos = { x: home.x, y: home.y + 20 };
                    sim.target = null;
                    sim.interactionTarget = null;
                    sim.changeState(new IdleState());
                    sim.say("爸爸妈妈来接我啦！", 'love');
                    GameStore.addLog(sim, "放学被接回了家", 'family');
                }
            }
        }
    },

    // 2. 中小学上课逻辑
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
                sim.say("学校好像关门了...", 'sys');
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