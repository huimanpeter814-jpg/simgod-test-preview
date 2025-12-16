import type { Sim } from '../Sim'; 
import { GameStore } from '../simulation';
import { CONFIG } from '../../constants'; 
import { minutes } from '../simulationHelpers';
import { Furniture } from '../../types';

export const DecisionLogic = {
    // [新增] 检查目标位置或家具是否是私人领地
    isRestricted(sim: Sim, target: { x: number, y: number } | Furniture): boolean {
        let homeId: string | undefined;

        // 如果是家具，直接检查家具的归属
        if ('homeId' in target && (target as Furniture).homeId) {
            homeId = (target as Furniture).homeId;
        } else {
            // 如果是坐标，检查是否落在某个住房单元内
            const unit = GameStore.housingUnits.find(u => 
                target.x >= u.x && target.x <= u.x + u.area.w &&
                target.y >= u.y && target.y <= u.y + u.area.h
            );
            if (unit) homeId = unit.id;
        }

        if (homeId) {
            // 如果是自己的家，不限制
            if (sim.homeId === homeId) return false;
            
            // 查找该房屋的主人（假设只要有住户，就不是空房）
            const isOccupied = GameStore.sims.some(s => s.homeId === homeId);
            
            // 如果房子有人住，且不是我家 -> 禁止入内
            if (isOccupied) return true;
        }

        return false;
    },

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

        let socialScore = (100 - sim.needs.social) * 1.5;
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

        scores.push({ id: 'social', score: socialScore, type: 'social' });

        if (sim.job.id === 'unemployed' && !['Infant', 'Toddler', 'Child'].includes(sim.ageStage)) {
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
            let skillScore = (100 - sim.needs.fun) * 0.5 * talent;
            scores.push({ id: `skill_${skillKey}`, score: skillScore, type: 'obj' });
        }

        if (sim.needs.fun < 50 && sim.money > 100) {
            scores.push({ id: 'cinema_3d', score: 90, type: 'obj' });
            
            let gymScore = 60;
            if (sim.constitution > 70) gymScore += 30;
            scores.push({ id: 'gym_run', score: gymScore, type: 'obj' });
        }
        
        if (sim.needs.fun < 70) {
             let artScore = 85;
             if (sim.mbti.includes('N') || sim.skills.creativity > 20 || sim.iq > 70) artScore += 30;
             scores.push({ id: 'art', score: artScore, type: 'obj' });
        }
        
        if (sim.needs.fun < 60 && (sim.mbti.includes('P') || sim.mood < 40)) {
            scores.push({ id: 'play', score: 80, type: 'obj' });
        }

        scores.sort((a, b) => b.score - a.score);
        let choice = scores[Math.floor(Math.random() * Math.min(scores.length, 3))];

        if (choice.score > 20) {
            if (choice.id === 'social') DecisionLogic.findHuman(sim);
            else if (choice.id === 'side_hustle') DecisionLogic.findSideHustle(sim);
            else DecisionLogic.findObject(sim, choice.id);
        } else {
            DecisionLogic.wander(sim);
        }

        // 学生做作业决策
        if (['Child', 'Teen'].includes(sim.ageStage) && sim.job.id === 'unemployed') {
            // 勤奋的学生(J)或者害怕挂科(成绩差)会倾向于做作业
            let studyDesire = 0;
            if (sim.mbti.includes('J')) studyDesire += 40;
            if ((sim.schoolPerformance || 60) < 60) studyDesire += 50; // 临阵磨枪
            
            // 下午/晚上才有做作业的想法
            const hour = GameStore.time.hour;
            if (hour > 16 && hour < 21) studyDesire += 30;

            if (studyDesire > 60) {
                // 寻找课桌
                DecisionLogic.findObject(sim, sim.ageStage === 'Teen' ? 'study_high' : 'study');
                return;
            }
        }
    },

    findSideHustle(sim: Sim) {
        let options: { type: string; target: Furniture }[] = [];

        if (sim.skills.logic > 5 || sim.skills.creativity > 5) {
            let pcs = GameStore.furniture.filter(f => f.label.includes('电脑') && (!f.reserved || f.reserved === sim.id));
            
            // [新增] 过滤掉别人家里的电脑
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
        // 过滤私人花园
        flowers = flowers.filter(f => !DecisionLogic.isRestricted(sim, f));

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
                 // 过滤私人领地
                 if (DecisionLogic.isRestricted(sim, f)) return false;

                 // [修改] 关键逻辑：如果是食物或生存必需品，且没钱，过滤掉收费项目
                 if (type === 'hunger' && sim.money < 20) {
                     // 如果这东西要钱（cost > 0），就别去了
                     if (f.cost && f.cost > 0) return false;
                     // 还要过滤掉那种 utility 是 buy_food 的（通常隐含收费）
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
            
            // [新增] 检查目标是否在私人领地内 (如果我不能进他家，就不能去找他)
            if (DecisionLogic.isRestricted(sim, partner.pos)) {
                // 尝试找下一个
                DecisionLogic.wander(sim);
                return;
            }

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
        
        // 尝试寻找一个可达的目标点 (最多尝试5次)
        for (let i = 0; i < 5; i++) {
            let tx = minX + Math.random() * (maxX - minX);
            let ty = minY + Math.random() * (maxY - minY);
            
            // [新增] 检查该点是否在受限区域
            if (!DecisionLogic.isRestricted(sim, { x: tx, y: ty })) {
                sim.target = { x: tx, y: ty };
                break;
            }
        }
        
        // 如果都没找到（极少情况），就待在原地发呆
        if (!sim.target) {
            sim.target = { ...sim.pos };
        }

        sim.action = 'wandering';
        sim.actionTimer = minutes(0);
    }
};