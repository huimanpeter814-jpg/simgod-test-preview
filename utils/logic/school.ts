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
    sendToSchool(sim: Sim, type: string): boolean {
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
            return false; // [修复] 返回 false 表示发送失败
        }

        // 执行传送/通勤逻辑
        if (type === 'kindergarten') {
            sim.pos = { x: targetX, y: targetY };
            sim.target = null;
            sim.path = [];
            sim.action = 'schooling'; 
            return true;
        }

        sim.target = { x: targetX, y: targetY };
        sim.action = 'commuting_school';
        sim.say("去学校...", 'act');
        return true;
    },


    // 1. 幼儿园托管逻辑
    checkKindergarten(sim: Sim) {
        if (!['Infant', 'Toddler'].includes(sim.ageStage)) return;

        const currentHour = GameStore.time.hour;
        // 设定托儿所时间：早上8点到下午6点
        const isDaycareTime = currentHour >= 8 && currentHour < 18;
        
        const inKindergarten = SchoolLogic.isInSchoolArea(sim, 'kindergarten');

        // 1. 白天：强制托管（解决父母出门导致反复传送的问题）
        if (isDaycareTime) {
            if (!inKindergarten && sim.action !== 'commuting_school' && sim.action !== 'schooling') {
                // 只有不在学校且没在路上时，才传送/出发
                SchoolLogic.sendToSchool(sim, 'kindergarten');
                GameStore.addLog(sim, "到了上托儿所的时间，被送到了幼儿园", 'sys');
            } 
            else if (inKindergarten) {
                // 在学校里保持状态
                if (sim.action === 'idle') sim.action = 'schooling';
                if (sim.needs.social < 80) sim.needs.social += 1; 
                SchoolLogic.autoReplenishNeeds(sim);
                
                // 找点事做，防止呆站着
                if (!sim.target && !sim.interactionTarget) {
                    const kgRoom = GameStore.rooms.find(r => r.id.includes('_kg_ground'));
                    if (kgRoom) {
                        const kgArea = { 
                            minX: kgRoom.x, maxX: kgRoom.x + kgRoom.w, 
                            minY: kgRoom.y, maxY: kgRoom.y + kgRoom.h 
                        };
                        // 累了睡，不累玩
                        const actionType = (sim.needs.energy < 60) ? 'nap_crib' : 'play_blocks';
                        SchoolLogic.findObjectInArea(sim, actionType, kgArea);
                    }
                }
            }
        } 
        // 2. 晚上：接回家
        else {
            if (inKindergarten) {
                // 放学逻辑：检查是否有家可回
                const home = sim.getHomeLocation();
                if (home) {
                    // 只有放学这一刻传送一次
                    sim.pos = { x: home.x, y: home.y + 20 };
                    sim.target = null;
                    sim.action = 'idle';
                    sim.interactionTarget = null;
                    sim.say("爸爸妈妈来接我啦！", 'love');
                    GameStore.addLog(sim, "放学被接回了家", 'family');
                }
            }
            // 在家时的逻辑由 Sim.update 的通用逻辑处理
        }
    },

    // 2. 中小学上课逻辑 (checkSchedule 调用)
    checkSchoolSchedule(sim: Sim) {
        if (!['Child', 'Teen'].includes(sim.ageStage)) return;

        const config = sim.ageStage === 'Child' ? SCHOOL_CONFIG.elementary : SCHOOL_CONFIG.high_school;
        const currentMonth = GameStore.time.month;

       // 1. 寒暑假判定
        // 设定：1月、2月为寒假；7月、8月为暑假
        const isWinterBreak = [1, 2].includes(currentMonth);
        const isSummerBreak = [7, 8].includes(currentMonth);

        if (isWinterBreak) {
            // (可选) 偶尔触发一句放假感言，避免每一帧都说
            if (Math.random() < 0.001) sim.say("寒假快乐！❄️", 'act');
            return;
        }
        if (isSummerBreak) {
            if (Math.random() < 0.001) sim.say("暑假万岁！🍉", 'act');
            return;
        }

        // 2. 特殊节假日判定 (读取 constants.ts 配置)
        // 例如：10月黄金周
        if (HOLIDAYS[currentMonth]?.type === 'break') {
            return;
        }

        const hour = GameStore.time.hour + GameStore.time.minute/60;

        // 上学时间
        if (hour >= config.startHour && hour < config.endHour) {
            if (sim.action === 'schooling') return;
            if (sim.action === 'commuting_school') return;
            if (sim.hasLeftWorkToday) return; // 借用这个flag表示今天已经放学或逃学

            // 判定是否逃学 (基于性格和心情)
            // 1. 基础概率 (极低，好学生默认不去想逃课)
            let skipProb = 0.01; 

            // 2. 性格维度 (MBTI)
            // Perceiving (P) 随性，增加逃课率；Judging (J) 自律，降低逃课率
            if (sim.mbti.includes('P')) skipProb += 0.02; 
            if (sim.mbti.includes('J')) skipProb -= 0.02; 

            // 3. 内在属性 (道德与智商)
            // 道德感是心中的准绳，影响最大
            if (sim.morality < 30) skipProb += 0.05;      // 坏孩子: +10%
            else if (sim.morality > 70) skipProb -= 0.1; // 乖孩子: -5%
            
            // 智商高的人通常更理智 (或者更擅长请假，这里简化为不逃课)
            if (sim.iq > 80) skipProb -= 0.02;

            // 4. 学业表现 (厌学 vs 进取)
            // 成绩太差会产生厌学心理
            const grades = sim.schoolPerformance || 60;
            if (grades < 40) skipProb += 0.05;            // 成绩差破罐破摔: +8%
            else if (grades > 85) skipProb -= 0.05;       // 优等生保持全勤: -5%

            // 5. 年龄阶段
            // 青少年更容易叛逆
            if (sim.ageStage === 'Teen') skipProb += 0.02;

            // 6. 当前状态 (短期诱因 - 决定性因素)
            // 极度无聊是逃课的最大动力
            if (sim.needs.fun < 30) skipProb += 0.15;     // 憋坏了: +15%
            // 精力不足或心情极差
            if (sim.needs.energy < 20) skipProb += 0.10;  // 起不来床: +10%
            if (sim.mood < 30) skipProb += 0.03;          // 心情抑郁: +10%

            // 7. 概率边界修正
            // 即使条件再好，也不会低于 0；即使条件再差，也给予 80% 封顶 (总有不敢的时候)
            skipProb = Math.max(0, Math.min(0.8, skipProb));

            if (Math.random() < skipProb) {
                sim.hasLeftWorkToday = true;
                
                // 根据主要诱因生成更具体的对话
                if (sim.needs.fun < 30) {
                    sim.say("学校太无聊了，去玩吧！🎮", 'bad');
                    GameStore.addLog(sim, "因忍受不了枯燥，决定逃学去玩！", 'bad');
                    DecisionLogic.findObject(sim, 'fun'); // 明确去找乐子
                } else if (sim.needs.energy < 20) {
                    sim.say("太困了...再睡会 💤", 'bad');
                    GameStore.addLog(sim, "因精力不足，决定在宿舍补觉逃课。", 'bad');
                    // 留在原地或回家睡觉
                    if (sim.homeId) DecisionLogic.findObject(sim, 'energy');
                } else if (sim.morality < 30) {
                    sim.say("切，谁稀罕上学...", 'bad');
                    GameStore.addLog(sim, "作为不良少年，逃课是家常便饭。", 'bad');
                    DecisionLogic.wander(sim); // 到处闲逛
                } else {
                    sim.say("今天不想上学...", 'bad');
                    GameStore.addLog(sim, "心情不好，决定翘课。", 'bad');
                    DecisionLogic.wander(sim);
                }
                return;
            }

            // [FIX] 尝试去上学
            const success = SchoolLogic.sendToSchool(sim, config.id);
            if (!success) {
                // 如果找不到学校（房间未生成等bug），则标记为“今日已放学/无需上学”
                // 防止每一帧都重新判定逃学概率，导致最终必定“逃课”
                sim.hasLeftWorkToday = true; 
                sim.say("学校好像关门了...", 'sys');
            }
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