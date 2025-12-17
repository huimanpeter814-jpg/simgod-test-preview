import React, { useState, useEffect } from 'react';
import Roster from './Roster';
import LogPanel from './LogPanel';
import Inspector from './Inspector';
import StatisticsPanel from './StatisticsPanel';
import EditorPanel from './EditorPanel'; 
import { GameStore, Sim } from '../../utils/simulation';

// Full Screen Overlay managing HUD elements
const GameOverlay: React.FC = () => {
    const [sims, setSims] = useState<Sim[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [showEditor, setShowEditor] = useState(false); 
    
    useEffect(() => {
        // Initial fetch
        setSims([...GameStore.sims]);
        setSelectedId(GameStore.selectedSimId);

        const unsub = GameStore.subscribe(() => {
            setSims([...GameStore.sims]);
            setSelectedId(GameStore.selectedSimId);
        });

        return () => {
            unsub();
        };
    }, []);

    const handleSpawnFamily = () => {
        GameStore.spawnFamily(); // Random family (2+)
    };

    const handleSpawnSingle = () => {
        GameStore.spawnSingle(); // Solo Sim
    };

    // Toggle Editor Logic
    const toggleEditor = () => {
        const newState = !showEditor;
        setShowEditor(newState);
        
        if (newState) {
            GameStore.editor.mode = 'plot';
        } else {
            GameStore.editor.mode = 'none';
            GameStore.editor.selectedPlotId = null;
            GameStore.editor.selectedFurnitureId = null;
        }
        GameStore.notify();
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">

            {/* Left Strip: Roster */}
            {!showEditor && (
                <div className="absolute left-4 top-20 bottom-24 w-[80px] pointer-events-auto flex flex-col gap-2 animate-[fadeIn_0.3s_ease-out]">
                    <Roster sims={sims} selectedId={selectedId} />
                </div>
            )}

            {/* Right Panel: Inspector */}
            {selectedId && !showEditor && (
                <div className="absolute right-4 top-20 bottom-4 pointer-events-none flex flex-col justify-start">
                    <Inspector selectedId={selectedId} sims={sims} />
                </div>
            )}

            {/* Editor Panel */}
            {showEditor && (
                <EditorPanel onClose={toggleEditor} />
            )}

            {/* Floating Log Panel */}
            {!showEditor && <LogPanel />}

            {/* Statistics Modal */}
            {showStats && <StatisticsPanel onClose={() => setShowStats(false)} />}

            {/* Bottom Right: Controls */}
            <div className="absolute right-8 bottom-8 pointer-events-auto flex flex-col gap-3 items-end">
                
                {/* Editor & Stats Buttons Row */}
                <div className="flex gap-3">
                     {/* Editor Button */}
                    <button
                        onClick={toggleEditor}
                        className={`
                            group flex items-center justify-center
                            w-12 h-12 rounded-full
                            shadow-lg border-2 
                            transition-all duration-300 transform hover:scale-105 active:scale-95
                            ${showEditor 
                                ? 'bg-warning text-black border-white shadow-[0_0_20px_rgba(253,203,110,0.6)]' 
                                : 'bg-purple-600 hover:bg-purple-500 text-white border-white/20 hover:border-white'
                            }
                        `}
                        title="建筑模式"
                    >
                        <span className="text-xl">🛠️</span>
                    </button>

                    {/* Statistics Button */}
                    <button
                        onClick={() => setShowStats(true)}
                        className="
                            group flex items-center justify-center
                            bg-[#0984e3] hover:bg-[#74b9ff] text-white
                            w-12 h-12 rounded-full
                            shadow-[0_0_20px_rgba(9,132,227,0.6)] hover:shadow-[0_0_30px_rgba(116,185,255,0.8)]
                            border-2 border-white/20 hover:border-white
                            transition-all duration-300 transform hover:scale-105 active:scale-95
                        "
                        title="查看统计"
                    >
                        <span className="text-xl">📊</span>
                    </button>
                </div>

                {/* Spawn Buttons Group */}
                <div className="flex gap-3">
                    {/* Spawn Single Button */}
                    <button
                        onClick={handleSpawnSingle}
                        className="
                            group flex items-center gap-2 
                            bg-[#00b894] hover:bg-[#55efc4] text-[#121212] 
                            pl-4 pr-5 py-3 rounded-full 
                            shadow-lg hover:shadow-[0_0_20px_rgba(85,239,196,0.5)]
                            border-2 border-[#fff]/20 hover:border-white
                            transition-all duration-300 transform hover:scale-105 active:scale-95
                        "
                        title="添加单身居民"
                    >
                        <span className="text-xl">👤</span>
                        <span className="font-bold text-xs">单人</span>
                    </button>

                    {/* Spawn Family Button */}
                    <button
                        onClick={handleSpawnFamily}
                        className="
                            group flex items-center gap-2 
                            bg-[#e17055] hover:bg-[#ff7675] text-white
                            pl-4 pr-5 py-3 rounded-full 
                            shadow-lg hover:shadow-[0_0_20px_rgba(225,112,85,0.5)]
                            border-2 border-[#fff]/20 hover:border-white
                            transition-all duration-300 transform hover:scale-105 active:scale-95
                        "
                        title="添加随机家庭"
                    >
                        <span className="text-xl">👨‍👩‍👧</span>
                        <span className="font-bold text-xs">家庭</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOverlay;