import React, { useRef, useEffect, useState } from 'react';
import { GameStore, Sim } from '../../utils/simulation';
import { drawAvatarHead } from '../../utils/render/pixelArt';
import { SKILLS, ORIENTATIONS, AGE_CONFIG, HAIR_STYLE_NAMES } from '../../constants';
import { SimData, SimAction, NeedType, AgeStage } from '../../types';

interface InspectorProps {
    selectedId: string | null;
    sims: Sim[];
}

const InspectorFace: React.FC<{ sim: SimData, size?: number }> = ({ sim, size = 64 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, size, size);
                // Adjust drawing parameters based on size
                const headSize = size === 64 ? 20 : 12;
                const centerX = size / 2;
                const centerY = size === 64 ? 40 : 25;
                drawAvatarHead(ctx, centerX, centerY, headSize, sim);
            }
        }
    }, [sim, size]);
    return <canvas ref={canvasRef} width={size} height={size} />;
};

const SkillBar: React.FC<{ val: number }> = ({ val }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`w-3 h-3 rounded-sm border border-black/20 ${i <= Math.floor(val / 20) ? 'bg-accent' : 'bg-white/10'}`} />
        ))}
    </div>
);

const RelBar: React.FC<{ val: number, type: 'friend' | 'romance' }> = ({ val, type }) => {
    const widthPercent = Math.min(50, (Math.abs(val) / 100) * 50);
    const isPositive = val >= 0;
    const leftPercent = isPositive ? 50 : 50 - widthPercent;
    let color = isPositive ? (type === 'friend' ? 'bg-success' : 'bg-love') : 'bg-danger';

    return (
        <div className="flex items-center gap-2 text-[9px] text-gray-500 w-full">
            <span className="w-3 text-center">{type === 'friend' ? '友' : '爱'}</span>
            <div className="flex-1 h-2 bg-black/40 rounded-full relative overflow-hidden border border-white/5">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 z-10"></div>
                <div className={`absolute top-0 bottom-0 ${color} transition-all duration-300`} style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}></div>
            </div>
            <span className={`w-6 text-right font-mono ${val < 0 ? 'text-danger' : 'text-gray-400'}`}>{Math.floor(val)}</span>
        </div>
    );
};

// [优化] 使用 SimAction 替换魔法字符串
const STATUS_MAP: Record<string, string> = {
    [SimAction.Idle]: '发呆', 
    [SimAction.Moving]: '移动中', 
    [SimAction.Commuting]: '通勤中', 
    [SimAction.Wandering]: '闲逛',
    [SimAction.Working]: '打工', 
    [SimAction.Sleeping]: '睡觉', 
    [SimAction.Eating]: '进食', 
    [SimAction.Talking]: '聊天',
    [SimAction.Using]: '忙碌', 
    [SimAction.WatchingMovie]: '看电影', 
    [SimAction.Phone]: '玩手机',
    [SimAction.CommutingSchool]: '上学路上',
    [SimAction.Schooling]: '在校学习',
    [SimAction.PickingUp]: '接送中',
    [SimAction.Escorting]: '护送中',
    [SimAction.BeingEscorted]: '被护送',
    [SimAction.Waiting]: '等待中'
};

// --- Sub Components ---

