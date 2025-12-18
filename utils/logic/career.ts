import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { JOBS, BUFFS, HOLIDAYS } from '../../constants';
import { Furniture, JobType, SimAction, AgeStage, Job } from '../../types';
import { CommutingState, IdleState } from './SimStates';
import { SocialLogic } from './social';

// 🆕 全职业适应性评分标准 (Job Preferences)
const JOB_PREFERENCES: Record<JobType, (sim: Sim) => number> = {
    [JobType.Unemployed]: () => -9999,

    [JobType.Internet]: (sim) => {
        let s = sim.iq * 0.6 + sim.skills.logic * 3;
        if (sim.mbti.includes('T')) s += 20;
        if (sim.mbti.includes('N')) s += 10;
        if (sim.lifeGoal.includes('黑客') || sim.lifeGoal.includes('大牛') || sim.lifeGoal.includes('富翁')) s += 50;
        return s;
    },
    [JobType.Design]: (sim) => {
        let s = sim.creativity * 0.6 + (sim.skills.creativity || 0) * 3;
        if (sim.mbti.includes('P')) s += 15;
        if (sim.mbti.includes('N')) s += 15;
        if (sim.lifeGoal.includes('艺术') || sim.lifeGoal.includes('设计')) s += 50;
        return s;
    },
    [JobType.Business]: (sim) => {
        let s = sim.eq * 0.5 + sim.appearanceScore * 0.4;
        if (sim.mbti.includes('E') && sim.mbti.includes('J')) s += 30;
        if (sim.lifeGoal.includes('富翁') || sim.lifeGoal.includes('大亨') || sim.lifeGoal.includes('领袖')) s += 50;
        return s;
    },
    [JobType.Store]: (sim) => {
        let s = sim.eq * 0.3 + sim.constitution * 0.3 + 30; 
        if (sim.ageStage === AgeStage.Teen) s += 20;
        return s;
    },
    [JobType.Restaurant]: (sim) => {
        let s = sim.skills.cooking * 4 + sim.constitution * 0.5;
        if (sim.lifeGoal.includes('美食') || sim.lifeGoal.includes('主厨')) s += 60;
        return s;
    },
    [JobType.Library]: (sim) => {
        let s = sim.iq * 0.4;
        if (sim.mbti.includes('I')) s += 40;
        if (sim.lifeGoal.includes('博学') || sim.lifeGoal.includes('岁月静好')) s += 40;
        return s;
    },
    [JobType.School]: (sim) => {
        let s = sim.iq * 0.3 + sim.eq * 0.3;
        if (sim.mbti.includes('S') && sim.mbti.includes('J')) s += 25;
        if (sim.lifeGoal.includes('家庭') || sim.lifeGoal.includes('桃李') || sim.lifeGoal.includes('岁月静好')) s += 50;
        return s;
    },
    [JobType.Nightlife]: (sim) => {
        let s = (sim.skills.music || 0) * 2 + (sim.skills.dancing || 0) * 2 + sim.appearanceScore * 0.5;
        if (sim.mbti.includes('E') && sim.mbti.includes('P')) s += 40;
        if (sim.lifeGoal.includes('派对') || sim.lifeGoal.includes('万人迷')) s += 60;
        return s;
    },
    [JobType.Hospital]: (sim) => {
        let s = sim.iq * 0.5 + sim.constitution * 0.4;
        if (sim.mbti.includes('J')) s += 20;
        if (sim.traits.includes('洁癖')) s += 15;
        if (sim.lifeGoal.includes('大牛') || sim.lifeGoal.includes('救死扶伤')) s += 40;
        return s;
    },
    [JobType.ElderCare]: (sim) => {
        let s = sim.constitution * 0.6 + sim.eq * 0.4;
        if (sim.mbti.includes('F')) s += 30;
        if (sim.traits.includes('善良') || sim.traits.includes('热心')) s += 30;
        return s;
    }
};

