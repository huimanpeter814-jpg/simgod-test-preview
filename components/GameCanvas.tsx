import React, { useRef, useEffect, useState } from 'react';
import { CONFIG, AGE_CONFIG, ASSET_CONFIG } from '../constants';
import { GameStore, gameLoopStep, getActivePalette } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';
import { drawAvatarHead, drawPixelProp } from '../utils/render/pixelArt';
import { PLOTS } from '../data/plots';

// 地皮选项映射 (用于右键菜单或UI显示，这里保留作为参考)
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

// 创建 Web Worker 处理游戏循环 (保持流畅度)
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

// 绘制缩放手柄辅助函数
const drawResizeHandle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const handleSize = 12;
    // 计算右下角位置
    const hx = x + w - handleSize / 2;
    const hy = y + h - handleSize / 2;
    
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.rect(hx - handleSize/2, hy - handleSize/2, handleSize, handleSize);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
};

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);

    // 相机状态
    const cameraRef = useRef({ 
        x: 1800 - window.innerWidth / 2, 
        y: 800 - window.innerHeight / 2, 
        zoom: 0.8 
    });

    // 交互状态 Refs
    const hoveredTarget = useRef<any>(null);
    const isCameraLocked = useRef(false); 
    const lastSelectedId = useRef<string | null>(null);
    
    const isSpacePressed = useRef(false); // 空格键状态
    const isDraggingCamera = useRef(false); // 是否正在拖拽镜头
    const isResizing = useRef(false); // 是否正在缩放
    
    const isDraggingObject = useRef(false); // 是否正在拖拽物体
    const lastMousePos = useRef({ x: 0, y: 0 });
    const dragStartMousePos = useRef({ x: 0, y: 0 }); // 区分点击和拖拽
    const isPickingUp = useRef(false); // 是否处于刚点击未移动的状态
    const dragStartPos = useRef({ x: 0, y: 0 }); // 物体初始位置

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    const [selectedPlot, setSelectedPlot] = useState<{
        id: string, x: number, y: number, templateId: string, 
        customName?: string, customColor?: string, customType?: string
    } | null>(null);

    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastTimePaletteRef = useRef<string>('');
    const lastStaticUpdateRef = useRef<number>(0); 

    const [editorRefresh, setEditorRefresh] = useState(0);

    // 1. 窗口大小监听
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        
        // 初始化相机位置
        if (cameraRef.current.x === 0 && cameraRef.current.y === 0) {
             cameraRef.current.x = 1800 - window.innerWidth / 2;
             cameraRef.current.y = 800 - window.innerHeight / 2;
        }

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. 键盘事件监听 (空格键漫游)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                isSpacePressed.current = true;
                if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
            }
            // 删除快捷键
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (GameStore.editor.selectedPlotId) GameStore.removePlot(GameStore.editor.selectedPlotId);
                else if (GameStore.editor.selectedFurnitureId) GameStore.removeFurniture(GameStore.editor.selectedFurnitureId);
                else if (GameStore.editor.selectedRoomId) GameStore.removeRoom(GameStore.editor.selectedRoomId);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpacePressed.current = false;
                isDraggingCamera.current = false; // 松开空格立即停止拖拽镜头
                if (canvasRef.current) canvasRef.current.style.cursor = 'default';
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // 3. Store 订阅
    useEffect(() => {
        const unsub = GameStore.subscribe(() => {
            setEditorRefresh(prev => prev + 1);

            // 同步 React State 中的选中地皮信息，用于 UI 显示
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                if (plot) {
                    const zoom = cameraRef.current.zoom;
                    const camX = cameraRef.current.x;
                    const camY = cameraRef.current.y;
                    const screenX = (plot.x - camX) * zoom;
                    const screenY = (plot.y - camY) * zoom;
                    
                    setSelectedPlot({ 
                        id: plot.id, x: screenX, y: screenY, 
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

    // 4. 静态层渲染 (背景、地板)
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

        // 背景图
        const bgPath = ASSET_CONFIG.bg?.find(path => path.includes('bg_img')) || ASSET_CONFIG.bg?.[0];
        const bgImg = getAsset(bgPath);

        if (bgImg) {
            ctx.drawImage(bgImg, 0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        } else {
            ctx.fillStyle = p.bg;
            ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        }

        // 房间/地板绘制
        const allRooms = [...GameStore.rooms.filter(r => !r.isCustom), ...GameStore.rooms.filter(r => r.isCustom)];
        
        allRooms.forEach((r: any) => {
            // 如果正在拖拽地皮，隐藏其附带的房间以避免重影
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId && isDraggingObject.current) {
                if (r.id.startsWith(`${GameStore.editor.selectedPlotId}_`)) return;
            }
            // 如果正在拖拽房间
            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId === r.id && isDraggingObject.current) return;

            // 选中高亮效果 (在静态层画一部分，动态层画框)
            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId === r.id) {
                ctx.globalAlpha = 0.8;
            }

            // 绘制逻辑 (保持原有逻辑)
            if (r.color !== 'transparent' && !r.isCustom) {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(r.x + 6, r.y + 6, r.w, r.h);
            }

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
                // ... (纹理绘制代码保持不变)
                if (r.pixelPattern === 'wood') {
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    for (let i = 0; i < r.w; i += 20) ctx.fillRect(r.x + i, r.y, 2, r.h);
                } else if (r.pixelPattern === 'grid' || r.pixelPattern === 'tile') {
                    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                    ctx.beginPath();
                    for(let i=0; i<r.w; i+=40) { ctx.moveTo(r.x+i, r.y); ctx.lineTo(r.x+i, r.y+r.h); }
                    for(let i=0; i<r.h; i+=40) { ctx.moveTo(r.x, r.y+i); ctx.lineTo(r.x+r.w, r.y+i); }
                    ctx.stroke();
                } else if (r.pixelPattern === 'stripes') {
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.setLineDash([20, 20]);
                    ctx.beginPath();
                    if (r.w > r.h) { ctx.moveTo(r.x, r.y + r.h/2); ctx.lineTo(r.x+r.w, r.y+r.h/2); } 
                    else { ctx.moveTo(r.x + r.w/2, r.y); ctx.lineTo(r.x+r.w/2, r.y+r.h); }
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            if (r.hasWall) {
                ctx.strokeStyle = p.wall || '#5a6572';
                ctx.lineWidth = 4;
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }

            if (r.label && !r.id.startsWith('road')) {
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                ctx.fillText(r.label, r.x + 10, r.y + 20);
            }
            
            ctx.globalAlpha = 1.0;
        });

        // 家具绘制 (非选中/非拖拽状态)
        GameStore.furniture.forEach((f: any) => {
            if (GameStore.editor.mode === 'furniture' && GameStore.editor.selectedFurnitureId === f.id && isDraggingObject.current) return;
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId && f.id.startsWith(`${GameStore.editor.selectedPlotId}_`) && isDraggingObject.current) return;

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

    // 5. 每一帧绘制 (动态层)
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
        
        // 渲染静态层缓存
        const paletteKey = JSON.stringify(p);
        if (paletteKey !== lastTimePaletteRef.current || !staticCanvasRef.current) {
             renderStaticLayer();
             lastTimePaletteRef.current = paletteKey;
        }
        if (staticCanvasRef.current) {
            ctx.drawImage(staticCanvasRef.current, 0, 0);
        }

        // --- 编辑器 UI (网格、选中框、预览) ---
        if (GameStore.editor.mode !== 'none') {
            // 网格
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            const startX = Math.floor(camX / gridSize) * gridSize;
            const startY = Math.floor(camY / gridSize) * gridSize;
            const endX = startX + (ctx.canvas.width / zoom);
            const endY = startY + (ctx.canvas.height / zoom);

            ctx.beginPath();
            for (let x = startX; x < endX; x += gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
            for (let y = startY; y < endY; y += gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
            ctx.stroke();

            // 框选预览
            if ((GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor) || (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot)) {
                const drawing = GameStore.editor.drawingFloor || GameStore.editor.drawingPlot;
                if (drawing) {
                    const { startX, startY, currX, currY } = drawing;
                    const x = Math.min(startX, currX);
                    const y = Math.min(startY, currY);
                    const w = Math.abs(currX - startX);
                    const h = Math.abs(currY - startY);
                    if (w > 0 && h > 0) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.fillRect(x, y, w, h);
                        ctx.strokeStyle = '#ffff00';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                        ctx.strokeRect(x, y, w, h);
                        ctx.setLineDash([]);
                        
                        // 尺寸提示
                        ctx.fillStyle = '#fff';
                        ctx.font = '12px sans-serif';
                        ctx.fillText(`${w} x ${h}`, x + w/2 - 20, y + h/2);
                    }
                }
            }

            // 选中框 & 缩放手柄
            // 1. 地皮
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                if (plot) {
                    const w = plot.width || 300;
                    const h = plot.height || 300;
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(plot.x, plot.y, w, h);
                    drawResizeHandle(ctx, plot.x, plot.y, w, h);
                }
            }
            // 2. 房间
            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                if (room) {
                    ctx.strokeStyle = '#39ff14';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(room.x, room.y, room.w, room.h);
                    drawResizeHandle(ctx, room.x, room.y, room.w, room.h);
                }
            }

            // 拖拽预览 (Ghost)
            if (GameStore.editor.previewPos) {
                const { x, y } = GameStore.editor.previewPos;
                ctx.save();
                ctx.globalAlpha = 0.8;
                
                if (GameStore.editor.mode === 'furniture' && (GameStore.editor.selectedFurnitureId || GameStore.editor.placingFurniture)) {
                    let f = GameStore.furniture.find(i => i.id === GameStore.editor.selectedFurnitureId) || GameStore.editor.placingFurniture;
                    if (f) {
                        const previewF = { ...f, x, y };
                        drawPixelProp(ctx, previewF, p);
                        ctx.strokeStyle = '#ffff00';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, (f.w||0), (f.h||0));
                    }
                } else if (GameStore.editor.mode === 'plot') {
                    // 地皮移动预览 (简化为一个矩形)
                    let w = 300, h = 300;
                    if (GameStore.editor.selectedPlotId) {
                        const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                        if (plot) { w = plot.width || 300; h = plot.height || 300; }
                    }
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.fillRect(x, y, w, h);
                    ctx.strokeStyle = '#ffff00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                }
                ctx.restore();
            }
        }

        // --- Sims 绘制 ---
        const renderSims = [...GameStore.sims].sort((a, b) => {
            if (a.carryingSimId === b.id) return -1;
            if (b.carryingSimId === a.id) return 1;
            return a.pos.y - b.pos.y;
        });

        renderSims.forEach(sim => {
            const renderX = sim.pos.x; 
            const renderY = sim.pos.y; 
            ctx.save();
            ctx.translate(renderX, renderY);

            // 选中脚底光圈
            if (GameStore.selectedSimId === sim.id) {
                ctx.fillStyle = '#39ff14';
                ctx.beginPath(); ctx.ellipse(0, 5, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
            }

            // Sim 绘制逻辑
            // @ts-ignore
            const ageConfig = AGE_CONFIG[sim.ageStage] || AGE_CONFIG.Adult;
            const w = ageConfig.width || 20;
            const h = ageConfig.height || 42;
            const headSize = ageConfig.headSize || 13;
            const headY = -h + (headSize * 0.4);

            drawAvatarHead(ctx, 0, headY, headSize, sim, 'back');

            // 身体
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
            
            // 手臂
            const shoulderY = -h + (headSize * 0.6); 
            const shirtBottomY = -h * 0.4; 
            ctx.fillStyle = 'rgba(0,0,0,0.1)'; 
            const armW = Math.max(3, w * 0.2);
            const armH = (shirtBottomY - shoulderY) * 0.9;
            ctx.fillRect(-w/2, shoulderY, armW, armH); 
            ctx.fillRect(w/2 - armW, shoulderY, armW, armH);

            drawAvatarHead(ctx, 0, headY, headSize, sim, 'front');

            // 气泡
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

        // 悬停提示
        if (hoveredTarget.current && GameStore.editor.mode === 'none') {
            const t = hoveredTarget.current;
            if (t.label) {
                const cx = t.x + t.w / 2;
                const topY = t.y - 12;
                ctx.save();
                ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
                const padding = 6;
                const metrics = ctx.measureText(t.label);
                const textW = metrics.width;
                const textH = 14;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cx - textW / 2 - padding, topY - textH - padding, textW + padding * 2, textH + padding * 2, 4);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(t.label, cx, topY - textH / 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2;
                ctx.strokeRect(t.x, t.y, t.w, t.h);
                ctx.restore();
            }
        }

        ctx.restore();
    };

    const renderLoop = (timestamp: number) => {
        // 自动跟随选中市民
        if (GameStore.selectedSimId !== lastSelectedId.current) {
            lastSelectedId.current = GameStore.selectedSimId;
            if (GameStore.selectedSimId) isCameraLocked.current = true;
        }
        if (GameStore.selectedSimId && isCameraLocked.current && !isDraggingCamera.current && GameStore.editor.mode === 'none') {
            const selectedSim = GameStore.sims.find(s => s.id === GameStore.selectedSimId);
            if (selectedSim) {
                const zoom = cameraRef.current.zoom;
                const targetX = selectedSim.pos.x - (window.innerWidth / 2) / zoom;
                const targetY = selectedSim.pos.y - (window.innerHeight / 2) / zoom;
                cameraRef.current.x = lerp(cameraRef.current.x, targetX, 0.05);
                cameraRef.current.y = lerp(cameraRef.current.y, targetY, 0.05);
            }
        }

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
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
             if (GameStore.editor.mode !== 'none' || (!isDraggingObject.current && !isDraggingCamera.current)) {
                 renderStaticLayer();
             }
        });
        return () => {
            worker.postMessage('stop'); worker.terminate();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            unsub();
        };
    }, []);

    // 交互逻辑
    const handleMouseDown = (e: React.MouseEvent) => {
        const zoom = cameraRef.current.zoom;
        const worldX = e.clientX / zoom + cameraRef.current.x;
        const worldY = e.clientY / zoom + cameraRef.current.y;
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        dragStartMousePos.current = { x: e.clientX, y: e.clientY };

        // 优先级 1: 空格键漫游模式
        if (isSpacePressed.current) {
            isDraggingCamera.current = true;
            if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
            return;
        }

        // 优先级 2: 编辑模式下的操作
        if (GameStore.editor.mode !== 'none') {
            
            // 2.1 检查是否点击了缩放手柄
            const handleSize = 12 / zoom; // 调整感应区域
            
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                if (plot) {
                    const w = plot.width || 300; 
                    const h = plot.height || 300;
                    if (worldX >= plot.x + w - handleSize - 20 && worldX <= plot.x + w + 20 &&
                        worldY >= plot.y + h - handleSize - 20 && worldY <= plot.y + h + 20) {
                        isResizing.current = true;
                        isDraggingObject.current = true; // 借用此状态阻止其他操作
                        return;
                    }
                }
            }
            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                if (room) {
                    if (worldX >= room.x + room.w - handleSize - 20 && worldX <= room.x + room.w + 20 &&
                        worldY >= room.y + room.h - handleSize - 20 && worldY <= room.y + room.h + 20) {
                        isResizing.current = true;
                        isDraggingObject.current = true;
                        return;
                    }
                }
            }

            // 2.2 正常的物体选择/拖拽
            const gridSnapX = Math.round(worldX / 50) * 50;
            const gridSnapY = Math.round(worldY / 50) * 50;

            if (GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor) {
                isPickingUp.current = true;
                GameStore.editor.drawingFloor.startX = gridSnapX; GameStore.editor.drawingFloor.startY = gridSnapY;
                GameStore.editor.drawingFloor.currX = gridSnapX; GameStore.editor.drawingFloor.currY = gridSnapY;
                return;
            }
            
            if (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot) {
                isPickingUp.current = true;
                GameStore.editor.drawingPlot.startX = gridSnapX; GameStore.editor.drawingPlot.startY = gridSnapY;
                GameStore.editor.drawingPlot.currX = gridSnapX; GameStore.editor.drawingPlot.currY = gridSnapY;
                return;
            }

            if (!GameStore.editor.isDragging) {
                if (GameStore.editor.mode === 'plot') {
                    if (GameStore.editor.placingTemplateId) return;
                    const clickedRoom = GameStore.rooms.find(r => worldX >= r.x && worldX <= r.x + r.w && worldY >= r.y && worldY <= r.y + r.h);
                    if (clickedRoom && !clickedRoom.isCustom) {
                        const plot = GameStore.worldLayout.find(p => clickedRoom.id.startsWith(p.id + '_'));
                        if (plot) {
                            GameStore.editor.selectedPlotId = plot.id;
                            GameStore.editor.isDragging = true;
                            isPickingUp.current = true;
                            isDraggingObject.current = true;
                            GameStore.editor.dragOffset = { x: worldX - plot.x, y: worldY - plot.y };
                            GameStore.editor.previewPos = { x: plot.x, y: plot.y };
                            dragStartPos.current = { x: plot.x, y: plot.y };
                            GameStore.notify();
                            return;
                        }
                    }
                    GameStore.editor.selectedPlotId = null;
                    GameStore.notify();
                } 
                else if (GameStore.editor.mode === 'furniture') {
                    if (GameStore.editor.placingFurniture) return;
                    // 逆序查找，优先选中上层
                    const clickedFurn = [...GameStore.furniture].reverse().find(f => worldX >= f.x && worldX <= f.x + f.w && worldY >= f.y && worldY <= f.y + f.h);
                    if (clickedFurn) {
                        GameStore.editor.selectedFurnitureId = clickedFurn.id;
                        GameStore.editor.isDragging = true;
                        isPickingUp.current = true;
                        isDraggingObject.current = true;
                        GameStore.editor.dragOffset = { x: worldX - clickedFurn.x, y: worldY - clickedFurn.y };
                        GameStore.editor.previewPos = { x: clickedFurn.x, y: clickedFurn.y };
                        dragStartPos.current = { x: clickedFurn.x, y: clickedFurn.y };
                        GameStore.notify();
                        return;
                    }
                    GameStore.editor.selectedFurnitureId = null;
                    GameStore.notify();
                } 
                else if (GameStore.editor.mode === 'floor') {
                    const clickedRoom = GameStore.rooms.find(r => r.isCustom && worldX >= r.x && worldX <= r.x + r.w && worldY >= r.y && worldY <= r.y + r.h);
                    if (clickedRoom) {
                        GameStore.editor.selectedRoomId = clickedRoom.id;
                        GameStore.editor.isDragging = true;
                        isPickingUp.current = true;
                        isDraggingObject.current = true;
                        GameStore.editor.dragOffset = { x: worldX - clickedRoom.x, y: worldY - clickedRoom.y };
                        GameStore.editor.previewPos = { x: clickedRoom.x, y: clickedRoom.y };
                        dragStartPos.current = { x: clickedRoom.x, y: clickedRoom.y };
                        GameStore.notify();
                        return;
                    }
                    GameStore.editor.selectedRoomId = null;
                    GameStore.notify();
                }
            } else {
                // 已经在 Place 模式下，点击即放置
                isPickingUp.current = true; 
                isDraggingObject.current = true;
            }
        } else {
            // 生活模式：检测点击 Sim
            const isClick = true; 
            // 在 MouseDown 不做点击判定，留给 MouseUp
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const zoom = cameraRef.current.zoom;
        const dx = (e.clientX - lastMousePos.current.x) / zoom;
        const dy = (e.clientY - lastMousePos.current.y) / zoom;
        const mouseX = e.clientX / zoom + cameraRef.current.x;
        const mouseY = e.clientY / zoom + cameraRef.current.y;

        if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
            if (!isDraggingCamera.current && !isDraggingObject.current) isCameraLocked.current = false;
        }

        // 1. 镜头漫游
        if (isDraggingCamera.current) {
            cameraRef.current.x -= dx;
            cameraRef.current.y -= dy;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // 2. 缩放逻辑
        if (isResizing.current) {
            const snapSize = 50;
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                if (plot) {
                    let newW = mouseX - plot.x; let newH = mouseY - plot.y;
                    newW = Math.max(50, Math.round(newW / snapSize) * snapSize);
                    newH = Math.max(50, Math.round(newH / snapSize) * snapSize);
                    plot.width = newW; plot.height = newH;
                    // 更新关联的基础地板
                    const baseRoom = GameStore.rooms.find(r => r.id === `${plot.id}_base`);
                    if (baseRoom) { baseRoom.w = newW; baseRoom.h = newH; }
                    
                    GameStore.initIndex(); GameStore.notify();
                }
            } else if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                if (room) {
                    let newW = mouseX - room.x; let newH = mouseY - room.y;
                    newW = Math.max(50, Math.round(newW / snapSize) * snapSize);
                    newH = Math.max(50, Math.round(newH / snapSize) * snapSize);
                    room.w = newW; room.h = newH;
                    GameStore.initIndex(); GameStore.notify();
                }
            }
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // 3. 物体/框选拖拽
        const gridX = Math.round(mouseX / 50) * 50;
        const gridY = Math.round(mouseY / 50) * 50;

        if (GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor && isPickingUp.current) {
            GameStore.editor.drawingFloor.currX = gridX; GameStore.editor.drawingFloor.currY = gridY;
        } else if (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot && isPickingUp.current) {
            GameStore.editor.drawingPlot.currX = gridX; GameStore.editor.drawingPlot.currY = gridY;
        } else if (GameStore.editor.mode !== 'none' && GameStore.editor.isDragging) {
            const gridSize = 10; 
            const rawX = mouseX - GameStore.editor.dragOffset.x;
            const rawY = mouseY - GameStore.editor.dragOffset.y;
            const newX = Math.round(rawX / gridSize) * gridSize;
            const newY = Math.round(rawY / gridSize) * gridSize;
            GameStore.editor.previewPos = { x: newX, y: newY };
        } else {
            // Hover 效果
            if (GameStore.editor.mode === 'none') {
                const hit = GameStore.worldGrid.queryHit(mouseX, mouseY);
                if (hit && hit.type === 'furniture') {
                    hoveredTarget.current = hit.ref;
                    if(canvasRef.current) canvasRef.current.style.cursor = 'pointer'; 
                } else {
                    hoveredTarget.current = null;
                    if(canvasRef.current) canvasRef.current.style.cursor = 'default';
                }
            }
        }
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        isDraggingObject.current = false;
        
        if (isDraggingCamera.current) {
            // [修复] 无论空格是否按着，只要松开鼠标，就必须停止镜头的移动计算
            isDraggingCamera.current = false; 

            // [逻辑] 检查后续状态
            if (isSpacePressed.current) {
                // 如果还按着空格：保持"抓手"光标，准备下一次点击拖拽
                if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
            } else {
                // 如果空格也松开了：恢复默认光标
                if (canvasRef.current) canvasRef.current.style.cursor = 'default';
            }
            return;
        }

        if (isResizing.current) {
            isResizing.current = false;
            GameStore.editor.finalizeResize();
            return;
        }

        // 判定点击
        const dragDist = Math.sqrt(Math.pow(e.clientX - dragStartMousePos.current.x, 2) + Math.pow(e.clientY - dragStartMousePos.current.y, 2));
        const isClick = dragDist < 5;

        // 框选结束
        if (isPickingUp.current) {
            if (GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor) {
                isPickingUp.current = false;
                const { startX, startY, currX, currY, pattern, color, label, hasWall } = GameStore.editor.drawingFloor;
                const x = Math.min(startX, currX); const y = Math.min(startY, currY);
                const w = Math.abs(currX - startX); const h = Math.abs(currY - startY);
                if (w >= 50 && h >= 50) GameStore.createCustomRoom({x, y, w, h}, pattern, color, label, hasWall);
                GameStore.editor.drawingFloor = null; GameStore.notify(); renderStaticLayer();
                return;
            }
            if (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot) {
                isPickingUp.current = false;
                const { startX, startY, currX, currY, templateId } = GameStore.editor.drawingPlot;
                const x = Math.min(startX, currX); const y = Math.min(startY, currY);
                const w = Math.abs(currX - startX); const h = Math.abs(currY - startY);
                if (w >= 50 && h >= 50) GameStore.createCustomPlot({x, y, w, h}, templateId);
                GameStore.editor.drawingPlot = null; GameStore.notify(); renderStaticLayer();
                return;
            }
        }

        // 放置物体
        if (GameStore.editor.mode !== 'none' && GameStore.editor.isDragging) {
            if (isPickingUp.current) {
                // 如果是移动物体（非点击放置新物体），则结束移动
                if (!isClick || GameStore.editor.placingTemplateId || GameStore.editor.placingFurniture) {
                    GameStore.editor.isDragging = false;
                    const finalPos = GameStore.editor.previewPos || {x:0, y:0};

                    if (GameStore.editor.placingTemplateId) GameStore.placePlot(finalPos.x, finalPos.y);
                    else if (GameStore.editor.placingFurniture) GameStore.placeFurniture(finalPos.x, finalPos.y);
                    else if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) GameStore.finalizeMove('plot', GameStore.editor.selectedPlotId, dragStartPos.current);
                    else if (GameStore.editor.mode === 'furniture' && GameStore.editor.selectedFurnitureId) GameStore.finalizeMove('furniture', GameStore.editor.selectedFurnitureId, dragStartPos.current);
                    else if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) GameStore.finalizeMove('room', GameStore.editor.selectedRoomId, dragStartPos.current);
                    
                    renderStaticLayer();
                } 
                isPickingUp.current = false;
            }
            return;
        }

        // 生活模式点击选择 Sim
        if (e.button === 0 && isClick && GameStore.editor.mode === 'none') {
            const zoom = cameraRef.current.zoom;
            const worldX = e.clientX / zoom + cameraRef.current.x;
            const worldY = e.clientY / zoom + cameraRef.current.y;
            
            let hitSim: string | null = null; 
            for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                let s = GameStore.sims[i];
                if (Math.abs(worldX - s.pos.x) < 40 && Math.abs(worldY - (s.pos.y - 20)) < 50) {
                    hitSim = s.id; break;
                }
            }
            if (hitSim) {
                if (GameStore.selectedSimId === hitSim) isCameraLocked.current = true;
                else GameStore.selectedSimId = hitSim;
            } else {
                GameStore.selectedSimId = null; 
            }
            GameStore.notify();
        }
    };

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
        <div className="relative flex-1 h-full overflow-hidden">
            <canvas
                ref={canvasRef}
                width={windowSize.width}   
                height={windowSize.height}
                className="block"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { isDraggingObject.current = false; }}
                onWheel={handleWheel}
                onContextMenu={(e) => e.preventDefault()}
            />
            {/* Editor UI Overlay logic remains in EditorPanel or handled by state overlay */}
        </div>
    );
};

export default GameCanvas;