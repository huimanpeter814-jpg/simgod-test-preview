import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { CONFIG, FURNITURE } from '../../constants';
import { minutes } from '../simulationHelpers';
import { Furniture } from '../../types';


export const DecisionLogic = {
    decideAction(sim: Sim) {
        // 1. 检查紧急需求 (< 40)
        let critical = [
            { id: 'energy', val: sim.needs.energy },
            { id: 'hunger', val: sim.needs.hunger },
            { id: 'bladder', val: sim.needs.bladder },
            { id: 'hygiene', val: sim.needs.hygiene }
        ].filter(n => n.val < 40);

        if (critical.length > 0) {
            critical.sort((a, b) => a.val - b.val);
            DecisionLogic.findObject(sim, critical[0].id);
            return;
        }

        // 2. 计算各需求评分
        let scores = [
            { id: 'energy', score: (100 - sim.needs.energy) * 3.0, type: 'obj' },
            { id: 'hunger', score: (100 - sim.needs.hunger) * 2.5, type: 'obj' },
            { id: 'bladder', score: (100 - sim.needs.bladder) * 2.8, type: 'obj' },
            { id: 'hygiene', score: (100 - sim.needs.hygiene) * 1.5, type: 'obj' },
            { id: 'fun', score: (100 - sim.needs.fun) * 1.2, type: 'fun' },
        ];

        // [新增] 复杂的社交需求权重计算
        // 基础分：需求缺口
        let socialScore = (100 - sim.needs.social) * 1.5;

        // MBTI 修正：E人更容易发起社交，I人较被动
        if (sim.mbti.startsWith('E')) socialScore *= 1.4;
        else if (sim.mbti.startsWith('I')) socialScore *= 0.8;

        // 星座修正：风象(Air)和火象(Fire)更主动
        if (['air', 'fire'].includes(sim.zodiac.element)) socialScore *= 1.2;

        // [新增] 属性修正：魅力和情商高的人更喜欢社交
        if (sim.appearanceScore > 70) socialScore *= 1.2; // 颜值高更自信
        if (sim.eq > 70) socialScore *= 1.3; // 情商高更擅长

        // 人生目标修正
        if (['万人迷', '派对之王', '交际花', '政坛领袖'].some(g => sim.lifeGoal.includes(g))) {
            socialScore *= 1.5; 
        } else if (['隐居', '独处', '黑客', '作家'].some(g => sim.lifeGoal.includes(g))) {
            socialScore *= 0.6; 
        }

        // 心情修正
        if (sim.mood < 30) socialScore *= 0.3;

        scores.push({ id: 'social', score: socialScore, type: 'social' });


        // [核心逻辑] 只有无业游民(自由职业)才会尝试赚钱 (Side Hustle)
        if (sim.job.id === 'unemployed') {
            let moneyDesire = 0;
            if (sim.money < 500) moneyDesire = 200; 
            else if (sim.money < 2000) moneyDesire = 100;
            else if (sim.lifeGoal.includes('富翁')) moneyDesire = 80;
            
            if (sim.skills.coding > 10) moneyDesire += sim.skills.coding;
            if (sim.skills.fishing > 10) moneyDesire += sim.skills.fishing;
            if (sim.skills.creativity > 10) moneyDesire += sim.skills.creativity;

            if (moneyDesire > 0) {
                scores.push({ id: 'side_hustle', score: moneyDesire, type: 'work' });
            }
        }

        // 技能练习加分
        for (let skillKey in sim.skills) {
            let talent = sim.skillModifiers[skillKey] || 1;
            let skillScore = (100 - sim.needs.fun) * 0.5 * talent;
            scores.push({ id: `skill_${skillKey}`, score: skillScore, type: 'obj' });
        }

        // 特殊活动加分
        if (sim.needs.fun < 50 && sim.money > 100) {
            scores.push({ id: 'cinema_3d', score: 90, type: 'obj' });
            
            // [新增] 高体质的人更喜欢去健身房
            let gymScore = 60;
            if (sim.constitution > 70) gymScore += 30;
            scores.push({ id: 'gym_run', score: gymScore, type: 'obj' });
        }
        
        // [新增] 艺术爱好者/高智商加分
        if (sim.needs.fun < 70) {
             let artScore = 85;
             // 高智商或高创意的人更喜欢去美术馆/看书
             if (sim.mbti.includes('N') || sim.skills.creativity > 20 || sim.iq > 70) artScore += 30;
             scores.push({ id: 'art', score: artScore, type: 'obj' });
        }
        
        // 孩子气或心情不好加分 (去游乐场)
        if (sim.needs.fun < 60 && (sim.mbti.includes('P') || sim.mood < 40)) {
            scores.push({ id: 'play', score: 80, type: 'obj' });
        }

        // 3. 做出决策
        scores.sort((a, b) => b.score - a.score);
        let choice = scores[Math.floor(Math.random() * Math.min(scores.length, 3))];

        if (choice.score > 20) {
            if (choice.id === 'social') DecisionLogic.findHuman(sim);
            else if (choice.id === 'side_hustle') DecisionLogic.findSideHustle(sim);
            else DecisionLogic.findObject(sim, choice.id);
        } else {
            DecisionLogic.wander(sim);
        }
    },

    findSideHustle(sim: Sim) {
        let options: { type: string; target: Furniture }[] = [];

        // 1. Coding/Writing (Need PC)
        if (sim.skills.logic > 5 || sim.skills.creativity > 5) {
            let pcs = FURNITURE.filter(f => f.label.includes('电脑') && (!f.reserved || f.reserved === sim.id));
            if (pcs.length > 0) {
                const netCafePcs = pcs.filter(p => p.label.includes('网吧'));
                const homePcs = pcs.filter(p => !p.label.includes('网吧'));
                
                if (sim.money > 100 && netCafePcs.length > 0 && Math.random() > 0.4) {
                     options.push({ type: 'pc', target: netCafePcs[Math.floor(Math.random() * netCafePcs.length)] });
                } else if (homePcs.length > 0) {
                     options.push({ type: 'pc', target: homePcs[Math.floor(Math.random() * homePcs.length)] });
                } else if (pcs.length > 0) {
                     options.push({ type: 'pc', target: pcs[Math.floor(Math.random() * pcs.length)] });
                }
            }
        }
        

        // 2. Fishing (Need Lake)
        let lake = GameStore.furnitureIndex.get('fishing')?.[0]; 
        if (lake) options.push({ type: 'lake', target: lake });

        // 3. Gardening (Need Flower)
        let flowers = GameStore.furnitureIndex.get('gardening') || [];
        if (flowers.length > 0) options.push({ type: 'garden', target: flowers[Math.floor(Math.random() * flowers.length)] });

        if (options.length > 0) {
            let best = options[Math.floor(Math.random() * options.length)];
            sim.target = { x: best.target.x + best.target.w / 2, y: best.target.y + best.target.h / 2 };
            sim.interactionTarget = best.target;
            sim.isSideHustle = true; 
        } else {
            DecisionLogic.wander(sim);
        }
    },

    findObject(sim: Sim, type: string) {
        let utility = type;

        const simpleMap: Record<string, string> = {
             hunger: 'hunger', 
             bladder: 'bladder', 
             hygiene: 'hygiene',
             energy: 'energy',
             cooking: 'cooking', 
             gardening: 'gardening', 
             fishing: 'fishing',
             art: 'art', 
             play: 'play'
        };
        
        if (simpleMap[type]) utility = simpleMap[type];

        let candidates: Furniture[] = [];

        if (type === 'fun') {
            const funTypes = ['fun', 'cinema_2d', 'cinema_3d', 'cinema_imax', 'art', 'play', 'fishing'];
            if (sim.needs.energy < 70) funTypes.push('comfort');
            
            funTypes.forEach(t => {
                const list = GameStore.furnitureIndex.get(t);
                if (list) candidates = candidates.concat(list);
            });
        } else if (type === 'energy') {
             const beds = GameStore.furnitureIndex.get('energy') || [];
             candidates = candidates.concat(beds);
             if (sim.needs.energy < 30) {
                 const sofas = GameStore.furnitureIndex.get('comfort') || [];
                 candidates = candidates.concat(sofas);
             }
        } else if (type === 'hunger') {
            candidates = candidates.concat(GameStore.furnitureIndex.get('hunger') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('eat_out') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('buy_drink') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('buy_food') || []);
        } else if (type === 'hygiene') {
             candidates = candidates.concat(GameStore.furnitureIndex.get('hygiene') || []);
             candidates = candidates.concat(GameStore.furnitureIndex.get('shower') || []);
        } else if (type === 'bladder') {
             candidates = candidates.concat(GameStore.furnitureIndex.get('bladder') || []);
             if (candidates.length === 0) {
                 const comforts = GameStore.furnitureIndex.get('comfort') || [];
                 candidates = candidates.concat(comforts.filter(f => f.label.includes('马桶')));
             }
        } else {
            candidates = GameStore.furnitureIndex.get(utility) || [];
        }

        if (candidates.length) {
            candidates = candidates.filter((f: Furniture)=> {
                 if (f.cost && f.cost > sim.money) return false;
                 if (f.reserved && f.reserved !== sim.id) return false;
                 if (!f.multiUser) {
                     const isOccupied = GameStore.sims.some(s => s.id !== sim.id && s.interactionTarget?.id === f.id);
                     if (isOccupied) return false;
                 }
                 return true;
            });

            if (candidates.length) {
                candidates.sort((a: Furniture, b: Furniture) => {
                    const distA = Math.pow(a.x - sim.pos.x, 2) + Math.pow(a.y - sim.pos.y, 2);
                    const distB = Math.pow(b.x - sim.pos.x, 2) + Math.pow(b.y - sim.pos.y, 2);
                    return distA - distB;
                });

                let poolSize = 3;
                if (type === 'fun' || type === 'play' || type === 'art') {
                    poolSize = 10; 
                } else if (type === 'hunger') {
                    poolSize = 5;  
                }
                
                let obj = candidates[Math.floor(Math.random() * Math.min(candidates.length, poolSize))];
                
                sim.target = { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
                sim.interactionTarget = obj;
                return;
            } else {
                sim.say("没钱/没位置...", 'bad');
            }
        }
        DecisionLogic.wander(sim);
    },

    findHuman(sim: Sim) {
        let others = GameStore.sims.filter(s => s.id !== sim.id && s.action !== 'sleeping' && s.action !== 'working');
        
        others.sort(() => Math.random() - 0.5);

        others.sort((a, b) => {
            let relA = (sim.relationships[a.id]?.friendship || 0);
            let relB = (sim.relationships[b.id]?.friendship || 0);
            return relB - relA; 
        });

        if (others.length) {
            const bestRel = sim.relationships[others[0].id]?.friendship || 0;
            let poolSize = bestRel < 20 ? 10 : 3;
            
            poolSize = Math.min(others.length, poolSize);

            let partner = others[Math.floor(Math.random() * poolSize)];
            
            const angle = Math.random() * Math.PI * 2;
            const socialDistance = 40;
            
            sim.target = { 
                x: partner.pos.x + Math.cos(angle) * socialDistance, 
                y: partner.pos.y + Math.sin(angle) * socialDistance 
            };
            
            sim.interactionTarget = { type: 'human', ref: partner };
        } else {
            DecisionLogic.wander(sim);
        }
    },

    wander(sim: Sim) {
        let minX = 50, maxX = CONFIG.CANVAS_W - 100;
        let minY = 100, maxY = CONFIG.CANVAS_H - 100;
        
        if (sim.needs.energy < 60) {
            const range = 500;
            minX = Math.max(50, sim.pos.x - range);
            maxX = Math.min(CONFIG.CANVAS_W - 50, sim.pos.x + range);
            minY = Math.max(50, sim.pos.y - range);
            maxY = Math.min(CONFIG.CANVAS_H - 50, sim.pos.y + range);
        }

        sim.target = { 
            x: minX + Math.random() * (maxX - minX), 
            y: minY + Math.random() * (maxY - minY) 
        };
        sim.action = 'wandering';
        sim.actionTimer = minutes(0);
    }
};