import { ITEMS, BUFFS } from '../../constants';
import { Furniture } from '../../types';
// [关键] 使用 type 导入 Sim，避免循环依赖导致的运行时错误
import type { Sim } from '../Sim';

// === 接口定义 ===
export interface InteractionHandler {
    verb: string;
    duration: number; // 基础分钟数
    getDuration?: (sim: Sim, obj: Furniture) => number; // 动态计算时长
    getVerb?: (sim: Sim, obj: Furniture) => string; // 动态计算动作名
    onStart?: (sim: Sim, obj: Furniture) => boolean; // 返回 false 表示交互失败(如钱不够)
    onUpdate?: (sim: Sim, obj: Furniture, f: number, getRate: (m: number) => number) => void;
    onFinish?: (sim: Sim, obj: Furniture) => void;
}

// === 常量定义 ===
export const RESTORE_TIMES: Record<string, number> = {
    bladder: 15, hygiene: 25, hunger: 45, energy_sleep: 420, energy_nap: 60,
    fun: 90, social: 60, art: 120, play: 60, default: 60
};

// === 辅助函数 ===
const genericRestore = (needType: string, timeKey?: string) => {
    return (sim: Sim, obj: Furniture, f: number, getRate: (m: number) => number) => {
        const t = timeKey ? RESTORE_TIMES[timeKey] : (RESTORE_TIMES[needType] || RESTORE_TIMES.default);
        if (sim.needs[needType] !== undefined) {
            sim.needs[needType] += getRate(t);
        }
    };
};

// === 核心交互策略表 ===
export const INTERACTIONS: Record<string, InteractionHandler> = {
    'buy_drink': {
        verb: '咕嘟咕嘟', duration: 5,
        onStart: (sim, obj) => {
            if (sim.money >= 5) { sim.money -= 5; sim.needs.hunger += 5; sim.needs.fun += 5; return true; }
            sim.say("没钱买水...", 'bad'); return false;
        }
    },
    'buy_book': {
        verb: '买书', duration: 15,
        onStart: (sim, obj) => {
            if (sim.money >= 60) { sim.buyItem(ITEMS.find((i: any) => i.id === 'book')); return true; }
            sim.say("买不起...", 'bad'); return false;
        }
    },
    'buy_item': {
        verb: '购物 🛍️', duration: 15,
        onStart: (sim, obj) => {
            // 检查钱够不够
            const cost = obj.cost || 50; // 默认价格
            if (sim.money < cost) {
                sim.say("太贵了...", 'bad');
                return false;
            }
            // 扣钱逻辑移到 Sim.ts 的 startInteraction 统一处理，或者在这里处理
            // 这里返回 true 让 Sim 进入 using 状态
            return true;
        },
        onFinish: (sim, obj) => {
            sim.say("买买买! ✨", 'act');
            // 增加一点心情
            sim.needs.fun += 20;
        }
    },
    'run': {
        verb: '健身', duration: 60,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.athletics += 0.08 * f;
            sim.needs.energy -= getRate(120);
            sim.needs.hygiene -= getRate(240);
        }
    },
    'stretch': {
        verb: '瑜伽', duration: 60,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.athletics += 0.05 * f;
            sim.needs.energy -= getRate(120);
            sim.needs.hygiene -= getRate(240);
        }
    },
    'lift': {
        verb: '举铁 💪', duration: 45,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.athletics += 0.1 * f; // 力量训练技能涨得快
            sim.needs.energy -= getRate(300); // 但更累
            sim.needs.hygiene -= getRate(300);
        }
    },
    'gardening': {
        verb: '修剪枝叶 🌿', duration: 40,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.gardening += 0.08 * f; // 技能增加
            sim.needs.fun += getRate(150);
        }
    },

    'fishing': {
        verb: '钓鱼 🎣', duration: 60,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.fishing += 0.08 * f; // 技能增加
            sim.needs.fun += getRate(120);
        },
        onFinish: (sim) => {
            // 钓鱼结束有概率获得收益
            if (Math.random() > 0.6) {
                const earned = 15 + sim.skills.fishing * 2;
                sim.earnMoney(earned, 'sell_fish');
                sim.say("钓到大鱼了! 🐟", 'money');
            }
        }
    },
    'cooking': {
        verb: '烹饪', duration: 90,
        onStart: (sim) => { 
            // 如果是在后厨工作，设置为 working 状态，否则为 using
            if (sim.interactionTarget?.utility === 'work') {
                sim.action = 'working';
            } else {
                sim.action = 'using';
            }
            return true; 
        },
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.cooking += 0.05 * f;
        }
    },
    'art': {
        verb: '看展览 🎨', duration: 90,
        onStart: (sim) => { sim.addBuff(BUFFS.art_inspired); return true; },
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs.fun += getRate(RESTORE_TIMES.art);
            sim.skills.creativity += 0.03 * f;
        }
    },
    'play': {
        verb: '玩耍 🎈', duration: 45,
        onStart: (sim) => { sim.addBuff(BUFFS.playful); return true; },
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs.fun += getRate(RESTORE_TIMES.play);
            sim.needs.energy -= getRate(180);
            sim.needs.hygiene -= getRate(300);
        }
    },
    'dance': {
        verb: '跳舞 💃', duration: 30,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.dancing += 0.1 * f;
            sim.needs.fun += getRate(60);
            sim.needs.energy -= getRate(200); // 消耗体力
        }
    },

   'work': {
        verb: '工作 💻', 
        duration: 480, 
        getDuration: (sim) => sim.isSideHustle ? 180 : 480,
        getVerb: (sim) => sim.isSideHustle ? '接单赚外快 💻' : '工作 💻',
        
        // [关键修复] 必须显式设置 action 为 'working'
        // 如果这里不设置，Sim 默认会变成 'using'，
        // checkSchedule 就会认为还没开始工作，从而再次强制该市民去上班。
        onStart: (sim, obj) => {
            if (sim.isSideHustle) {
                sim.action = 'using'; 
            } else {
                sim.action = 'working'; // <--- 确保这一行存在
            }
            return true;
    },

    onFinish: (sim, obj) => {
        // 赚外快结算逻辑
        if (sim.isSideHustle && obj.label.includes('电脑')) {
            const skillUsed = sim.skills.coding > sim.skills.creativity ? 'coding' : 'writing';
            let skillVal = sim.skills.logic; 
            if (skillUsed === 'writing') skillVal = sim.skills.creativity;
            const earned = 50 + skillVal * 5; 
            sim.skills.logic += 0.5;
            sim.skills.creativity += 0.5;
            sim.earnMoney(earned, 'side_hustle_pc');
        }
        // 正式工作的结算在 checkSchedule 的 else 分支处理，这里不需要写
    }
},


    'cinema_': { // 前缀匹配
        verb: '看电影 🎬', duration: 120,
        onStart: (sim) => { sim.addBuff(BUFFS.movie_fun); return true; },
        onUpdate: (sim, obj, f, getRate) => {
             sim.needs.fun += getRate(120);
             sim.needs.energy -= getRate(600);
        }
    },
    // Generic Needs
    'energy': {
        verb: '睡觉 💤', duration: 420,
        getVerb: (sim, obj) => (obj.label.includes('沙发') || obj.label.includes('长椅')) ? '小憩' : '睡觉 💤',
        getDuration: (sim, obj) => {
             if (obj.label.includes('沙发') || obj.label.includes('长椅')) {
                 const missing = 100 - sim.needs.energy;
                 return (missing / 100) * RESTORE_TIMES.energy_nap * 1.1; 
             }
             const missing = 100 - sim.needs.energy;
             return (missing / 100) * RESTORE_TIMES.energy_sleep * 1.1; 
        },
        onStart: (sim, obj) => { 
            if (obj.label.includes('沙发')) sim.action = 'using'; 
            else sim.action = 'sleeping'; 
            return true; 
        },
        onUpdate: (sim, obj, f, getRate) => {
            let timeKey = (obj.label.includes('沙发') || obj.label.includes('长椅')) ? 'energy_nap' : 'energy_sleep';
            let t = RESTORE_TIMES[timeKey];
            if (sim.needs.energy !== undefined) sim.needs.energy += getRate(t);
            if (timeKey === 'energy_nap') sim.needs.comfort = 100;
        }
    },
    'shower': {
        verb: '洗澡 🚿', duration: 20,
        onStart: (sim) => { sim.action = 'using'; return true; }, // 显示正在使用
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs.hygiene += getRate(20); // 20分钟充满
            sim.needs.energy += getRate(400); // 稍微恢复一点精力
            sim.needs.comfort = 100;
        }
    },
    'hunger': {
        verb: '用餐 🍴', duration: 30,
        onStart: (sim) => { sim.action = 'eating'; return true; },
        onUpdate: genericRestore('hunger')
    },
    'comfort': {
        verb: '休息', 
        duration: 60,
        getVerb: () => '小憩 💤',
        onStart: (sim) => { 
            sim.action = 'using'; // 保持 using 状态（坐着），而不是 sleeping（躺着）
            return true; 
        },
        onUpdate: (sim, obj, f, getRate) => {
            // 关键：使用 energy_nap (60分钟) 的速率来恢复 energy
            sim.needs.energy += getRate(RESTORE_TIMES.energy_nap);
            // 顺便拉满舒适度
            if (sim.needs.comfort !== undefined) sim.needs.comfort = 100;
            sim.needs.fun += getRate(60);
        }
    },
    'eat_out': {
        verb: '享用美食 🍝', duration: 60,
        onStart: (sim, obj) => {
             const cost = obj.cost || 60;
             if (sim.money < cost) { sim.say("吃不起...", 'bad'); return false; }
             return true;
        },
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs.hunger += getRate(40); // 慢慢吃
            sim.needs.fun += getRate(100);
            sim.needs.social += getRate(200); // 餐厅有人气
        },
        onFinish: (sim) => {
            sim.addBuff(BUFFS.good_meal);
        }
    },
    'buy_food': {
        verb: '享用美食 🌭', 
        duration: 15,
        onStart: (sim, obj) => {
            const cost = 20; // 定义一个默认食物价格
            if (sim.money >= cost) { 
                sim.money -= cost; 
                sim.needs.hunger += 40; // 恢复饥饿
                sim.needs.fun += 10;    // 稍微增加快乐
                return true; 
            }
            sim.say("买不起吃的...", 'bad'); 
            return false;
        }
    },
    'default': {
        verb: '使用', duration: 30,
        getVerb: (sim, obj) => {
             if (obj.label.includes('沙发')) return "葛优躺";
             if (obj.label.includes('马桶') || obj.label.includes('公厕')) return "方便";
             if (obj.label.includes('淋浴')) return "洗澡";
             if (obj.label.includes('电脑')) return "上网 ⌨️";
             return "使用";
        },
        onUpdate: (sim, obj, f, getRate) => {
            const u = obj.utility;
            const t = RESTORE_TIMES[u] || RESTORE_TIMES.default;
            if (sim.needs[u] !== undefined) sim.needs[u] += getRate(t);
        }
    }
};