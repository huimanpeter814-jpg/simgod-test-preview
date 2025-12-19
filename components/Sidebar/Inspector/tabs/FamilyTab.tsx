import React from 'react';
import { Sim, GameStore } from '../../../../utils/simulation';
import { SimData } from '../../../../types';
import { InspectorFace } from '../InspectorFace';

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

export const FamilyTab: React.FC<{ sim: Sim, sims: Sim[] }> = ({ sim, sims }) => {
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