export const CareerLogic = {
    getDynamicJobCapacity(job: Job): number {
        if (job.level >= 4) return 1;
        return 20; 
    },

    assignJob(sim: Sim) {
        const scores: { type: JobType, score: number }[] = [];
        
        (Object.keys(JOB_PREFERENCES) as JobType[]).forEach(type => {
            if (type === JobType.Unemployed) return;
            const calculateScore = JOB_PREFERENCES[type];
            let score = calculateScore(sim);
            score += Math.random() * 15; 
            scores.push({ type, score });
        });

        scores.sort((a, b) => b.score - a.score);

        let assignedJob: Job | undefined = undefined;

        for (const candidate of scores) {
            const jobType = candidate.type;
            const validJobs = JOBS.filter(j => {
                if (j.companyType !== jobType) return false;
                const cap = this.getDynamicJobCapacity(j);
                const currentCount = GameStore.sims.filter(s => s.job.id === j.id).length;
                return currentCount < cap;
            });

            if (validJobs.length > 0) {
                const weightedPool: Job[] = [];
                validJobs.forEach(job => {
                    let weight = 10;
                    if (job.level === 2) weight = 5;
                    if (job.level >= 3) weight = 1;
                    for(let k=0; k<weight; k++) weightedPool.push(job);
                });
                assignedJob = weightedPool[Math.floor(Math.random() * weightedPool.length)];
                break; 
            }
        }

        if (!assignedJob) {
            assignedJob = JOBS.find(j => j.id === 'unemployed');
            sim.say("找不到合适的工作...", 'bad');
        } else {
            if (scores[0].type === assignedJob.companyType) {
                sim.addBuff(BUFFS.promoted); 
                sim.say("这是我的梦想职业！", 'act');
            } else {
                sim.say("先干着这份工吧...", 'normal');
            }
        }

        sim.job = assignedJob!;
        
        if (sim.job.id !== 'unemployed') {
            this.bindWorkplace(sim);
        } else {
            sim.workplaceId = undefined;
        }

        const isJ = sim.mbti.includes('J');
        const basePre = isJ ? 60 : 30;
        const variance = Math.random() * 30;
        sim.commutePreTime = Math.floor(isJ ? basePre + variance : basePre - variance);
        
        if (sim.traits.includes('懒惰')) sim.commutePreTime = 5;
        if (sim.traits.includes('洁癖')) sim.commutePreTime += 20;
    },

    bindWorkplace(sim: Sim) {
        let targetPlotTemplateId = 'work';
        let customNameKeyword = '';

        switch (sim.job.companyType) {
            case JobType.School:
                if (sim.job.id.includes('high')) targetPlotTemplateId = 'high_school';
                else if (sim.job.id.includes('elem')) targetPlotTemplateId = 'elementary';
                else targetPlotTemplateId = 'kindergarten';
                break;
            case JobType.Hospital:
                targetPlotTemplateId = 'hospital_l';
                break;
            case JobType.ElderCare:
                targetPlotTemplateId = 'any'; 
                customNameKeyword = '养老';
                break;
            case JobType.Nightlife:
                targetPlotTemplateId = 'any';
                customNameKeyword = '夜'; 
                break;
            case JobType.Restaurant:
            case JobType.Store:
                targetPlotTemplateId = 'any'; 
                break;
            default:
                targetPlotTemplateId = 'work'; 
                break;
        }

        const potentialWorkplaces = GameStore.worldLayout.filter(p => {
            if (targetPlotTemplateId !== 'any' && targetPlotTemplateId !== 'work') {
                return p.templateId === targetPlotTemplateId;
            }
            if (customNameKeyword && p.customName && p.customName.includes(customNameKeyword)) {
                return true;
            }
            if (targetPlotTemplateId === 'work' || (sim.job.companyType === JobType.Store)) {
                if (sim.job.companyType === JobType.Internet || sim.job.companyType === JobType.Design || sim.job.companyType === JobType.Business) {
                    return p.customType === 'work';
                }
                return p.customType === 'commercial';
            }
            return false;
        });

        if (potentialWorkplaces.length > 0) {
            const workplace = potentialWorkplaces[Math.floor(Math.random() * potentialWorkplaces.length)];
            sim.workplaceId = workplace.id;
            this.updateColleagues(sim, workplace.id);
        } else {
            sim.workplaceId = undefined;
        }
    },

    updateColleagues(sim: Sim, workplaceId: string) {
        GameStore.sims.forEach(other => {
            if (other.id !== sim.id && other.workplaceId === workplaceId) {
                if (!sim.relationships[other.id]) SocialLogic.updateRelationship(sim, other, 'friendship', 0);
                if (!other.relationships[sim.id]) SocialLogic.updateRelationship(other, sim, 'friendship', 0);
                
                sim.relationships[other.id].isColleague = true;
                other.relationships[sim.id].isColleague = true;
            }
        });
    },

    checkSchedule(sim: Sim) {
        if ([AgeStage.Infant, AgeStage.Toddler, AgeStage.Elder].includes(sim.ageStage) || sim.job.id === 'unemployed') return;

        const currentMonth = GameStore.time.month;
        const holiday = HOLIDAYS[currentMonth];
        const isVacationMonth = sim.job.vacationMonths?.includes(currentMonth);
        const isPublicHoliday = holiday && (holiday.type === 'traditional' || holiday.type === 'break');

        if (isPublicHoliday || isVacationMonth) return;

        const currentHour = GameStore.time.hour + GameStore.time.minute / 60;
        const jobStart = sim.job.startHour;
        const jobEnd = sim.job.endHour;

        const preTimeHours = (sim.commutePreTime || 30) / 60;
        let commuteStart = jobStart - preTimeHours;
        
        let isWorkTime = false;
        if (jobStart < jobEnd) {
            isWorkTime = currentHour >= commuteStart && currentHour < jobEnd;
        } else {
            isWorkTime = currentHour >= commuteStart || currentHour < jobEnd;
        }

        if (isWorkTime) {
            if (sim.hasLeftWorkToday) return;

            if (sim.action === SimAction.Working || sim.action === SimAction.Commuting) return;

            sim.isSideHustle = false;
            sim.consecutiveAbsences = 0; 
            sim.changeState(new CommutingState()); 
            sim.say("去上班... 💼", 'act');
        } 
        else {
            if (sim.action === SimAction.Working) {
                this.offWork(sim);
            }
        }
    },

    offWork(sim: Sim) {
        sim.hasLeftWorkToday = false;
        sim.lastPunchInTime = undefined;

        sim.target = null;
        sim.interactionTarget = null;
        sim.path = [];
        
        sim.money += sim.job.salary;
        sim.dailyIncome += sim.job.salary;
        sim.say(`下班! +$${sim.job.salary}`, 'money');
        sim.addBuff(BUFFS.stressed);

        this.updatePerformance(sim);

        sim.changeState(new IdleState());
    },

    updatePerformance(sim: Sim) {
        let dailyPerf = 0;
        
        if (sim.job.companyType === JobType.Internet && sim.iq > 70) dailyPerf += 3;
        if (sim.job.companyType === JobType.Business && sim.eq > 70) dailyPerf += 3;
        if (sim.job.companyType === JobType.Hospital && sim.constitution > 70) dailyPerf += 3;
        
        if (sim.mood > 80) dailyPerf += 5;
        else if (sim.mood < 40) dailyPerf -= 5;

        dailyPerf += Math.floor(Math.random() * 10) - 4; 

        sim.workPerformance += dailyPerf;
        sim.workPerformance = Math.max(-100, Math.min(200, sim.workPerformance));

        if (sim.workPerformance > 100 && sim.job.level < 4) {
            this.promote(sim);
            sim.workPerformance = 50; 
        }
    },

    promote(sim: Sim) {
        const nextLevel = JOBS.find(j => {
             if (j.companyType !== sim.job.companyType) return false;
             if (j.level !== sim.job.level + 1) return false;
             
             if (sim.job.companyType === JobType.School || sim.job.companyType === JobType.Hospital) {
                 const kw = sim.job.title.substring(0, 1); 
                 if (!j.title.includes(kw)) return false; 
             }
             return true;
        });

        if (!nextLevel) return;

        const cap = this.getDynamicJobCapacity(nextLevel);
        const currentHolders = GameStore.sims.filter(s => s.job.id === nextLevel.id);
        
        if (currentHolders.length < cap) {
            sim.job = nextLevel;
            sim.money += 1000;
            GameStore.addLog(sim, `升职了！现在是 ${nextLevel.title}`, 'sys');
            sim.say("升职啦! 🚀", 'act');
            sim.addBuff(BUFFS.promoted);
        } else {
            const victim = currentHolders.sort((a, b) => a.workPerformance - b.workPerformance)[0];
            if (sim.workPerformance > victim.workPerformance + 20) {
                const oldJob = sim.job;
                sim.job = nextLevel;
                victim.job = oldJob; 
                victim.addBuff(BUFFS.demoted);
                GameStore.addLog(sim, `PK 成功！取代 ${victim.name} 晋升。`, 'sys');
            }
        }
    },

    leaveWorkEarly(sim: Sim) {
        const currentHour = GameStore.time.hour + GameStore.time.minute / 60;
        let startHour = sim.lastPunchInTime || sim.job.startHour;
        const totalDuration = sim.job.endHour - sim.job.startHour;
        let workedDuration = currentHour - startHour;
        if (workedDuration < 0) workedDuration += 24;

        const workRatio = Math.max(0, Math.min(1, workedDuration / totalDuration));
        const actualPay = Math.floor(sim.job.salary * workRatio);
        
        sim.money += actualPay;
        sim.hasLeftWorkToday = true;
        
        sim.workPerformance -= 15;
        
        sim.target = null;
        sim.interactionTarget = null;
        sim.say("早退... 😓", 'bad');
        sim.changeState(new IdleState());
    },

    // ✅ [修复] 补回了这个方法
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

    checkFire(sim: Sim) {
        if (sim.job.id === 'unemployed') return;

        if (sim.workPerformance < -60) {
            this.fireSim(sim, 'fired');
        } else if (sim.consecutiveAbsences >= 3) {
            this.fireSim(sim, 'absent');
        }
    },

    fireSim(sim: Sim, reason: 'resign' | 'fired' | 'absent') {
        const oldTitle = sim.job.title;
        sim.job = JOBS.find(j => j.id === 'unemployed')!;
        sim.workplaceId = undefined;
        sim.workPerformance = 0;
        sim.consecutiveAbsences = 0; // 重置旷工计数
        
        if (reason === 'fired') {
            GameStore.addLog(sim, `被公司开除了 (${oldTitle})`, 'bad');
            sim.addBuff(BUFFS.fired);
        } else if (reason === 'absent') {
            GameStore.addLog(sim, `因旷工被辞退`, 'bad');
        } else if (reason === 'resign') {
            GameStore.addLog(sim, `辞去了 ${oldTitle} 的工作`, 'sys');
            sim.addBuff(BUFFS.well_rested);
        }
    }
};