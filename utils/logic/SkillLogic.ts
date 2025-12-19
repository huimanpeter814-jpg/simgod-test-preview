import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { BUFFS } from '../../constants';

// 技能里程碑配置
export const SKILL_PERKS: Record<string, Record<number, { title: string; desc: string; type: 'speed' | 'quality' | 'efficiency' }>> = {
    cooking: {
        25: { title: "熟练帮厨", desc: "切菜速度加快，烹饪耗时减少 10%", type: 'speed' },
        50: { title: "营养搭配", desc: "掌握营养学，烹饪耗时减少 20%，成品更抗饿", type: 'quality' },
        75: { title: "主厨风范", desc: "游刃有余，烹饪耗时减少 30%，必定获得美味Buff", type: 'quality' },
        100: { title: "食神", desc: "神乎其技，烹饪耗时减少 40%", type: 'speed' }
    },
    athletics: {
        25: { title: "有氧基础", desc: "心肺功能提升，运动时卫生下降速度减缓", type: 'efficiency' },
        50: { title: "肌肉记忆", desc: "动作标准，运动获得的经验值加成 10%", type: 'quality' },
        75: { title: "铁人", desc: "体能充沛，运动时精力消耗减少 20%", type: 'efficiency' },
        100: { title: "奥林匹克", desc: "运动不再是负担，而是享受", type: 'quality' }
    },
    logic: {
        25: { title: "逻辑清晰", desc: "能更快找到代码Bug，工作效率微幅提升", type: 'speed' },
        50: { title: "快速学习", desc: "大脑运转加速，所有技能学习速度 +5%", type: 'quality' },
        75: { title: "黑客思维", desc: "解决问题只需一瞬间，电脑类工作耗时减少 20%", type: 'speed' },
        100: { title: "最强大脑", desc: "看透世间万物", type: 'quality' }
    },
    creativity: {
        25: { title: "灵感乍现", desc: "偶尔会有好点子，艺术类活动娱乐效果提升", type: 'quality' },
        50: { title: "独特审美", desc: "创作出精品的概率提升", type: 'quality' },
        75: { title: "高产作家", desc: "文思泉涌，写作/绘画耗时减少 25%", type: 'speed' },
        100: { title: "艺术大师", desc: "作品价值连城", type: 'quality' }
    },
    gardening: {
        25: { title: "绿手指", desc: "植物存活率大幅提升", type: 'quality' },
        50: { title: "丰收", desc: "每次收获的产量增加", type: 'quality' },
        75: { title: "植物语者", desc: "园艺带来的娱乐回复效果翻倍", type: 'efficiency' },
        100: { title: "自然之子", desc: "枯木逢春", type: 'quality' }
    },
    fishing: {
        25: { title: "耐心", desc: "钓鱼不再容易空军", type: 'quality' },
        50: { title: "大鱼猎手", desc: "钓到高价值鱼类的概率提升", type: 'quality' },
        75: { title: "海王", desc: "甚至能钓到宝藏", type: 'quality' },
        100: { title: "姜太公", desc: "愿者上钩", type: 'speed' }
    },
    charisma: {
        25: { title: "自来熟", desc: "打招呼效果提升", type: 'quality' },
        50: { title: "倾听者", desc: "聊天时对方好感度增加更快", type: 'quality' },
        75: { title: "社交磁铁", desc: "即使什么都不做，周围人也会慢慢产生好感", type: 'quality' },
        100: { title: "领袖气质", desc: "一呼百应", type: 'quality' }
    },
    // 其他技能可以复用通用模板
    default: {
        50: { title: "熟能生巧", desc: "操作该技能相关物品耗时减少 15%", type: 'speed' },
        100: { title: "大师", desc: "登峰造极", type: 'quality' }
    }
};

export const SkillLogic = {
    /**
     * 核心：获取非线性经验收益
     * 解决“数值黑洞”问题：等级越高，升级越难
     */
    gainExperience(sim: Sim, skillId: string, baseAmount: number) {
        if (!sim.skills[skillId]) sim.skills[skillId] = 0;
        const currentLevel = sim.skills[skillId];

        // 1. 收益递减公式
        // Lv 0-20: 100% 收益
        // Lv 20-50: 逐渐降低至 60%
        // Lv 50-80: 逐渐降低至 30%
        // Lv 80+: 20% - 10%
        let diminishingFactor = 1.0;
        if (currentLevel > 20) diminishingFactor = 1 - ((currentLevel - 20) / 100); 
        if (currentLevel > 80) diminishingFactor = 0.2;
        if (currentLevel >= 100) diminishingFactor = 0; // 满级不再增加

        // 2. 天赋加成 (比如"快速学习")
        const learningBonus = (sim.skills.logic > 50) ? 1.05 : 1.0;
        const talent = (sim.skillModifiers && sim.skillModifiers[skillId]) || 1.0;

        const finalAmount = baseAmount * diminishingFactor * learningBonus * talent;

        // 3. 应用经验
        const oldLevel = Math.floor(sim.skills[skillId]);
        sim.skills[skillId] = Math.min(100, sim.skills[skillId] + finalAmount);
        const newLevel = Math.floor(sim.skills[skillId]);

        // 4. 检查升级与里程碑解锁
        if (newLevel > oldLevel) {
            this.checkMilestones(sim, skillId, newLevel);
        }
    },

    /**
     * 检查并触发里程碑通知
     */
    checkMilestones(sim: Sim, skillId: string, level: number) {
        // 每 25 级一个门槛
        if (level % 25 === 0) {
            const perks = SKILL_PERKS[skillId] || SKILL_PERKS.default;
            const perk = perks[level];
            if (perk) {
                GameStore.addLog(sim, `💡 [技能突破] ${skillId} 达到 Lv.${level}！解锁天赋：【${perk.title}】`, 'sys');
                sim.say(`解锁: ${perk.title}!`, 'act');
                sim.addMemory(`我的 ${skillId} 技术精进到了 Lv.${level}，学会了【${perk.title}】。`, 'achievement');
                sim.addBuff(BUFFS.promoted); // 借用升职的喜悦Buff
            }
        }
    },

    /**
     * 获取天赋带来的属性修正
     * @returns multiplier (默认为 1.0)
     */
    getPerkModifier(sim: Sim, skillId: string, type: 'speed' | 'efficiency' | 'quality'): number {
        const level = sim.skills[skillId] || 0;
        let modifier = 1.0;

        // 简单的硬编码逻辑，对应上面的 SKILL_PERKS 描述
        if (type === 'speed') {
            // 速度修正：值越小越快 (duration * modifier)
            if (skillId === 'cooking') {
                if (level >= 100) modifier = 0.6;
                else if (level >= 75) modifier = 0.7;
                else if (level >= 50) modifier = 0.8;
                else if (level >= 25) modifier = 0.9;
            }
            if (skillId === 'logic' && level >= 75) modifier = 0.8;
            if (skillId === 'creativity' && level >= 75) modifier = 0.75;
            if (skillId === 'fishing' && level >= 100) modifier = 0.5; // 姜太公
        } 
        else if (type === 'efficiency') {
            // 效率修正：值越小消耗越少 (cost * modifier)
            if (skillId === 'athletics' && level >= 75) modifier = 0.8; // 铁人：减少精力消耗
            if (skillId === 'gardening' && level >= 75) modifier = 0.5; // 园艺不再那么累
        }

        return modifier;
    }
};