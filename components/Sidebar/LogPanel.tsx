import React, { useState, useEffect, useRef } from 'react';
import { GameStore } from '../../utils/simulation';
import { LogEntry } from '../../types';

type TabType = 'all' | 'chat' | 'rel' | 'sys';

const LogPanel: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [isMinimized, setIsMinimized] = useState(false);

    // Dragging State
    const [position, setPosition] = useState({ x: 80, y: window.innerHeight - 320 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsub = GameStore.subscribe(() => setLogs([...GameStore.logs]));
        return unsub;
    }, []);

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

    // Filter Logic
    const filteredLogs = logs.filter(l => {
        if (activeTab === 'all') return true;
        if (activeTab === 'chat') return l.category === 'chat';
        if (activeTab === 'rel') return l.category === 'rel';
        if (activeTab === 'sys') return l.category === 'sys';
        return true;
    });

    return (
        <div
            ref={panelRef}
            style={{
                left: position.x,
                top: position.y,
                height: isMinimized ? 'auto' : '300px'
            }}
            className="fixed w-[400px] flex flex-col pointer-events-auto z-50 transition-height duration-200"
        >
            {/* Header / Drag Handle */}
            <div
                onMouseDown={startDrag}
                className="h-8 bg-[#2d3436] border border-white/20 rounded-t-lg flex items-center justify-between px-3 cursor-move select-none shadow-lg"
            >
                <span className="text-[10px] font-pixel text-gray-300">SYSTEM.LOG</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-gray-400 hover:text-white"
                    >
                        {isMinimized ? '□' : '_'}
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="flex-1 flex flex-col bg-[#121212]/90 backdrop-blur-md border-x border-b border-white/10 rounded-b-lg shadow-xl overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        {[
                            { id: 'all', label: '全部' },
                            { id: 'chat', label: '聊天' },
                            { id: 'rel', label: '关系' },
                            { id: 'sys', label: '系统' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex-1 py-1.5 text-[10px] font-bold transition-colors ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Log Content */}
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col-reverse gap-1">
                        {filteredLogs.map(log => {
                            let colorClass = 'text-gray-400';
                            if (log.type === 'love') colorClass = 'text-love';
                            if (log.type === 'bad') colorClass = 'text-danger';
                            if (log.type === 'jealous') colorClass = 'text-danger font-bold';
                            if (log.isAI) colorClass = 'text-ai';
                            if (log.type === 'sys') colorClass = 'text-warning';

                            return (
                                <div key={log.id} className="text-[11px] leading-snug hover:bg-white/5 px-1 rounded">
                                    <span className="opacity-30 text-[9px] mr-2 font-mono">
                                        {log.time.split(' ')[2]}
                                    </span>
                                    {log.simName && log.simName !== '系统' && (
                                        <span
                                            className="font-bold text-gray-300 mr-1 cursor-pointer hover:underline hover:text-white"
                                            onClick={() => {
                                                const s = GameStore.sims.find(sim => sim.name === log.simName);
                                                if (s) { GameStore.selectedSimId = s.id; GameStore.notify(); }
                                            }}
                                        >
                                            [{log.simName}]
                                        </span>
                                    )}
                                    <span className={colorClass}>
                                        {log.text}
                                    </span>
                                </div>
                            );
                        })}
                        {filteredLogs.length === 0 && <div className="text-center text-[10px] text-gray-600 mt-10">- 暂无记录 -</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogPanel;