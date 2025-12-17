import { ITEMS, BUFFS } from '../../constants';
import { Furniture, NeedType, SimAction, AgeStage } from '../../types';
import type { Sim } from '../Sim';
import { SchoolLogic } from './school';

// === 接口定义 ===
export interface InteractionHandler {
    verb: string;
    duration: number; // 基础分钟数
    getDuration?: (sim: Sim, obj: Furniture) => number; // 动态计算时长
    getVerb?: (sim: Sim, obj: Furniture) => string; // 动态计算动作名
    onStart?: (sim: Sim, obj: Furniture) => boolean; // 返回 false 表示交互失败
    onUpdate?: (sim: Sim, obj: Furniture, f: number, getRate: (m: number) => number) => void;
    onFinish?: (sim: Sim, obj: Furniture) => void;
}

// === 常量定义 ===
// [优化] 使用 NeedType 作为 Key
export const RESTORE_TIMES: Record<string, number> = {
    [NeedType.Bladder]: 15, 
    [NeedType.Hygiene]: 25, 
    [NeedType.Hunger]: 45, 
    energy_sleep: 420, 
    energy_nap: 60,
    [NeedType.Fun]: 90, 
    [NeedType.Social]: 60, 
    art: 120, 
    play: 60, 
    default: 60
};

