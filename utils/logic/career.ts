import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { JOBS, BUFFS, HOLIDAYS } from '../../constants';
import { Furniture, JobType, SimAction, AgeStage, Job } from '../../types';
import { CommutingState, IdleState } from './SimStates';


// 🆕 定义职业适应性评分标准
const JOB_PREFERENCES: Record<JobType, (sim: Sim) => number> = {
    [JobType.Internet]: (sim) => {
        let score = 0;
        // 核心能力：智商与逻辑
        score += sim.iq * 0.5;
        score += sim.skills.logic * 2;
        // 性格偏好：T(思考型), N(直觉型)
        if (sim.mbti.includes('T')) score += 20;
        if (sim.mbti.includes('N')) score += 10;
        // 目标加成
        if (sim.lifeGoal.includes('黑客') || sim.lifeGoal.includes('大牛') || sim.lifeGoal.includes('富翁')) score += 50;
        return score;
    },
    [JobType.Design]: (sim) => {
        let score = 0;
        // 核心能力：创造力与审美
        score += sim.creativity * 0.6;
        score += (sim.skills.creativity || 0) * 2;
        // 性格偏好：P(感知型), N(直觉型)
        if (sim.mbti.includes('P')) score += 15;
        if (sim.mbti.includes('N')) score += 15;
        if (sim.lifeGoal.includes('艺术') || sim.lifeGoal.includes('设计')) score += 50;
        return score;
    },
    [JobType.Business]: (sim) => {
        let score = 0;
        // 核心能力：情商与外表
        score += sim.eq * 0.5;
        score += sim.appearanceScore * 0.3;
        // 性格偏好：E(外向), J(判断型)
        if (sim.mbti.includes('E')) score += 25;
        if (sim.mbti.includes('J')) score += 15;
        if (sim.lifeGoal.includes('富翁') || sim.lifeGoal.includes('大亨') || sim.lifeGoal.includes('领袖')) score += 50;
        return score;
    },
    [JobType.Store]: (sim) => {
        let score = 0;
        // 核心能力：情商、体质(站立工作)
        score += sim.eq * 0.4;
        score += sim.constitution * 0.2;
        // 比较平均，适合没有突出特长的人作为保底
        score += 20; 
        return score;
    },
    [JobType.Restaurant]: (sim) => {
        let score = 0;
        // 核心能力：烹饪、体质
        score += sim.skills.cooking * 3; // 技能权重很高，有一技之长
        score += sim.constitution * 0.4;
        if (sim.lifeGoal.includes('美食') || sim.lifeGoal.includes('主厨')) score += 50;
        return score;
    },
    [JobType.Library]: (sim) => {
        let score = 0;
        // 核心能力：智商、逻辑
        score += sim.iq * 0.3;
        // 性格偏好：I(内向)
        if (sim.mbti.includes('I')) score += 30;
        if (sim.lifeGoal.includes('博学') || sim.lifeGoal.includes('岁月静好')) score += 40;
        return score;
    },
    [JobType.School]: (sim) => {
        let score = 0;
        // 核心能力：智商、情商(管学生)
        score += sim.iq * 0.3;
        score += sim.eq * 0.3;
        // 性格偏好：S(实感型), J(判断型) - 守规矩、负责任
        if (sim.mbti.includes('S')) score += 10;
        if (sim.mbti.includes('J')) score += 20;
        // 喜欢家庭/教育的人
        if (sim.lifeGoal.includes('家庭') || sim.lifeGoal.includes('桃李') || sim.lifeGoal.includes('岁月静好')) score += 50;
        return score;
    },
    [JobType.Nightlife]: (sim) => {
        let score = 0;
        // 核心能力：音乐、舞蹈、魅力
        score += (sim.skills.music || 0) * 1.5;
        score += (sim.skills.dancing || 0) * 1.5;
        score += sim.appearanceScore * 0.4;
        // 性格偏好：E(外向), P(感知型)
        if (sim.mbti.includes('E')) score += 20;
        if (sim.mbti.includes('P')) score += 20;
        if (sim.lifeGoal.includes('派对') || sim.lifeGoal.includes('万人迷')) score += 50;
        return score;
    },
    [JobType.Unemployed]: () => -999 // 除非没得选，否则不主动选失业
};

