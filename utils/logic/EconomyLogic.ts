import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { ITEMS, BUFFS } from '../../constants';
import { SocialLogic } from './social';
import { DecisionLogic } from './decision';
import { CareerLogic } from './career';

export const EconomyLogic = {
    calculateDailyBudget(sim: Sim) {
        if (['Infant', 'Toddler', 'Child', 'Teen'].includes(sim.ageStage)) {
            sim.dailyBudget = 0;
            return;
        }

        let safetyPercent = 0.2;
        const isEarth = sim.zodiac.element === 'earth';
        const isFire = sim.zodiac.element === 'fire';
        const isJ = sim.mbti.includes('J');

        if (isEarth || isJ) safetyPercent = 0.4;
        if (isFire || !isJ) safetyPercent = 0.1;

        const safetyMargin = sim.money * safetyPercent;
        let disposable = Math.max(0, sim.money - safetyMargin);

        let propensity = 0.2;
        if (sim.hasBuff('rich_feel')) propensity = 0.5;
        if (sim.hasBuff('shopping_spree')) propensity = 0.8; 
        if (sim.hasBuff('stressed')) propensity = 0.4;

        sim.dailyBudget = Math.floor(disposable * propensity);
    },

    checkSpending(sim: Sim) {
        if (sim.action !== 'wandering' && sim.action !== 'idle') {
            return;
        }
        if (sim.money <= 0) return;

        if (sim.money < 100) {
            if (!sim.hasBuff('broke') && !sim.hasBuff('anxious')) {
                sim.addBuff(BUFFS.broke);
                sim.addBuff(BUFFS.anxious);
            }
            return;
        }

        const affordable = ITEMS.filter(item => item.cost <= sim.dailyBudget && item.cost <= sim.money);
        let bestItem: any = null;
        let maxScore = 0;

        affordable.forEach(item => {
            let score = 0;
            if (item.needs) {
                if (item.needs.hunger && sim.needs.hunger < 60) score += item.needs.hunger * 2;
                if (item.needs.fun && sim.needs.fun < 60) score += item.needs.fun * 2;
                if (item.needs.energy && sim.needs.energy < 50 && item.needs.energy > 0) score += 20;
            }
            if (item.id === 'museum_ticket' && (sim.mbti.includes('N') || sim.skills.creativity > 20)) {
                score += 40;
            }
            
            if (item.skill) {
                if (sim.lifeGoal.includes('博学') || sim.lifeGoal.includes('富翁')) score += 30;
                if (sim.mbti.includes('N') && item.skill === 'logic') score += 20;
                if (sim.zodiac.element === 'fire' && item.skill === 'athletics') score += 20;
            }

            if (item.attribute) {
                const currentVal = (sim as any)[item.attribute] || 0;
                if (currentVal < 40) score += 30;

                if (item.attribute === 'iq' && sim.job.companyType === 'internet') score += 40;
                if (item.attribute === 'creativity' && sim.job.companyType === 'design') score += 40;
                if ((item.attribute === 'appearanceScore' || item.attribute === 'eq') && sim.job.companyType === 'business') score += 40;
                if (item.attribute === 'constitution' && sim.job.companyType === 'restaurant') score += 30;

                if (sim.lifeGoal.includes('万人迷') && item.attribute === 'appearanceScore') score += 50;
                if (sim.lifeGoal.includes('大牛') && item.attribute === 'iq') score += 50;
                if (sim.lifeGoal.includes('健身') && item.attribute === 'constitution') score += 50;
            }

            if (sim.hasBuff('shopping_spree')) {
                score += 50; 
                if (item.cost > 100) score += 30; 
            }

            if (item.trigger === 'rich_hungry' && sim.money > 5000) score += 50;
            if (item.trigger === 'addicted' && sim.mbti.includes('P') && sim.needs.fun < 30) score += 100;
            if (item.trigger === 'love' && sim.hasBuff('in_love')) score += 80;
            if (item.trigger === 'beauty' && sim.appearanceScore < 50) score += 30; 

            score += Math.random() * 20;

            if (score > 50 && score > maxScore) {
                maxScore = score;
                bestItem = item;
            }
        });

        if (bestItem) {
            EconomyLogic.buyItem(sim, bestItem);
        }
        
        CareerLogic.checkCareerSatisfaction(sim);
    },

    buyItem(sim: Sim, item: any) {
        sim.money -= item.cost;
        sim.dailyExpense += item.cost;
        sim.dailyBudget -= item.cost;

        if (item.needs) {
            for (let k in item.needs) {
                if (sim.needs[k] !== undefined) sim.needs[k] = Math.min(100, sim.needs[k] + item.needs[k]);
            }
        }

        if (item.skill) {
            let val = item.skillVal || 5;
            sim.skills[item.skill] = Math.min(100, sim.skills[item.skill] + val);
            sim.say("📚 涨知识", 'act');
        }

        if (item.attribute) {
            let val = item.attrVal || 2;
            const current = (sim as any)[item.attribute] || 0;
            (sim as any)[item.attribute] = Math.min(100, current + val);
            
            let emoji = '✨';
            if (item.attribute === 'appearanceScore') emoji = '💅';
            if (item.attribute === 'constitution') emoji = '💪';
            if (item.attribute === 'iq') emoji = '🧠';
            
            sim.say(`${emoji} 提升!`, 'act');
        }

        if (item.buff) sim.addBuff(BUFFS[item.buff as keyof typeof BUFFS]);

        if (item.id === 'museum_ticket') {
             sim.say("买票去看展 🎨", 'act');
             sim.addBuff(BUFFS.art_inspired);
             DecisionLogic.findObject(sim, 'art'); 
        }

        let logSuffix = "";
        if (item.rel) {
            const loverId = Object.keys(sim.relationships).find(id => sim.relationships[id].isLover);
            if (loverId) {
                const lover = GameStore.sims.find(s => s.id === loverId);
                if (lover) {
                    let relBonus = 15;
                    if (lover.lifeGoal.includes('富翁')) relBonus += 10;
                    
                    SocialLogic.updateRelationship(lover, sim, 'romance', relBonus);
                    lover.needs.fun = Math.min(100, lover.needs.fun + 20);
                    logSuffix = ` (送给 ${lover.name})`;
                    sim.addMemory(`给 ${lover.name} 买了 ${item.label}，希望Ta喜欢。`, 'social', lover.id);
                }
            }
        }

        if (item.id !== 'museum_ticket') sim.say(`💸 ${item.label}`, 'act');
        GameStore.addLog(sim, `购买了 ${item.label} -$${item.cost}${logSuffix}`, 'money');
    },

    payRent(sim: Sim) {
        if (!sim.homeId) return; 
        if (sim.ageStage === 'Infant' || sim.ageStage === 'Toddler' || sim.ageStage === 'Child') return;

        const home = GameStore.housingUnits.find(u => u.id === sim.homeId);
        if (!home) return;

        const adultRoommates = GameStore.sims.filter(s => s.homeId === sim.homeId && !['Infant', 'Toddler', 'Child'].includes(s.ageStage));
        const share = Math.ceil(home.cost / (adultRoommates.length || 1));

        if (sim.money >= share) {
            sim.money -= share;
            sim.dailyExpense += share;
        } else {
            sim.addBuff(BUFFS.broke);
            sim.say("房租要交不起了...", 'bad');
        }
    },

    earnMoney(sim: Sim, amount: number, source: string) {
        const earned = Math.floor(amount);
        sim.money += earned;
        sim.dailyIncome += earned; 
        GameStore.addLog(sim, `通过 ${source} 赚了 $${earned}`, 'money');
        sim.say(`赚到了! +$${earned}`, 'money');
        sim.addBuff(BUFFS.side_hustle_win);
    }
};