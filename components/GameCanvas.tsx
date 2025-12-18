import React, { useRef, useEffect, useState } from 'react';
import { CONFIG, AGE_CONFIG, ASSET_CONFIG } from '../constants';
import { GameStore, gameLoopStep, getActivePalette } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';
import { drawAvatarHead, drawPixelProp } from '../utils/render/pixelArt';
import { PLOTS } from '../data/plots';

// 创建 Web Worker 处理游戏循环
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

// 绘制缩放手柄 (白色小方块)
const drawResizeHandle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const handleSize = 12;
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

    const initialZoom = 0.8;
    const initialX = (CONFIG.CANVAS_W - window.innerWidth / initialZoom) / 2;
    const initialY = (CONFIG.CANVAS_H - window.innerHeight / initialZoom) / 2;

    const cameraRef = useRef({ x: initialX, y: initialY, zoom: initialZoom });

    // Refs
    const hoveredTarget = useRef<any>(null);
    const isCameraLocked = useRef(false); 
    const lastSelectedId = useRef<string | null>(null);
    
    // 交互状态
    const isDraggingCamera = useRef(false);
    const isResizing = useRef(false);
    const isDraggingObject = useRef(false);
    
    const lastMousePos = useRef({ x: 0, y: 0 });
    const dragStartMousePos = useRef({ x: 0, y: 0 });
    const isPickingUp = useRef(false); 
    const dragStartPos = useRef({ x: 0, y: 0 }); 

    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [selectedPlot, setSelectedPlot] = useState<any>(null);
    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastTimePaletteRef = useRef<string>('');
    const lastStaticUpdateRef = useRef<number>(0); 
    const [editorRefresh, setEditorRefresh] = useState(0);

    // 限制相机边界
    const clampCamera = (targetX: number, targetY: number, currentZoom: number) => {
        const padding = 200;
        const minX = -padding;
        const maxX = CONFIG.CANVAS_W - (window.innerWidth / currentZoom) + padding;
        const minY = -padding;
        const maxY = CONFIG.CANVAS_H - (window.innerHeight / currentZoom) + padding;
        const clampedX = Math.max(Math.min(minX, maxX), Math.min(targetX, Math.max(minX, maxX)));
        const clampedY = Math.max(Math.min(minY, maxY), Math.min(targetY, Math.max(minY, maxY)));
        return { x: clampedX, y: clampedY };
    };

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        if (cameraRef.current.x === 0 && cameraRef.current.y === 0) {
             cameraRef.current.x = 1800 - window.innerWidth / 2;
             cameraRef.current.y = 800 - window.innerHeight / 2;
        }
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (GameStore.editor.selectedPlotId) GameStore.removePlot(GameStore.editor.selectedPlotId);
                else if (GameStore.editor.selectedFurnitureId) GameStore.removeFurniture(GameStore.editor.selectedFurnitureId);
                else if (GameStore.editor.selectedRoomId) GameStore.removeRoom(GameStore.editor.selectedRoomId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const unsub = GameStore.subscribe(() => {
            setEditorRefresh(prev => prev + 1);
            // 同步选中地皮状态
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                if (plot) {
                    const zoom = cameraRef.current.zoom;
                    const screenX = (plot.x - cameraRef.current.x) * zoom;
                    const screenY = (plot.y - cameraRef.current.y) * zoom;
                    setSelectedPlot({ id: plot.id, x: screenX, y: screenY, templateId: plot.templateId });
                }
            } else {
                setSelectedPlot(null);
            }
        });
        return unsub;
    }, []);

    // 渲染静态层 (背景/地板/家具)
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
        
        // 背景
        const bgPath = ASSET_CONFIG.bg?.find(path => path.includes('bg_img')) || ASSET_CONFIG.bg?.[0];
        const bgImg = getAsset(bgPath);
        if (bgImg) ctx.drawImage(bgImg, 0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
        else { ctx.fillStyle = p.bg; ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H); }

        // 绘制所有房间 (移除了 !isCustom 限制，使其显示统一)
        const allRooms = [...GameStore.rooms.filter(r => !r.isCustom), ...GameStore.rooms.filter(r => r.isCustom)];
        allRooms.forEach((r: any) => {
            // 拖拽时隐藏原始物体 (Ghost效果)
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId && isDraggingObject.current && r.id.startsWith(`${GameStore.editor.selectedPlotId}_`)) return;
            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId === r.id && isDraggingObject.current) return;
            
            // 选中时半透明
            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId === r.id) ctx.globalAlpha = 0.6;

            // 绘制逻辑
            if (r.color !== 'transparent' && !r.isCustom) { ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x + 6, r.y + 6, r.w, r.h); }
            if (r.color === 'transparent' || !r.label.startsWith('空地')) { ctx.strokeStyle = p.wall; ctx.lineWidth = 1; ctx.strokeRect(r.x, r.y, r.w, r.h); }
            
            const floorImg = getAsset((r as any).imagePath);
            if (floorImg) { ctx.drawImage(floorImg, r.x, r.y, r.w, r.h); } 
            else { ctx.fillStyle = r.color; ctx.fillRect(r.x, r.y, r.w, r.h); }
            
            if (r.hasWall) { ctx.strokeStyle = p.wall || '#5a6572'; ctx.lineWidth = 4; ctx.strokeRect(r.x, r.y, r.w, r.h); }
            
            if (r.label && !r.id.startsWith('road')) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(r.label, r.x + 10, r.y + 20); }
            ctx.globalAlpha = 1.0;
        });

        // 绘制家具
        GameStore.furniture.forEach((f: any) => {
            if (GameStore.editor.mode === 'furniture' && GameStore.editor.selectedFurnitureId === f.id && isDraggingObject.current) return;
            // 如果是在拖拽地皮，隐藏上面的家具
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId && f.id.startsWith(`${GameStore.editor.selectedPlotId}_`) && isDraggingObject.current) return;
            
            if (f.pixelPattern !== 'zebra') { ctx.fillStyle = p.furniture_shadow || 'rgba(0,0,0,0.2)'; ctx.fillRect(f.x + 4, f.y + 4, f.w, f.h); }
            const furnImg = getAsset(f.imagePath);
            if (furnImg) ctx.drawImage(furnImg, f.x, f.y, f.w, f.h);
            else drawPixelProp(ctx, f, p); 
        });
        lastStaticUpdateRef.current = Date.now();
    };

    // 动态层绘制 (UI, 选中框, Sims)
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

        const p = getActivePalette();
        const paletteKey = JSON.stringify(p);
        if (paletteKey !== lastTimePaletteRef.current || !staticCanvasRef.current) { renderStaticLayer(); lastTimePaletteRef.current = paletteKey; }
        if (staticCanvasRef.current) ctx.drawImage(staticCanvasRef.current, 0, 0);

        // --- 编辑模式 UI ---
        if (GameStore.editor.mode !== 'none') {
            // 网格
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = 1;
            const gridSize = 50;
            const startX = Math.floor(camX / gridSize) * gridSize; const startY = Math.floor(camY / gridSize) * gridSize;
            const endX = startX + (ctx.canvas.width / zoom); const endY = startY + (ctx.canvas.height / zoom);
            ctx.beginPath();
            for (let x = startX; x < endX; x += gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
            for (let y = startY; y < endY; y += gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
            ctx.stroke();

            // 1. 地皮选中框
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                if (plot) {
                    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.strokeRect(plot.x, plot.y, plot.width || 300, plot.height || 300);
                    // 仅在编辑工具下显示缩放手柄
                    // @ts-ignore
                    if (GameStore.editor.activeTool !== 'camera') drawResizeHandle(ctx, plot.x, plot.y, plot.width || 300, plot.height || 300);
                }
            }
            // 2. 房间选中框 (Floor Mode)
            if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                if (room) {
                    ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 2; ctx.strokeRect(room.x, room.y, room.w, room.h);
                    // @ts-ignore
                    if (GameStore.editor.activeTool !== 'camera') drawResizeHandle(ctx, room.x, room.y, room.w, room.h);
                }
            }
            // 3. 家具选中框
            if (GameStore.editor.mode === 'furniture' && GameStore.editor.selectedFurnitureId) {
                const furn = GameStore.furniture.find(f => f.id === GameStore.editor.selectedFurnitureId);
                if (furn) { ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2; ctx.strokeRect(furn.x, furn.y, furn.w, furn.h); }
            }

            // 拖拽时的半透明预览 (Ghost)
            if (GameStore.editor.previewPos) {
                const { x, y } = GameStore.editor.previewPos;
                ctx.save(); ctx.globalAlpha = 0.8;
                
                if (GameStore.editor.mode === 'furniture' && (GameStore.editor.selectedFurnitureId || GameStore.editor.placingFurniture)) {
                    let f = GameStore.furniture.find(i => i.id === GameStore.editor.selectedFurnitureId) || GameStore.editor.placingFurniture;
                    if (f) { const previewF = { ...f, x, y }; drawPixelProp(ctx, previewF, p); ctx.strokeStyle = '#ffff00'; ctx.strokeRect(x, y, f.w||0, f.h||0); }
                } else if (GameStore.editor.mode === 'plot') {
                    let w = 300, h = 300;
                    if (GameStore.editor.selectedPlotId) { const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId); if(plot){ w=plot.width||300; h=plot.height||300; } }
                    else if (GameStore.editor.placingTemplateId) { const tpl = PLOTS[GameStore.editor.placingTemplateId]; if(tpl){ w=tpl.width; h=tpl.height; } }
                    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#ffff00'; ctx.strokeRect(x, y, w, h);
                } else if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                    const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                    if (room) { ctx.fillStyle = 'rgba(57, 255, 20, 0.2)'; ctx.fillRect(x, y, room.w, room.h); ctx.strokeStyle = '#39ff14'; ctx.strokeRect(x, y, room.w, room.h); }
                }
                ctx.restore();
            }

            // 框选时的预览
            if ((GameStore.editor.drawingFloor || GameStore.editor.drawingPlot) && isPickingUp.current) {
                const d = GameStore.editor.drawingFloor || GameStore.editor.drawingPlot;
                if (d) {
                    const x = Math.min(d.startX, d.currX); const y = Math.min(d.startY, d.currY);
                    const w = Math.abs(d.currX - d.startX); const h = Math.abs(d.currY - d.startY);
                    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x, y, w, h);
                    ctx.strokeStyle = '#ffff00'; ctx.setLineDash([5, 5]); ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
                    ctx.fillStyle = '#fff'; ctx.fillText(`${w} x ${h}`, x + w/2 - 20, y + h/2);
                }
            }
        }

        // Sims 绘制
        const renderSims = [...GameStore.sims].sort((a, b) => {
            if (a.carryingSimId === b.id) return -1;
            if (b.carryingSimId === a.id) return 1;
            return a.pos.y - b.pos.y;
        });
        renderSims.forEach(sim => {
            const renderX = sim.pos.x; const renderY = sim.pos.y;
            ctx.save(); ctx.translate(renderX, renderY);
            if (GameStore.selectedSimId === sim.id) { ctx.fillStyle = '#39ff14'; ctx.beginPath(); ctx.ellipse(0, 5, 12, 6, 0, 0, Math.PI * 2); ctx.fill(); }
            // @ts-ignore
            const ageConfig = AGE_CONFIG[sim.ageStage] || AGE_CONFIG.Adult;
            const w = ageConfig.width || 20; const h = ageConfig.height || 42; const headSize = ageConfig.headSize || 13; const headY = -h + (headSize * 0.4);
            drawAvatarHead(ctx, 0, headY, headSize, sim, 'back');
            ctx.fillStyle = sim.pantsColor || '#455A64'; ctx.fillRect(-w / 2, -h * 0.45, w, h * 0.45);
            ctx.fillStyle = sim.clothesColor; ctx.fillRect(-w / 2, -h + (headSize * 0.6), w, (-h * 0.25) - (-h + (headSize * 0.6))); 
            drawAvatarHead(ctx, 0, headY, headSize, sim, 'front');
            if (sim.bubble.timer > 0 && sim.bubble.text) { ctx.font='10px sans-serif'; ctx.fillStyle='#fff'; ctx.fillText(sim.bubble.text, 0, -h-20); }
            ctx.restore();
        });

        // 悬停提示
        if (hoveredTarget.current && GameStore.editor.mode === 'none') {
            const t = hoveredTarget.current;
            if (t.label) {
                const cx = t.x + t.w / 2; const topY = t.y - 12;
                ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(cx - 30, topY - 20, 60, 20);
                ctx.fillStyle = '#fff'; ctx.fillText(t.label, cx - 15, topY - 5);
                ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.strokeRect(t.x, t.y, t.w, t.h);
            }
        }
        ctx.restore();
    };

    const renderLoop = (timestamp: number) => {
        if (GameStore.selectedSimId !== lastSelectedId.current) {
            lastSelectedId.current = GameStore.selectedSimId;
            if (GameStore.selectedSimId) isCameraLocked.current = true;
        }
        if (GameStore.selectedSimId && isCameraLocked.current && !isDraggingCamera.current && GameStore.editor.mode === 'none') {
            const selectedSim = GameStore.sims.find(s => s.id === GameStore.selectedSimId);
            if (selectedSim) {
                const zoom = cameraRef.current.zoom;
                cameraRef.current.x = lerp(cameraRef.current.x, selectedSim.pos.x - (window.innerWidth/2)/zoom, 0.05);
                cameraRef.current.y = lerp(cameraRef.current.y, selectedSim.pos.y - (window.innerHeight/2)/zoom, 0.05);
            }
        }
        if (canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if (ctx) draw(ctx); }
        requestRef.current = requestAnimationFrame(renderLoop);
    };

    useEffect(() => {
        const worker = createWorker();
        worker.onmessage = (e) => { if (e.data === 'tick') gameLoopStep(); };
        worker.postMessage('start');
        requestRef.current = requestAnimationFrame(renderLoop);
        renderStaticLayer();
        const unsub = GameStore.subscribe(() => { if (GameStore.editor.mode !== 'none' || (!isDraggingObject.current && !isDraggingCamera.current)) renderStaticLayer(); });
        return () => { worker.postMessage('stop'); worker.terminate(); if (requestRef.current) cancelAnimationFrame(requestRef.current); unsub(); };
    }, []);

    // === 核心交互逻辑 ===
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const zoom = cameraRef.current.zoom;
        const worldX = e.clientX / zoom + cameraRef.current.x;
        const worldY = e.clientY / zoom + cameraRef.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        dragStartMousePos.current = { x: e.clientX, y: e.clientY };

        // 1. 生活模式 (始终是漫游)
        if (GameStore.editor.mode === 'none') {
            isDraggingCamera.current = true;
            if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
            return;
        }

        // 2. 编辑模式
        // 注意：EditorPanel 把 'select' 映射为了 'move'，所以这里检查 move
        // @ts-ignore
        const activeTool = GameStore.editor.activeTool || 'select';

        // 放置新物体优先级最高 (Override all tools)
        if (GameStore.editor.placingTemplateId || GameStore.editor.placingFurniture || GameStore.editor.drawingFloor || GameStore.editor.drawingPlot) {
            isPickingUp.current = true;
            isDraggingObject.current = true;
            if (GameStore.editor.drawingFloor || GameStore.editor.drawingPlot) {
                const gridSnapX = Math.round(worldX / 50) * 50; const gridSnapY = Math.round(worldY / 50) * 50;
                if(GameStore.editor.drawingFloor) { GameStore.editor.drawingFloor.startX = gridSnapX; GameStore.editor.drawingFloor.startY = gridSnapY; GameStore.editor.drawingFloor.currX = gridSnapX; GameStore.editor.drawingFloor.currY = gridSnapY; }
                if(GameStore.editor.drawingPlot) { GameStore.editor.drawingPlot.startX = gridSnapX; GameStore.editor.drawingPlot.startY = gridSnapY; GameStore.editor.drawingPlot.currX = gridSnapX; GameStore.editor.drawingPlot.currY = gridSnapY; }
            }
            return;
        }

        // 1. 漫游模式 (Camera)
        if (activeTool === 'camera') {
            isDraggingCamera.current = true;
            if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
            return;
        }

        // 2. 编辑模式 (Select) - 统一处理移动和缩放
        if (activeTool === 'select') {
            const zoom = cameraRef.current.zoom;
            const handleSize = 20 / zoom; 
            let targetFound = false;

            // --- A. 检测缩放手柄 (仅当已选中物体时) ---
            if (GameStore.editor.mode === 'plot' && GameStore.editor.selectedPlotId) {
                const plot = GameStore.worldLayout.find(p => p.id === GameStore.editor.selectedPlotId);
                if (plot) {
                    const w = plot.width || 300; const h = plot.height || 300;
                    // 检测右下角区域
                    if (worldX >= plot.x + w - handleSize && worldX <= plot.x + w + handleSize && worldY >= plot.y + h - handleSize && worldY <= plot.y + h + handleSize) {
                        isResizing.current = true; isDraggingObject.current = true; targetFound = true;
                    }
                }
            } else if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                if (room) {
                    if (worldX >= room.x + room.w - handleSize && worldX <= room.x + room.w + handleSize && worldY >= room.y + room.h - handleSize && worldY <= room.y + room.h + handleSize) {
                        isResizing.current = true; isDraggingObject.current = true; targetFound = true;
                    }
                }
            }

            if (targetFound) return; // 如果点到了缩放手柄，直接开始缩放，不进行移动判定

            // --- B. 检测物体点击 (移动) ---
            let hitFound = false;
            if (GameStore.editor.mode === 'plot') {
                const clickedRoom = GameStore.rooms.find(r => worldX >= r.x && worldX <= r.x + r.w && worldY >= r.y && worldY <= r.y + r.h);
                if (clickedRoom) {
                    const plot = GameStore.worldLayout.find(p => clickedRoom.id.startsWith(p.id + '_'));
                    if (plot) {
                        GameStore.editor.selectedPlotId = plot.id; GameStore.editor.isDragging = true; isPickingUp.current = true; isDraggingObject.current = true;
                        GameStore.editor.dragOffset = { x: worldX - plot.x, y: worldY - plot.y }; GameStore.editor.previewPos = { x: plot.x, y: plot.y }; dragStartPos.current = { x: plot.x, y: plot.y };
                        hitFound = true;
                    }
                }
            } else if (GameStore.editor.mode === 'furniture') {
                const clickedFurn = [...GameStore.furniture].reverse().find(f => worldX >= f.x && worldX <= f.x + f.w && worldY >= f.y && worldY <= f.y + f.h);
                if (clickedFurn) {
                    GameStore.editor.selectedFurnitureId = clickedFurn.id; GameStore.editor.isDragging = true; isPickingUp.current = true; isDraggingObject.current = true;
                    GameStore.editor.dragOffset = { x: worldX - clickedFurn.x, y: worldY - clickedFurn.y }; GameStore.editor.previewPos = { x: clickedFurn.x, y: clickedFurn.y }; dragStartPos.current = { x: clickedFurn.x, y: clickedFurn.y };
                    hitFound = true;
                }
            } else if (GameStore.editor.mode === 'floor') {
                // [修改] 解锁默认地板：移除 !r.isCustom 判断，允许选中所有地板
                const clickedRoom = [...GameStore.rooms].reverse().find(r => worldX >= r.x && worldX <= r.x + r.w && worldY >= r.y && worldY <= r.y + r.h);
                if (clickedRoom) {
                    GameStore.editor.selectedRoomId = clickedRoom.id; GameStore.editor.isDragging = true; isPickingUp.current = true; isDraggingObject.current = true;
                    GameStore.editor.dragOffset = { x: worldX - clickedRoom.x, y: worldY - clickedRoom.y }; GameStore.editor.previewPos = { x: clickedRoom.x, y: clickedRoom.y }; dragStartPos.current = { x: clickedRoom.x, y: clickedRoom.y };
                    hitFound = true;
                }
            }

            if (hitFound) {
                GameStore.notify();
            } else {
                // 点击空地 -> 取消选择
                GameStore.editor.selectedPlotId = null; GameStore.editor.selectedFurnitureId = null; GameStore.editor.selectedRoomId = null;
                GameStore.notify();
            }
            return;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const zoom = cameraRef.current.zoom;
        const dx = (e.clientX - lastMousePos.current.x) / zoom;
        const dy = (e.clientY - lastMousePos.current.y) / zoom;
        const mouseX = e.clientX / zoom + cameraRef.current.x;
        const mouseY = e.clientY / zoom + cameraRef.current.y;

        // 解锁跟随
        if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
            if (!isDraggingCamera.current && !isDraggingObject.current) isCameraLocked.current = false;
        }

        // 1. 镜头漫游
        if (isDraggingCamera.current) {
            const targetX = cameraRef.current.x - dx;
            const targetY = cameraRef.current.y - dy;
            const clamped = clampCamera(targetX, targetY, zoom);
            cameraRef.current.x = clamped.x; cameraRef.current.y = clamped.y;
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
                    newW = Math.max(50, Math.round(newW / snapSize) * snapSize); newH = Math.max(50, Math.round(newH / snapSize) * snapSize);
                    plot.width = newW; plot.height = newH;
                    // 同时更新关联的基础地板
                    const baseRoom = GameStore.rooms.find(r => r.id === `${plot.id}_base`);
                    if (baseRoom) { baseRoom.w = newW; baseRoom.h = newH; }
                    GameStore.initIndex(); GameStore.notify();
                }
            } else if (GameStore.editor.mode === 'floor' && GameStore.editor.selectedRoomId) {
                const room = GameStore.rooms.find(r => r.id === GameStore.editor.selectedRoomId);
                if (room) {
                    let newW = mouseX - room.x; let newH = mouseY - room.y;
                    newW = Math.max(50, Math.round(newW / snapSize) * snapSize); newH = Math.max(50, Math.round(newH / snapSize) * snapSize);
                    room.w = newW; room.h = newH;
                    GameStore.initIndex(); GameStore.notify();
                }
            }
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        // 3. 物体移动 / 框选
        if (GameStore.editor.mode === 'floor' && GameStore.editor.drawingFloor && isPickingUp.current) {
            const gridX = Math.round(mouseX / 50) * 50; const gridY = Math.round(mouseY / 50) * 50;
            GameStore.editor.drawingFloor.currX = gridX; GameStore.editor.drawingFloor.currY = gridY;
        } else if (GameStore.editor.mode === 'plot' && GameStore.editor.drawingPlot && isPickingUp.current) {
            const gridX = Math.round(mouseX / 50) * 50; const gridY = Math.round(mouseY / 50) * 50;
            GameStore.editor.drawingPlot.currX = gridX; GameStore.editor.drawingPlot.currY = gridY;
        } else if (GameStore.editor.mode !== 'none' && GameStore.editor.isDragging) {
            const gridSize = 10; 
            const rawX = mouseX - GameStore.editor.dragOffset.x; const rawY = mouseY - GameStore.editor.dragOffset.y;
            const newX = Math.round(rawX / gridSize) * gridSize; const newY = Math.round(rawY / gridSize) * gridSize;
            GameStore.editor.previewPos = { x: newX, y: newY };
        } else if (GameStore.editor.mode === 'none') {
            // Life Mode Hover
            const hit = GameStore.worldGrid.queryHit(mouseX, mouseY);
            if (hit && hit.type === 'furniture') { hoveredTarget.current = hit.ref; if(canvasRef.current) canvasRef.current.style.cursor = 'pointer'; } 
            else { hoveredTarget.current = null; if(canvasRef.current) canvasRef.current.style.cursor = 'default'; }
        }
        
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        isDraggingObject.current = false;
        if (canvasRef.current) canvasRef.current.style.cursor = 'default';

        const dragDist = Math.sqrt(Math.pow(e.clientX - dragStartMousePos.current.x, 2) + Math.pow(e.clientY - dragStartMousePos.current.y, 2));
        const isClick = dragDist < 5;

        if (isDraggingCamera.current) {
            isDraggingCamera.current = false;
            return; 
        }

        if (isResizing.current) {
            isResizing.current = false;
            GameStore.editor.finalizeResize();
            return;
        }

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

        // 放置物体/移动结束
        if (GameStore.editor.mode !== 'none' && GameStore.editor.isDragging) {
            if (isPickingUp.current) {
                // 如果是移动操作，结束移动并更新位置
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

        // Life Mode: Select Sim
        if (isClick && GameStore.editor.mode === 'none') {
            const zoom = cameraRef.current.zoom;
            const worldX = e.clientX / zoom + cameraRef.current.x;
            const worldY = e.clientY / zoom + cameraRef.current.y;
            let hitSim: string | null = null; 
            for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                let s = GameStore.sims[i];
                if (Math.abs(worldX - s.pos.x) < 40 && Math.abs(worldY - (s.pos.y - 20)) < 50) { hitSim = s.id; break; }
            }
            if (hitSim) { if (GameStore.selectedSimId === hitSim) isCameraLocked.current = true; else GameStore.selectedSimId = hitSim; } 
            else { GameStore.selectedSimId = null; }
            GameStore.notify();
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        const zoomSpeed = 0.001;
        const oldZoom = cameraRef.current.zoom;
        const minZoom = Math.max(0.2, Math.min(window.innerWidth / CONFIG.CANVAS_W, window.innerHeight / CONFIG.CANVAS_H) * 0.95);
        const maxZoom = 4;
        const newZoom = Math.min(Math.max(oldZoom - e.deltaY * zoomSpeed, minZoom), maxZoom);
        
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = mouseX / oldZoom + cameraRef.current.x;
        const worldY = mouseY / oldZoom + cameraRef.current.y;
        
        let targetCamX = worldX - mouseX / newZoom;
        let targetCamY = worldY - mouseY / newZoom;
        const clamped = clampCamera(targetCamX, targetCamY, newZoom);

        cameraRef.current.zoom = newZoom;
        cameraRef.current.x = clamped.x;
        cameraRef.current.y = clamped.y;
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
        </div>
    );
};

export default GameCanvas;