const StatusTab: React.FC<{ sim: Sim }> = ({ sim }) => {
    let statusText = STATUS_MAP[sim.action] || sim.action;
    if (sim.action === SimAction.Using && sim.interactionTarget) statusText = `使用 ${sim.interactionTarget.label}`;
    const displayStatus = (sim.bubble?.type === 'act' && sim.bubble?.text && sim.bubble?.timer > 0) ? sim.bubble.text : statusText;

    return (
        <>
            <div>
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">当前状态</div>
                <div className="bg-black/30 rounded px-3 py-2 flex items-center justify-between border border-white/5 shadow-inner">
                    <span className="text-sm text-act font-bold flex items-center gap-2 truncate max-w-[200px]">{displayStatus}</span>
                    <span className="text-xs text-gray-400">Mood: {Math.floor(sim.mood)}</span>
                </div>
            </div>
            <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">基本需求</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                        { l: '饥饿', v: sim.needs[NeedType.Hunger], c: '#e17055' }, 
                        { l: '精力', v: sim.needs[NeedType.Energy], c: '#6c5ce7' },
                        { l: '社交', v: sim.needs[NeedType.Social], c: '#00b894' }, 
                        { l: '娱乐', v: sim.needs[NeedType.Fun], c: '#fdcb6e' },
                        { l: '卫生', v: sim.needs[NeedType.Hygiene], c: '#74b9ff' }, 
                        { l: '如厕', v: sim.needs[NeedType.Bladder], c: '#fab1a0' },
                    ].map(s => (
                        <div key={s.l}>
                            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5"><span>{s.l}</span></div>
                            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full transition-all duration-500" style={{ width: `${s.v}%`, background: s.c }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">状态 (Buffs)</div>
                {sim.buffs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {sim.buffs.map(b => (
                            <span key={b.id} className={`text-[10px] px-2 py-1 rounded border ${b.type === 'good' ? 'bg-success/10 border-success/30 text-success' : 'bg-danger/10 border-danger/30 text-danger'}`}>{b.label}</span>
                        ))}
                    </div>
                ) : <span className="text-[10px] text-gray-600 italic">无特殊状态</span>}
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">人际关系</div>
                    <div className={`text-[10px] font-mono flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5 ${sim.faithfulness > 80 ? 'text-success' : 'text-gray-300'}`}>
                        <span>❤️ 专一: {Math.floor(sim.faithfulness)}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    {Object.keys(sim.relationships).sort((a, b) => {
                        const rA = sim.relationships[a], rB = sim.relationships[b];
                        const isFamA = rA.kinship && rA.kinship !== 'none' ? 1 : 0, isFamB = rB.kinship && rB.kinship !== 'none' ? 1 : 0;
                        if (isFamA !== isFamB) return isFamB - isFamA;
                        return (Math.abs(rB.friendship) + Math.abs(rB.romance)) - (Math.abs(rA.friendship) + Math.abs(rA.romance));
                    }).map(targetId => {
                        const targetSim = GameStore.sims.find(s => s.id === targetId);
                        if (!targetSim) return null;
                        const rel = sim.relationships[targetId];
                        const label = sim.getRelLabel(rel);
                        const isFamily = rel.kinship && rel.kinship !== 'none';
                        return (
                            <div key={targetId} className={`p-2 rounded border transition-colors hover:bg-white/10 ${isFamily ? 'bg-blue-900/10 border-blue-500/20' : 'bg-white/5 border-white/5'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.stopPropagation(); GameStore.selectedSimId = targetSim.id; GameStore.notify(); }}>
                                        <div className="w-4 h-4 rounded-full" style={{ background: targetSim.skinColor }}></div>
                                        <span className="text-[11px] font-bold text-gray-200 group-hover:text-white group-hover:underline transition-all">{targetSim.name} 🔗</span>
                                    </div>
                                    <span className={`text-[9px] px-1.5 rounded ${isFamily ? 'bg-blue-500/20 text-blue-300' : (rel.isLover ? 'bg-love/20 text-love' : 'bg-black/30 text-gray-400')}`}>{label}</span>
                                </div>
                                <div className="flex flex-col gap-1 mt-1">
                                    <RelBar val={rel.friendship} type="friend" />
                                    {(rel.hasRomance || rel.romance !== 0 || rel.isSpouse) && <RelBar val={rel.romance} type="romance" />}
                                </div>
                            </div>
                        );
                    })}
                    {Object.keys(sim.relationships).length === 0 && <span className="text-[11px] text-gray-600 italic text-center py-2">还未认识任何人...</span>}
                </div>
            </div>
        </>
    );
};

// Tree Node Component
const TreeNode: React.FC<{ 
    sim: SimData | null, 
    label: string, 
    isSelf?: boolean,
    onClick?: (id: string) => void 
}> = ({ sim, label, isSelf, onClick }) => {
    if (!sim) {
        return (
            <div className="flex flex-col items-center gap-1 opacity-30">
                <div className="w-10 h-10 rounded-full border border-dashed border-white/30 bg-white/5 flex items-center justify-center">
                    <span className="text-[10px] text-gray-500">?</span>
                </div>
                <span className="text-[9px] text-gray-500">{label}</span>
            </div>
        );
    }

    return (
        <div 
            className={`flex flex-col items-center gap-1 group cursor-pointer ${isSelf ? 'scale-110' : ''}`}
            onClick={() => onClick && onClick(sim.id)}
        >
            <div className={`
                w-10 h-10 rounded-full border-2 overflow-hidden bg-black/40 relative transition-all group-hover:border-white
                ${isSelf ? 'border-accent shadow-[0_0_10px_rgba(162,155,254,0.5)]' : 'border-white/20'}
            `}>
                <InspectorFace sim={sim} size={40} />
            </div>
            <div className="flex flex-col items-center leading-none">
                <span className={`text-[9px] font-bold truncate max-w-[60px] ${isSelf ? 'text-accent' : 'text-gray-300 group-hover:text-white'}`}>
                    {sim.name}
                </span>
                <span className="text-[8px] text-gray-500">{label}</span>
            </div>
        </div>
    );
};

const FamilyTab: React.FC<{ sim: Sim, sims: Sim[] }> = ({ sim, sims }) => {
    const getSim = (id: string | null) => sims.find(s => s.id === id);
    const partner = getSim(sim.partnerId);
    const father = getSim(sim.fatherId);
    const mother = getSim(sim.motherId);
    const children = sim.childrenIds.map(id => getSim(id)).filter(Boolean) as SimData[];

    const handleSelect = (id: string) => {
        GameStore.selectedSimId = id;
        GameStore.notify();
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Family Lore Section */}
            {sim.familyLore && (
                <div className="p-3 rounded bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/20 text-[11px] shadow-sm">
                    <div className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>📜 家庭历史</span>
                    </div>
                    <div className="leading-snug text-gray-300 italic">
                        "{sim.familyLore}"
                    </div>
                </div>
            )}

            {/* Tree Structure */}
            <div className="flex flex-col items-center relative py-2">
                {/* Generation 1: Parents */}
                <div className="flex justify-center gap-8 relative z-10 mb-6">
                    <TreeNode sim={father || null} label="父亲" onClick={handleSelect} />
                    <TreeNode sim={mother || null} label="母亲" onClick={handleSelect} />
                    
                    {/* Parent Connector Line */}
                    {(father || mother) && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full h-4 pointer-events-none">
                            <div className="w-[60px] h-full border-b border-white/20 mx-auto rounded-b-lg"></div>
                            <div className="w-px h-6 bg-white/20 mx-auto"></div>
                        </div>
                    )}
                </div>

                {/* Generation 2: Self & Partner */}
                <div className="flex justify-center gap-10 relative z-10 mb-6">
                    <TreeNode sim={sim} label="我" isSelf onClick={handleSelect} />
                    {partner && (
                        <>
                            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-8 h-px bg-pink-500/30"></div>
                            <TreeNode sim={partner} label="配偶" onClick={handleSelect} />
                        </>
                    )}
                </div>

                {/* Generation 3: Children */}
                {children.length > 0 && (
                    <div className="w-full flex flex-col items-center relative">
                        {/* Connector from Parent to Children */}
                        <div className="w-px h-6 bg-white/20 absolute -top-6"></div>
                        <div className="w-[80%] border-t border-white/20 absolute top-0"></div>
                        
                        <div className="flex justify-center gap-4 flex-wrap pt-4">
                            {children.map(child => (
                                <div key={child.id} className="relative flex flex-col items-center">
                                    <div className="w-px h-4 bg-white/20 absolute -top-4"></div>
                                    <TreeNode 
                                        sim={child} 
                                        label="子女" 
                                        onClick={handleSelect}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {children.length === 0 && (
                    <div className="text-[10px] text-gray-600 italic mt-2">- 暂无后代 -</div>
                )}
            </div>
        </div>
    );
};

const AttrTab: React.FC<{ sim: Sim }> = ({ sim }) => {
    const hairName = HAIR_STYLE_NAMES[(sim.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 17)] || '未知发型';
    const jobTitle = sim.ageStage === AgeStage.Infant ? '吃奶' : (sim.ageStage === AgeStage.Toddler ? '幼儿园' : (sim.ageStage === AgeStage.Child ? '小学生' : (sim.ageStage === AgeStage.Teen ? '中学生' : sim.job.title)));
    const homeUnit = GameStore.housingUnits.find(u => u.id === sim.homeId);
    
    return (
        <>
            <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">个人特征</div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex flex-col gap-0.5 col-span-2 pb-2 mb-2 border-b border-white/5">
                        <span className="text-gray-500 text-[9px]">家庭住址</span>
                        <div className="flex justify-between items-center">
                            <span className={`${sim.homeId ? 'text-gray-200' : 'text-gray-500 italic'}`}>{homeUnit ? homeUnit.name : '无家可归'}</span>
                            {!sim.homeId && <button onClick={() => GameStore.assignRandomHome(sim)} className="text-[9px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 transition-colors">分配住址</button>}
                        </div>
                    </div>
                    
                    {/* Character Traits */}
                    <div className="flex flex-col gap-1 col-span-2 pb-2 mb-2 border-b border-white/5">
                        <span className="text-gray-500 text-[9px]">性格特质 (Traits)</span>
                        <div className="flex flex-wrap gap-1">
                            {sim.traits && sim.traits.length > 0 ? (
                                sim.traits.map(t => (
                                    <span key={t} className="text-[10px] bg-white/10 text-gray-200 px-1.5 py-0.5 rounded border border-white/10">{t}</span>
                                ))
                            ) : (
                                <span className="text-gray-600 text-[10px] italic">无明显特质</span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5"><span className="text-gray-500 text-[9px]">姓氏</span><span className="text-gray-200 font-bold">{sim.surname}</span></div>
                    <div className="flex flex-col gap-0.5"><span className="text-gray-500 text-[9px]">发型 / 色值</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{background: sim.hairColor}}></div><div className="flex flex-col leading-none justify-center"><span className="text-gray-200 font-bold text-[10px]">{hairName}</span><span className="text-gray-500 font-mono text-[8px] scale-90 origin-left">{sim.hairColor}</span></div></div></div>
                    <div className="flex flex-col gap-0.5"><span className="text-gray-500 text-[9px]">身高</span><span className="text-gray-200 font-mono">{sim.height} cm</span></div>
                    <div className="flex flex-col gap-0.5"><span className="text-gray-500 text-[9px]">体重</span><span className="text-gray-200 font-mono">{sim.weight} kg</span></div>
                    {[
                        { l: '魅力值', v: sim.appearanceScore, c: 'bg-gradient-to-r from-blue-400 to-pink-400', txt: sim.appearanceScore > 80 ? 'text-love' : 'text-gray-300' },
                        { l: '幸运', v: sim.luck, c: 'bg-gradient-to-r from-yellow-300 to-orange-400', txt: sim.luck > 80 ? 'text-warning' : 'text-gray-300' },
                        { l: '体质', v: sim.constitution, c: 'bg-gradient-to-r from-emerald-400 to-green-500', txt: sim.constitution > 80 ? 'text-success' : 'text-gray-300' },
                        { l: '智商', v: sim.iq, c: 'bg-gradient-to-r from-indigo-400 to-purple-500', txt: sim.iq > 80 ? 'text-purple-300' : 'text-gray-300' },
                        { l: '情商', v: sim.eq, c: 'bg-gradient-to-r from-cyan-400 to-blue-500', txt: sim.eq > 80 ? 'text-blue-400' : 'text-gray-300' },
                    ].map(attr => (
                        <div key={attr.l} className="flex flex-col gap-0.5 col-span-2 mt-1 pt-1 border-t border-white/5">
                            <div className="flex justify-between items-center"><span className="text-gray-500 text-[9px]">{attr.l}</span><span className={`font-bold ${attr.txt}`}>{attr.v}/100</span></div>
                            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mt-1"><div className={`h-full ${attr.c}`} style={{width: `${attr.v}%`}}></div></div>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">财务 & 职业</div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-2 rounded border border-white/5"><div className="text-[10px] text-gray-400">总资产</div><div className="text-lg font-bold text-warning">${sim.money}</div></div>
                    <div className="bg-white/5 p-2 rounded border border-white/5"><div className="text-[10px] text-gray-400">当前职位</div><div className="text-xs font-bold text-gray-200">{jobTitle} {sim.job.id !== 'unemployed' && <span className="text-[9px] opacity-50">Lv.{sim.job.level}</span>}</div></div>
                    <div className="bg-white/5 p-2 rounded border border-white/5"><div className="text-[10px] text-gray-400">今日预算</div><div className="text-sm font-bold text-gray-300">${sim.dailyBudget}</div></div>
                    <div className="bg-white/5 p-2 rounded border border-white/5"><div className="text-[10px] text-gray-400">今日收支</div><div className="flex justify-between items-end"><span className="text-sm font-bold text-success">+${sim.dailyIncome || 0}</span><span className="text-xs font-bold text-danger">-${sim.dailyExpense}</span></div></div>
                </div>
            </div>
            <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">技能等级</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {Object.entries(sim.skills).map(([key, val]) => {
                        const skillVal = val as number;
                        if (skillVal < 5) return null; 
                        const label = SKILLS.find(s => s.id === key)?.label || key;
                        return (
                            <div key={key} className="flex justify-between items-center bg-white/5 px-2 py-1 rounded border border-white/5"><span className="text-[10px] text-gray-300">{label}</span><SkillBar val={skillVal} /></div>
                        );
                    })}
                    {Object.values(sim.skills).every(v => (v as number) < 5) && <span className="text-[10px] text-gray-600 italic col-span-2">暂无技能</span>}
                </div>
            </div>
        </>
    );
};

const Inspector: React.FC<InspectorProps> = ({ selectedId, sims }) => {
    const [tab, setTab] = useState<'status' | 'attr' | 'memories' | 'family'>('status');
    
    // [新增] 拖拽相关状态
    const panelRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: window.innerWidth - 360, y: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const sim = sims.find(s => s.id === selectedId);
    
    useEffect(() => { 
        setTab('status'); 
    }, [selectedId]);

    // [新增] 全局拖拽事件监听
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // [新增] 开始拖拽处理
    const startDrag = (e: React.MouseEvent) => {
        if (panelRef.current) {
            setIsDragging(true);
            const rect = panelRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    if (!sim) return null;

    let moodColor = sim.mood > 80 ? '#00b894' : (sim.mood < 40 ? '#ff7675' : '#b2bec3');
    const genderIcon = sim.gender === 'M' ? '♂' : '♀';
    const genderColor = sim.gender === 'M' ? 'text-blue-400' : 'text-pink-400';
    const ageInfo = AGE_CONFIG[sim.ageStage];
    let relStatus = '单身', relStatusClass = 'bg-white/5 border-white/10 text-gray-400';
    if (sim.partnerId) {
        const rel = sim.relationships[sim.partnerId];
        if (rel && rel.isSpouse) { relStatus = '已婚'; relStatusClass = 'bg-love/10 border-love/30 text-love font-bold'; }
        else { relStatus = '恋爱中'; relStatusClass = 'bg-pink-500/10 border-pink-500/30 text-pink-300'; }
    }
    const jobTitle = sim.ageStage === AgeStage.Infant ? '吃奶' : (sim.ageStage === AgeStage.Toddler ? '幼儿园' : (sim.ageStage === AgeStage.Child ? '小学生' : (sim.ageStage === AgeStage.Teen ? '中学生' : sim.job.title)));

    return (
        <div 
            ref={panelRef}
            style={{ left: position.x, top: position.y }}
            className="fixed w-[340px] max-h-[calc(100vh-160px)] flex flex-col bg-[#121212]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl pointer-events-auto animate-[fadeIn_0.2s_ease-out] text-[#e0e0e0] z-40"
        >
            {/* Header */}
            <div 
                onMouseDown={startDrag}
                className="flex gap-4 p-4 border-b border-white/10 shrink-0 bg-white/5 cursor-move select-none rounded-t-xl"
            >
                <div className="w-16 h-16 bg-black/40 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative pointer-events-none">
                    <InspectorFace sim={sim} />
                    <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-[#121212]" style={{ background: moodColor }}></div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold truncate tracking-tight flex items-center gap-2">{sim.name}<span className={`text-sm font-bold ${genderColor}`}>{genderIcon}</span></h2>
                        <button 
                            onMouseDown={(e) => e.stopPropagation()} 
                            onClick={() => { GameStore.selectedSimId = null; GameStore.notify(); }} 
                            className="text-white/30 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
                        <span className="text-[10px] px-2 py-0.5 rounded border" style={{ color: ageInfo.color, borderColor: ageInfo.color + '40', background: ageInfo.color + '20' }}>{ageInfo.label} ({Math.floor(sim.age)}岁)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30" title="星座">{sim.zodiac.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-200 border border-pink-500/30" title="性取向">{ORIENTATIONS.find(o => o.type === sim.orientation)?.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${relStatusClass}`} title="情感状态">{relStatus}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-accent/20 text-accent font-bold border border-accent/20" title="MBTI">{sim.mbti}</span>
                        {sim.isPregnant && <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 animate-pulse">🤰 孕期</span>}
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${sim.health > 80 ? 'border-green-500/30 text-green-300' : (sim.health < 30 ? 'border-red-500/30 text-red-300' : 'border-white/10 text-gray-300')}`}>HP: {Math.floor(sim.health)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30" title="职业">{jobTitle}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20" title="人生目标">🎯 {sim.lifeGoal}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                {[{ id: 'status', label: '状态' }, { id: 'attr', label: '属性' }, { id: 'family', label: '族谱' }, { id: 'memories', label: `记忆 (${sim.memories.length})` }].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex-1 py-2 text-[10px] font-bold transition-colors uppercase ${tab === t.id ? 'bg-white/10 text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'}`}>{t.label}</button>
                ))}
            </div>

            {/* Content */}
            <div 
                className="overflow-y-auto p-4 custom-scrollbar flex flex-col gap-6"
                onMouseDown={(e) => e.stopPropagation()} 
            >
                {tab === 'status' && <StatusTab sim={sim} />}
                {tab === 'family' && <FamilyTab sim={sim} sims={sims} />}
                {tab === 'attr' && <AttrTab sim={sim} />}
                {tab === 'memories' && (
                    <div className="flex flex-col gap-2">
                        {sim.memories.length > 0 ? sim.memories.map(mem => (
                            <div key={mem.id} className={`p-2 rounded bg-white/5 border text-[11px] flex flex-col gap-1 ${mem.type === 'job' ? 'border-blue-500/30' : (mem.type === 'social' ? 'border-green-500/30' : (mem.type === 'life' ? 'border-pink-500/30 text-pink-100' : (mem.type === 'bad' ? 'border-red-500/30 text-red-200' : (mem.type === 'family' ? 'border-yellow-500/30 text-yellow-100' : 'border-white/10 text-gray-300'))))}`}>
                                <div className="flex justify-between items-center opacity-50 text-[9px]"><span className="font-mono">{mem.time}</span><span>{mem.type === 'job' ? '💼' : (mem.type === 'social' ? '💬' : (mem.type === 'life' ? '❤️' : (mem.type === 'bad' ? '💔' : (mem.type === 'family' ? '👨‍👩‍👧' : '📝'))))}</span></div>
                                <div className="leading-snug">{mem.text}</div>
                            </div>
                        )) : <div className="text-center py-10 opacity-30 flex flex-col items-center gap-2"><span className="text-2xl">🍃</span><span className="text-[10px]">平平淡淡才是真</span></div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inspector;