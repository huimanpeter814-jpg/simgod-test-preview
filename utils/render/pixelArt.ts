import { SimData, AgeStage } from '../../types';
import { getAsset } from '../assetLoader';

// ==========================================
// 🎨 像素风格渲染库 (增强版)
// ==========================================

const PIXEL_STEP = 2;

// --- 基础图形辅助 ---
const drawPseudoCircle = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(cx - r + PIXEL_STEP, cy - r, (r * 2) - (PIXEL_STEP * 2), r * 2);
    ctx.fillRect(cx - r, cy - r + PIXEL_STEP, r * 2, (r * 2) - (PIXEL_STEP * 2));
};

const drawPseudoRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + PIXEL_STEP, y, w - (PIXEL_STEP * 2), h);
    ctx.fillRect(x, y + PIXEL_STEP, w, h - (PIXEL_STEP * 2));
};

// --- 发型与头像绘制 ---
const drawPixelHair = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, styleIndex: number, ageStage: AgeStage, layer: 'back' | 'front') => {    
    if (ageStage === 'Infant') {
        if (layer === 'back') return;
        drawPseudoCircle(ctx, x, y - s - 2, 2, color);
        return;
    }
    let finalColor = color;
    let effectiveStyle = styleIndex;
    if (ageStage === 'Elder') {
        finalColor = ['#dcdde1', '#7f8fa6'][styleIndex % 2];
        if (styleIndex % 3 === 0) effectiveStyle = 9; 
    }
    ctx.fillStyle = finalColor;

    if (layer === 'front') {
        if (![6, 7, 9, 14].includes(effectiveStyle)) { // Base cap
             ctx.fillRect(x - s + 2, y - s, s * 2 - 4, s);
             ctx.fillRect(x - s, y - s + 2, s * 2, s - 2);
        }
        if (effectiveStyle === 1) { // Bob
            ctx.fillRect(x - s, y - s, s * 2, s * 0.5);
            ctx.fillRect(x - s, y - s, s * 0.4, s * 1.5);
            ctx.fillRect(x + s - s * 0.4, y - s, s * 0.4, s * 1.5);
        } else if (effectiveStyle === 9) { // Balding
            ctx.fillRect(x - s, y - s * 0.5, s * 0.5, s);
            ctx.fillRect(x + s * 0.5, y - s * 0.5, s * 0.5, s);
        } else { // Generic Short
            ctx.fillRect(x - s, y - s, s * 2, s * 0.6);
            if (effectiveStyle % 2 === 0) ctx.fillRect(x + s*0.2, y - s - 2, s*0.6, 2); 
        }
    } else {
        // Back hair
        if (effectiveStyle === 1 || effectiveStyle === 5 || effectiveStyle === 15) { // Long
            ctx.fillRect(x - s - 1, y - s * 0.5, s * 2 + 2, s * 2);
        } else if (effectiveStyle === 8) { // Twin tails
            ctx.fillRect(x - s * 1.8, y, s * 0.8, s * 1.5);
            ctx.fillRect(x + s * 1.0, y, s * 0.8, s * 1.5);
        }
    }
};

export function drawAvatarHead(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, sim: SimData, renderLayer: 'all' | 'back' | 'front' = 'all') {
    let s = size;
    const hash = sim.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const styleIndex = hash % 17;

    if (renderLayer === 'all' || renderLayer === 'back') {
        drawPixelHair(ctx, x, y, s, sim.hairColor, styleIndex, sim.ageStage, 'back');
    }
    if (renderLayer === 'back') return;

    // Face
    drawPseudoRoundRect(ctx, x - s, y - s, s * 2, s * 2, sim.skinColor);
    // Eyes
    ctx.fillStyle = '#121212';
    const eyeSize = Math.max(2, s * 0.15);
    ctx.fillRect(x - s * 0.45, y + s * 0.2, eyeSize, eyeSize);     
    ctx.fillRect(x + s * 0.45 - eyeSize, y + s * 0.2, eyeSize, eyeSize); 

    if (renderLayer === 'all' || renderLayer === 'front') {
        drawPixelHair(ctx, x, y, s, sim.hairColor, styleIndex, sim.ageStage, 'front');
    }
}

