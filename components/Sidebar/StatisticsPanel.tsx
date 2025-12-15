import React, { useEffect, useState } from 'react';
import { GameStore, Sim } from '../../utils/simulation';
import { JOBS } from '../../constants';

interface StatsPanelProps {
    onClose: () => void;
}

// 简单的详情列表项
const SimListItem: React.FC<{ name: string, sub?: string, id: string }> = ({ name, sub, id }) => (
    <div 
        className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 px-2 rounded transition-colors"
        onClick={() => {
            GameStore.selectedSimId = id;
            GameStore.notify();
        }}
    >
        <span className="text-[11px] text-gray-200 font-bold">{name}</span>
        {sub && <span className="text-[10px] text-gray-500">{sub}</span>}
    </div>
);

// 统计行组件 (支持点击)
const StatRow: React.FC<{ label: string, value: number, color?: string, onClick?: () => void }> = ({ label, value, color = 'text-white', onClick }) => (
    <div 
        className={`flex justify-between items-center py-1 border-b border-white/5 last:border-0 ${onClick && value > 0 ? 'cursor-pointer group' : ''}`}
        onClick={value > 0 ? onClick : undefined}
    >
        <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors">{label}</span>
        <div className="flex items-center gap-1">
            <span className={`text-[11px] font-bold font-mono ${color}`}>{value}</span>
            {onClick && value > 0 && <span className="text-[9px] text-gray-600 group-hover:text-gray-400">▶</span>}
        </div>
    </div>
);

const StatisticsPanel: React.FC<StatsPanelProps> = ({ onClose }) => {
    const [sims, setSims] = useState<Sim[]>([]);
    
    // [新增] 详情视图状态
    const [detailView, setDetailView] = useState<{ title: string, list: {name: string, sub?: string, id: string}[] } | null>(null);

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

    // 2. 关系统计 (收集具体名单)
    const lovers: {name: string, sub: string, id: string}[] = [];
    const ambiguous: {name: string, sub: string, id: string}[] = [];
    const bestFriends: {name: string, sub: string, id: string}[] = []; // 好友
    const normalFriends: {name: string, sub: string, id: string}[] = []; // 普通朋友
    const enemies: {name: string, sub: string, id: string}[] = [];
    
    // 使用 Set 避免重复计数 (A-B 和 B-A)
    const processedPairs = new Set<string>();
    
    sims.forEach(s => {
        Object.keys(s.relationships).forEach(targetId => {
            const key = [s.id, targetId].sort().join('-');
            if (processedPairs.has(key)) return;
            processedPairs.add(key);
            
            const target = sims.find(t => t.id === targetId);
            if (!target) return;

            const rel = s.relationships[targetId];
            const pairName = `${s.name} & ${target.name}`;

            if (rel.isLover) {
                lovers.push({ name: pairName, sub: `热度: ${Math.floor(rel.romance)}`, id: s.id });
            }
            else if (rel.romance > 40) {
                // 暧昧关系：有一定浪漫值但未确立关系
                ambiguous.push({ name: pairName, sub: `暧昧: ${Math.floor(rel.romance)}`, id: s.id });
            }
            else if (rel.friendship > 60) {
                bestFriends.push({ name: pairName, sub: `深厚: ${Math.floor(rel.friendship)}`, id: s.id });
            }
            else if (rel.friendship >= 20) {
                // [新增] 普通朋友：友谊度 20-60
                normalFriends.push({ name: pairName, sub: `友谊: ${Math.floor(rel.friendship)}`, id: s.id });
            }
            else if (rel.friendship < -60) {
                enemies.push({ name: pairName, sub: `仇恨: ${Math.floor(rel.friendship)}`, id: s.id });
            }
        });
    });

    // 3. 状态统计
    const happyCount = sims.filter(s => s.mood > 80).length;
    const sadCount = sims.filter(s => s.mood < 40).length;
    const smellyCount = sims.filter(s => s.needs.hygiene < 30 || s.hasBuff('smelly')).length;
    const hungryCount = sims.filter(s => s.needs.hunger < 30).length;
    const richCount = sims.filter(s => s.money > 5000).length;
    const brokeCount = sims.filter(s => s.money < 200).length;

    // 显示详情的辅助函数
    const showList = (title: string, list: any[]) => {
        setDetailView({ title, list });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out] pointer-events-auto">
            <div className="w-full max-w-md bg-[#121212] border border-white/20 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {detailView ? (
                            <button onClick={() => setDetailView(null)} className="hover:text-accent mr-2">←</button>
                        ) : '📊'} 
                        {detailView ? detailView.title : '城镇统计数据'}
                        {!detailView && <span className="text-xs font-normal text-gray-500 bg-white/10 px-2 py-0.5 rounded-full">POP: {sims.length}</span>}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
                    >
                        ✕
                    </button>
                </div>
                
                {/* Content */}
                <div className="overflow-y-auto p-4 custom-scrollbar">
                    
                    {/* View: List Details */}
                    {detailView ? (
                        <div className="flex flex-col gap-1">
                            {detailView.list.length > 0 ? (
                                detailView.list.map((item, idx) => (
                                    <SimListItem key={idx} name={item.name} sub={item.sub} id={item.id} />
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-4 text-xs">空空如也</div>
                            )}
                        </div>
                    ) : (
                        // View: Dashboard
                        <div className="grid grid-cols-2 gap-6">
                            
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
                                    <StatRow 
                                        label="❤️ 情侣对数" 
                                        value={lovers.length} 
                                        color="text-love" 
                                        onClick={() => showList('情侣名单', lovers)}
                                    />
                                    <StatRow 
                                        label="💕 暧昧关系" 
                                        value={ambiguous.length} 
                                        color="text-pink-400" 
                                        onClick={() => showList('暧昧名单', ambiguous)}
                                    />
                                    <StatRow 
                                        label="🌟 亲密好友" 
                                        value={bestFriends.length} 
                                        color="text-act" 
                                        onClick={() => showList('亲密好友名单', bestFriends)}
                                    />
                                    <StatRow 
                                        label="🙂 普通朋友" 
                                        value={normalFriends.length} 
                                        color="text-gray-300" 
                                        onClick={() => showList('普通朋友名单', normalFriends)}
                                    />
                                    <StatRow 
                                        label="⚔️ 死对头" 
                                        value={enemies.length} 
                                        color="text-gray-500" 
                                        onClick={() => showList('死对头名单', enemies)}
                                    />
                                </div>
                            </div>

                            {/* 职业分布 */}
                            <div className="col-span-1 bg-white/5 rounded-lg p-3 border border-white/5">
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">职业分布</div>
                                <div className="flex flex-col">
                                    {Object.entries(jobStats)
                                        .sort(([,a], [,b]) => b - a)
                                        .slice(0, 6) // 只显示前6个
                                        .map(([type, count]) => (
                                            <div key={type} className="flex justify-between items-center text-[10px] mb-1">
                                                <span className="text-gray-400">{type}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
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
                    )}
                </div>
                
                <div className="p-3 border-t border-white/10 text-center">
                    <p className="text-[9px] text-gray-600">点击数字查看具体名单 · SimGod</p>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;