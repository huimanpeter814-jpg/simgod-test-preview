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
    
    // [新增] 创造者模式检测
    const [isCreatorMode, setIsCreatorMode] = useState(false);

    useEffect(() => {
        // Initial fetch
        setSims([...GameStore.sims]);
        setSelectedId(GameStore.selectedSimId);

        const unsub = GameStore.subscribe(() => {
            setSims([...GameStore.sims]);
            setSelectedId(GameStore.selectedSimId);
        });

        // [新增] 简单的权限检查：
        // 只有当网址包含 #creator 时才显示编辑器按钮 (例如: http://localhost:5173/#creator)
        const checkHash = () => {
            setIsCreatorMode(window.location.hash === '#creator');
        };
        checkHash();
        window.addEventListener('hashchange', checkHash);

        return () => {
            unsub();
            window.removeEventListener('hashchange', checkHash);
        };
    }, []);

    const handleSpawnFamily = () => {
        GameStore.spawnFamily();
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
            <div className="absolute right-8 bottom-8 pointer-events-auto flex gap-4 items-end">
                
                {/* [修改] Editor Button: 仅在创造者模式下显示 */}
                {isCreatorMode && (
                    <button
                        onClick={toggleEditor}
                        className={`
                            group flex items-center justify-center
                            w-14 h-14 rounded-full
                            shadow-lg border-2 
                            transition-all duration-300 transform hover:scale-105 active:scale-95
                            ${showEditor 
                                ? 'bg-warning text-black border-white shadow-[0_0_20px_rgba(253,203,110,0.6)]' 
                                : 'bg-purple-600 hover:bg-purple-500 text-white border-white/20 hover:border-white'
                            }
                        `}
                        title="创造者模式：地图编辑器"
                    >
                        <span className="text-2xl">🛠️</span>
                    </button>
                )}

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
                    onClick={handleSpawnFamily}
                    className="
                        group flex items-center gap-3 
                        bg-[#00b894] hover:bg-[#55efc4] text-[#121212] 
                        pl-5 pr-8 py-4 rounded-full 
                        shadow-[0_0_20px_rgba(0,184,148,0.6)] hover:shadow-[0_0_30px_rgba(85,239,196,0.8)]
                        border-2 border-[#fff]/20 hover:border-white
                        transition-all duration-300 transform hover:scale-105 active:scale-95
                    "
                    title="Add a new family"
                >
                    <div className="bg-black/20 w-10 h-10 rounded-full flex items-center justify-center text-2xl font-black group-hover:rotate-90 transition-transform duration-300">
                        +
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-pixel text-xs font-bold opacity-80">SYSTEM</span>
                        <span className="font-inter text-lg font-black tracking-wide leading-none">ADD FAMILY</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default GameOverlay;