// --- 🛠️ 核心：家具/物品绘制逻辑 ---
export const drawPixelProp = (ctx: CanvasRenderingContext2D, f: any, p: any) => {
    // 🆕 旋转支持
    const rotation = f.rotation || 0;
    
    // 如果没有旋转，走快速通道
    if (rotation === 0) {
        drawInternal(ctx, f.x, f.y, f.w, f.h, f, p);
    } else {
        // 计算旋转中心
        const cx = f.x + f.w / 2;
        const cy = f.y + f.h / 2;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((rotation * 90 * Math.PI) / 180);
        
        // [修复关键点] 
        // 当旋转 90 或 270 度时 (rotation % 2 !== 0)，数据层(Data)的 w 和 h 已经被交换以匹配世界坐标的 AABB。
        // 但在旋转后的本地坐标系(Local Context)中，我们需要画出家具“原始”的形状。
        // 因此，如果旋转了 90/270 度，我们需要把 w 和 h 再次换回来传给绘制函数。
        
        const isRotated90 = rotation % 2 !== 0;
        const localW = isRotated90 ? f.h : f.w;
        const localH = isRotated90 ? f.w : f.h;
        
        // drawInternal 期望左上角坐标。我们在中心，所以偏移 -localW/2
        drawInternal(ctx, -localW/2, -localH/2, localW, localH, { ...f, x: -localW/2, y: -localH/2 }, p);
        
        ctx.restore();
    }
};