// === 辅助函数 ===
const genericRestore = (needType: NeedType, timeKey?: string) => {
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
            if (sim.money >= 5) { 
                sim.money -= 5; 
                sim.needs[NeedType.Hunger] += 5; 
                sim.needs[NeedType.Fun] += 5; 
                return true; 
            }
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
            const cost = obj.cost || 50; 
            if (sim.money < cost) {
                sim.say("太贵了...", 'bad');
                return false;
            }
            return true;
        },
        onFinish: (sim, obj) => {
            sim.say("买买买! ✨", 'act');
            sim.needs[NeedType.Fun] += 20;
        }
    },
    'run': {
        verb: '健身', duration: 60,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.athletics += 0.08 * f;
            sim.needs[NeedType.Energy] -= getRate(120);
            sim.needs[NeedType.Hygiene] -= getRate(240);
            sim.constitution = Math.min(100, sim.constitution + 0.05 * f);
        }
    },
    'stretch': {
        verb: '瑜伽', duration: 60,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.athletics += 0.05 * f;
            sim.needs[NeedType.Energy] -= getRate(120);
            sim.needs[NeedType.Hygiene] -= getRate(240);
            sim.constitution = Math.min(100, sim.constitution + 0.03 * f);
        }
    },
    'lift': {
        verb: '举铁 💪', duration: 45,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.athletics += 0.1 * f; 
            sim.needs[NeedType.Energy] -= getRate(300); 
            sim.needs[NeedType.Hygiene] -= getRate(300);
            sim.constitution = Math.min(100, sim.constitution + 0.08 * f);
        }
    },
    'gardening': {
        verb: '修剪枝叶 🌿', duration: 40,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.gardening += 0.08 * f; 
            sim.needs[NeedType.Fun] += getRate(150);
        }
    },
    'fishing': {
        verb: '钓鱼 🎣', duration: 60,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.fishing += 0.08 * f; 
            sim.needs[NeedType.Fun] += getRate(120);
        },
        onFinish: (sim) => {
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
            // [修复] 使用 sim 方法代替直接实例化
            if (sim.interactionTarget?.utility === 'work') {
                sim.enterWorkingState();
            } else {
                sim.enterInteractionState(SimAction.Using);
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
            sim.needs[NeedType.Fun] += getRate(RESTORE_TIMES.art);
            sim.skills.creativity += 0.03 * f;
            sim.creativity = Math.min(100, sim.creativity + 0.05 * f);
        }
    },
    'paint': {
        verb: '绘画 🖌️', duration: 90,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.creativity += 0.08 * f;
            sim.creativity = Math.min(100, sim.creativity + 0.08 * f);
            sim.needs[NeedType.Fun] += getRate(120);
        }
    },
    'play': {
        verb: '玩耍 🎈', duration: 45,
        onStart: (sim) => { sim.addBuff(BUFFS.playful); return true; },
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs[NeedType.Fun] += getRate(RESTORE_TIMES.play);
            sim.needs[NeedType.Energy] -= getRate(180);
            sim.needs[NeedType.Hygiene] -= getRate(300);
        }
    },
    'dance': {
        verb: '跳舞 💃', duration: 30,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.dancing += 0.1 * f;
            sim.appearanceScore = Math.min(100, sim.appearanceScore + 0.02 * f);
            sim.constitution = Math.min(100, sim.constitution + 0.02 * f);
            sim.needs[NeedType.Fun] += getRate(60);
            sim.needs[NeedType.Energy] -= getRate(200); 
        }
    },
   'work': {
        verb: '工作 💻', 
        duration: 480, 
        getDuration: (sim) => sim.isSideHustle ? 180 : 480,
        getVerb: (sim) => sim.isSideHustle ? '接单赚外快 💻' : '工作 💻',
        
        onStart: (sim, obj) => {
            if (sim.isSideHustle) {
                sim.enterInteractionState(SimAction.Using);
            } else {
                sim.enterWorkingState();
            }
            return true;
        },

        onUpdate: (sim, obj, f, getRate) => {
            if (sim.skills.logic > sim.skills.creativity) {
                sim.iq = Math.min(100, sim.iq + 0.01 * f);
            } else {
                sim.creativity = Math.min(100, sim.creativity + 0.01 * f);
            }
        },

        onFinish: (sim, obj) => {
            if (sim.isSideHustle && obj.label.includes('电脑')) {
                const skillUsed = sim.skills.coding > sim.skills.creativity ? 'coding' : 'writing';
                let skillVal = sim.skills.logic; 
                if (skillUsed === 'writing') skillVal = sim.skills.creativity;
                const earned = 50 + skillVal * 5; 
                sim.skills.logic += 0.5;
                sim.skills.creativity += 0.5;
                sim.iq = Math.min(100, sim.iq + 0.2);
                sim.earnMoney(earned, 'side_hustle_pc');
            }
        }
    },
    'cinema_': { 
        verb: '看电影 🎬', duration: 120,
        onStart: (sim) => { sim.addBuff(BUFFS.movie_fun); return true; },
        onUpdate: (sim, obj, f, getRate) => {
             sim.needs[NeedType.Fun] += getRate(120);
             sim.needs[NeedType.Energy] -= getRate(600);
             sim.eq = Math.min(100, sim.eq + 0.02 * f);
        }
    },
    // [优化] 使用 NeedType.Energy
    [NeedType.Energy]: {
        verb: '睡觉 💤', duration: 420,
        getVerb: (sim, obj) => (obj.label.includes('沙发') || obj.label.includes('长椅')) ? '小憩' : '睡觉 💤',
        getDuration: (sim, obj) => {
             if (obj.label.includes('沙发') || obj.label.includes('长椅')) {
                 const missing = 100 - sim.needs[NeedType.Energy];
                 return (missing / 100) * RESTORE_TIMES.energy_nap * 1.1; 
             }
             const missing = 100 - sim.needs[NeedType.Energy];
             return (missing / 100) * RESTORE_TIMES.energy_sleep * 1.1; 
        },
        onStart: (sim, obj) => { 
            // [修复] 使用 sim 方法
            if (obj.label.includes('沙发')) sim.enterInteractionState(SimAction.Using);
            else sim.enterInteractionState(SimAction.Sleeping);
            return true; 
        },
        onUpdate: (sim, obj, f, getRate) => {
            let timeKey = (obj.label.includes('沙发') || obj.label.includes('长椅')) ? 'energy_nap' : 'energy_sleep';
            let t = RESTORE_TIMES[timeKey];
            if (sim.needs[NeedType.Energy] !== undefined) sim.needs[NeedType.Energy] += getRate(t);
            if (timeKey === 'energy_nap') sim.needs[NeedType.Comfort] = 100;
        }
    },
    'shower': {
        verb: '洗澡 🚿', duration: 20,
        onStart: (sim) => { sim.enterInteractionState(SimAction.Using); return true; }, 
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs[NeedType.Hygiene] += getRate(20); 
            sim.needs[NeedType.Energy] += getRate(400); 
            sim.needs[NeedType.Comfort] = 100;
            if (sim.appearanceScore < 80) sim.appearanceScore += 0.05 * f;
        }
    },
    [NeedType.Hunger]: {
        verb: '用餐 🍴', duration: 30,
        onStart: (sim) => { sim.enterInteractionState(SimAction.Eating); return true; },
        onUpdate: genericRestore(NeedType.Hunger)
    },
    [NeedType.Comfort]: {
        verb: '休息', 
        duration: 60,
        getVerb: () => '小憩 💤',
        onStart: (sim) => { 
            sim.enterInteractionState(SimAction.Using);
            return true; 
        },
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs[NeedType.Energy] += getRate(RESTORE_TIMES.energy_nap);
            if (sim.needs[NeedType.Comfort] !== undefined) sim.needs[NeedType.Comfort] = 100;
            sim.needs[NeedType.Fun] += getRate(60);
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
            sim.needs[NeedType.Hunger] += getRate(40); 
            sim.needs[NeedType.Fun] += getRate(100);
            sim.needs[NeedType.Social] += getRate(200); 
        },
        onFinish: (sim) => {
            sim.addBuff(BUFFS.good_meal);
        }
    },
    'buy_food': {
        verb: '吃点心 🌭', 
        duration: 15,
        onStart: (sim, obj) => {
            const cost = 20; 
            if (sim.money >= cost) { 
                sim.money -= cost; 
                sim.needs[NeedType.Hunger] += 40; 
                sim.needs[NeedType.Fun] += 10;    
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
             if (obj.label.includes('试妆') || obj.label.includes('镜')) return "照镜子 🪞";
             return "使用";
        },
        onUpdate: (sim, obj, f, getRate) => {
            const u = obj.utility;
            const t = RESTORE_TIMES[u] || RESTORE_TIMES.default;
            // [Fix] 安全检查 Needs
            if (sim.needs[u as NeedType] !== undefined) sim.needs[u as NeedType] += getRate(t);
            
            if (obj.label.includes('试妆') || obj.label.includes('镜')) {
                sim.appearanceScore = Math.min(100, sim.appearanceScore + 0.1 * f);
            }
        }
    },
    'nap_crib': {
        verb: '午睡 👶', duration: 120,
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs[NeedType.Energy] += getRate(120);
            if (sim.ageStage === AgeStage.Infant) sim.health += 0.01 * f;
        }
    },
    'play_blocks': {
        verb: '堆积木 🧱', duration: 40,
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs[NeedType.Fun] += getRate(60);
            sim.creativity += 0.05 * f; 
            sim.needs[NeedType.Social] += getRate(180); 
        }
    },
    'study': {
        verb: '写作业 📝', duration: 60,
        onStart: (sim) => {
            if (sim.mood < 40 && !sim.mbti.includes('J')) {
                sim.say("不想写...", 'bad');
                return false;
            }
            return true;
        },
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs[NeedType.Fun] -= getRate(200); 
        },
        onFinish: (sim) => {
            SchoolLogic.doHomework(sim);
        }
    },
    'study_high': {
        verb: '自习 📖', duration: 90,
        onUpdate: (sim, obj, f, getRate) => {
            sim.skills.logic += 0.05 * f;
        },
        onFinish: (sim) => {
            SchoolLogic.doHomework(sim);
        }
    },
    'eat_canteen': {
        verb: '吃食堂 🍛', duration: 20,
        onStart: (sim, obj) => {
            const isStudent = [AgeStage.Child, AgeStage.Teen].includes(sim.ageStage);
            
            if (!isStudent && sim.money < 10) { 
                sim.say("饭卡没钱了...", 'bad'); 
                return false; 
            }
            
            if (!isStudent) {
                sim.money -= 10;
            } else {
                if (Math.random() > 0.8) sim.health += 0.5;
            }
            return true;
        },
        onUpdate: (sim, obj, f, getRate) => {
            sim.needs[NeedType.Hunger] += getRate(40);
        }
    },
};