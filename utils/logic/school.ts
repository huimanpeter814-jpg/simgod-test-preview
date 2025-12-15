import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { SCHOOL_CONFIG, BUFFS, HOLIDAYS } from '../../constants';
import { DecisionLogic } from './decision';

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
            // 保持 schooling 状态，但因为有了 interactionTarget，Sim.update 会进入交互逻辑
            // 交互结束后 finishAction 会重置为 idle，所以我们需要在 finishAction 后或者 checkKindergarten 里再次维持状态
        } else {
            // 找不到就随机游荡一下
            const tx = area.minX + Math.random() * (area.maxX - area.minX);
            const ty = area.minY + Math.random() * (area.maxY - area.minY);
            sim.target = { x: tx, y: ty };
            sim.action = 'schooling'; // 保持状态
        }
    },
    isInSchoolArea(sim: Sim, type: string): boolean {
        // 定义不同学校类型的房间 ID 关键词 (对应 data/plots.ts 中的 ID)
        const keywords: Record<string, string> = {
            'kindergarten': '_kg_', // 比如 plot_edu_kg_ground
            'elementary': '_elem_', // 比如 plot_edu_elem_class_1
            'high_school': '_high_' // 比如 plot_edu_high_library
        };

        const keyword = keywords[type];
        if (!keyword) return false;

        // 遍历所有房间，检查 Sim 是否在匹配的房间范围内
        // GameStore.rooms 存储的是世界绝对坐标
        return GameStore.rooms.some(r => 
            r.id.includes(keyword) && 
            sim.pos.x >= r.x && sim.pos.x <= r.x + r.w &&
            sim.pos.y >= r.y && sim.pos.y <= r.y + r.h
        );
    },
    // 动态获取学校位置并传送
    sendToSchool(sim: Sim, type: string) {
        // 定义主要落地点的房间 ID 后缀 (优先寻找大块地面)
        const targetRoomSuffixes: Record<string, string> = {
            'kindergarten': '_kg_ground',
            'elementary': '_elem_ground',
            'high_school': '_high_ground'
        };

        const suffix = targetRoomSuffixes[type];
        // 1. 尝试找到特定的 Ground 房间
        let targetRoom = GameStore.rooms.find(r => r.id.endsWith(suffix));
        
        // 2. 如果没找到 (比如改名了)，就找任何一个包含关键词的房间
        if (!targetRoom) {
            const keyword = {
                'kindergarten': '_kg_',
                'elementary': '_elem_',
                'high_school': '_high_'
            }[type];
            targetRoom = GameStore.rooms.find(r => r.id.includes(keyword || '_____'));
        }

        let targetX = 0, targetY = 0;

        if (targetRoom) {
            // 找到房间中心点，稍微加点随机偏移，避免所有人叠在一起
            targetX = targetRoom.x + targetRoom.w / 2 + (Math.random() - 0.5) * 40;
            targetY = targetRoom.y + targetRoom.h / 2 + (Math.random() - 0.5) * 40;
        } else {
            console.warn(`[SchoolLogic] 未找到学校类型 ${type} 的房间，传送失败`);
            return; // 找不到学校就不送了
        }

        // 执行传送/通勤逻辑
        if (type === 'kindergarten') {
            sim.pos = { x: targetX, y: targetY };
            sim.target = null;
            sim.path = [];
            sim.action = 'schooling'; 
            return;
        }

        sim.target = { x: targetX, y: targetY };
        sim.action = 'commuting_school';
        sim.say("去学校...", 'act');
    },


    // 1. 幼儿园托管逻辑
    checkKindergarten(sim: Sim) {
        if (!['Infant', 'Toddler'].includes(sim.ageStage)) return;

        const parents = GameStore.sims.filter(s => (s.id === sim.fatherId || s.id === sim.motherId));
        let parentsAtHome = false;
        if (sim.homeId) {
            parentsAtHome = parents.some(p => p.homeId === sim.homeId && p.isAtHome());
        }

        const inKindergarten = SchoolLogic.isInSchoolArea(sim, 'kindergarten');

        if (!parentsAtHome) {
            if (!inKindergarten && sim.action !== 'commuting_school' && sim.action !== 'schooling') {
                sim.say("爸爸妈妈不在家...", 'sys');
                SchoolLogic.sendToSchool(sim, 'kindergarten');
                GameStore.addLog(sim, "被送到了向日葵幼儿园托管", 'sys');
            } 
            else if (inKindergarten) {
                if (sim.action === 'idle') sim.action = 'schooling';
                SchoolLogic.autoReplenishNeeds(sim);
                
                // [修改] 动态查找校内活动区域
                if (!sim.target && !sim.interactionTarget) {
                    // 动态查找当前的幼儿园范围 (找到 kg_ground)
                    const kgRoom = GameStore.rooms.find(r => r.id.includes('_kg_ground'));
                    if (kgRoom) {
                        const kgArea = { 
                            minX: kgRoom.x, maxX: kgRoom.x + kgRoom.w, 
                            minY: kgRoom.y, maxY: kgRoom.y + kgRoom.h 
                        };
                        const actionType = (sim.needs.energy < 70) ? 'nap_crib' : 'play_blocks';
                        SchoolLogic.findObjectInArea(sim, actionType, kgArea);
                    }
                }
            }
        } else {
            if (inKindergarten) {
                sim.say("回家咯！", 'love');
                const home = sim.getHomeLocation();
                if (home) {
                    sim.pos = { x: home.x, y: home.y + 20 };
                    sim.target = null;
                    sim.action = 'idle';
                    sim.interactionTarget = null;
                    GameStore.addLog(sim, "被父母接回了家", 'family');
                }
            }
        }
    },

    // 2. 中小学上课逻辑 (checkSchedule 调用)
    checkSchoolSchedule(sim: Sim) {
        if (!['Child', 'Teen'].includes(sim.ageStage)) return;

        const config = sim.ageStage === 'Child' ? SCHOOL_CONFIG.elementary : SCHOOL_CONFIG.high_school;
        
        // 假期/周末检查
        const currentMonth = GameStore.time.month;
        if (HOLIDAYS[currentMonth]?.type === 'break') return; // 寒暑假
        
        // 简单模拟周末 (每7天里的后2天)
        const dayOfWeek = GameStore.time.totalDays % 7;
        if (dayOfWeek >= 6) return; // 周末

        const hour = GameStore.time.hour + GameStore.time.minute/60;

        // 上学时间
        if (hour >= config.startHour && hour < config.endHour) {
            if (sim.action === 'schooling') return;
            if (sim.action === 'commuting_school') return;
            if (sim.hasLeftWorkToday) return; // 借用这个flag表示今天已经放学或逃学

            // 判定是否逃学 (基于性格和心情)
            let skipChance = 0.05;
            if (sim.mbti.includes('P')) skipChance += 0.1;
            if (sim.mood < 30) skipChance += 0.2;
            if (sim.ageStage === 'Teen') skipChance += 0.1; // 叛逆期

            if (Math.random() < skipChance) {
                sim.hasLeftWorkToday = true;
                sim.say("今天不想上学...", 'bad');
                GameStore.addLog(sim, "决定逃学去玩！", 'bad');
                DecisionLogic.findObject(sim, 'fun');
                return;
            }

            SchoolLogic.sendToSchool(sim, config.id);
        } 
        else if (hour >= config.endHour && sim.action === 'schooling') {
            // 放学
            sim.action = 'idle';
            sim.target = null;
            sim.hasLeftWorkToday = false;
            sim.say("放学啦！", 'act');
            sim.needs.fun -= 20;
            sim.needs.energy -= 30;
            
            // 成绩结算 (每天结算一次)
            SchoolLogic.calculateDailyPerformance(sim);
        }
    },

    autoReplenishNeeds(sim: Sim) {
        // 幼儿园老师照顾：如果需求过低，自动补满
        ['hunger', 'bladder', 'hygiene', 'energy'].forEach(n => {
            if (sim.needs[n] < 30) {
                sim.needs[n] = 90;
                sim.say("老师帮忙...", 'sys');
            }
        });
        // 娱乐值如果不高，缓慢增加
        if (sim.needs.fun < 60) sim.needs.fun += 0.5;
    },

    // 4. 零花钱系统 (每日触发)
    giveAllowance(sim: Sim) {
        if (!['Child', 'Teen'].includes(sim.ageStage)) return;
        
        const config = sim.ageStage === 'Child' ? SCHOOL_CONFIG.elementary : SCHOOL_CONFIG.high_school;
        let amount = config.allowanceBase;

        // 父母越有钱，给的越多
        const parents = GameStore.sims.filter(s => s.id === sim.fatherId || s.id === sim.motherId);
        let totalParentMoney = 0;
        parents.forEach(p => totalParentMoney += p.money);

        if (totalParentMoney > 10000) amount *= 3;
        else if (totalParentMoney > 3000) amount *= 1.5;
        else if (totalParentMoney < 500) amount = 0; // 穷苦家庭

        if (amount > 0 && totalParentMoney >= amount) {
            sim.money += amount;
            // 扣除父母的钱 (简单均摊)
            parents.forEach(p => p.money = Math.max(0, p.money - amount/parents.length));
            sim.say(`零花钱 +$${amount}`, 'money');
        }
    },

    // 5. 学业与作业
    doHomework(sim: Sim) {
        // 只有小学生和中学生需要做作业
        if (!['Child', 'Teen'].includes(sim.ageStage)) return;

        const successChance = (sim.iq * 0.4 + sim.skills.logic * 0.6) / 100;
        
        // 增加智商和逻辑
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
        
        // 基于智商、是否完成作业(简化为是否有 disciplined buff 或心情)、出勤
        let delta = 0;
        if (sim.iq > 80) delta += 2;
        if (sim.mood > 70) delta += 1;
        
        sim.schoolPerformance = Math.max(0, Math.min(100, sim.schoolPerformance + delta));
        
        // 考试周逻辑 (每月最后几天)
        if (GameStore.time.totalDays % 30 > 25) {
            if (sim.schoolPerformance > 90) {
                sim.addBuff(BUFFS.promoted); // 借用 buff，表示考得好
                sim.addMemory("期末考试拿了满分！💯", 'achievement');
                sim.money += 100; // 奖学金
            } else if (sim.schoolPerformance < 40) {
                sim.addBuff(BUFFS.stressed);
                sim.addMemory("期末考试挂科了... 怕被骂", 'bad');
            }
        }
    }
};