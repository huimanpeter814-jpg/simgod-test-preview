import React, { useRef, useEffect, useState } from 'react';
import { CONFIG, AGE_CONFIG } from '../constants'; 
import { GameStore, gameLoopStep, getActivePalette } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';
import { drawAvatarHead, drawPixelProp } from '../utils/render/pixelArt';
import { PLOTS } from '../data/plots';

// ==========================================
// 🕒 后台保活核心：Worker Timer
// ==========================================
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

// Lerp Helper
const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    // [Fix] 初始相机位置：居中
    // 假设地图中心大概在 (1800, 1000)，初始 Zoom 0.8
    const cameraRef = useRef({ 
        x: 1800 - window.innerWidth / 2, 
        y: 800 - window.innerHeight / 2, 
        zoom: 0.8 
    });

    // 用于存储当前悬停的物品
    const hoveredTarget = useRef<any>(null);

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    const isCameraLocked = useRef(false); 
    const lastSelectedId = useRef<string | null>(null);

    // 鼠标交互状态 Refs
    const isDragging = useRef(false); // 是否按下了鼠标左键
    const lastMousePos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false); // 按下鼠标后是否发生了位移（用于区分点击和拖拽）
    const isPickingUp = useRef(false); // 标记当前操作是否是“刚开始拾取”的点击
    
    const dragStartPos = useRef({ x: 0, y: 0 });

    // [优化] 静态层 Canvas 缓存
    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastTimePaletteRef = useRef<string>('');
    const lastStaticUpdateRef = useRef<number>(0); 

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
        
        // 初始化时稍微纠正一下相机中心，确保不偏
        if (cameraRef.current.x === 0 && cameraRef.current.y === 0) {
             cameraRef.current.x = 1800 - window.innerWidth / 2;
             cameraRef.current.y = 800 - window.innerHeight / 2;
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ==========================================
    // 🖼️ 静态层绘制逻辑 (只绘制一次或当光照变化时绘制)
    // ==========================================
    const renderStaticLayer = () => {
        if (!staticCanvasRef.current) {
            staticCanvasRef.current = document.createElement('canvas');
            staticCanvasRef.current.width = CONFIG.CANVAS_W;
            staticCanvasRef.current.height = CONFIG.CANVAS_H;
        }

        const ctx = staticCanvasRef.current.getContext('2d');
        if (!ctx) return;

        const p = getActivePalette();
        
        // 1. 绘制世界背景
        ctx.fillStyle = p.bg;
        ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

        // 2. 绘制房间/区域 (读取 GameStore)
        GameStore.rooms.forEach((r: any) => {
            // [Edit Mode] 如果是正在拖拽的地皮，跳过静态绘制
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId && GameStore.editor.isDragging) {
                if (r.id.startsWith(`${GameStore.editor.selectedPlotId}_`)) return;
            }

            // 外部阴影
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(r.x + 6, r.y + 6, r.w, r.h);

            const floorImg = getAsset((r as any).imagePath);
            if (floorImg) {
                const ptrn = ctx.createPattern(floorImg, 'repeat');
                if (ptrn) {
                    ctx.fillStyle = ptrn;
                    ctx.save();
                    ctx.translate(r.x, r.y);
                    ctx.fillRect(0, 0, r.w, r.h);
                    ctx.restore();
                } else {
                    ctx.drawImage(floorImg, r.x, r.y, r.w, r.h);
                }
            } else {
                ctx.fillStyle = r.color;
                ctx.fillRect(r.x, r.y, r.w, r.h);
                if (r.pixelPattern === 'grid' || r.pixelPattern === 'tile') {
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.beginPath();
                    for(let i=0; i<r.w; i+=40) { ctx.moveTo(r.x+i, r.y); ctx.lineTo(r.x+i, r.y+r.h); }
                    for(let i=0; i<r.h; i+=40) { ctx.moveTo(r.x, r.y+i); ctx.lineTo(r.x+r.w, r.y+i); }
                    ctx.stroke();
                }
            }
            if (r.id !== 'park_base' && !r.id.startsWith('road')) {
                ctx.strokeStyle = p.wall;
                ctx.lineWidth = 4;
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }
            if (r.label && !r.id.startsWith('road')) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                ctx.fillText(r.label, r.x + 10, r.y + 20);
            }
        });

        // 3. 绘制家具 (读取 GameStore)
        GameStore.furniture.forEach((f: any) => {
            // [Edit Mode] 如果是正在拖拽的家具，跳过静态绘制
            if (GameStore.editor.mode === 'furniture' && GameStore.editor.selectedFurnitureId === f.id && GameStore.editor.isDragging) return;
            // [Edit Mode] 如果是正在拖拽的地皮上的家具，也跳过静态绘制
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

    // ==========================================
    // 🎭 主渲染循环 (动态层)
    // ==========================================
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

        // 3. 绘制静态背景层
        if (staticCanvasRef.current) {
            ctx.drawImage(staticCanvasRef.current, 0, 0);
        }

        // 4. Editor Preview
        if (GameStore.editor.mode !== 'none') {
            // Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            const gridSize = 100;
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
                            const tpl = PLOTS[templateId];
                            if (tpl) {
                                roomsToRender = tpl.rooms.map(r => ({ ...r, x: r.x + x, y: r.y + y }));
                            }
                        }

                        roomsToRender.forEach(r => {
                            const floorImg = getAsset(r.imagePath);
                            if (floorImg) {
                                const ptrn = ctx.createPattern(floorImg, 'repeat');
                                if (ptrn) {
                                    ctx.fillStyle = ptrn;
                                    ctx.save();
                                    ctx.translate(r.x, r.y);
                                    ctx.fillRect(0, 0, r.w, r.h);
                                    ctx.restore();
                                } else {
                                    ctx.drawImage(floorImg, r.x, r.y, r.w, r.h);
                                }
                            } else {
                                ctx.fillStyle = r.color;
                                ctx.fillRect(r.x, r.y, r.w, r.h);
                                if (r.pixelPattern === 'grid' || r.pixelPattern === 'tile') {
                                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                                    ctx.strokeRect(r.x, r.y, r.w, r.h); 
                                }
                            }
                            ctx.strokeStyle = plotId ? '#ffff00' : '#00ff00';
                            ctx.lineWidth = 3;
                            ctx.strokeRect(r.x, r.y, r.w, r.h);
                        });

                        if (templateId) {
                            ctx.fillStyle = '#00ff00';
                            ctx.font = 'bold 14px "Microsoft YaHei"';
                            ctx.fillText("✨ 新地皮", x, y - 10);
                        }
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
                        const renderX = isNew ? x : x;
                        const renderY = isNew ? y : y;
                        
                        const previewF = { ...f, x: renderX, y: renderY };

                        if (previewF.pixelPattern !== 'zebra') {
                            ctx.fillStyle = p.furniture_shadow || 'rgba(0,0,0,0.2)';
                            ctx.fillRect(previewF.x + 4, previewF.y + 4, previewF.w, previewF.h);
                        }

                        const furnImg = getAsset(previewF.imagePath);
                        if (furnImg) {
                            ctx.drawImage(furnImg, previewF.x, previewF.y, previewF.w, previewF.h);
                        } else {
                            drawPixelProp(ctx, previewF, p);
                            if (previewF.pixelGlow) {
                                ctx.shadowBlur = 10;
                                ctx.shadowColor = previewF.glowColor || previewF.color;
                                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                                ctx.fillRect(previewF.x, previewF.y, previewF.w, previewF.h);
                                ctx.shadowBlur = 0;
                            }
                        }

                        ctx.strokeStyle = isNew ? '#00ff00' : '#ffff00';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(previewF.x - 2, previewF.y - 2, previewF.w + 4, previewF.h + 4);
                        
                        if (isNew) {
                            ctx.fillStyle = '#00ff00';
                            ctx.font = 'bold 12px "Microsoft YaHei"';
                            ctx.fillText("✨ 新增", renderX, renderY - 5);
                        }
                    };

                    if (GameStore.editor.selectedFurnitureId) {
                        const f = GameStore.furniture.find(i => i.id === GameStore.editor.selectedFurnitureId);
                        if (f) drawFurnPreview(f, false);
                    } 
                    else if (GameStore.editor.placingFurniture) {
                        drawFurnPreview(GameStore.editor.placingFurniture, true);
                    }
                }
                ctx.restore();
            }
        }

        // 5. 绘制角色 (Sims)
        const renderSims = [...GameStore.sims].sort((a, b) => a.pos.y - b.pos.y);
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

        // 6. 粒子
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
        // 7. 绘制悬停家具名称 (放在最上层绘制)
        if (hoveredTarget.current && GameStore.editor.mode === 'none') {
            const t = hoveredTarget.current;
            const label = t.label;
            
            if (label) {
                const cx = t.x + t.w / 2;
                const topY = t.y - 12; // 显示在家具上方

                ctx.save();
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                const padding = 6;
                const metrics = ctx.measureText(label);
                const textW = metrics.width;
                const textH = 14;

                // 绘制背景框 (半透明黑底 + 白边)
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cx - textW / 2 - padding, topY - textH - padding, textW + padding * 2, textH + padding * 2, 4);
                ctx.fill();
                ctx.stroke();

                // 绘制文字
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, cx, topY - textH / 2);
                
                // 可选：给家具加一个高亮边框，表示选中
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

            const zoom = cameraRef.current.zoom;
            const worldX = e.clientX / zoom + cameraRef.current.x;
            const worldY = e.clientY / zoom + cameraRef.current.y;

            if (GameStore.editor.mode !== 'none') {
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
                    
                    renderStaticLayer();
                    return;
                }

                if (!GameStore.editor.isDragging) {
                    if (GameStore.editor.mode === 'plot') {
                        if (GameStore.editor.placingTemplateId) return;

                        const clickedRoom = GameStore.rooms.find(r => 
                            worldX >= r.x && worldX <= r.x + r.w &&
                            worldY >= r.y && worldY <= r.y + r.h
                        );
                        if (clickedRoom) {
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

        if (GameStore.editor.mode !== 'none' && GameStore.editor.isDragging) {
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
        }else {
            // 非拖拽状态下的悬停检测 (仅在观察模式下生效)
            if (GameStore.editor.mode === 'none') {
                // 使用 SpatialHashGrid 进行快速查询
                const hit = GameStore.worldGrid.queryHit(mouseX, mouseY);
                
                // 我们只关心家具 (type === 'furniture')
                if (hit && hit.type === 'furniture') {
                    hoveredTarget.current = hit.ref;
                    // 设置鼠标样式为“可点击/查看”
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
                    renderStaticLayer();
                } else {
                    isPickingUp.current = false;
                }
            } 
            return;
        }

        if (e.button === 0 && !hasDragged.current) {
            const rect = canvasRef.current!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const zoom = cameraRef.current.zoom;
            const worldX = mouseX / zoom + cameraRef.current.x;
            const worldY = mouseY / zoom + cameraRef.current.y;

            if (GameStore.editor.mode === 'none') {
                let hitSim: string | null = null; 
                for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                    let s = GameStore.sims[i];
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

    return (
        <canvas
            ref={canvasRef}
            width={windowSize.width}   
            height={windowSize.height}
            className="block bg-[#121212] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
        />
    );
};

export default GameCanvas;