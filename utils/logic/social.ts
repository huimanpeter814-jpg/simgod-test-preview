import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { SOCIAL_TYPES, BUFFS, ELE_COMP, ROOMS } from '../../constants';
import { DIALOGUE_TEMPLATES } from '../../data/dialogues';

// 定义社交行为对象的类型
type SocialType = typeof SOCIAL_TYPES[number];

export const SocialLogic = {
    // 获取当前地点名称
    getCurrentPlaceName(sim: Sim) {
        const room = ROOMS.find(r => 
            sim.pos.x >= r.x && sim.pos.x <= r.x + r.w &&
            sim.pos.y >= r.y && sim.pos.y <= r.y + r.h
        );
        return room ? room.label.split(' ')[0] : '户外';
    },

    // 智能对话生成系统
    getDialogue(sim: Sim, typeId: string, target: Sim): string {
        const templates = DIALOGUE_TEMPLATES[typeId] || { default: ["..."] };
        let candidates = [...(templates.default || [])];

        // 1. 基于性格维度筛选 (E/I, F/T)
        if (sim.mbti.includes('E') && templates.E) candidates.push(...templates.E);
        if (sim.mbti.includes('I') && templates.I) candidates.push(...templates.I);
        if (sim.mbti.includes('F') && templates.F) candidates.push(...templates.F);
        if (sim.mbti.includes('T') && templates.T) candidates.push(...templates.T);

        // 2. 基于具体 MBTI 类型
        if (templates[sim.mbti]) candidates.push(...templates[sim.mbti]);

        // 3. 基于关系状态
        if (sim.relationships[target.id]?.isLover && templates.lover) candidates.push(...templates.lover);
        
        const relVal = sim.relationships[target.id]?.friendship || 0;
        if (relVal < -50 && templates.enemy) candidates.push(...templates.enemy);

        // 4. 防止空列表
        if (candidates.length === 0) candidates = ["..."];

        // 5. 随机选择
        let template = candidates[Math.floor(Math.random() * candidates.length)];

        // 6. 变量替换
        template = template.replace(/{A}/g, sim.name);
        template = template.replace(/{B}/g, target.name);
        template = template.replace(/{Place}/g, SocialLogic.getCurrentPlaceName(sim));

        return template;
    },

    getCompatibility(sim: Sim, partner: Sim) {
        let score = 0;
        // MBTI 基础契合
        for (let i = 0; i < 4; i++) if (sim.mbti[i] === partner.mbti[i]) score++;
        
        // 星座契合
        if (sim.zodiac.element === partner.zodiac.element) score += 2;
        else if (ELE_COMP[sim.zodiac.element].includes(partner.zodiac.element)) score += 1;
        else score -= 1;

        return Math.max(0, score);
    },

    // [新增] 人生目标契合度计算
    getLifeGoalCompatibility(sim: Sim, partner: Sim) {
        if (sim.lifeGoal === partner.lifeGoal) return 25; // 完全一致，知己！

        // 关键词分组匹配
        const groups = {
            money: ['富翁', '大亨', '上市', '财富', '敲钟', '金牌'],
            fame: ['万人迷', '爆红', '领袖', '明星', '政坛', '声望'],
            chill: ['隐居', '极简', '躺平', '睡个好觉', '岁月静好'],
            art: ['作家', '制作人', '艺术', '设计', '美'],
            tech: ['黑客', '大牛', '诺贝尔', '全网'],
            fun: ['派对', '游戏', '环游', '美食']
        };

        const getGroup = (goal: string) => Object.keys(groups).find(k => groups[k as keyof typeof groups].some(word => goal.includes(word)));

        const g1 = getGroup(sim.lifeGoal);
        const g2 = getGroup(partner.lifeGoal);

        if (g1 && g1 === g2) return 15; // 同类人

        // 冲突检测
        if ((g1 === 'money' && g2 === 'chill') || (g1 === 'chill' && g2 === 'money')) return -15; // 价值观冲突
        if ((g1 === 'tech' && g2 === 'party')) return -5; 

        return 0;
    },

    checkSexualOrientation(sim: Sim, partner: Sim) {
        if (sim.orientation === 'bi') return true;
        if (sim.orientation === 'hetero') return sim.gender !== partner.gender;
        if (sim.orientation === 'homo') return sim.gender === partner.gender;
        return false;
    },

    hasOtherPartner(sim: Sim, partner: Sim) {
        for (let id in sim.relationships) {
            if (id !== partner.id && sim.relationships[id].romance > 80 && sim.relationships[id].isLover) return true;
        }
        return false;
    },

    getRelLabel(rel: any) {
        let r = rel.romance || 0;
        let isLover = rel.isLover;
        if (isLover) return '恋人';
        if (r > 80) return '爱慕';
        if (r > 60) return '喜欢';
        if (r > 40) return '暧昧';
        if (r > 20) return '好感';
        if (r > 10) return '心动';
        if (r >= 0) return '无感';
        if (r > -30) return '不吸引';
        if (r > -60) return '嫌弃';
        return '厌恶';
    },

    checkRelChange(sim: Sim, partner: Sim, oldLabel: string) {
        let newLabel = SocialLogic.getRelLabel(sim.relationships[partner.id] || {});
        const newFriendship = sim.relationships[partner.id]?.friendship || 0;
        
        if (oldLabel !== newLabel) {
            if (newLabel === '恋人' || newLabel === '爱慕') {
                GameStore.addLog(sim, `与 ${partner.name} 的关系变成了 ${newLabel}`, 'rel_event');
            }
            // 成为死对头
            if (newLabel === '厌恶' && oldLabel !== '厌恶') {
                sim.addMemory(`受不了 ${partner.name} 了，简直是死对头！`, 'social', partner.id);
                GameStore.addLog(sim, `视 ${partner.name} 为死对头！`, 'bad');
            }
        }

        // 成为好朋友判定 (假设友谊度 60 为界)
        if (newFriendship > 60 && !sim.memories.some(m => m.type === 'social' && m.relatedSimId === partner.id && m.text.includes('好朋友'))) {
             sim.addMemory(`和 ${partner.name} 成为了好朋友。`, 'social', partner.id);
        }
    },

    updateRelationship(sim: Sim, target: Sim, type: string, delta: number) {
        if (!sim.relationships[target.id]) sim.relationships[target.id] = { friendship: 0, romance: 0, isLover: false, hasRomance: false };
        let rel = sim.relationships[target.id];
        
        // [修改] 属性修正系数
        let modifier = 1.0;
        if (delta > 0) {
            modifier += (sim.eq - 50) * 0.01; // EQ 80 -> +30% 增益
        } else {
            // 高 EQ 的人更能化解矛盾，扣分更少
            modifier -= (sim.eq - 50) * 0.005; // EQ 80 -> 减少 15% 的扣分
        }
        
        if (type === 'romance' && delta > 0) {
            modifier += (sim.appearanceScore - 50) * 0.01;
        }

        const finalDelta = delta * modifier;

        if (type === 'friendship') {
            rel.friendship = Math.max(-100, Math.min(100, rel.friendship + finalDelta));
        } else if (type === 'romance') {
            rel.romance = Math.max(-100, Math.min(100, rel.romance + finalDelta));
            // 浪漫互动通常也会轻微影响友谊
            rel.friendship = Math.max(-100, Math.min(100, rel.friendship + finalDelta * 0.3));
        }
    },

    // [重构] 更加细致的吃醋逻辑
    triggerJealousy(sim: Sim, actor: Sim, target: Sim) {
        // 1. 计算“容忍阈值” (Sensitivity)
        // 基础阈值，值越低越敏感
        let sensitivity = 50; 
        
        // 属性修正
        if (sim.mbti.includes('F')) sensitivity -= 10; // 情感型更敏感
        if (sim.mbti.includes('P')) sensitivity += 10; // 感知型更随性
        if (['water', 'fire'].includes(sim.zodiac.element)) sensitivity -= 10; // 水/火象更敏感
        if (sim.eq > 70) sensitivity += 15; // 高情商更能容忍
        if (sim.faithfulness < 30) sensitivity += 20; // 渣男/渣女自己也不在乎

        let relActor = sim.relationships[actor.id]?.romance || 0;
        let isLover = sim.relationships[actor.id]?.isLover;

        // 如果是恋人，阈值大幅降低（眼里容不得沙子），除非非常不在乎（Faithfulness极低）
        if (isLover && sim.faithfulness > 40) sensitivity = 20;

        // 2. 判断是否触发吃醋
        if (relActor > sensitivity) {
            
            // 3. 计算“愤怒值” (Impact)
            // 基础伤害
            let baseImpact = -30;

            // 专一度修正：越专一的人，遭到背叛越痛苦
            const faithFactor = sim.faithfulness / 50; // 0.8 ~ 2.0
            
            // 情商修正：高情商能控制情绪
            const eqFactor = Math.max(0.5, (100 - sim.eq) / 50); // 1.0 ~ 0.2 (EQ越高因子越小)

            let finalImpact = baseImpact * faithFactor * eqFactor;

            // 如果不是恋人，只是暧昧对象，伤害减半
            if (!isLover) finalImpact *= 0.5;

            // 应用伤害
            SocialLogic.updateRelationship(sim, actor, 'romance', finalImpact);
            SocialLogic.updateRelationship(sim, actor, 'friendship', finalImpact * 0.5);
            // 迁怒于第三者
            SocialLogic.updateRelationship(sim, target, 'friendship', finalImpact * 0.8);

            // 4. 结果判定 & 记录
            let oldLabelA = SocialLogic.getRelLabel(sim.relationships[actor.id] || {});
            
            // 判定这是否是一次“致命”打击
            if (finalImpact < -25) {
                // 严重吃醋
                sim.say("💢 怎么可以这样...", 'bad');
                GameStore.addLog(sim, `目睹 ${actor.name} 出轨，心碎了一地！(好感大幅下降)`, 'jealous');
                sim.addMemory(`看见 ${actor.name} 和别人亲密，我感到被背叛了。`, 'bad', actor.id);
                // [新增] 施加背叛 Buff
                sim.addBuff(BUFFS.cheated);
                // 移除恋爱脑 Buff 如果有
                sim.buffs = sim.buffs.filter(b => b.id !== 'in_love');
                
                // 有概率直接分手 (性格决绝的人)
                if (isLover && sim.mbti.includes('J') && sim.relationships[actor.id].romance < 0) {
                    sim.relationships[actor.id].isLover = false;
                    actor.relationships[sim.id].isLover = false; // 对方也感知到分手
                    GameStore.addLog(sim, `因无法忍受背叛，与 ${actor.name} 分手了。`, 'rel_event');
                }

            } else {
                // 轻微吃醋 / 误会
                sim.say("哼... 😒", 'bad');
                GameStore.addLog(sim, `看到 ${actor.name} 和别人在一起，心里有点酸。(轻微吃醋)`, 'jealous');
                // [新增] 施加轻微吃醋 Buff
                sim.addBuff(BUFFS.jealous);
            }

            SocialLogic.checkRelChange(sim, actor, oldLabelA);
        }
    },

    performSocial(sim: Sim, partner: Sim) {
        // [新增] 综合计算初始契合度
        const mbtiComp = SocialLogic.getCompatibility(sim, partner);
        const goalComp = SocialLogic.getLifeGoalCompatibility(sim, partner); // 人生目标
        const charmDiff = sim.appearanceScore - partner.appearanceScore; // 颜值差距
        
        // 基础好感检查
        if (!sim.relationships[partner.id]) sim.relationships[partner.id] = { friendship: 0, romance: 0, isLover: false, hasRomance: false };
        if (!partner.relationships[sim.id]) partner.relationships[sim.id] = { friendship: 0, romance: 0, isLover: false, hasRomance: false };

        let rel = sim.relationships[partner.id];
        let oldLabel = SocialLogic.getRelLabel(rel);

        // 筛选可用行为
        let availableActions: SocialType[] = SOCIAL_TYPES.filter(type => {
            if (type.type === 'friendship') {
                return rel.friendship >= type.minVal && rel.friendship <= type.maxVal;
            } else if (type.type === 'romance') {
                let romantic = rel.romance >= type.minVal && rel.romance <= type.maxVal;
                if (type.special === 'confess') return !rel.isLover && rel.romance >= 40;
                if (type.special === 'breakup') return rel.isLover && rel.romance < -60;
                if (type.special === 'pickup') return !rel.hasRomance && rel.romance < 20;
                if (!rel.hasRomance && type.special !== 'pickup') return false;
                return romantic;
            }
            return false;
        });

        // 性取向检查
        let canBeRomantic = SocialLogic.checkSexualOrientation(sim, partner);
        // 忠诚度检查 (如果专一且有对象，不进行浪漫互动)
        if (canBeRomantic && sim.faithfulness > 70 && SocialLogic.hasOtherPartner(sim, partner)) {
            canBeRomantic = false;
        }
        else if (canBeRomantic && sim.faithfulness < 40 && SocialLogic.hasOtherPartner(sim, partner)) {
            if (Math.random() > 0.4) canBeRomantic = false;
        }

        if (!canBeRomantic) {
            availableActions = availableActions.filter(t => t.type !== 'romance');
        }

        if (availableActions.length === 0) availableActions = [SOCIAL_TYPES[0]];

        let romanceActions = availableActions.filter(t => t.type === 'romance');
        let finalType: SocialType = availableActions[0];

        // 决定是否进行浪漫行为
        let romanticProb = 0.4;
        if (sim.mbti.includes('F')) romanticProb += 0.2;
        if (sim.faithfulness < 40) romanticProb += 0.2;
        if (sim.hasBuff('in_love')) romanticProb += 0.3;
        // 如果人生目标一致，更倾向于浪漫（志同道合）
        if (goalComp > 10) romanticProb += 0.2;

        if (romanceActions.length > 0 && Math.random() < romanticProb) {
            finalType = romanceActions[Math.floor(Math.random() * romanceActions.length)];
        } else {
            finalType = availableActions[Math.floor(Math.random() * availableActions.length)];
        }

        let success = true;
        
        // [核心修改] 浪漫行为的成功判定逻辑
        if (finalType.type === 'romance') {
            // 1. 对方是否有对象且专一
            if (partner.faithfulness > 70 && SocialLogic.hasOtherPartner(partner, sim)) success = false;
            
            // 2. 颜值差距影响 (癞蛤蟆想吃天鹅肉难)
            // 除非发起者很有钱或者智商很高来弥补
            let charmThreshold = -30;
            if (sim.money > 5000) charmThreshold = -50; // 有钱能使鬼推磨
            if (sim.iq > 80 && partner.mbti.includes('N')) charmThreshold = -40; // 智性恋

            if (charmDiff < charmThreshold) success = Math.random() > 0.8; 

            // 3. 人生目标冲突 (道不同不相为谋)
            if (goalComp < -10) success = Math.random() > 0.7; // 很难成功

            // 4. 基础好感度门槛
            if (finalType.minVal > partner.relationships[sim.id].romance + 15) success = false;
            
            // 分手总是成功的
            if (finalType.special === 'breakup') success = true;
        }

        if (success) {
            // [新增] 成功后的 Buff 施加
            if (finalType.type === 'romance') {
                if (finalType.special === 'pickup') {
                    // 搭讪/初次浪漫 -> 心动 Buff
                    sim.addBuff(BUFFS.crush);
                    partner.addBuff(BUFFS.crush);
                } else if (!finalType.special && rel.isLover) {
                    // 日常甜蜜 -> 甜蜜 Buff (偶尔触发)
                    if (Math.random() > 0.7) {
                        sim.addBuff(BUFFS.sweet_date);
                        partner.addBuff(BUFFS.sweet_date);
                    }
                }
            }

            // 成功后的逻辑分支
            if (finalType.special === 'confess') {
                // 表白判定：需要好感度足够，且没有严重冲突
                if (partner.relationships[sim.id].romance > 40 && goalComp >= -5) {
                    rel.isLover = true;
                    partner.relationships[sim.id].isLover = true;
                    GameStore.addLog(sim, `向 ${partner.name} 表白成功！两人成为了恋人 ❤️`, 'rel_event');
                    GameStore.spawnHeart(sim.pos.x, sim.pos.y);
                    sim.addBuff(BUFFS.in_love);
                    partner.addBuff(BUFFS.in_love);
                    sim.addMemory(`向 ${partner.name} 表白成功，我们在一起了！❤️`, 'life', partner.id);
                    partner.addMemory(`接受了 ${sim.name} 的表白，我们在一起了！❤️`, 'life', sim.id);
                } else {
                    success = false;
                    let reason = goalComp < -5 ? "（觉得性格不合）" : "";
                    GameStore.addLog(sim, `向 ${partner.name} 表白被拒绝了... ${reason}`, 'rel_event');
                    SocialLogic.updateRelationship(sim, partner, 'romance', -10);
                    sim.addMemory(`向 ${partner.name} 表白被拒绝，好难过...`, 'bad', partner.id);
                    // [新增] 表白失败 Buff
                    sim.addBuff(BUFFS.rejected);
                }
            } else if (finalType.special === 'breakup') {
                rel.isLover = false;
                partner.relationships[sim.id].isLover = false;
                GameStore.addLog(sim, `和 ${partner.name} 分手了... 💔`, 'rel_event');
                sim.addBuff(BUFFS.heartbroken);
                partner.addBuff(BUFFS.heartbroken);
                sim.addMemory(`和 ${partner.name} 分手了，往事随风。`, 'bad', partner.id);
                partner.addMemory(`被 ${sim.name} 甩了... 💔`, 'bad', sim.id);
            } else if (finalType.special === 'propose') {
                 // 求婚判定：需要极高好感度 + 目标一致
                 let proposeThreshold = 90;
                 if (goalComp > 10) proposeThreshold = 80; // 目标一致则门槛降低
                 
                 if (partner.relationships[sim.id].romance > proposeThreshold) {
                     GameStore.addLog(sim, `向 ${partner.name} 求婚成功！💍`, 'rel_event');
                     sim.addMemory(`向 ${partner.name} 求婚成功！我们将共度余生。`, 'life', partner.id);
                     partner.addMemory(`答应了 ${sim.name} 的求婚！💍`, 'life', sim.id);
                     sim.say("嫁给我吧！", 'love');
                     partner.say("我愿意！", 'love');
                 } else {
                     sim.say("我们结婚吧...", 'love');
                     partner.say("还没准备好...", 'normal');
                     GameStore.addLog(sim, `向 ${partner.name} 求婚被委婉拒绝了。`, 'rel_event');
                     sim.addMemory(`向 ${partner.name} 求婚被拒，可能太着急了。`, 'bad', partner.id);
                     sim.addBuff(BUFFS.rejected);
                 }
            } else {
                // 普通交互 (调情、拥抱等)
                let val = finalType.val;
                
                // 加上所有属性修正
                val += mbtiComp * 1.5;
                val += goalComp * 0.5; // 人生目标加成

                if (finalType.type === 'romance') {
                    rel.hasRomance = true;
                    partner.relationships[sim.id].hasRomance = true;
                }

                if (finalType.id === 'argue' && rel.romance > 60) {
                    SocialLogic.updateRelationship(sim, partner, 'romance', -15);
                    SocialLogic.updateRelationship(partner, sim, 'romance', -15);
                }

                // 互动双方数值更新
                SocialLogic.updateRelationship(sim, partner, finalType.type, val * sim.socialModifier);
                SocialLogic.updateRelationship(partner, sim, finalType.type, val * partner.socialModifier);

                // 触发吃醋判定 (LogType check)
                if (finalType.logType === 'love') {
                    GameStore.spawnHeart(sim.pos.x, sim.pos.y);
                    GameStore.sims.forEach(s => {
                        if (s.id !== sim.id && s.id !== partner.id) {
                            const dist = Math.sqrt(Math.pow(sim.pos.x - s.pos.x, 2) + Math.pow(sim.pos.y - s.pos.y, 2));
                            if (dist < 150) SocialLogic.triggerJealousy(s, sim, partner);
                        }
                    });
                }

                // 智能对话生成 (发起者)
                let text = SocialLogic.getDialogue(sim, finalType.id, partner);
                sim.say(text, finalType.logType === 'love' ? 'love' : (finalType.logType === 'bad' ? 'bad' : 'normal'));
                
                // 智能对话回应 (回复者)
                setTimeout(() => {
                    let replyType = finalType.id;
                    if (finalType.id === 'pickup') replyType = 'greet'; 
                    if (finalType.id === 'confess') replyType = 'flirt';

                    if (finalType.id === 'joke') {
                        partner.say("哈哈哈哈！", 'normal');
                    } else {
                        const replyText = SocialLogic.getDialogue(partner, replyType, sim);
                        partner.say(replyText, finalType.logType === 'love' ? 'love' : (finalType.logType === 'bad' ? 'bad' : 'normal'));
                    }
                }, 800);

                let sign = val > 0 ? '+' : '';
                let labelStr = finalType.type === 'romance' ? '浪漫' : '友谊';
                if (finalType.special !== 'confess' && finalType.special !== 'breakup' && finalType.special !== 'propose') {
                    GameStore.addLog(sim, `与 ${partner.name} ${finalType.label} (${labelStr} ${sign}${Math.floor(val)})`, finalType.logType);
                }
            }
        } else {
            // 失败逻辑
            sim.say("...", 'bad');
            setTimeout(() => partner.say("不要...", 'bad'), 800);
            
            // 如果是尝试浪漫失败，会扣分，但高情商扣的少 (在 updateRelationship 内部处理)
            SocialLogic.updateRelationship(sim, partner, finalType.type, -5);
            GameStore.addLog(sim, `想对 ${partner.name} ${finalType.label} 但被拒绝了。`, 'bad');
            
            // [新增] 浪漫互动失败 Buff
            if (finalType.type === 'romance') {
                sim.addBuff(BUFFS.rejected);
            }
        }

        SocialLogic.checkRelChange(sim, partner, oldLabel);
    }
};