export const CareerLogic = {
    // 🆕 动态计算岗位容量
    getDynamicJobCapacity(job: Job): number {
        // 1. 获取该职业需要的家具类型
        let searchLabels: string[] = [];
        const isBoss = job.level >= 4;

        if (job.companyType === JobType.Internet) {
            searchLabels = isBoss ? ['老板椅'] : ['码农工位', '控制台', '服务器组'];
        } else if (job.companyType === JobType.Design) {
            searchLabels = isBoss ? ['创意总监'] : ['画架']; 
        } else if (job.companyType === JobType.Business) {
            searchLabels = isBoss ? ['老板椅', '红木班台'] : ['商务工位'];
        } else if (job.companyType === JobType.Store) {
            searchLabels = isBoss ? ['店长'] : ['收银台', '售票处', '货架'];
        } else if (job.companyType === JobType.Restaurant) {
            searchLabels = isBoss ? ['行政主厨'] : ['灶台', '后厨', '服务员'];
        } else if (job.companyType === JobType.Nightlife) {
            searchLabels = ['DJ台', '吧台'];
        } else if (job.companyType === JobType.School) {
            if (job.level >= 4) {
                searchLabels = ['校长室', '办公桌']; // 校长
            } else if (job.title.includes('厨') || job.title.includes('帮厨')) {
                searchLabels = ['后厨', '食堂灶台'];
            } else if (job.title.includes('保安')) {
                searchLabels = ['保安岗'];
            } else {
                searchLabels = ['讲台', '黑板', '办公桌', '教师桌']; // 通用教师
            }
        } else {
            return 20; 
        }

        // 2. 遍历地图家具，统计符合条件的数量
        let capacity = 0;
        GameStore.furniture.forEach(f => {
            if (searchLabels.some(l => f.label.includes(l))) {
                // 如果家具支持多人 (multiUser)，容量加倍 (简单估算)
                capacity += f.multiUser ? 4 : 1;
            }
        });

        // 3. 兜底，防止地图是个空的
        return Math.max(1, capacity); 
    },

    // 🌟 重构后的工作指派逻辑：基于全属性评分
    assignJob(sim: Sim) {
        // 1. 计算所有职业类型的得分
        const scores: { type: JobType, score: number }[] = [];
        
        (Object.keys(JOB_PREFERENCES) as JobType[]).forEach(type => {
            if (type === JobType.Unemployed) return;
            const calculateScore = JOB_PREFERENCES[type];
            let score = calculateScore(sim);
            
            // 加上一点随机波动，避免数值完全决定命运，增加多样性
            score += Math.random() * 15; 
            
            scores.push({ type, score });
        });

        // 2. 按分数降序排列，优先尝试高分职业
        scores.sort((a, b) => b.score - a.score);

        // 3. 尝试分配工作（从高分到低分遍历）
        let assignedJob: Job | undefined = undefined;

        for (const candidate of scores) {
            const jobType = candidate.type;
            
            // 查找该类型下 Level 1 或 Level 2 的职位
            // (放宽限制：允许 Lv2 入职，防止因为没有 Lv1 职位导致无法就职)
            const validJobs = JOBS.filter(j => {
                if (j.companyType !== jobType) return false;
                
                // 检查容量
                const capacity = this.getDynamicJobCapacity(j);
                const currentCount = GameStore.sims.filter(s => s.job.id === j.id).length;
                return currentCount < capacity;
            });

            if (validJobs.length > 0) {

                // 权重算法示例：等级越高，被选中的概率越低
                const weightedPool: Job[] = [];
                validJobs.forEach(job => {
                    let weight = 10;
                    if (job.level === 2) weight = 6;
                    if (job.level === 3) weight = 3;
                    if (job.level === 4) weight = 1;
                    
                    // 将职位按权重多次推入池子，增加被随机到的概率
                    for(let k=0; k<weight; k++) weightedPool.push(job);
                });

                assignedJob = weightedPool[Math.floor(Math.random() * weightedPool.length)];
                break;
            }
        }

        // 4. 如果所有偏好职业都满了，只好失业或随机塞一个 (兜底)
        if (!assignedJob) {
            assignedJob = JOBS.find(j => j.id === 'unemployed');
            sim.say("找不到合适的工作...", 'bad');
        } else {
            // 如果是很匹配的工作（分数高），给个好心情
            // 简单判断：如果选中的是第一志愿
            if (scores[0].type === assignedJob.companyType) {
                sim.addBuff(BUFFS.promoted); // 借用 promoted 表示找到心仪工作
                sim.say("这是我的梦想职业！", 'act');
            } else {
                sim.say("先干着这份工吧...", 'normal');
            }
        }

        sim.job = assignedJob!;
        
        // 🆕 绑定工作地点 (Workplace Binding)
        if (sim.job.id !== 'unemployed') {
            let targetPlotType = 'work'; // 默认办公区
            
            switch (sim.job.companyType) {
                case JobType.Store:
                case JobType.Restaurant:
                case JobType.Nightlife:
                    targetPlotType = 'commercial';
                    break;
                case JobType.School:
                case JobType.Library:
                    targetPlotType = 'public';
                    break;
                case JobType.Internet:
                case JobType.Design:
                case JobType.Business:
                    targetPlotType = 'work';
                    break;
            }

            // 在地图上寻找符合类型的地皮
            const validPlots = GameStore.worldLayout.filter(p => p.customType === targetPlotType);
            if (validPlots.length > 0) {
                // 随机分配一个作为固定工作点
                const plot = validPlots[Math.floor(Math.random() * validPlots.length)];
                sim.workplaceId = plot.id;
            } else {
                sim.workplaceId = undefined; // 没找到对应地皮
            }
        } else {
            sim.workplaceId = undefined;
        }
    },

    // 检查职业满意度/辞职逻辑
    checkCareerSatisfaction(sim: Sim) {
        if (sim.job.id === 'unemployed') return;
        
        let quitScore = 0;
        if (sim.mood < 30) quitScore += 20;
        if (sim.hasBuff('stressed') || sim.hasBuff('anxious')) quitScore += 30;
        if (sim.money > 10000) quitScore += 10; 
        
        if (sim.job.companyType === JobType.Internet && sim.mbti.includes('F')) quitScore += 10;
        if (sim.job.companyType === JobType.Business && sim.mbti.includes('I')) quitScore += 15;
        
        if (Math.random() * 100 < quitScore && quitScore > 50) {
            this.fireSim(sim, 'resign');
        }
    },

    // 🆕 解雇/离职 统一处理
    fireSim(sim: Sim, reason: 'resign' | 'fired' | 'absent') {
        const oldJobTitle = sim.job.title;
        sim.job = JOBS.find(j => j.id === 'unemployed')!;
        sim.workplaceId = undefined;
        sim.workPerformance = 0;
        sim.consecutiveAbsences = 0;

        if (reason === 'resign') {
            GameStore.addLog(sim, `决定辞职... "这工作不适合我"`, 'sys');
            sim.addMemory(`辞去了 ${oldJobTitle} 的工作，想要休息一段时间。`, 'job');
            sim.say("我不干了! 💢", 'bad');
            sim.addBuff(BUFFS.well_rested);
        } else if (reason === 'fired') {
            GameStore.addLog(sim, `因绩效考核不合格，被公司开除了！`, 'bad');
            sim.addMemory(`失去了 ${oldJobTitle} 的工作，感觉很挫败...`, 'bad');
            sim.say("被炒了... 😭", 'bad');
            sim.addBuff(BUFFS.fired);
            sim.needs.fun -= 50;
        } else if (reason === 'absent') {
            GameStore.addLog(sim, `因连续旷工，被自动辞退。`, 'bad');
            sim.addMemory(`因为太久没去上班，丢掉了工作。`, 'bad');
            sim.say("哎呀，玩脱了...", 'bad');
        }
    },

    // 🆕 每日检测：解雇逻辑
    checkFire(sim: Sim) {
        if (sim.job.id === 'unemployed') return;

        // 1. 绩效过低解雇 (铁饭碗不再铁)
        if (sim.workPerformance < -50) {
            this.fireSim(sim, 'fired');
            return;
        }

        // 2. 连续旷工解雇
        if (sim.consecutiveAbsences && sim.consecutiveAbsences >= 3) {
            this.fireSim(sim, 'absent');
            return;
        }
    },

    // 升职判定
    promote(sim: Sim) {
        // [修改] 晋升逻辑增加对 School 不同轨道的检查
        const nextLevel = JOBS.find(j => {
             if (j.companyType !== sim.job.companyType) return false;
             if (j.level !== sim.job.level + 1) return false;
             
             // 学校内部的特殊晋升轨道检查
             if (sim.job.companyType === JobType.School) {
                 const isChef = sim.job.title.includes('厨');
                 const isSecurity = sim.job.title.includes('保安');
                 const isTeacher = sim.job.title.includes('师') || sim.job.title.includes('教') || sim.job.title.includes('长');
                 
                 const nextIsChef = j.title.includes('厨');
                 const nextIsSecurity = j.title.includes('保安');
                 const nextIsTeacher = j.title.includes('师') || j.title.includes('教') || j.title.includes('长');

                 // 确保不跨界：厨师只能升厨师，保安只能升保安(如果有Lv2的话)，老师只能升老师
                 if (isChef && !nextIsChef) return false;
                 if (isSecurity && !nextIsSecurity) return false;
                 if (isTeacher && !nextIsTeacher) return false;
             }
             
             return true;
        });

        if (!nextLevel) return;

        // 🆕 使用动态容量检测
        const cap = this.getDynamicJobCapacity(nextLevel);
        const currentHolders = GameStore.sims.filter(s => s.job.id === nextLevel.id);
        
        if (currentHolders.length < cap) {
            sim.job = nextLevel;
            sim.money += 1000;
            sim.dailyIncome += 1000; 
            GameStore.addLog(sim, `升职了！现在是 ${nextLevel.title} (Lv.${nextLevel.level})`, 'sys');
            sim.say("升职啦! 🚀", 'act');
            sim.addBuff(BUFFS.promoted);
            sim.addMemory(`因为表现优异，升职为 ${nextLevel.title}！`, 'job');
        } else {
            // 竞争上岗逻辑
            const victim = currentHolders.sort((a, b) => a.workPerformance - b.workPerformance)[0];
            // 挑战者需要比受害者高出一定分数才能上位
            if (sim.workPerformance + sim.mood > victim.workPerformance + victim.mood + 20) {
                const oldJob = sim.job;
                sim.job = nextLevel;
                
                // 受害者降职
                victim.job = oldJob; 
                victim.workPerformance = 0; 
                victim.addBuff(BUFFS.demoted);
                
                sim.money += 1000;
                sim.dailyIncome += 1000;
                sim.addBuff(BUFFS.promoted);
                
                GameStore.addLog(sim, `PK 成功！取代了 ${victim.name} 成为 ${nextLevel.title}`, 'sys');
                sim.say("我赢了! 👑", 'act');
                victim.say("可恶... 😭", 'bad');
                sim.addMemory(`在职场竞争中击败了 ${victim.name}，成功晋升为 ${nextLevel.title}。`, 'job', victim.id);
                victim.addMemory(`在职场竞争中输给了 ${sim.name}，被降职了...`, 'bad', sim.id);
            } else {
                GameStore.addLog(sim, `尝试晋升 ${nextLevel.title} 但职位已满且 PK 失败。`, 'sys');
                // 失败会有挫败感，绩效下降
                sim.workPerformance -= 20; 
                sim.say("竞争太激烈了...", 'bad');
            }
        }
    },

    // 早退逻辑
    leaveWorkEarly(sim: Sim) {
        const currentHour = GameStore.time.hour + GameStore.time.minute / 60;
        let startHour = sim.currentShiftStart || sim.job.startHour;
        const totalDuration = sim.job.endHour - sim.job.startHour;

        let workedDuration = currentHour - startHour;
        if (workedDuration < 0) workedDuration += 24;

        const workRatio = Math.max(0, Math.min(1, workedDuration / totalDuration));
        
        const actualPay = Math.floor(sim.job.salary * workRatio);
        sim.money += actualPay;
        sim.dailyIncome += actualPay;

        sim.hasLeftWorkToday = true;
        sim.target = null;
        sim.interactionTarget = null;
        
        sim.addBuff(BUFFS.stressed);
        sim.needs.fun = Math.max(0, sim.needs.fun - 20);
        
        // 早退扣绩效
        sim.workPerformance -= 10;

        GameStore.addLog(sim, `因精力耗尽早退。实发工资: $${actualPay} (占比 ${(workRatio*100).toFixed(0)}%)`, 'money');
        sim.say("太累了，先溜了... 😓", 'bad');
        sim.changeState(new IdleState());
    },

    // 检查是否需要去上班
    checkSchedule(sim: Sim) {
        if ([AgeStage.Infant, AgeStage.Toddler, AgeStage.Elder].includes(sim.ageStage) || sim.job.id === 'unemployed') return;

        const currentMonth = GameStore.time.month;
        const holiday = HOLIDAYS[currentMonth];
        
        const isVacationMonth = sim.job.vacationMonths?.includes(currentMonth);
        const isPublicHoliday = holiday && (holiday.type === 'traditional' || holiday.type === 'break');

        if (isPublicHoliday || isVacationMonth) return;

        const currentHour = GameStore.time.hour;
        const isWorkTime = currentHour >= sim.job.startHour && currentHour < sim.job.endHour;

        if (isWorkTime) {
            if (sim.hasLeftWorkToday) return;

            if (sim.action === SimAction.Working) return;
            if (sim.action === SimAction.Commuting && sim.interactionTarget?.utility === 'work') return;
            
            sim.isSideHustle = false; 
            sim.currentShiftStart = GameStore.time.hour + GameStore.time.minute / 60;

            // 1. 确定家具搜索关键词
            let searchLabels: string[] = [];
            let searchCategories: string[] = ['work', 'work_group']; 

            if (sim.job.companyType === JobType.Internet) {
                searchLabels = sim.job.level >= 4 ? ['老板椅'] : ['码农工位', '控制台', '服务器组'];
            } else if (sim.job.companyType === JobType.Design) {
                searchLabels = ['画架', '工位椅']; // 扩大范围
                searchCategories.push('paint'); 
            } else if (sim.job.companyType === JobType.Business) {
                searchLabels = sim.job.level >= 4 ? ['老板椅', '红木班台'] : ['商务工位', '会议桌'];
            } else if (sim.job.companyType === JobType.Store) {
                searchLabels = ['服务台', '收银台', '售票处']; 
            } else if (sim.job.companyType === JobType.Restaurant) {
                if (sim.job.title.includes('厨') || sim.job.title === '打杂') {
                    searchLabels = ['后厨', '灶台'];
                } else {
                    searchLabels = ['餐厅前台', '服务员'];
                }
            } else if (sim.job.companyType === JobType.Library) {
                searchLabels = ['管理员', '阅览桌'];
            }
            else if (sim.job.companyType === JobType.School) {
                // [修改] 增加新职位的搜索关键字
                if (sim.job.id === 'teacher_kg' || sim.job.id === 'teacher_kg_intern') searchLabels = ['教师桌', '婴儿床', '滑梯']; 
                else if (sim.job.id === 'teacher_elem' || sim.job.id === 'teacher_high' || sim.job.id === 'teacher_intern') searchLabels = ['黑板', '讲台', '教师桌', '办公桌'];
                else if (sim.job.id === 'principal') searchLabels = ['老板椅', '办公桌', '校长室'];
                else if (sim.job.id === 'teacher_pe') searchLabels = ['篮筐', '旗杆'];
                else if (sim.job.id === 'school_security') searchLabels = ['保安岗'];
                else if (sim.job.id === 'school_chef' || sim.job.id === 'school_chef_helper') searchLabels = ['食堂灶台', '后厨'];
            } 
            else if (sim.job.companyType === JobType.Nightlife) {
                if (sim.job.id === 'dj') searchLabels = ['DJ台'];
                else searchLabels = ['吧台'];
            }

            // 2. 收集全图候选家具
            let candidateFurniture: Furniture[] = [];
            searchCategories.forEach(cat => {
                const list = GameStore.furnitureIndex.get(cat);
                if (list) candidateFurniture = candidateFurniture.concat(list);
            });

            // 补充特殊家具
            if (searchLabels.includes('黑板') || searchLabels.includes('旗杆')) {
                const allF = GameStore.furniture.filter(f => searchLabels.some(l => f.label.includes(l)));
                candidateFurniture = candidateFurniture.concat(allF);
            }

            // 3. 🆕 关键修复：根据 WorkplaceId 过滤家具 (修复全城乱窜)
            if (sim.workplaceId) {
                candidateFurniture = candidateFurniture.filter(f => {
                    // 检查家具ID的前缀是否包含 PlotID (EditorManager 生成家具ID时使用了 `${plotId}_${furnId}`)
                    // 或者检查 spatial 位置 (这里用ID前缀最快)
                    return f.id.startsWith(sim.workplaceId!);
                });
            }

            const validDesks = candidateFurniture.filter(f => searchLabels.some(l => f.label.includes(l)));

            if (validDesks.length > 0) {
                // 只要找到了工位，就视为去上班了，重置连续旷工
                sim.consecutiveAbsences = 0;

                const desk = validDesks[Math.floor(Math.random() * validDesks.length)];
                let targetX = desk.x + desk.w / 2;
                let targetY = desk.y + desk.h / 2;
                targetX += (Math.random() - 0.5) * 15;
                targetY += (Math.random() - 0.5) * 15;

                sim.target = { x: targetX, y: targetY };
                sim.interactionTarget = { ...desk, utility: 'work' };
                sim.commuteTimer = 0;
                sim.changeState(new CommutingState());
                sim.say("去上班 💼", 'act');
            } else {
                // 没找到工位
                if (sim.workplaceId) {
                    // 如果有单位但没工位，去单位门口罚站 (虚拟上班)
                    const plot = GameStore.worldLayout.find(p => p.id === sim.workplaceId);
                    if (plot) {
                        sim.consecutiveAbsences = 0; // 虽然没椅子，但人到了
                        const randomSpot = { 
                            x: plot.x + (plot.width||300)/2 + (Math.random()-0.5)*50, 
                            y: plot.y + (plot.height||300)/2 + (Math.random()-0.5)*50 
                        };
                        sim.target = randomSpot;
                        sim.interactionTarget = { id: `virtual_work_${sim.id}`, utility: 'work', label: '站立办公', type: 'virtual' };
                        sim.commuteTimer = 0;
                        sim.changeState(new CommutingState());
                        sim.say("没抢到工位... 💼", 'bad');
                    } else {
                        // 单位都没了？
                        sim.say("公司倒闭了？", 'sys');
                    }
                } else {
                    // 彻底找不到，算旷工
                    if (!sim.hasLeftWorkToday) { // 防止重复触发
                        sim.consecutiveAbsences = (sim.consecutiveAbsences || 0) + 1;
                        sim.hasLeftWorkToday = true; // 标记今天已“结束”
                        sim.say("找不到地方上班...", 'bad');
                    }
                }
            }
        } 
        else {
            // 下班逻辑
            sim.hasLeftWorkToday = false;

            if (sim.action === SimAction.Working || sim.action === SimAction.Commuting) {
                 if (sim.action === SimAction.Commuting && sim.interactionTarget?.utility !== 'work') return;

                sim.target = null;
                sim.interactionTarget = null;
                sim.path = [];
                
                sim.money += sim.job.salary;
                sim.dailyIncome += sim.job.salary;
                sim.say(`下班! +$${sim.job.salary}`, 'money');
                sim.addBuff(BUFFS.stressed);

                // 🆕 修复：绩效有增有减 (Iron Rice Bowl Fix)
                let dailyPerf = 0; 
                
                // 基础表现基于属性
                if (sim.job.companyType === JobType.Internet) { if (sim.iq > 70) dailyPerf += 3; if (sim.skills.logic > 50) dailyPerf += 2; } 
                else if (sim.job.companyType === JobType.Design) { if (sim.creativity > 70) dailyPerf += 3; if (sim.skills.creativity > 50) dailyPerf += 2; } 
                else if (sim.job.companyType === JobType.Business) { if (sim.eq > 70) dailyPerf += 3; if (sim.appearanceScore > 70) dailyPerf += 2; } 
                else if (sim.job.companyType === JobType.Restaurant) { if (sim.constitution > 70) dailyPerf += 3; if (sim.skills.cooking > 50) dailyPerf += 2; }

                // 心情影响
                if (sim.mood > 80) dailyPerf += 5;
                else if (sim.mood < 40) dailyPerf -= 5; // 心情差扣分
                else if (sim.mood < 20) dailyPerf -= 10;

                // 状态影响
                if (sim.hasBuff('stressed')) dailyPerf -= 2;
                if (sim.hasBuff('well_rested')) dailyPerf += 2;

                // 随机波动
                dailyPerf += Math.floor(Math.random() * 10) - 4; // -4 ~ +5

                sim.workPerformance += dailyPerf;
                // 限制范围 -100 ~ 100 (或更高)
                sim.workPerformance = Math.max(-100, Math.min(200, sim.workPerformance));

                // 升职检查
                if (sim.workPerformance > 100 && sim.job.level < 4) {
                    this.promote(sim);
                    sim.workPerformance = 50; // 升职后绩效重置一部分
                }
                
                sim.changeState(new IdleState());
            }
        }
    }
};