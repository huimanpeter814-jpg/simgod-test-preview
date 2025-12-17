import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { JOBS, BUFFS, HOLIDAYS } from '../../constants';
import { getJobCapacity } from '../simulationHelpers';
import { Furniture, JobType, SimAction, AgeStage } from '../../types';
import { CommutingState, IdleState } from './SimStates';

export const CareerLogic = {
    // 初始工作指派
    assignJob(sim: Sim) {
        let preferredType = '';
        if (sim.lifeGoal.includes('富翁') || sim.mbti.includes('T')) preferredType = JobType.Internet;
        else if (sim.lifeGoal.includes('博学') || sim.mbti.includes('N')) preferredType = JobType.Design;
        else if (sim.mbti.includes('E')) preferredType = JobType.Business;
        else preferredType = Math.random() > 0.5 ? JobType.Store : JobType.Restaurant;

        const validJobs = JOBS.filter(j => {
            if (j.id === 'unemployed') return true;
            if (j.level !== 1) return false; 
            if (preferredType && j.companyType !== preferredType) return false;
            
            const capacity = getJobCapacity(j);
            const currentCount = GameStore.sims.filter(s => s.job.id === j.id).length;
            return currentCount < capacity;
        });

        let finalJobChoice = validJobs.length > 0 ? validJobs[Math.floor(Math.random() * validJobs.length)] : undefined;
        if (!finalJobChoice) finalJobChoice = JOBS.find(j => j.id === 'unemployed')!;
        sim.job = finalJobChoice!;
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
            GameStore.addLog(sim, `决定辞职... "这工作不适合我"`, 'sys');
            sim.addMemory(`辞去了 ${sim.job.title} 的工作，想要休息一段时间。`, 'job');
            
            sim.job = JOBS.find(j => j.id === 'unemployed')!;
            sim.workPerformance = 0;
            sim.say("我不干了! 💢", 'bad');
            sim.addBuff(BUFFS.well_rested);
        }
    },

    // 升职判定
    promote(sim: Sim) {
        const nextLevel = JOBS.find(j => j.companyType === sim.job.companyType && j.level === sim.job.level + 1);
        if (!nextLevel) return;

        const cap = getJobCapacity(nextLevel);
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
            if (sim.workPerformance + sim.mood > victim.workPerformance + victim.mood) {
                const oldJob = sim.job;
                sim.job = nextLevel;
                victim.job = oldJob; 
                victim.workPerformance = 0; 
                sim.money += 1000;
                sim.dailyIncome += 1000;
                sim.addBuff(BUFFS.promoted);
                victim.addBuff(BUFFS.demoted);
                GameStore.addLog(sim, `PK 成功！取代了 ${victim.name} 成为 ${nextLevel.title}`, 'sys');
                sim.say("我赢了! 👑", 'act');
                victim.say("可恶... 😭", 'bad');
                sim.addMemory(`在职场竞争中击败了 ${victim.name}，成功晋升为 ${nextLevel.title}。`, 'job', victim.id);
                victim.addMemory(`在职场竞争中输给了 ${sim.name}，被降职了...`, 'bad', sim.id);
            } else {
                GameStore.addLog(sim, `尝试晋升 ${nextLevel.title} 但 PK 失败了。`, 'sys');
                sim.workPerformance -= 100; 
                sim.say("还需要努力...", 'bad');
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

            let searchLabels: string[] = [];
            let searchCategories: string[] = ['work', 'work_group']; 

            // 查找合适的工位 (省略详细查找逻辑，保持原样)
            if (sim.job.companyType === JobType.Internet) {
                searchLabels = sim.job.level >= 4 ? ['老板椅'] : ['码农工位', '控制台'];
            } else if (sim.job.companyType === JobType.Design) {
                searchLabels = ['画架'];
                searchCategories.push('paint'); 
            } else if (sim.job.companyType === JobType.Business) {
                searchLabels = sim.job.level >= 4 ? ['老板椅'] : ['商务工位'];
            } else if (sim.job.companyType === JobType.Store) {
                searchLabels = ['服务台', '影院服务台', '售票处']; 
            } else if (sim.job.companyType === JobType.Restaurant) {
                if (sim.job.title.includes('厨') || sim.job.title === '打杂') {
                    searchLabels = ['后厨', '灶台'];
                } else {
                    searchLabels = ['餐厅前台'];
                }
            } else if (sim.job.companyType === JobType.Library) {
                searchLabels = ['管理员'];
            }
            else if (sim.job.companyType === JobType.School) {
                if (sim.job.id === 'teacher_kg') searchLabels = ['教师桌', '婴儿床', '滑梯'];
                else if (sim.job.id === 'teacher_elem' || sim.job.id === 'teacher_high') searchLabels = ['黑板'];
                else if (sim.job.id === 'teacher_pe') searchLabels = ['篮筐', '旗杆'];
                else if (sim.job.id === 'school_security') searchLabels = ['保安岗'];
                else if (sim.job.id === 'school_chef') searchLabels = ['食堂灶台', '后厨'];
            } 
            else if (sim.job.companyType === JobType.Nightlife) {
                if (sim.job.id === 'dj') searchLabels = ['DJ台'];
            }

            let candidateFurniture: Furniture[] = [];
            searchCategories.forEach(cat => {
                const list = GameStore.furnitureIndex.get(cat);
                if (list) candidateFurniture = candidateFurniture.concat(list);
            });

            if (searchLabels.includes('黑板') || searchLabels.includes('旗杆')) {
                const allF = GameStore.furniture.filter(f => searchLabels.some(l => f.label.includes(l)));
                candidateFurniture = candidateFurniture.concat(allF);
            }

            const validDesks = candidateFurniture.filter(f => searchLabels.some(l => f.label.includes(l)));

            if (validDesks.length > 0) {
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
                // 虚拟上班
                const randomSpot = { x: 100 + Math.random()*200, y: 100 + Math.random()*200 };
                sim.target = randomSpot;
                sim.interactionTarget = { id: `virtual_work_${sim.id}`, utility: 'work', label: '站立办公', type: 'virtual' };
                sim.commuteTimer = 0;
                sim.changeState(new CommutingState());
                sim.say("站着上班 💼", 'bad');
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

                let dailyPerf = 5; 
                if (sim.job.companyType === JobType.Internet) { if (sim.iq > 70) dailyPerf += 5; if (sim.skills.logic > 50) dailyPerf += 3; } 
                else if (sim.job.companyType === JobType.Design) { if (sim.creativity > 70) dailyPerf += 5; if (sim.skills.creativity > 50) dailyPerf += 3; } 
                else if (sim.job.companyType === JobType.Business) { if (sim.eq > 70) dailyPerf += 5; if (sim.appearanceScore > 70) dailyPerf += 3; } 
                else if (sim.job.companyType === JobType.Restaurant) { if (sim.constitution > 70) dailyPerf += 5; if (sim.skills.cooking > 50) dailyPerf += 3; }

                if (sim.mood > 80) dailyPerf += 2;
                sim.workPerformance += dailyPerf;

                if (sim.workPerformance > 500 && sim.job.level < 4) {
                    CareerLogic.promote(sim);
                    sim.workPerformance = 100;
                }
                
                sim.changeState(new IdleState());
            }
        }
    }
};