import React, { useRef, useEffect, useState } from 'react';
import { CONFIG, AGE_CONFIG, ASSET_CONFIG } from '../constants';
import { GameStore, gameLoopStep, getActivePalette } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';
import { drawAvatarHead, drawPixelProp } from '../utils/render/pixelArt';
import { PLOTS } from '../data/plots';

// 地皮选项映射
const PLOT_OPTIONS = [
    { id: 'tech', label: '科技园区' },
    { id: 'finance', label: '金融中心' },
    { id: 'design', label: '创意园区' },
    { id: 'kindergarten', label: '幼儿园' },
    { id: 'elementary', label: '小学' },
    { id: 'high_school', label: '中学' },
    { id: 'dorm', label: '公寓/宿舍' },
    { id: 'villa', label: '别墅区' },
    { id: 'park', label: '公园' },
    { id: 'commercial', label: '商业街' },
    { id: 'nightlife', label: '娱乐区' },
    { id: 'gallery', label: '文化设施' },
];

const SIMPLE_COLORS = [
    'transparent','#dcdcdc', '#8cb393', '#3d404b', '#5a8fff', '#ff7675', '#fdcb6e', '#ffffff'
];

const createWorker = () => {
    const blob = new Blob([`
        let interval = null;
        self.onmessage = function(e) {
            if (e.data === 'start') {
                if (interval) clearInterval(interval);
                interval = setInterval(() => {
                    self.postMessage('tick');
                }, 1000 / 30);
            } else if (e.data === 'stop') {
                if (interval) clearInterval(interval);
            }
        };
    `], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
};

const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    const cameraRef = useRef({ 
        x: 1800 - window.innerWidth / 2, 
        y: 800 - window.innerHeight / 2, 
        zoom: 0.8 
    });

    const hoveredTarget = useRef<any>(null);

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    const [selectedPlot, setSelectedPlot] = useState<{
        id: string, 
        x: number, 
        y: number, 
        templateId: string,
        customName?: string,
        customColor?: string,
        customType?: string
    } | null>(null);

    const isCameraLocked = useRef(false); 
    const lastSelectedId = useRef<string | null>(null);

    const isDragging = useRef(false); 
    const lastMousePos = useRef({ x: 0, y: 0 });
    // 🆕 新增：记录鼠标按下位置，用于区分点击和拖拽
    const dragStartMousePos = useRef({ x: 0, y: 0 }); 
    const hasDragged = useRef(false); 
    const isPickingUp = useRef(false); 
    
    const dragStartPos = useRef({ x: 0, y: 0 });

    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastTimePaletteRef = useRef<string>('');
    const lastStaticUpdateRef = useRef<number>(0); 

    const [editorRefresh, setEditorRefresh] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        
        if (cameraRef.current.x === 0 && cameraRef.current.y === 0) {
             cameraRef.current.x = 1800 - window.innerWidth / 2;
             cameraRef.current.y = 800 - window.innerHeight / 2;
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const unsub = GameStore.subscribe(() => {
            setEditorRefresh(prev => prev + 1);

            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                if (plot) {
                    const zoom = cameraRef.current.zoom;
                    const camX = cameraRef.current.x;
                    const camY = cameraRef.current.y;
                    const screenX = (plot.x - camX) * zoom;
                    const screenY = (plot.y - camY) * zoom;
                    
                    setSelectedPlot({ 
                        id: plot.id, 
                        x: screenX, 
                        y: screenY, 
                        templateId: plot.templateId,
                        customName: plot.customName,
                        customColor: plot.customColor,
                        customType: plot.customType
                    });
                }
            } else {
                setSelectedPlot(null);
            }
        });
        return unsub;
    }, []);

    const renderStaticLayer = () => {
        if (!staticCanvasRef.current) {
            staticCanvasRef.current = document.createElement('canvas');
            staticCanvasRef.current.width = CONFIG.CANVAS_W;
            staticCanvasRef.current.height = CONFIG.CANVAS_H;
        }

        const ctx = staticCanvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        const p = getActivePalette();

        const bgPath = ASSET_CONFIG.bg?.find(path => path.includes('bg_img')) || ASSET_CONFIG.bg?.[0];
        const bgImg = getAsset(bgPath);

        if (bgImg) {
            // 如果有图，绘制图片并拉伸至全图
            ctx.drawImage(bgImg, 0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        } else {
            // 如果没图，回退到原来的纯色背景
            ctx.fillStyle = p.bg;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        }

        GameStore.rooms.filter(r => !r.isCustom).forEach((r: any) => {
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId && GameStore.editor.isDragging) {
                if (r.id.startsWith(`${GameStore.editor.selectedPlotId}_`)) return;
            }

            if (r.color !== 'transparent') {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(r.x + 6, r.y + 6, r.w, r.h);
            }

            // 修改判断条件：如果是 'transparent' 颜色，强制绘制边框
            if (r.color === 'transparent' || (r.id !== 'park_base' && !r.id.startsWith('road') && !r.label.startsWith('空地'))) {
                ctx.strokeStyle = p.wall;
                ctx.lineWidth = 1;
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }

            const floorImg = getAsset((r as any).imagePath);
            if (floorImg) {
                const ptrn = ctx.createPattern(floorImg, 'repeat');
                if (ptrn) {
                    ctx.fillStyle = ptrn;
                    ctx.save(); ctx.translate(r.x, r.y); ctx.fillRect(0, 0, r.w, r.h); ctx.restore();
                } else {
                    ctx.drawImage(floorImg, r.x, r.y, r.w, r.h);
                }
            } else {
                ctx.fillStyle = r.color;
                ctx.fillRect(r.x, r.y, r.w, r.h);
                
                if (r.pixelPattern === 'wood') {
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    for (let i = 0; i < r.w; i += 20) { ctx.fillRect(r.x + i, r.y, 2, r.h); }
                }
                else if (r.pixelPattern === 'grid' || r.pixelPattern === 'tile') {
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.beginPath();
                    for(let i=0; i<r.w; i+=40) { ctx.moveTo(r.x+i, r.y); ctx.lineTo(r.x+i, r.y+r.h); }
                    for(let i=0; i<r.h; i+=40) { ctx.moveTo(r.x, r.y+i); ctx.lineTo(r.x+r.w, r.y+i); }
                    ctx.stroke();
                }
            }
            // if (r.id !== 'park_base' && !r.id.startsWith('road') && !r.label.startsWith('空地')) {
            //     ctx.strokeStyle = p.wall;
            //     ctx.lineWidth = 4;
            //     ctx.strokeRect(r.x, r.y, r.w, r.h);
            // }
            if (r.label && !r.id.startsWith('road')) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                ctx.fillText(r.label, r.x + 10, r.y + 20);
            }
        });

        GameStore.rooms.filter(r => r.isCustom).forEach(r => {
            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId === r.id && GameStore.editor.isDragging) return;

            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId === r.id) {
                ctx.globalAlpha = 0.8;
            }
            
            const floorImg = getAsset(r.imagePath);
            if (floorImg) {
                const ptrn = ctx.createPattern(floorImg, 'repeat');
                if (ptrn) {
                    ctx.fillStyle = ptrn;
                    ctx.save(); ctx.translate(r.x, r.y); ctx.fillRect(0, 0, r.w, r.h); ctx.restore();
                } else {
                    ctx.drawImage(floorImg, r.x, r.y, r.w, r.h);
                }
            } else {
                ctx.fillStyle = r.color;
                ctx.fillRect(r.x, r.y, r.w, r.h);
                
                if (r.pixelPattern === 'wood') {
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    for (let i = 0; i < r.w; i += 20) { 
                        ctx.fillRect(r.x + i, r.y, 2, r.h); 
                    }
                    ctx.fillStyle = 'rgba(0,0,0,0.05)';
                    for (let i = 0; i < r.w; i += 40) {
                        for (let j = 0; j < r.h; j += 20) {
                            if ((i + j) % 3 === 0) ctx.fillRect(r.x + i, r.y + j, 20, 4);
                        }
                    }
                } else if (r.pixelPattern === 'grid' || r.pixelPattern === 'tile') {
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.beginPath();
                    for(let i=0; i<r.w; i+=40) { ctx.moveTo(r.x+i, r.y); ctx.lineTo(r.x+i, r.y+r.h); }
                    for(let i=0; i<r.h; i+=40) { ctx.moveTo(r.x, r.y+i); ctx.lineTo(r.x+r.w, r.y+i); }
                    ctx.stroke();
                } else if (r.pixelPattern === 'zebra') {
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    for(let i=10; i<r.w; i+=40) ctx.fillRect(r.x+i, r.y, 20, r.h);
                } else if (r.pixelPattern === 'stripes') {
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.setLineDash([20, 20]);
                    ctx.beginPath();
                    if (r.w > r.h) { 
                        ctx.moveTo(r.x, r.y + r.h/2); ctx.lineTo(r.x+r.w, r.y+r.h/2);
                    } else {
                        ctx.moveTo(r.x + r.w/2, r.y); ctx.lineTo(r.x+r.w/2, r.y+r.h);
                    }
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            if (r.hasWall) {
                ctx.strokeStyle = p.wall || '#5a6572';
                ctx.lineWidth = 4;
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }

            ctx.globalAlpha = 1.0;
        });

        GameStore.furniture.forEach((f: any) => {
            if (GameStore.editor.mode === 'furniture' && GameStore.editor.selectedFurnitureId === f.id && GameStore.editor.isDragging) return;
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId && f.id.startsWith(`${GameStore.editor.selectedPlotId}_`) && GameStore.editor.isDragging) return;

            if (f.pixelPattern !== 'zebra') {
                ctx.fillStyle = p.furniture_shadow || 'rgba(0,0,0,0.2)';
                ctx.fillRect(f.x + 4, f.y + 4, f.w, f.h);
            }

            const furnImg = getAsset(f.imagePath);
            if (furnImg) {
                ctx.drawImage(furnImg, f.x, f.y, f.w, f.h);
            } else {
                drawPixelProp(ctx, f, p); 
                if (f.pixelGlow) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = f.glowColor || f.color;
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(f.x, f.y, f.w, f.h);
                    ctx.shadowBlur = 0;
                }
            }
        });

        lastStaticUpdateRef.current = Date.now();
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
        ctx.imageSmoothingEnabled = false;

        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();
        const zoom = cameraRef.current.zoom;
        const camX = Math.floor(cameraRef.current.x);
        const camY = Math.floor(cameraRef.current.y);
        
        ctx.scale(zoom, zoom);
        ctx.translate(-camX, -camY);

        const mouseWorldX = (lastMousePos.current.x) / zoom + camX;
        const mouseWorldY = (lastMousePos.current.y) / zoom + camY;
        
        const p = getActivePalette();
        const paletteKey = JSON.stringify(p);
        
        if (paletteKey !== lastTimePaletteRef.current || !staticCanvasRef.current) {
             renderStaticLayer();
             lastTimePaletteRef.current = paletteKey;
        }

        if (staticCanvasRef.current) {
            ctx.drawImage(staticCanvasRef.current, 0, 0);
        }

        if (GameStore.editor.mode !== 'none') {
            // ... Editor Grid Drawing Code (No Changes) ...
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            const startX = Math.floor(camX / gridSize) * gridSize;
            const startY = Math.floor(camY / gridSize) * gridSize;
            const endX = startX + (ctx.canvas.width / zoom);
            const endY = startY + (ctx.canvas.height / zoom);

            ctx.beginPath();
            for (let x = startX; x < endX; x += gridSize) {
                ctx.moveTo(x, startY); ctx.lineTo(x, endY);
            }
            for (let y = startY; y < endY; y += gridSize) {
                ctx.moveTo(startX, y); ctx.lineTo(endX, y);
            }
            ctx.stroke();

            if (GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor) {
                const { startX, startY, currX, currY, color } = GameStore.editor.drawingFloor;
                const x = Math.min(startX, currX);
                const y = Math.min(startY, currY);
                const w = Math.abs(currX - startX);
                const h = Math.abs(currY - startY);

                if (w > 0 && h > 0) {
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(x, y, w, h);
                    ctx.globalAlpha = 1.0;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    
                    ctx.fillStyle = '#fff';
                    ctx.font = '12px "Microsoft YaHei"';
                    ctx.fillText(`${w} x ${h}`, x + w/2 - 20, y + h/2);
                }
            }

            if (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot) {
                const { startX, startY, currX, currY } = GameStore.editor.drawingPlot;
                const x = Math.min(startX, currX);
                const y = Math.min(startY, currY);
                const w = Math.abs(currX - startX);
                const h = Math.abs(currY - startY);

                if (w > 0 && h > 0) {
                    ctx.save();
                    ctx.strokeStyle = '#ffff00';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([10, 10]);
                    ctx.strokeRect(x, y, w, h);
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(x, y, w, h);
                    ctx.restore();

                    ctx.fillStyle = '#ffff00';
                    ctx.font = 'bold 14px "Microsoft YaHei"';
                    ctx.fillText(`新地皮: ${w} x ${h}`, x + w/2 - 40, y + h/2);
                }
            }

            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId && !GameStore.editor.isDragging) {
                const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                if (room) {
                    ctx.strokeStyle = '#39ff14';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(room.x, room.y, room.w, room.h);
                }
            }

            if (GameStore.editor.previewPos) {
                const { x, y } = GameStore.editor.previewPos;
                ctx.save();
                ctx.globalAlpha = 0.9; 

                if (GameStore.editor.mode === 'plot') {
                    const drawPlotPreview = (plotId: string | null, templateId: string | null, dx: number, dy: number) => {
                        let roomsToRender: any[] = [];
                        
                        if (plotId) {
                            roomsToRender = GameStore.rooms.filter(r => r.id.startsWith(`${plotId}_`)).map(r => ({ ...r, x: r.x + dx, y: r.y + dy }));
                        } else if (templateId) {
                            const tpl = PLOTS[templateId] || PLOTS['default_empty'];
                            if (tpl) {
                                roomsToRender = tpl.rooms.map(r => ({ ...r, x: r.x + x, y: r.y + y }));
                            }
                        }

                        roomsToRender.forEach(r => {
                            ctx.fillStyle = r.color;
                            ctx.fillRect(r.x, r.y, r.w, r.h);
                            ctx.strokeStyle = plotId ? '#ffff00' : '#00ff00';
                            ctx.lineWidth = 3;
                            ctx.strokeRect(r.x, r.y, r.w, r.h);
                        });
                    };

                    if (GameStore.editor.selectedPlotId) {
                        const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                        if (plot) {
                            drawPlotPreview(plot.id, null, x - plot.x, y - plot.y);
                        }
                    } else if (GameStore.editor.placingTemplateId) {
                        drawPlotPreview(null, GameStore.editor.placingTemplateId, 0, 0);
                    }
                } 
                else if (GameStore.editor.mode === 'furniture') {
                    const drawFurnPreview = (f: any, isNew: boolean) => {
                        const previewF = { ...f, x: x, y: y };
                        drawPixelProp(ctx, previewF, p);
                        ctx.strokeStyle = isNew ? '#00ff00' : '#ffff00';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(previewF.x - 2, previewF.y - 2, previewF.w + 4, previewF.h + 4);
                    };

                    if (GameStore.editor.selectedFurnitureId) {
                        const f = GameStore.furniture.find(i => i.id === GameStore.editor.selectedFurnitureId);
                        if (f) drawFurnPreview(f, false);
                    } 
                    else if (GameStore.editor.placingFurniture) {
                        drawFurnPreview(GameStore.editor.placingFurniture, true);
                    }
                }
                else if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                    const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                    if (room) {
                        ctx.fillStyle = room.color;
                        ctx.fillRect(x, y, room.w, room.h);
                        if (room.pixelPattern === 'wood') {
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.fillStyle = 'rgba(0,0,0,0.1)';
                            for (let i = 0; i < room.w; i += 20) ctx.fillRect(i, 0, 2, room.h);
                            ctx.restore();
                        }
                        ctx.strokeStyle = '#ffff00';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x, y, room.w, room.h);
                        if (room.hasWall) {
                            ctx.strokeStyle = p.wall || '#5a6572';
                            ctx.lineWidth = 4;
                            ctx.strokeRect(x, y, room.w, room.h);
                        }
                    }
                }
                ctx.restore();
            }
        }

        // === Sims 绘制 (修复：层级问题) ===
        // [关键修复] 自定义排序：如果 a 是 b 的载体 (a抱b)，则 a 需要在 b 之前被处理（即 b 在 a 后面，a 绘制后 b 再绘制 = b 在上层）
        // 默认 Y 轴排序：Y 小的（远处）先画，Y 大的（近处）后画。
        const renderSims = [...GameStore.sims].sort((a, b) => {
            // 如果 a 正在抱着 b，a 必须排在 b 前面 (return -1)，这样 b 才会覆盖 a
            if (a.carryingSimId === b.id) return -1;
            // 如果 b 正在抱着 a，b 必须排在 a 前面 (return 1)
            if (b.carryingSimId === a.id) return 1;
            
            return a.pos.y - b.pos.y;
        });

        renderSims.forEach(sim => {
            const renderX = sim.pos.x; 
            const renderY = sim.pos.y; 
            
            ctx.save();
            ctx.translate(renderX, renderY);

            if (GameStore.selectedSimId === sim.id) {
                ctx.fillStyle = '#39ff14';
                ctx.beginPath(); ctx.ellipse(0, 5, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
            }

            // @ts-ignore
            const ageConfig = AGE_CONFIG[sim.ageStage] || AGE_CONFIG.Adult;
            const w = ageConfig.width || 20;
            const h = ageConfig.height || 42;
            const headSize = ageConfig.headSize || 13;
            const headY = -h + (headSize * 0.4);

            drawAvatarHead(ctx, 0, headY, headSize, sim, 'back');

            if (sim.ageStage === 'Infant' || sim.ageStage === 'Toddler') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.roundRect(-w / 2 + 1, -h * 0.45, w - 2, h * 0.45, 4); ctx.fill();
                const shoulderY = -h + (headSize * 1); 
                ctx.fillStyle = sim.clothesColor;
                ctx.fillRect(-w / 2, shoulderY, w, h * 0.4); 
            } else {
                ctx.fillStyle = sim.pantsColor || '#455A64'; 
                ctx.fillRect(-w / 2, -h * 0.45, w, h * 0.45);
                const shoulderY = -h + (headSize * 0.6); 
                const shirtBottomY = -h * 0.25;
                ctx.fillStyle = sim.clothesColor;
                ctx.fillRect(-w / 2, shoulderY, w, shirtBottomY - shoulderY); 
            }
            
            const shoulderY = -h + (headSize * 0.6); 
            const shirtBottomY = -h * 0.4; 
            ctx.fillStyle = 'rgba(0,0,0,0.1)'; 
            const armW = Math.max(3, w * 0.2);
            const armH = (shirtBottomY - shoulderY) * 0.9;
            ctx.fillRect(-w/2, shoulderY, armW, armH); 
            ctx.fillRect(w/2 - armW, shoulderY, armW, armH);

            drawAvatarHead(ctx, 0, headY, headSize, sim, 'front');

            if (sim.action === 'phone') {
                ctx.fillStyle = '#ECEFF1'; ctx.fillRect(w/2 - 2, shoulderY + 5, 6, 9);
                ctx.fillStyle = '#81D4FA'; ctx.fillRect(w/2 - 1, shoulderY + 6, 4, 7);
            }

            if (sim.bubble.timer > 0 && sim.bubble.text) {
                ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
                let width = ctx.measureText(sim.bubble.text).width + 12;
                let bg = '#fff', border='#2d3436', textC='#2d3436';
                if (sim.bubble.type === 'love') { bg = '#fd79a8'; border = '#e84393'; textC = '#fff'; }
                else if (sim.bubble.type === 'bad') { bg = '#ff7675'; border = '#d63031'; textC = '#fff'; }
                else if (sim.bubble.type === 'money') { bg = '#ffeaa7'; border = '#fdcb6e'; textC = '#d35400'; }

                ctx.fillStyle = border;
                ctx.beginPath(); ctx.moveTo(0, -h - 5); ctx.lineTo(-4, -h - 15); ctx.lineTo(4, -h - 15); ctx.fill();
                ctx.fillStyle = bg; ctx.strokeStyle = border; ctx.lineWidth = 1.5 / zoom;
                ctx.beginPath(); ctx.roundRect(-width / 2, -h - 38, width, 24, 4); ctx.fill(); ctx.stroke();
                ctx.fillStyle = textC; ctx.textAlign = 'center';
                ctx.fillText(sim.bubble.text, 0, -h - 22);
                ctx.textAlign = 'left';
            }
            ctx.restore();
        });

        // 粒子
        for (let i = GameStore.particles.length - 1; i >= 0; i--) {
            let p = GameStore.particles[i];
            p.y -= 0.6; p.life -= 0.015;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.fillText('❤️', p.x, p.y);
            ctx.globalAlpha = 1.0;
            ctx.textAlign = 'left';
            if (p.life <= 0) GameStore.particles.splice(i, 1);
        }
        
        // 悬停提示
        if (hoveredTarget.current && GameStore.editor.mode === 'none') {
            const t = hoveredTarget.current;
            const label = t.label;
            
            if (label) {
                const cx = t.x + t.w / 2;
                const topY = t.y - 12;

                ctx.save();
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                const padding = 6;
                const metrics = ctx.measureText(label);
                const textW = metrics.width;
                const textH = 14;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cx - textW / 2 - padding, topY - textH - padding, textW + padding * 2, textH + padding * 2, 4);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, cx, topY - textH / 2);
                
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.strokeRect(t.x, t.y, t.w, t.h);

                ctx.restore();
            }
        }

        ctx.restore();
    };

    const renderLoop = (timestamp: number) => {
        if (GameStore.selectedSimId !== lastSelectedId.current) {
            lastSelectedId.current = GameStore.selectedSimId;
            if (GameStore.selectedSimId) {
                isCameraLocked.current = true;
            }
        }

        if (GameStore.selectedSimId && isCameraLocked.current && !isDragging.current && GameStore.editor.mode === 'none') {
            const selectedSim = GameStore.sims.find(s => s.id === GameStore.selectedSimId);
            if (selectedSim) {
                const zoom = cameraRef.current.zoom;
                const targetX = selectedSim.pos.x - (window.innerWidth / 2) / zoom;
                const targetY = selectedSim.pos.y - (window.innerHeight / 2) / zoom;
                cameraRef.current.x = lerp(cameraRef.current.x, targetX, 0.05);
                cameraRef.current.y = lerp(cameraRef.current.y, targetY, 0.05);
            }
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) draw(ctx);
        }
        requestRef.current = requestAnimationFrame(renderLoop);
    };

    useEffect(() => {
        const worker = createWorker();
        worker.onmessage = (e) => { if (e.data === 'tick') gameLoopStep(); };
        worker.postMessage('start');
        requestRef.current = requestAnimationFrame(renderLoop);
        
        renderStaticLayer();

        const unsub = GameStore.subscribe(() => {
             if (GameStore.editor.mode !== 'none' || !GameStore.editor.isDragging) {
                 renderStaticLayer();
             }
        });

        return () => {
            worker.postMessage('stop'); worker.terminate();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            unsub();
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { 
            isDragging.current = true;
            hasDragged.current = false;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            // 🆕 记录起始点
            dragStartMousePos.current = { x: e.clientX, y: e.clientY };

            const zoom = cameraRef.current.zoom;
            const worldX = e.clientX / zoom + cameraRef.current.x;
            const worldY = e.clientY / zoom + cameraRef.current.y;
            
            const gridSnapX = Math.round(worldX / 50) * 50;
            const gridSnapY = Math.round(worldY / 50) * 50;

            if (GameStore.editor.mode !== 'none') {
                if (GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor) {
                    isPickingUp.current = true;
                    GameStore.editor.drawingFloor.startX = gridSnapX;
                    GameStore.editor.drawingFloor.startY = gridSnapY;
                    GameStore.editor.drawingFloor.currX = gridSnapX;
                    GameStore.editor.drawingFloor.currY = gridSnapY;
                    return;
                }
                
                if (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot) {
                    isPickingUp.current = true;
                    GameStore.editor.drawingPlot.startX = gridSnapX;
                    GameStore.editor.drawingPlot.startY = gridSnapY;
                    GameStore.editor.drawingPlot.currX = gridSnapX;
                    GameStore.editor.drawingPlot.currY = gridSnapY;
                    return;
                }

                if (GameStore.editor.isDragging && !isPickingUp.current) {
                    GameStore.editor.isDragging = false;
                    const finalPos = GameStore.editor.previewPos || {x:0, y:0};

                    if (GameStore.editor.placingTemplateId) {
                        GameStore.placePlot(finalPos.x, finalPos.y);
                    } else if (GameStore.editor.placingFurniture) {
                        GameStore.placeFurniture(finalPos.x, finalPos.y);
                    } else if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                        GameStore.finalizeMove('plot', GameStore.editor.selectedPlotId, dragStartPos.current);
                    } else if (GameStore.editor.mode === 'furniture' && GameStore.editor.selectedFurnitureId) {
                        GameStore.finalizeMove('furniture', GameStore.editor.selectedFurnitureId, dragStartPos.current);
                    }
                    else if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                        GameStore.finalizeMove('room', GameStore.editor.selectedRoomId, dragStartPos.current);
                    }
                    
                    renderStaticLayer();
                    return;
                }

                if (!GameStore.editor.isDragging) {
                    if (GameStore.editor.mode === 'plot') {
                        if (GameStore.editor.placingTemplateId || GameStore.editor.drawingPlot) return;

                        const clickedRoom = GameStore.rooms.find(r => 
                            worldX >= r.x && worldX <= r.x + r.w &&
                            worldY >= r.y && worldY <= r.y + r.h
                        );
                        if (clickedRoom) {
                            if (!clickedRoom.isCustom) {
                                const plot = GameStore.worldLayout.find(p => clickedRoom.id.startsWith(p.id + '_'));
                                if (plot) {
                                    GameStore.editor.selectedPlotId = plot.id;
                                    GameStore.editor.isDragging = true;
                                    isPickingUp.current = true;
                                    GameStore.editor.dragOffset = { x: worldX - plot.x, y: worldY - plot.y };
                                    GameStore.editor.previewPos = { x: plot.x, y: plot.y };
                                    dragStartPos.current = { x: plot.x, y: plot.y };
                                    renderStaticLayer(); 
                                    GameStore.notify();
                                    return;
                                }
                            }
                        }
                        if (GameStore.editor.selectedPlotId) {
                            GameStore.editor.selectedPlotId = null;
                            GameStore.notify();
                        }

                    } else if (GameStore.editor.mode === 'furniture') {
                        if (GameStore.editor.placingFurniture) return;

                        const clickedFurn = GameStore.furniture.find(f => 
                            worldX >= f.x && worldX <= f.x + f.w &&
                            worldY >= f.y && worldY <= f.y + f.h
                        );
                        if (clickedFurn) {
                            GameStore.editor.selectedFurnitureId = clickedFurn.id;
                            GameStore.editor.isDragging = true;
                            isPickingUp.current = true;
                            GameStore.editor.dragOffset = { x: worldX - clickedFurn.x, y: worldY - clickedFurn.y };
                            GameStore.editor.previewPos = { x: clickedFurn.x, y: clickedFurn.y };
                            dragStartPos.current = { x: clickedFurn.x, y: clickedFurn.y };
                            renderStaticLayer();
                            GameStore.notify();
                            return;
                        }
                        if (GameStore.editor.selectedFurnitureId) {
                            GameStore.editor.selectedFurnitureId = null;
                            GameStore.notify();
                        }
                    } else if (GameStore.editor.mode === 'floor') {
                        const clickedRoom = GameStore.rooms.find(r => 
                            r.isCustom &&
                            worldX >= r.x && worldX <= r.x + r.w &&
                            worldY >= r.y && worldY <= r.y + r.h
                        );
                        if (clickedRoom) {
                            GameStore.editor.selectedRoomId = clickedRoom.id;
                            GameStore.editor.isDragging = true;
                            isPickingUp.current = true;
                            GameStore.editor.dragOffset = { x: worldX - clickedRoom.x, y: worldY - clickedRoom.y };
                            GameStore.editor.previewPos = { x: clickedRoom.x, y: clickedRoom.y };
                            dragStartPos.current = { x: clickedRoom.x, y: clickedRoom.y };
                            renderStaticLayer();
                            GameStore.notify();
                            return;
                        }
                        GameStore.editor.selectedRoomId = null;
                        GameStore.notify();
                    }
                }
            }
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        const zoom = cameraRef.current.zoom;
        const dx = (e.clientX - lastMousePos.current.x) / zoom;
        const dy = (e.clientY - lastMousePos.current.y) / zoom;
        const mouseX = e.clientX / zoom + cameraRef.current.x;
        const mouseY = e.clientY / zoom + cameraRef.current.y;

        if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
            hasDragged.current = true;
            if (isDragging.current) {
                isCameraLocked.current = false;
            }
        }

        const gridX = Math.round(mouseX / 50) * 50;
        const gridY = Math.round(mouseY / 50) * 50;

        if (GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor && isPickingUp.current) {
            GameStore.editor.drawingFloor.currX = gridX;
            GameStore.editor.drawingFloor.currY = gridY;
        }
        else if (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot && isPickingUp.current) {
            GameStore.editor.drawingPlot.currX = gridX;
            GameStore.editor.drawingPlot.currY = gridY;
        }
        else if (GameStore.editor.mode !== 'none' && GameStore.editor.isDragging) {
            const gridSize = 10; 
            const rawX = mouseX - GameStore.editor.dragOffset.x;
            const rawY = mouseY - GameStore.editor.dragOffset.y;
            const newX = Math.round(rawX / gridSize) * gridSize;
            const newY = Math.round(rawY / gridSize) * gridSize;

            GameStore.editor.previewPos = { x: newX, y: newY };
        } 
        else if (isDragging.current) {
            cameraRef.current.x -= dx;
            cameraRef.current.y -= dy;
        } else {
            if (GameStore.editor.mode === 'none') {
                const hit = GameStore.worldGrid.queryHit(mouseX, mouseY);
                if (hit && hit.type === 'furniture') {
                    hoveredTarget.current = hit.ref;
                    if(canvasRef.current) canvasRef.current.style.cursor = 'auto'; 
                } else {
                    hoveredTarget.current = null;
                    if(canvasRef.current) canvasRef.current.style.cursor = 'auto';
                }
            }
        }
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = (e: React.MouseEvent) => {
        isDragging.current = false;

        // 🆕 计算移动距离，严格判断是否为点击
        const dragDist = Math.sqrt(
            Math.pow(e.clientX - dragStartMousePos.current.x, 2) + 
            Math.pow(e.clientY - dragStartMousePos.current.y, 2)
        );
        const isClick = dragDist < 5; // 允许5像素误差

        if (isPickingUp.current) {
            if (GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor) {
                isPickingUp.current = false;
                const { startX, startY, currX, currY, pattern, color, label, hasWall } = GameStore.editor.drawingFloor;
                const x = Math.min(startX, currX);
                const y = Math.min(startY, currY);
                const w = Math.abs(currX - startX);
                const h = Math.abs(currY - startY);
                
                if (w >= 50 && h >= 50) {
                    GameStore.createCustomRoom({x, y, w, h}, pattern, color, label, hasWall);
                }
                GameStore.editor.drawingFloor = null; 
                GameStore.notify();
                renderStaticLayer();
                return;
            }
            if (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot) {
                isPickingUp.current = false;
                const { startX, startY, currX, currY, templateId } = GameStore.editor.drawingPlot;
                const x = Math.min(startX, currX);
                const y = Math.min(startY, currY);
                const w = Math.abs(currX - startX);
                const h = Math.abs(currY - startY);
                
                if (w >= 50 && h >= 50) {
                    GameStore.createCustomPlot({x, y, w, h}, templateId);
                }
                GameStore.editor.drawingPlot = null;
                GameStore.notify();
                renderStaticLayer();
                return;
            }
        }

        if (GameStore.editor.mode !== 'none' && GameStore.editor.isDragging) {
            if (isPickingUp.current) {
                if (hasDragged.current) {
                    GameStore.editor.isDragging = false;
                    const finalPos = GameStore.editor.previewPos || {x:0, y:0};

                    if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                        GameStore.finalizeMove('plot', GameStore.editor.selectedPlotId, dragStartPos.current);
                    } else if (GameStore.editor.mode === 'furniture' && GameStore.editor.selectedFurnitureId) {
                        GameStore.finalizeMove('furniture', GameStore.editor.selectedFurnitureId, dragStartPos.current);
                    }
                    else if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                        GameStore.finalizeMove('room', GameStore.editor.selectedRoomId, dragStartPos.current);
                    }
                    renderStaticLayer();
                } else {
                    isPickingUp.current = false;
                }
            } 
            return;
        }

        // [BugFix] 仅当是真正的点击（未拖动）时才触发选中逻辑
        if (e.button === 0 && isClick) {
            const rect = canvasRef.current!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const zoom = cameraRef.current.zoom;
            const worldX = mouseX / zoom + cameraRef.current.x;
            const worldY = mouseY / zoom + cameraRef.current.y;

            if (GameStore.editor.mode === 'none') {
                let hitSim: string | null = null; 
                // 优先检测最上层的Sim (逆序遍历)
                for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                    let s = GameStore.sims[i];
                    // 增加点击判定范围
                    if (Math.abs(worldX - s.pos.x) < 40 && Math.abs(worldY - (s.pos.y - 20)) < 50) {
                        hitSim = s.id; break;
                    }
                }
                
                if (hitSim) {
                    if (GameStore.selectedSimId === hitSim) {
                        isCameraLocked.current = true;
                    } else {
                        GameStore.selectedSimId = hitSim;
                    }
                } else {
                    GameStore.selectedSimId = null; 
                }
                GameStore.notify();
            }
        }
    };

    const handleMouseLeave = () => { isDragging.current = false; };

    const handleWheel = (e: React.WheelEvent) => {
        const zoomSpeed = 0.001;
        const oldZoom = cameraRef.current.zoom;
        const newZoom = Math.min(Math.max(oldZoom - e.deltaY * zoomSpeed, 0.2), 4);

        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = mouseX / oldZoom + cameraRef.current.x;
        const worldY = mouseY / oldZoom + cameraRef.current.y;
        
        cameraRef.current.zoom = newZoom;
        cameraRef.current.x = worldX - mouseX / newZoom;
        cameraRef.current.y = worldY - mouseY / newZoom;
    };

    const handleAttributeChange = (key: 'name' | 'color' | 'type', value: string) => {
        if (selectedPlot) {
            GameStore.updatePlotAttributes(selectedPlot.id, { [key]: value });
        }
    };

    return (
        <div className="relative flex-1 h-full overflow-hidden">
            <canvas
                ref={canvasRef}
                width={windowSize.width}   
                height={windowSize.height}
                className="block cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
            />
            
            {selectedPlot && GameStore.editor.mode === 'plot' && !GameStore.editor.isDragging && !GameStore.editor.drawingPlot && (
                <div 
                    className="absolute z-50 bg-[#121212]/95 border border-white/20 p-3 rounded-xl shadow-2xl flex flex-col gap-3 animate-[fadeIn_0.1s_ease-out] w-64 backdrop-blur-md"
                    style={{ 
                        left: selectedPlot.x - 128, 
                        top: selectedPlot.y - 180 
                    }}
                >
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-white">📍 地皮设置</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 font-bold">名称</span>
                        <input 
                            type="text" 
                            className="bg-black/40 text-white text-xs border border-white/10 rounded px-2 py-1 outline-none focus:border-accent"
                            value={selectedPlot.customName || ''}
                            placeholder="输入地皮名称..."
                            onChange={(e) => handleAttributeChange('name', e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 font-bold">规划用途</span>
                        <select 
                            className="bg-black/40 text-white text-xs border border-white/10 rounded px-2 py-1 outline-none focus:border-accent appearance-none cursor-pointer hover:bg-white/5"
                            value={selectedPlot.customType || ''}
                            onChange={(e) => handleAttributeChange('type', e.target.value)}
                        >
                            <option value="">(无特定规划)</option>
                            {PLOT_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-400 font-bold">地皮颜色</span>
                        <div className="flex flex-wrap gap-1.5">
                            {SIMPLE_COLORS.map(c => (
                                <button
                                key={c}
                                onClick={() => handleAttributeChange('color', c)}
                                // ✨ 同样的按钮样式修改
                                className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center overflow-hidden ${selectedPlot.customColor === c ? 'border-white scale-110 shadow-lg ring-1 ring-white/50' : 'border-white/20'}`}
                                style={{ background: c === 'transparent' ? 'rgba(255,255,255,0.1)' : c }}
                                title={c === 'transparent' ? '无填充' : c}
                            >
                                {c === 'transparent' && (
                                    <div className="w-full h-px bg-red-500 transform rotate-45 scale-150"></div>
                                )}
                            </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            GameStore.editor.selectedPlotId = null;
                            GameStore.notify();
                        }}
                        className="w-full mt-2 bg-success/80 hover:bg-success text-white text-xs font-bold py-1.5 rounded transition-colors border border-success/30"
                    >
                        ✅ 确认
                    </button>
                </div>
            )}

            {(GameStore.editor.drawingPlot || GameStore.editor.drawingFloor) && !GameStore.editor.isDragging && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full pointer-events-none text-xs font-bold border border-white/20 shadow-lg backdrop-blur-sm animate-pulse z-40 flex items-center gap-2">
                    <span className="text-lg">🖱️</span> 按住鼠标左键拖拽以框选区域
                </div>
            )}
        </div>
    );
};

export default GameCanvas;