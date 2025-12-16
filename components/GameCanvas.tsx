import React, { useRef, useEffect, useState } from 'react';
import { CONFIG, AGE_CONFIG } from '../constants'; // [Import Updated]
import { GameStore, gameLoopStep, getActivePalette } from '../utils/simulation';
import { getAsset } from '../utils/assetLoader';
import { drawAvatarHead, drawPixelProp } from '../utils/render/pixelArt';

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

    // [Update] 添加 zoom 状态
    const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });

    // [New] 窗口大小状态，用于动态调整画布分辨率
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // 镜头锁定控制
    const isCameraLocked = useRef(false); 
    const lastSelectedId = useRef<string | null>(null);

    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);

    // [优化] 静态层 Canvas 缓存
    const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
    // 记录上一帧的时间段，用于判断是否需要重绘静态层
    const lastTimePaletteRef = useRef<string>('');

    // [New] 监听窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
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

        console.log("[Canvas] Static Layer Updated");
    };

    // ==========================================
    // 🎭 主渲染循环 (动态层)
    // ==========================================
    const draw = (ctx: CanvasRenderingContext2D) => {
        // 关闭平滑处理以保持像素锐利
        ctx.imageSmoothingEnabled = false;

        // 1. 清空视口
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // --- 应用摄像机变换 ---
        ctx.save();
        const zoom = cameraRef.current.zoom;
        const camX = Math.floor(cameraRef.current.x);
        const camY = Math.floor(cameraRef.current.y);
        
        // [New] 应用缩放和位移
        ctx.scale(zoom, zoom);
        ctx.translate(-camX, -camY);

        const mouseWorldX = (lastMousePos.current.x) / zoom + camX;
        const mouseWorldY = (lastMousePos.current.y) / zoom + camY;
        
        // 2. 检测环境光变化，决定是否重绘静态层
        const p = getActivePalette();
        const paletteKey = JSON.stringify(p); // 简单比较引用或内容
        if (paletteKey !== lastTimePaletteRef.current || !staticCanvasRef.current) {
            renderStaticLayer();
            lastTimePaletteRef.current = paletteKey;
        }

        // 3. 绘制静态背景层 (Copy Image) - 极快!
        if (staticCanvasRef.current) {
            ctx.drawImage(staticCanvasRef.current, 0, 0);
        }

        // 4. [优化] 鼠标悬停检测 (Furniture Tooltip)
        // 使用空间网格查询，而不是遍历所有家具
        const hoveredItem = GameStore.worldGrid.queryHit(mouseWorldX, mouseWorldY);
        if (hoveredItem && hoveredItem.type === 'furniture') {
            const f = hoveredItem.ref;
            const textWidth = ctx.measureText(f.label).width;
            
            ctx.save();
            // Tooltip 保持不随 zoom 缩放 (可选，这里跟随世界缩放比较简单)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1 / zoom; // 线条保持细致
            ctx.beginPath();
            ctx.roundRect(f.x + f.w/2 - textWidth/2 - 4, f.y - 20, textWidth + 8, 16, 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = '10px "Microsoft YaHei", sans-serif';
            ctx.fillText(f.label, f.x + f.w/2, f.y - 9);
            ctx.textAlign = 'left';
            ctx.restore();
        }

        // 5. 绘制角色 (Sims)
        const renderSims = [...GameStore.sims].sort((a, b) => a.pos.y - b.pos.y);
        renderSims.forEach(sim => {
            const renderX = sim.pos.x; 
            const renderY = sim.pos.y; 
            if (sim.action === 'working' && renderX < 0) return;

            ctx.save();
            ctx.translate(renderX, renderY);

            // 选中特效
            if (GameStore.selectedSimId === sim.id) {
                // 内圈
                ctx.fillStyle = '#39ff14';
                ctx.beginPath();
                ctx.ellipse(0, 5, 12, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // 外圈扩散
                const rippleScale = (Date.now() % 1000) / 1000;
                ctx.globalAlpha = (1 - rippleScale) * 0.6;
                ctx.strokeStyle = '#39ff14';
                ctx.lineWidth = 3 / zoom;
                ctx.beginPath();
                ctx.ellipse(0, 5, 10 + rippleScale * 15, 5 + rippleScale * 7, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1.0;

                // 悬浮箭头
                const floatY = -65 + Math.sin(Date.now() / 150) * 4;
                ctx.fillStyle = '#39ff14';
                ctx.beginPath();
                ctx.moveTo(0, floatY);
                ctx.lineTo(-10, floatY - 12);
                ctx.lineTo(10, floatY - 12);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); 
                ctx.ellipse(0, 5, 10, 4, 0, 0, Math.PI * 2); 
                ctx.fill();
            }

            // [修改] 根据年龄段获取体型参数
            // @ts-ignore
            const ageConfig = AGE_CONFIG[sim.ageStage] || AGE_CONFIG.Adult;
            const w = ageConfig.width || 20;
            const h = ageConfig.height || 42;
            const headSize = ageConfig.headSize || 13;

            const headY = -h + (headSize * 0.4);

            // === A. 绘制后发 (Back Hair) === 
            // 在身体之前绘制，防止遮挡
            drawAvatarHead(ctx, 0, headY, headSize, sim, 'back');

            // === B. 绘制小人身体 ===
            // [修复] 婴儿穿纸尿裤，其他人穿彩色裤子
            if (sim.ageStage === 'Infant') {
                // 纸尿裤 (白色)
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                // 绘制一个类似尿布的形状
                ctx.roundRect(-w / 2 + 1, -h * 0.4, w - 2, h * 0.4, 4);
                ctx.fill();
                // 衣服 (Baby shirt)
                const shoulderY = -h + (headSize * 0.6); 
                ctx.fillStyle = sim.clothesColor;
                ctx.fillRect(-w / 2, shoulderY, w, h * 0.4); 
            } else {
                // 正常裤子 (下半身)
                // [修复] 使用 sim.pantsColor 并调整高度以防遮挡
                ctx.fillStyle = sim.pantsColor || '#455A64'; 
                // 裤子从腰部 (-h * 0.45) 到底部 (0)
                ctx.fillRect(-w / 2, -h * 0.45, w, h * 0.45);
                
                // 衣服 (上半身) - 覆盖裤子腰部
                const shoulderY = -h + (headSize * 0.6); 
                // 衣服延伸到 -h * 0.4，比裤子腰线(-0.45h)略低，形成遮盖
                const shirtBottomY = -h * 0.25;
                
                ctx.fillStyle = sim.clothesColor;
                ctx.fillRect(-w / 2, shoulderY, w, shirtBottomY - shoulderY); 
            }
            
            // 手臂 (通用)
            const shoulderY = -h + (headSize * 0.6); 
            const shirtBottomY = -h * 0.4; // 与衣服一致
            ctx.fillStyle = 'rgba(0,0,0,0.1)'; // 手臂阴影
            const armW = Math.max(3, w * 0.2);
            const armH = (shirtBottomY - shoulderY) * 0.9;
            ctx.fillRect(-w/2, shoulderY, armW, armH); // Left
            ctx.fillRect(w/2 - armW, shoulderY, armW, armH); // Right

            // === C. 绘制前脸和前发 (Front Head) ===
            // 在身体之后绘制，确保脸和刘海在身体前面
            drawAvatarHead(ctx, 0, headY, headSize, sim, 'front');

            if (sim.action === 'phone') {
                ctx.fillStyle = '#ECEFF1'; ctx.fillRect(w/2 - 2, shoulderY + 5, 6, 9);
                ctx.fillStyle = '#81D4FA'; ctx.fillRect(w/2 - 1, shoulderY + 6, 4, 7);
            }

            // 气泡
            if (sim.bubble.timer > 0 && sim.bubble.text) {
                ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
                let width = ctx.measureText(sim.bubble.text).width + 12;
                
                let bg = '#fff', border='#2d3436', textC='#2d3436';
                if (sim.bubble.type === 'love') { bg = '#fd79a8'; border = '#e84393'; textC = '#fff'; }
                else if (sim.bubble.type === 'ai') { bg = '#a29bfe'; border = '#6c5ce7'; textC = '#fff'; }
                else if (sim.bubble.type === 'act') { bg = '#55efc4'; border = '#00b894'; textC = '#000'; }
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

        ctx.restore();
    };

    // 🎨 渲染循环
    const renderLoop = (timestamp: number) => {
        // 自动判断是否需要锁定镜头
        if (GameStore.selectedSimId !== lastSelectedId.current) {
            lastSelectedId.current = GameStore.selectedSimId;
            if (GameStore.selectedSimId) {
                isCameraLocked.current = true;
            }
        }

        // 镜头跟随逻辑
        if (GameStore.selectedSimId && isCameraLocked.current && !isDragging.current) {
            const selectedSim = GameStore.sims.find(s => s.id === GameStore.selectedSimId);
            if (selectedSim) {
                const zoom = cameraRef.current.zoom;
                // 计算目标位置：将选中市民置于屏幕中心
                // SimPos - (ScreenSize / 2) / Zoom
                const targetX = selectedSim.pos.x - (window.innerWidth / 2) / zoom;
                const targetY = selectedSim.pos.y - (window.innerHeight / 2) / zoom;
                
                // 平滑跟随
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
        
        // 初始渲染一次静态层
        renderStaticLayer();

        return () => {
            worker.postMessage('stop'); worker.terminate();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { 
            isDragging.current = true;
            hasDragged.current = false;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        if (isDragging.current) {
            if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
                hasDragged.current = true;
                // 一旦开始拖拽，解除镜头锁定，但不取消选中状态
                isCameraLocked.current = false; 
            }
            // 修正：拖拽距离需要除以 zoom
            cameraRef.current.x -= e.movementX / cameraRef.current.zoom;
            cameraRef.current.y -= e.movementY / cameraRef.current.zoom;
        }
    };
    
    const handleMouseUp = (e: React.MouseEvent) => {
        isDragging.current = false;

        if (e.button === 0 && !hasDragged.current) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // 修正：点击世界坐标计算 Screen / Zoom + Cam
            const zoom = cameraRef.current.zoom;
            const worldX = mouseX / zoom + cameraRef.current.x;
            const worldY = mouseY / zoom + cameraRef.current.y;

            // [优化] 点击检测
            // 1. 优先检测 Sims (动态，遍历检测)
            let hitSim: string | null = null; // Fix: 显式类型声明
            // 倒序遍历，因为绘制是顺序的（下面的覆盖上面的），所以点击应该先检测上面的
            for (let i = GameStore.sims.length - 1; i >= 0; i--) {
                let s = GameStore.sims[i];
                if (Math.abs(worldX - s.pos.x) < 40 && Math.abs(worldY - (s.pos.y - 20)) < 50) {
                    hitSim = s.id; break;
                }
            }
            
            if (hitSim) {
                // 如果点的是同一个人，说明用户想重新聚焦
                if (GameStore.selectedSimId === hitSim) {
                    isCameraLocked.current = true; // 手动重新锁定
                } else {
                    GameStore.selectedSimId = hitSim; // 切换新人，renderLoop 会自动处理锁定
                }
            } else {
                // 2. 如果没点到 Sim，检测家具 (使用空间网格加速)
                // const hitFurniture = GameStore.worldGrid.queryHit(worldX, worldY);
                // if (hitFurniture) console.log("Clicked furniture:", hitFurniture.ref.label);
                
                GameStore.selectedSimId = null; 
            }
            GameStore.notify();
        }
    };

    const handleMouseLeave = () => { isDragging.current = false; };

    // [New] 滚轮缩放事件
    const handleWheel = (e: React.WheelEvent) => {
        const zoomSpeed = 0.001;
        const oldZoom = cameraRef.current.zoom;
        const newZoom = Math.min(Math.max(oldZoom - e.deltaY * zoomSpeed, 0.5), 3); // Limit 0.5x to 3x

        // 以鼠标为中心进行缩放
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 计算缩放前的鼠标在世界坐标系的位置
        const worldX = mouseX / oldZoom + cameraRef.current.x;
        const worldY = mouseY / oldZoom + cameraRef.current.y;
        
        // 更新缩放
        cameraRef.current.zoom = newZoom;
        
        // 调整相机位置，使得缩放后鼠标位置对应的世界坐标不变
        // newWorldX = mouseX / newZoom + newCamX
        // 我们希望 newWorldX == worldX
        // 所以: newCamX = worldX - mouseX / newZoom
        cameraRef.current.x = worldX - mouseX / newZoom;
        cameraRef.current.y = worldY - mouseY / newZoom;
    };

    return (
        <canvas
            ref={canvasRef}
            width={windowSize.width}   // 使用动态宽度
            height={windowSize.height} // 使用动态高度
            className="block bg-[#121212] cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel} // 绑定滚轮事件
            onContextMenu={(e) => e.preventDefault()}
        />
    );
};

export default GameCanvas;