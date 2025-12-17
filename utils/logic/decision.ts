import type { Sim } from '../Sim'; 
import { GameStore } from '../simulation';
import { CONFIG } from '../../constants'; 
import { Furniture, SimAction, NeedType, AgeStage } from '../../types';

export const DecisionLogic = {
    // 检查目标位置或家具是否是私人领地
    isRestricted(sim: Sim, target: { x: number, y: number } | Furniture): boolean {
        let homeId: string | undefined;

        if ('homeId' in target && (target as Furniture).homeId) {
            homeId = (target as Furniture).homeId;
        } else {
            const unit = GameStore.housingUnits.find(u => 
                target.x >= u.x && target.x <= u.x + u.area.w &&
                target.y >= u.y && target.y <= u.y + u.area.h
            );
            if (unit) homeId = unit.id;
        }

        if (homeId) {
            if (sim.homeId === homeId) return false;
            const isOccupied = GameStore.sims.some(s => s.homeId === homeId);
            if (isOccupied) return true;
        }
        return false;
    },

    decideAction(sim: Sim) {
        // 1. 检查紧急需求 (< 40)
        let critical = [
            { id: NeedType.Energy, val: sim.needs[NeedType.Energy] },
            { id: NeedType.Hunger, val: sim.needs[NeedType.Hunger] },
            { id: NeedType.Bladder, val: sim.needs[NeedType.Bladder] },
            { id: NeedType.Hygiene, val: sim.needs[NeedType.Hygiene] }
        ].filter(n => n.val < 40);

        if (critical.length > 0) {
            critical.sort((a, b) => a.val - b.val);
            DecisionLogic.findObject(sim, critical[0].id);
            return;
        }

        // 2. 计算各需求评分
        // [修复] 显式定义数组类型，允许 id 为 string，解决类型不兼容报错
        let scores: { id: string, score: number, type: string }[] = [
            { id: NeedType.Energy, score: (100 - sim.needs[NeedType.Energy]) * 3.0, type: 'obj' },
            { id: NeedType.Hunger, score: (100 - sim.needs[NeedType.Hunger]) * 2.5, type: 'obj' },
            { id: NeedType.Bladder, score: (100 - sim.needs[NeedType.Bladder]) * 2.8, type: 'obj' },
            { id: NeedType.Hygiene, score: (100 - sim.needs[NeedType.Hygiene]) * 1.5, type: 'obj' },
            { id: NeedType.Fun, score: (100 - sim.needs[NeedType.Fun]) * 1.2, type: 'fun' },
        ];

        let socialScore = (100 - sim.needs[NeedType.Social]) * 1.5;
        if (sim.mbti.startsWith('E')) socialScore *= 1.4;
        else if (sim.mbti.startsWith('I')) socialScore *= 0.8;
        if (['air', 'fire'].includes(sim.zodiac.element)) socialScore *= 1.2;
        if (sim.appearanceScore > 70) socialScore *= 1.2; 
        if (sim.eq > 70) socialScore *= 1.3; 

        if (['万人迷', '派对之王', '交际花', '政坛领袖'].some(g => sim.lifeGoal.includes(g))) {
            socialScore *= 1.5; 
        } else if (['隐居', '独处', '黑客', '作家'].some(g => sim.lifeGoal.includes(g))) {
            socialScore *= 0.6; 
        }
        if (sim.mood < 30) socialScore *= 0.3;

        scores.push({ id: NeedType.Social, score: socialScore, type: 'social' });

        if (sim.job.id === 'unemployed' && ![AgeStage.Infant, AgeStage.Toddler, AgeStage.Child].includes(sim.ageStage)) {
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

        for (let skillKey in sim.skills) {
            let talent = sim.skillModifiers[skillKey] || 1;
            let skillScore = (100 - sim.needs[NeedType.Fun]) * 0.5 * talent;
            scores.push({ id: `skill_${skillKey}`, score: skillScore, type: 'obj' });
        }

        if (sim.needs[NeedType.Fun] < 50 && sim.money > 100) {
            scores.push({ id: 'cinema_3d', score: 90, type: 'obj' });
            
            let gymScore = 60;
            if (sim.constitution > 70) gymScore += 30;
            scores.push({ id: 'gym_run', score: gymScore, type: 'obj' });
        }
        
        if (sim.needs[NeedType.Fun] < 70) {
             let artScore = 85;
             if (sim.mbti.includes('N') || sim.skills.creativity > 20 || sim.iq > 70) artScore += 30;
             scores.push({ id: 'art', score: artScore, type: 'obj' });
        }
        
        if (sim.needs[NeedType.Fun] < 60 && (sim.mbti.includes('P') || sim.mood < 40)) {
            scores.push({ id: 'play', score: 80, type: 'obj' });
        }

        scores.sort((a, b) => b.score - a.score);
        let choice = scores[Math.floor(Math.random() * Math.min(scores.length, 3))];

        if (choice.score > 20) {
            if (choice.id === NeedType.Social) DecisionLogic.findHuman(sim);
            else if (choice.id === 'side_hustle') DecisionLogic.findSideHustle(sim);
            else DecisionLogic.findObject(sim, choice.id);
        } else {
            sim.startWandering();
        }

        // 学生做作业决策
        if ([AgeStage.Child, AgeStage.Teen].includes(sim.ageStage) && sim.job.id === 'unemployed') {
            let studyDesire = 0;
            if (sim.mbti.includes('J')) studyDesire += 40;
            if ((sim.schoolPerformance || 60) < 60) studyDesire += 50; 
            
            const hour = GameStore.time.hour;
            if (hour > 16 && hour < 21) studyDesire += 30;

            if (studyDesire > 60) {
                DecisionLogic.findObject(sim, sim.ageStage === AgeStage.Teen ? 'study_high' : 'study');
                return;
            }
        }
    },

    findSideHustle(sim: Sim) {
        let options: { type: string; target: Furniture }[] = [];

        if (sim.skills.logic > 5 || sim.skills.creativity > 5) {
            let pcs = GameStore.furniture.filter(f => f.label.includes('电脑') && (!f.reserved || f.reserved === sim.id));
            pcs = pcs.filter(f => !DecisionLogic.isRestricted(sim, f));

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
        
        let lake = GameStore.furnitureIndex.get('fishing')?.[0]; 
        if (lake) options.push({ type: 'lake', target: lake });

        let flowers = GameStore.furnitureIndex.get('gardening') || [];
        flowers = flowers.filter(f => !DecisionLogic.isRestricted(sim, f));

        if (flowers.length > 0) options.push({ type: 'garden', target: flowers[Math.floor(Math.random() * flowers.length)] });

        if (options.length > 0) {
            let best = options[Math.floor(Math.random() * options.length)];
            sim.target = { x: best.target.x + best.target.w / 2, y: best.target.y + best.target.h / 2 };
            sim.interactionTarget = best.target;
            sim.isSideHustle = true; 
            
            // [修复] 调用 Sim 方法代替直接实例化 State，切断循环依赖
            sim.startCommuting();
        } else {
            sim.startWandering();
        }
    },

    findObject(sim: Sim, type: string) {
        let utility = type;
        // [优化] 使用 NeedType 常量
        const simpleMap: Record<string, string> = {
             [NeedType.Hunger]: 'hunger', 
             [NeedType.Bladder]: 'bladder', 
             [NeedType.Hygiene]: 'hygiene',
             [NeedType.Energy]: 'energy',
             cooking: 'cooking', gardening: 'gardening', fishing: 'fishing', art: 'art', play: 'play'
        };
        if (simpleMap[type]) utility = simpleMap[type];

        let candidates: Furniture[] = [];

        if (type === NeedType.Fun) {
            const funTypes = ['fun', 'cinema_2d', 'cinema_3d', 'cinema_imax', 'art', 'play', 'fishing'];
            if (sim.needs[NeedType.Energy] < 70) funTypes.push('comfort');
            funTypes.forEach(t => {
                const list = GameStore.furnitureIndex.get(t);
                if (list) candidates = candidates.concat(list);
            });
        } else if (type === NeedType.Energy) {
             const beds = GameStore.furnitureIndex.get('energy') || [];
             candidates = candidates.concat(beds);
             if (sim.needs[NeedType.Energy] < 30) {
                 const sofas = GameStore.furnitureIndex.get('comfort') || [];
                 candidates = candidates.concat(sofas);
             }
        } else if (type === NeedType.Hunger) {
            candidates = candidates.concat(GameStore.furnitureIndex.get('hunger') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('eat_out') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('buy_drink') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('buy_food') || []);
        } else if (type === NeedType.Hygiene) {
             candidates = candidates.concat(GameStore.furnitureIndex.get('hygiene') || []);
             candidates = candidates.concat(GameStore.furnitureIndex.get('shower') || []);
        } else if (type === NeedType.Bladder) {
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
                 if (DecisionLogic.isRestricted(sim, f)) return false;
                 if (type === NeedType.Hunger && sim.money < 20) {
                     if (f.cost && f.cost > 0) return false;
                     if (f.utility === 'buy_food' || f.utility === 'buy_drink') return false;
                 }
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
                if (type === NeedType.Fun || type === 'play' || type === 'art') poolSize = 10; 
                else if (type === NeedType.Hunger) poolSize = 5;  
                
                let obj = candidates[Math.floor(Math.random() * Math.min(candidates.length, poolSize))];
                
                sim.target = { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
                sim.interactionTarget = obj;
                
                // [修复] 调用 Sim 方法
                sim.startCommuting();
                return;
            } else {
                sim.say("没钱/没位置...", 'bad');
            }
        }
        sim.startWandering();
    },

    findHuman(sim: Sim) {
        let others = GameStore.sims.filter(s => s.id !== sim.id && s.action !== SimAction.Sleeping && s.action !== SimAction.Working);
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
            
            if (DecisionLogic.isRestricted(sim, partner.pos)) {
                sim.startWandering();
                return;
            }

            const angle = Math.random() * Math.PI * 2;
            const socialDistance = 40;
            
            sim.target = { 
                x: partner.pos.x + Math.cos(angle) * socialDistance, 
                y: partner.pos.y + Math.sin(angle) * socialDistance 
            };
            
            sim.interactionTarget = { type: 'human', ref: partner };
            
            // [修复] 调用 Sim 方法
            sim.startCommuting();
        } else {
            sim.startWandering();
        }
    }
};