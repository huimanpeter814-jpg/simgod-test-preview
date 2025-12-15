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
        for (let i = 0; i < 4; i++) if (sim.mbti[i] === partner.mbti[i]) score++;
        if (sim.zodiac.element === partner.zodiac.element) score += 2;
        else if (ELE_COMP[sim.zodiac.element].includes(partner.zodiac.element)) score += 1;
        else score -= 1;
        return Math.max(0, score);
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
        
        // [新增] 属性对关系增减的修正
        // 高情商(EQ)会让所有正向社交效果更好，负向效果减弱
        let modifier = 1.0;
        if (delta > 0) {
            modifier += (sim.eq - 50) * 0.01; // EQ 80 -> +30%
        } else {
            modifier -= (sim.eq - 50) * 0.005; // EQ 80 -> -15% bad effect
        }
        
        // 高魅力(Appearance)对浪漫关系加成极大
        if (type === 'romance' && delta > 0) {
            modifier += (sim.appearanceScore - 50) * 0.015; // 魅力 80 -> +45% romance
        }

        const finalDelta = delta * modifier;

        if (type === 'friendship') {
            rel.friendship = Math.max(-100, Math.min(100, rel.friendship + finalDelta));
        } else if (type === 'romance') {
            rel.romance = Math.max(-100, Math.min(100, rel.romance + finalDelta));
            rel.friendship = Math.max(-100, Math.min(100, rel.friendship + finalDelta * 0.3));
        }
    },

    triggerJealousy(sim: Sim, actor: Sim, target: Sim) {
        let sensitivity = 60;
        if (sim.mbti.includes('F')) sensitivity -= 10;
        if (sim.zodiac.element === 'water' || sim.zodiac.element === 'fire') sensitivity -= 10;

        let relActor = sim.relationships[actor.id]?.romance || 0;
        let relTarget = sim.relationships[target.id]?.romance || 0;

        if (relActor > sensitivity || relTarget > sensitivity) {
            sim.say("💢 吃醋!", 'bad');
            let oldLabelA = SocialLogic.getRelLabel(sim.relationships[actor.id] || {});
            let oldLabelT = SocialLogic.getRelLabel(sim.relationships[target.id] || {});

            const impact = -40 * sim.socialModifier;

            SocialLogic.updateRelationship(sim, actor, 'friendship', impact);
            SocialLogic.updateRelationship(sim, actor, 'romance', impact);
            SocialLogic.updateRelationship(sim, target, 'friendship', impact);
            SocialLogic.updateRelationship(sim, target, 'romance', impact);

            SocialLogic.checkRelChange(sim, actor, oldLabelA);
            SocialLogic.checkRelChange(sim, target, oldLabelT);

            GameStore.addLog(sim, `目睹 ${actor.name} 和 ${target.name} 亲热，吃醋了！`, 'jealous');
            // [记录] 吃醋记忆
            sim.addMemory(`看见 ${actor.name} 和 ${target.name} 在一起，心里酸酸的。`, 'bad', actor.id);
        }
    },

    performSocial(sim: Sim, partner: Sim) {
        const comp = SocialLogic.getCompatibility(sim, partner);
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

        let canBeRomantic = SocialLogic.checkSexualOrientation(sim, partner);
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

        let romanticProb = 0.4;
        if (sim.mbti.includes('F')) romanticProb += 0.2;
        if (sim.faithfulness < 40) romanticProb += 0.2;
        if (sim.hasBuff('in_love')) romanticProb += 0.3;

        if (romanceActions.length > 0 && Math.random() < romanticProb) {
            finalType = romanceActions[Math.floor(Math.random() * romanceActions.length)];
        } else {
            finalType = availableActions[Math.floor(Math.random() * availableActions.length)];
        }

        let success = true;
        if (finalType.type === 'romance') {
            if (partner.faithfulness > 70 && SocialLogic.hasOtherPartner(partner, sim)) success = false;
            
            // [新增] 颜值差距影响搭讪/表白成功率
            // 如果发起方颜值远低于对方，成功率降低
            const charmDiff = sim.appearanceScore - partner.appearanceScore;
            if (charmDiff < -30) success = Math.random() > 0.6; // 颜值差距过大，较难成功

            if (finalType.minVal > partner.relationships[sim.id].romance + 15) success = false;
            if (finalType.special === 'breakup') success = true;
        }

        if (success) {
            if (finalType.special === 'confess') {
                if (partner.relationships[sim.id].romance > 40) {
                    rel.isLover = true;
                    partner.relationships[sim.id].isLover = true;
                    GameStore.addLog(sim, `向 ${partner.name} 表白成功！两人成为了恋人 ❤️`, 'rel_event');
                    GameStore.spawnHeart(sim.pos.x, sim.pos.y);
                    sim.addBuff(BUFFS.in_love);
                    partner.addBuff(BUFFS.in_love);
                    // [记录] 表白成功记忆
                    sim.addMemory(`向 ${partner.name} 表白成功，我们在一起了！❤️`, 'life', partner.id);
                    partner.addMemory(`接受了 ${sim.name} 的表白，我们在一起了！❤️`, 'life', sim.id);
                } else {
                    success = false;
                    GameStore.addLog(sim, `向 ${partner.name} 表白被拒绝了...`, 'rel_event');
                    SocialLogic.updateRelationship(sim, partner, 'romance', -10);
                    // [记录] 表白失败记忆
                    sim.addMemory(`向 ${partner.name} 表白被拒绝，好难过...`, 'bad', partner.id);
                }
            } else if (finalType.special === 'breakup') {
                rel.isLover = false;
                partner.relationships[sim.id].isLover = false;
                GameStore.addLog(sim, `和 ${partner.name} 分手了... 💔`, 'rel_event');
                sim.addBuff(BUFFS.heartbroken);
                partner.addBuff(BUFFS.heartbroken);
                // [记录] 分手记忆
                sim.addMemory(`和 ${partner.name} 分手了，往事随风。`, 'bad', partner.id);
                partner.addMemory(`被 ${sim.name} 甩了... 💔`, 'bad', sim.id);
            } else if (finalType.special === 'propose') {
                 if (partner.relationships[sim.id].romance > 90) {
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
                 }
            } else {
                let val = finalType.val;
                val += comp * 1.5;

                if (finalType.type === 'romance') {
                    rel.hasRomance = true;
                    partner.relationships[sim.id].hasRomance = true;
                }

                if (finalType.id === 'argue' && rel.romance > 60) {
                    SocialLogic.updateRelationship(sim, partner, 'romance', -15);
                    SocialLogic.updateRelationship(partner, sim, 'romance', -15);
                }

                SocialLogic.updateRelationship(sim, partner, finalType.type, val * sim.socialModifier);
                SocialLogic.updateRelationship(partner, sim, finalType.type, val * partner.socialModifier);

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
            sim.say("...", 'bad');
            setTimeout(() => partner.say("不要...", 'bad'), 800);
            SocialLogic.updateRelationship(sim, partner, finalType.type, -5);
            GameStore.addLog(sim, `想对 ${partner.name} ${finalType.label} 但被拒绝了。`, 'bad');
        }

        SocialLogic.checkRelChange(sim, partner, oldLabel);
    }
};