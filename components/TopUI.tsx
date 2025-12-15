import React, { useState, useEffect } from 'react';
import { GameStore } from '../utils/simulation';
import { HOLIDAYS } from '../constants';

const TopUI: React.FC = () => {
  const [time, setTime] = useState({ ...GameStore.time });
  const [pop, setPop] = useState(0);

  useEffect(() => {
    // 订阅 GameStore 的变化
    const unsub = GameStore.subscribe(() => {
        setTime({ ...GameStore.time });
        setPop(GameStore.sims.length);
    });
    return unsub;
  }, []);

  const setSpeed = (s: number) => {
    GameStore.time.speed = s;
    GameStore.notify(); 
  };

  const holiday = HOLIDAYS[time.month];

  return (
    <div className="absolute top-4 left-0 right-0 flex justify-between px-6 z-30 pointer-events-none">
      {/* Time & Speed Control */}
      <div className="flex gap-4 items-center">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-6 pointer-events-auto shadow-lg">
            <div className="flex flex-col items-end leading-none gap-1 min-w-[80px]">
                <div className="font-pixel text-[10px] text-gray-400">
                    YEAR {time.year}
                </div>
                <div className="font-bold text-xs text-white flex items-center gap-2">
                    <span>{time.month} 月</span>
                    {holiday && <span className="text-[10px] bg-red-500/20 text-red-300 px-1 rounded border border-red-500/30">{holiday.name}</span>}
                </div>
            </div>
            
            <div className="text-xl font-bold text-warning drop-shadow-[0_0_5px_rgba(253,203,110,0.5)]">
               {String(time.hour).padStart(2,'0')}:{String(time.minute).padStart(2,'0')}
            </div>

            <div className="h-6 w-px bg-white/20"></div>
            
            <div className="flex gap-1">
                {[
                    { l: 'II', s: 0 }, { l: '▶', s: 1 }, { l: '▶▶', s: 50 }, { l: '>>>', s: 200 }
                ].map(btn => (
                    <button 
                        key={btn.s}
                        onClick={() => setSpeed(btn.s)}
                        className={`
                            bg-transparent border-none cursor-pointer font-inter text-[10px] font-bold px-2 py-0.5 rounded transition-all
                            ${time.speed === btn.s ? 'bg-success text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}
                        `}
                    >
                        {btn.l}
                    </button>
                ))}
            </div>
        </div>

        {/* Save / Reset Controls */}
        <div className="flex gap-2 pointer-events-auto">
             <button 
                onClick={() => GameStore.saveGame()}
                className="bg-black/60 backdrop-blur-md w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-success hover:border-success/50 transition-all active:scale-95"
                title="手动保存"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
             </button>
             <button 
                onClick={() => GameStore.clearSave()}
                className="bg-black/60 backdrop-blur-md w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-danger hover:border-danger/50 transition-all active:scale-95"
                title="删除存档并重置"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
             </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-xs text-gray-300 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Pop: {pop}
        </div>
        
      </div>
    </div>
  );
};

export default TopUI;