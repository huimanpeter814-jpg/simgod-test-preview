import React, { useState, useEffect } from 'react';
import Roster from './Roster';
import LogPanel from './LogPanel';
import Inspector from './Inspector';
import StatisticsPanel from './StatisticsPanel';
import { GameStore, Sim } from '../../utils/simulation';

// Full Screen Overlay managing HUD elements
const GameOverlay: React.FC = () => {
    const [sims, setSims] = useState<Sim[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showStats, setShowStats] = useState(false);

    useEffect(() => {
        // Initial fetch
        setSims([...GameStore.sims]);
        setSelectedId(GameStore.selectedSimId);

        const unsub = GameStore.subscribe(() => {
            setSims([...GameStore.sims]);
            setSelectedId(GameStore.selectedSimId);
        });
        return unsub;
    }, []);

    const handleSpawn = () => {
        GameStore.sims.push(new Sim(450, 350));
        GameStore.notify();
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">

            {/* Left Strip: Roster (Widened for names) */}
            <div className="absolute left-4 top-20 bottom-24 w-[80px] pointer-events-auto flex flex-col gap-2">
                <Roster sims={sims} selectedId={selectedId} />
            </div>

            {/* Right Panel: Inspector (Floating) */}
            {selectedId && (
                <div className="absolute right-4 top-20 bottom-4 pointer-events-none flex flex-col justify-start">
                    <Inspector selectedId={selectedId} sims={sims} />
                </div>
            )}

            {/* Floating Log Panel (Self-managed positioning) */}
            <LogPanel />

            {/* Statistics Modal */}
            {showStats && <StatisticsPanel onClose={() => setShowStats(false)} />}

            {/* Bottom Right: Controls */}
            <div className="absolute right-8 bottom-8 pointer-events-auto flex gap-4 items-end">
                
                {/* Statistics Button */}
                <button
                    onClick={() => setShowStats(true)}
                    className="
                        group flex items-center justify-center
                        bg-[#0984e3] hover:bg-[#74b9ff] text-white
                        w-14 h-14 rounded-full
                        shadow-[0_0_20px_rgba(9,132,227,0.6)] hover:shadow-[0_0_30px_rgba(116,185,255,0.8)]
                        border-2 border-white/20 hover:border-white
                        transition-all duration-300 transform hover:scale-105 active:scale-95
                    "
                    title="View Statistics"
                >
                    <span className="text-2xl">📊</span>
                </button>

                {/* Spawn Button */}
                <button
                    onClick={handleSpawn}
                    className="
                        group flex items-center gap-3 
                        bg-[#00b894] hover:bg-[#55efc4] text-[#121212] 
                        pl-5 pr-8 py-4 rounded-full 
                        shadow-[0_0_20px_rgba(0,184,148,0.6)] hover:shadow-[0_0_30px_rgba(85,239,196,0.8)]
                        border-2 border-[#fff]/20 hover:border-white
                        transition-all duration-300 transform hover:scale-105 active:scale-95
                    "
                    title="add random new sim"
                >
                    <div className="bg-black/20 w-10 h-10 rounded-full flex items-center justify-center text-2xl font-black group-hover:rotate-90 transition-transform duration-300">
                        +
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-pixel text-xs font-bold opacity-80">SYSTEM</span>
                        <span className="font-inter text-lg font-black tracking-wide leading-none">ADD SIM</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default GameOverlay;