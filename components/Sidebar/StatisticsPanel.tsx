import React, { useEffect, useState } from 'react';
import { GameStore, Sim } from '../../utils/simulation';
import { JOBS } from '../../constants';

interface StatsPanelProps {
    onClose: () => void;
}

const StatRow: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color = 'text-white' }) => (
    <div className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
        <span className="text-[10px] text-gray-400">{label}</span>
        <span className={`text-[11px] font-bold font-mono ${color}`}>{value}</span>
    </div>
);

const ProgressBar: React.FC<{ label: string, val: number, max: number, color: string }> = ({ label, val, max, color }) => {
    const pct = Math.min(100, (val / max) * 100);
    return (
        <div className="mb-2">
            <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-300">{val}人</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }}></div>
            </div>
        </div>
    );
};

const StatisticsPanel: React.FC<StatsPanelProps> = ({ onClose }) => {
    const [sims, setSims] = useState<Sim[]>([]);

    useEffect(() => {
        setSims([...GameStore.sims]);
        const unsub = GameStore.subscribe(() => setSims([...GameStore.sims]));
        return unsub;
    }, []);

    // 1. 职业统计
    const jobStats: Record<string, number> = {};
    sims.forEach(s => {
        const type = s.job.id === 'unemployed' ? '自由职业' : (
            s.job.companyType === 'internet' ? '互联网' :
            s.job.companyType === 'design' ? '设计' :
            s.job.companyType === 'business' ? '商业' :
            s.job.companyType === 'store' ? '零售' :
            s.job.companyType === 'restaurant' ? '餐饮' :
            s.job.companyType === 'library' ? '图书' : '其他'
        );
        jobStats[type] = (jobStats[type] || 0) + 1;
    });

    // 2. 关系统计
    let loverPairs = 0;
    let friendPairs = 0; // 友谊 > 60
    let enemyPairs = 0;  // 友谊 < -60
    
    // 使用 Set 避免重复计数 (A-B 和 B-A)
    const processedPairs = new Set<string>();
    
    sims.forEach(s => {
        Object.keys(s.relationships).forEach(targetId => {
            const key = [s.id, targetId].sort().join('-');
            if (processedPairs.has(key)) return;
            processedPairs.add(key);
            
            const rel = s.relationships[targetId];
            if (rel.isLover) loverPairs++;
            else if (rel.friendship > 60) friendPairs++;
            else if (rel.friendship < -60) enemyPairs++;
        });
    });

    // 3. 状态统计
    const happyCount = sims.filter(s => s.mood > 80).length;
    const sadCount = sims.filter(s => s.mood < 40).length;
    const smellyCount = sims.filter(s => s.needs.hygiene < 30 || s.hasBuff('smelly')).length;
    const hungryCount = sims.filter(s => s.needs.hunger < 30).length;
    const richCount = sims.filter(s => s.money > 5000).length;
    const brokeCount = sims.filter(s => s.money < 200).length;

    return (
        // [修复] 添加了 pointer-events-auto 类，因为父容器是 pointer-events-none
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out] pointer-events-auto">
            <div className="w-full max-w-md bg-[#121212] border border-white/20 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        📊 城镇统计数据
                        <span className="text-xs font-normal text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">POP: {sims.length}</span>
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>
                
                <div className="overflow-y-auto p-4 custom-scrollbar grid grid-cols-2 gap-6">
                    
                    {/* 状态概览 */}
                    <div className="col-span-2 bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">当前状态</div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            <StatRow label="😄 开心" value={happyCount} color="text-success" />
                            <StatRow label="😭 难过" value={sadCount} color="text-danger" />
                            <StatRow label="🤢 发臭/邋遢" value={smellyCount} color="text-yellow-600" />
                            <StatRow label="🍖 饥饿" value={hungryCount} color="text-orange-400" />
                            <StatRow label="💰 富裕 (>5k)" value={richCount} color="text-warning" />
                            <StatRow label="💸 贫穷 (<200)" value={brokeCount} color="text-gray-400" />
                        </div>
                    </div>

                    {/* 社会关系 */}
                    <div className="col-span-1 bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">社会关系网</div>
                        <div className="flex flex-col gap-1">
                            <StatRow label="❤️ 情侣对数" value={loverPairs} color="text-love" />
                            <StatRow label="🤝 好友关系" value={friendPairs} color="text-act" />
                            <StatRow label="⚔️ 死对头" value={enemyPairs} color="text-gray-500" />
                        </div>
                    </div>

                    {/* 职业分布 */}
                    <div className="col-span-1 bg-white/5 rounded-lg p-3 border border-white/5">
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">职业分布</div>
                        <div className="flex flex-col">
                            {Object.entries(jobStats)
                                .sort(([,a], [,b]) => b - a)
                                .map(([type, count]) => (
                                    <div key={type} className="flex justify-between items-center text-[10px] mb-1">
                                        <span className="text-gray-400">{type}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-400" style={{ width: `${(count / sims.length) * 100}%` }}></div>
                                            </div>
                                            <span className="text-gray-200 w-3 text-right">{count}</span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                </div>
                
                <div className="p-3 border-t border-white/10 text-center">
                    <p className="text-[9px] text-gray-600">数据实时更新 · Pixel Life Observer</p>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;