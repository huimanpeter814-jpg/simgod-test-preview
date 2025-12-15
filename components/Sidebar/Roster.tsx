import React, { useRef, useEffect } from 'react';
import { GameStore, Sim } from '../../utils/simulation';
import { drawAvatarHead } from '../../utils/render/pixelArt';
import { SimData } from '../../types';

interface RosterProps {
    sims: Sim[];
    selectedId: string | null;
}

const AvatarCanvas: React.FC<{ sim: SimData }> = ({ sim }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, 40, 40);
                drawAvatarHead(ctx, 20, 25, 12, sim);
            }
        }
    }, [sim]);
    return <canvas ref={canvasRef} width={40} height={40} className="w-10 h-10 object-contain" />;
};

const Roster: React.FC<RosterProps> = ({ sims, selectedId }) => {
    return (
        <div className="flex flex-col gap-3 max-h-full overflow-y-auto no-scrollbar py-2 items-center w-full">
            {sims.map(sim => (
                <div
                    key={sim.id}
                    onClick={() => { GameStore.selectedSimId = sim.id; GameStore.notify(); }}
                    className={`
                    w-full shrink-0 bg-[#121212]/80 backdrop-blur-md rounded-lg border-2 cursor-pointer relative flex flex-col items-center justify-center py-1 transition-all hover:border-white group
                    ${selectedId === sim.id ? 'border-select shadow-[0_0_10px_rgba(57,255,20,0.3)] bg-white/10' : 'border-white/10'}
                `}
                    title={sim.name}
                >
                    <AvatarCanvas sim={sim} />
                    <span className={`text-[10px] mt-1 font-bold truncate max-w-[90%] ${selectedId === sim.id ? 'text-select' : 'text-gray-400 group-hover:text-white'}`}>
                        {sim.name}
                    </span>

                    {/* Mood Dot */}
                    <div
                        className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-black/50 ${sim.mood > 80 ? 'bg-success' : sim.mood < 40 ? 'bg-danger' : 'bg-gray-400'}`}
                    />
                </div>
            ))}
        </div>
    );
};

export default Roster;