// 内部绘制函数，坐标已相对于原点或世界坐标
const drawInternal = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: any, p: any) => {
    const { color, pixelPattern } = f;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.fillStyle = color;

    // 1. 🎹 乐器类
    if (pixelPattern === 'piano') {
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(x, y, w, h);
        // 简单的方向适配：如果是竖向的，画竖向琴键
        if (h > w) {
             ctx.fillStyle = '#ffffff';
             ctx.fillRect(x + w * 0.6, y + 2, w * 0.35, h - 4);
        } else {
             ctx.fillStyle = '#3d3d3d';
             ctx.fillRect(x, y + h * 0.4, w, h * 0.2);
             ctx.fillStyle = '#ffffff';
             ctx.fillRect(x + 2, y + h * 0.6, w - 4, h * 0.35);
             ctx.fillStyle = '#000000';
             for (let i = 10; i < w - 10; i += 12) {
                 if (i % 24 !== 0) ctx.fillRect(x + i, y + h * 0.6, 6, h * 0.2);
             }
        }
        return;
    }

    // 2. 🏃 健身类
    if (pixelPattern === 'treadmill') { // 跑步机
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#636e72'; 
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8); 
        // 跑带纹理
        ctx.fillStyle = '#000';
        if (h > w) {
            for(let i=y+4; i<y+h-4; i+=10) ctx.fillRect(x+4, i, w-8, 2); 
            ctx.fillStyle = '#dfe6e9'; ctx.fillRect(x, y, w, 20); // 控制台
        } else {
            for(let i=x+4; i<x+w-4; i+=10) ctx.fillRect(i, y+4, 2, h-8);
            ctx.fillStyle = '#dfe6e9'; ctx.fillRect(x, y, 20, h); 
        }
        return;
    }
    if (pixelPattern === 'weights_rack') { // 举重床
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(x, y, w, h); 
        ctx.fillStyle = '#b2bec3';
        if (h > w) {
            ctx.fillRect(x - 5, y + 20, w + 10, 6); // 杠铃杆
            ctx.fillStyle = '#000';
            drawPseudoCircle(ctx, x - 5, y + 23, 8, '#000');
            drawPseudoCircle(ctx, x + w + 5, y + 23, 8, '#000');
        } else {
            ctx.fillRect(x + 20, y - 5, 6, h + 10);
            ctx.fillStyle = '#000';
            drawPseudoCircle(ctx, x + 23, y - 5, 8, '#000');
            drawPseudoCircle(ctx, x + 23, y + h + 5, 8, '#000');
        }
        return;
    }
    if (pixelPattern === 'yoga_mat') { // 瑜伽垫
        drawPseudoRoundRect(ctx, x, y, w, h, color);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        return;
    }

    // 3. 🎨 艺术与技能
    if (pixelPattern === 'easel') { // 画架
        ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 3;
        ctx.beginPath();
        if (h > w) {
            ctx.moveTo(cx, y); ctx.lineTo(x, y+h);
            ctx.moveTo(cx, y); ctx.lineTo(x+w, y+h);
            ctx.moveTo(cx, y); ctx.lineTo(cx, y+h); 
        } else {
            ctx.moveTo(x, cy); ctx.lineTo(x+w, y);
            ctx.moveTo(x, cy); ctx.lineTo(x+w, y+h);
        }
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + w*0.1, y + h*0.2, w*0.8, h * 0.6);
        ctx.fillStyle = color;
        drawPseudoCircle(ctx, cx, cy, 6, color);
        return;
    }
    if (pixelPattern === 'chess_table') { // 棋桌
        ctx.fillStyle = '#8b4513'; ctx.fillRect(x+4, y+4, w-8, h-8);
        ctx.fillStyle = '#dcdde1'; ctx.fillRect(x, y, w, h);
        const cellSize = Math.min(w, h) / 4;
        ctx.fillStyle = '#2f3542';
        for(let r=0; r<4; r++) {
            for(let c=0; c<4; c++) {
                if ((r+c)%2===1) ctx.fillRect(x + c*cellSize + (w-cellSize*4)/2, y + r*cellSize + (h-cellSize*4)/2, cellSize, cellSize);
            }
        }
        return;
    }

    // 4. 🏥 医疗与科技
    if (pixelPattern === 'medical_bed') { // 医疗床
        ctx.fillStyle = '#dfe6e9'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#74b9ff'; 
        if (h > w) ctx.fillRect(x, y, w, 15); // 枕头区
        else ctx.fillRect(x, y, 15, h);
        
        const crossSize = 12;
        ctx.fillStyle = '#ff7675';
        ctx.fillRect(cx - crossSize/2, cy - 4, crossSize, 8);
        ctx.fillRect(cx - 4, cy - crossSize/2, 8, crossSize);
        return;
    }
    if (pixelPattern === 'scanner') { 
        ctx.fillStyle = '#b2bec3'; 
        const minDim = Math.min(w,h);
        drawPseudoCircle(ctx, cx, cy, minDim/2, '#b2bec3'); 
        ctx.fillStyle = '#2d3436';
        drawPseudoCircle(ctx, cx, cy, minDim/3, '#2d3436'); 
        
        ctx.fillStyle = '#74b9ff';
        if (h > w) ctx.fillRect(x + 10, cy, w - 20, h/2);
        else ctx.fillRect(cx, y + 10, w/2, h - 20);
        return;
    }
    if (pixelPattern === 'server') { // 服务器机柜
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(x, y, w, h);
        const time = Date.now();
        
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

        if (h > w) {
            for (let i = 5; i < h - 5; i += 8) {
                ctx.fillStyle = (Math.sin(time/200 + i) > 0) ? '#00b894' : '#000';
                ctx.fillRect(x + w - 8, y + i, 4, 4);
            }
        } else {
            for (let i = 5; i < w - 5; i += 8) {
                ctx.fillStyle = (Math.sin(time/200 + i) > 0) ? '#00b894' : '#000';
                ctx.fillRect(x + i, y + h - 8, 4, 4);
            }
        }
        return;
    }

    // 5. 🏡 居家生活
    if (pixelPattern === 'kitchen' || pixelPattern === 'fridge') { // 橱柜/冰箱
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; 
        if (pixelPattern === 'kitchen') { // 橱柜
            if (h > w) { // 竖向
                ctx.fillRect(x + w - 4, y, 2, h); 
                if (f.tags?.includes('stove')) {
                    ctx.fillStyle = '#2d3436';
                    drawPseudoCircle(ctx, cx, y + h/6, 6, '#2d3436');
                    drawPseudoCircle(ctx, cx, y + h/2, 6, '#2d3436');
                }
            } else { // 横向
                ctx.fillRect(x, y + 4, w, 2); 
                if (f.tags?.includes('stove')) {
                    ctx.fillStyle = '#2d3436';
                    drawPseudoCircle(ctx, x + w/6, y + h/2, 6, '#2d3436');
                    drawPseudoCircle(ctx, x + w/2, y + h/2, 6, '#2d3436');
                }
            }
        } else { // 冰箱
            if (h > w) ctx.fillRect(x, y + h/3, w, 2);
            else ctx.fillRect(x + w/3, y, 2, h);
        }
        return;
    }
    if (pixelPattern === 'toilet') {
        ctx.fillStyle = '#fff';
        if (h > w) {
            ctx.fillRect(x + w/4, y, w/2, 10); // 水箱
            drawPseudoCircle(ctx, cx, cy + 5, 10, '#fff'); // 马桶圈
        } else {
            ctx.fillRect(x, y + h/4, 10, h/2);
            drawPseudoCircle(ctx, cx + 5, cy, 10, '#fff');
        }
        return;
    }
    if (pixelPattern === 'shower_stall') {
        ctx.fillStyle = 'rgba(129, 236, 236, 0.3)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x,y,w,h);
        return;
    }
    
    // 6. 🛋️ 座椅沙发增强
    if (pixelPattern === 'sofa_vip' || pixelPattern === 'boss_chair') {
        ctx.fillStyle = color;
        // 根据长宽比猜测方向，画出简单的靠背
        if (h > w) {
            // 竖向：靠背在左或右（简化为左）
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x + w*0.2, y, w*0.8, h); // 座垫
        } else {
            // 横向：靠背在上
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x, y + h*0.2, w, h*0.8);
        }
        return;
    }

    // 7. 🌳 植被增强
    if (pixelPattern === 'tree_pixel') {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(cx - 4, y + h - 10, 8, 10);
        ctx.fillStyle = color; 
        drawPseudoCircle(ctx, cx, cy - 5, w/2, color);
        drawPseudoCircle(ctx, cx - 8, cy + 5, w/3, color);
        drawPseudoCircle(ctx, cx + 8, cy + 5, w/3, color);
        ctx.fillStyle = '#ff7675';
        ctx.fillRect(cx - 10, cy - 10, 4, 4);
        ctx.fillRect(cx + 5, cy, 4, 4);
        return;
    }
    if (pixelPattern === 'flower_rose') {
        ctx.fillStyle = '#27ae60';
        drawPseudoCircle(ctx, cx, cy, w/2, '#27ae60');
        ctx.fillStyle = '#d63031';
        drawPseudoCircle(ctx, cx - 5, cy - 5, 4, '#d63031');
        drawPseudoCircle(ctx, cx + 5, cy + 5, 4, '#d63031');
        drawPseudoCircle(ctx, cx + 5, cy - 5, 4, '#d63031');
        drawPseudoCircle(ctx, cx - 5, cy + 5, 4, '#d63031');
        return;
    }

    // 8. 通用兜底
    if (f.shape === 'circle') {
        drawPseudoCircle(ctx, cx, cy, w/2, color);
        return;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, w, 4);
    ctx.fillRect(x, y, 4, h);
    
    if (f.label) {
        if (f.label.includes('电脑')) {
            ctx.fillStyle = '#81ecec'; ctx.fillRect(cx-6, cy-6, 12, 10);
        } else if (f.label.includes('书')) {
            ctx.fillStyle = '#a29bfe'; 
            if (w > h) for(let i=4; i<w-4; i+=6) ctx.fillRect(x+i, y+4, 4, h-8);
            else for(let i=4; i<h-4; i+=6) ctx.fillRect(x+4, y+i, w-8, 4);
        }
    }
};