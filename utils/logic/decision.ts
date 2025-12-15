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
            // { id: 'social', score: (100 - sim.needs.social) * 1.5, type: 'social' } // 移除旧的简单逻辑
        ];

        // [新增] 复杂的社交需求权重计算
        // 基础分：需求缺口
        let socialScore = (100 - sim.needs.social) * 1.5;

        // MBTI 修正：E人更容易发起社交，I人较被动
        if (sim.mbti.startsWith('E')) socialScore *= 1.4;
        else if (sim.mbti.startsWith('I')) socialScore *= 0.8;

        // 星座修正：风象(Air)和火象(Fire)更主动
        if (['air', 'fire'].includes(sim.zodiac.element)) socialScore *= 1.2;

        // 人生目标修正
        if (['万人迷', '派对之王', '交际花', '政坛领袖'].some(g => sim.lifeGoal.includes(g))) {
            socialScore *= 1.5; // 渴望成为焦点
        } else if (['隐居', '独处', '黑客', '作家'].some(g => sim.lifeGoal.includes(g))) {
            socialScore *= 0.6; // 更喜欢独处
        }

        // 心情修正：心情太差时不想理人
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
            scores.push({ id: 'gym_run', score: 60, type: 'obj' });
        }
        
        // 艺术爱好者加分 (去美术馆)
        if (sim.needs.fun < 70 && (sim.mbti.includes('N') || sim.skills.creativity > 20)) {
             scores.push({ id: 'art', score: 85, type: 'obj' });
        }
        
        // 孩子气或心情不好加分 (去游乐场)
        if (sim.needs.fun < 60 && (sim.mbti.includes('P') || sim.mood < 40)) {
            scores.push({ id: 'play', score: 80, type: 'obj' });
        }

        // 性格影响社交加分 (这部分已合并到上方)
        
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
                // [优化] 优先去网吧 (如果是个性外向或者喜欢玩乐的市民)
                const netCafePcs = pcs.filter(p => p.label.includes('网吧'));
                const homePcs = pcs.filter(p => !p.label.includes('网吧'));
                
                // 简单随机逻辑：有钱且喜欢热闹的去网吧，没钱的找免费电脑
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
        let lake = GameStore.furnitureIndex.get('fishing')?.[0]; // 使用索引
        if (lake) options.push({ type: 'lake', target: lake });

        // 3. Gardening (Need Flower)
        let flowers = GameStore.furnitureIndex.get('gardening') || []; // 使用索引
        if (flowers.length > 0) options.push({ type: 'garden', target: flowers[Math.floor(Math.random() * flowers.length)] });

        if (options.length > 0) {
            let best = options[Math.floor(Math.random() * options.length)];
            sim.target = { x: best.target.x + best.target.w / 2, y: best.target.y + best.target.h / 2 };
            sim.interactionTarget = best.target;
            sim.isSideHustle = true; // 标记为赚外快，InteractionRegistry 会据此发放收益
        } else {
            DecisionLogic.wander(sim);
        }
    },

    findObject(sim: Sim, type: string) {
        let utility = type;

        // [优化] 更完善的映射表
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
             // 如果非常困，沙发也可以睡
             if (sim.needs.energy < 30) {
                 const sofas = GameStore.furnitureIndex.get('comfort') || [];
                 candidates = candidates.concat(sofas);
             }
        } else if (type === 'hunger') {
            // [关键] 优先把免费的 hunger 资源 (餐桌、饮水机) 加入候选
            candidates = candidates.concat(GameStore.furnitureIndex.get('hunger') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('eat_out') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('buy_drink') || []);
            candidates = candidates.concat(GameStore.furnitureIndex.get('buy_food') || []);
        } else if (type === 'hygiene') {
             // [关键] 同时寻找 hygiene 和 shower
             candidates = candidates.concat(GameStore.furnitureIndex.get('hygiene') || []);
             candidates = candidates.concat(GameStore.furnitureIndex.get('shower') || []);
        } else if (type === 'bladder') {
             // [关键] 同时寻找 bladder 和 comfort (兼容旧配置)
             candidates = candidates.concat(GameStore.furnitureIndex.get('bladder') || []);
             if (candidates.length === 0) {
                 // 只有在没找到 bladder 专用设施时才找 comfort，避免去坐沙发上厕所
                 const comforts = GameStore.furnitureIndex.get('comfort') || [];
                 candidates = candidates.concat(comforts.filter(f => f.label.includes('马桶')));
             }
        } else {
            candidates = GameStore.furnitureIndex.get(utility) || [];
        }

        if (candidates.length) {
            candidates = candidates.filter((f: Furniture)=> {
                 // [关键] 严格检查金钱，防止卡死
                 if (f.cost && f.cost > sim.money) return false;
                 if (f.reserved && f.reserved !== sim.id) return false;
                 if (!f.multiUser) {
                     const isOccupied = GameStore.sims.some(s => s.id !== sim.id && s.interactionTarget?.id === f.id);
                     if (isOccupied) return false;
                 }
                 return true;
            });

            if (candidates.length) {
                // [优化 1] 放宽距离限制，增加随机性
                // 不再严格按距离排序，而是先按距离排序，然后取前 50% 或前 10 个作为候选池
                // 这样市民会愿意走远一点去更好玩的地方
                candidates.sort((a: Furniture, b: Furniture) => {
                    const distA = Math.pow(a.x - sim.pos.x, 2) + Math.pow(a.y - sim.pos.y, 2);
                    const distB = Math.pow(b.x - sim.pos.x, 2) + Math.pow(b.y - sim.pos.y, 2);
                    return distA - distB;
                });

                // 修改这里：从 min(length, 3) 改为更大的范围，例如 min(length, 8)
                // 或者如果是为了娱乐(fun)，甚至可以全图随机
                let poolSize = 3;
                if (type === 'fun' || type === 'play' || type === 'art') {
                    poolSize = 10; // 娱乐活动愿意跑远点
                } else if (type === 'hunger') {
                    poolSize = 5;  // 吃饭也可以多走两步
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
        
        // [修复列表偏差 1] 先进行随机打乱
        // 防止 relationship 数值一样（比如都是0）时，sort 保持原数组顺序（即创建顺序）
        // 这样前几个创建的居民就不会总是排在前面了
        others.sort(() => Math.random() - 0.5);

        // [修复列表偏差 2] 再按照关系度排序
        others.sort((a, b) => {
            let relA = (sim.relationships[a.id]?.friendship || 0);
            let relB = (sim.relationships[b.id]?.friendship || 0);
            return relB - relA; // 降序：好友在前
        });

        if (others.length) {
            // [逻辑优化] 
            // 如果最好的关系度都很低（<20，说明大家都是陌生人），则扩大候选池范围（比如前10人）
            // 如果有熟人（关系度高），则缩小范围优先找熟人（前3人）
            const bestRel = sim.relationships[others[0].id]?.friendship || 0;
            let poolSize = bestRel < 20 ? 10 : 3;
            
            // 确保不越界
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
        // [优化 2] 修正坐标范围，覆盖全图
        // 使用 CONFIG.CANVAS_W 和 H (需确保从 constants 导入了 CONFIG)
        let minX = 50, maxX = CONFIG.CANVAS_W - 100; // 3000 - 100
        let minY = 100, maxY = CONFIG.CANVAS_H - 100; // 1800 - 100
        
        // 也可以增加一点逻辑：如果比较累(energy < 60)，就在附近逛；如果精力充沛，就全图跑
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