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
    const { x, y, w, h, color, pixelPattern } = f;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.fillStyle = color;

    // 1. 🎹 乐器类
    if (pixelPattern === 'piano') {
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#3d3d3d';
        ctx.fillRect(x, y + h * 0.4, w, h * 0.2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + h * 0.6, w - 4, h * 0.35);
        ctx.fillStyle = '#000000';
        for (let i = 10; i < w - 10; i += 12) {
            if (i % 24 !== 0) ctx.fillRect(x + i, y + h * 0.6, 6, h * 0.2);
        }
        return;
    }

    // 2. 🏃 健身类
    if (pixelPattern === 'treadmill') { // 跑步机
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#636e72'; 
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8); 
        ctx.fillStyle = '#000';
        for(let i=y+4; i<y+h-4; i+=10) ctx.fillRect(x+4, i, w-8, 2); 
        ctx.fillStyle = '#dfe6e9';
        ctx.fillRect(x, y, w, 20);
        ctx.fillStyle = '#0984e3'; 
        ctx.fillRect(x + w/2 - 10, y + 5, 20, 10);
        return;
    }
    if (pixelPattern === 'weights_rack') { // 举重床
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(x, y, w, h); 
        ctx.fillStyle = '#b2bec3';
        ctx.fillRect(x - 10, y + 20, w + 20, 6);
        ctx.fillStyle = '#000';
        drawPseudoCircle(ctx, x - 10, y + 23, 10, '#000');
        drawPseudoCircle(ctx, x + w + 10, y + 23, 10, '#000');
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
        ctx.moveTo(cx, y); ctx.lineTo(x, y+h);
        ctx.moveTo(cx, y); ctx.lineTo(x+w, y+h);
        ctx.moveTo(cx, y); ctx.lineTo(cx, y+h); 
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 5, y + 10, w - 10, h * 0.6);
        ctx.fillStyle = color;
        drawPseudoCircle(ctx, cx, y + h * 0.4, 8, color);
        return;
    }
    if (pixelPattern === 'chess_table') { // 棋桌
        ctx.fillStyle = '#8b4513'; ctx.fillRect(x+4, y+4, w-8, h-8);
        ctx.fillStyle = '#dcdde1'; ctx.fillRect(x, y, w, h);
        const cellSize = w / 4;
        ctx.fillStyle = '#2f3542';
        for(let r=0; r<4; r++) {
            for(let c=0; c<4; c++) {
                if ((r+c)%2===1) ctx.fillRect(x + c*cellSize, y + r*cellSize, cellSize, cellSize);
            }
        }
        return;
    }

    // 4. 🏥 医疗与科技
    if (pixelPattern === 'medical_bed') { // 医疗床
        ctx.fillStyle = '#dfe6e9'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#74b9ff'; ctx.fillRect(x, y, w, 15); 
        const crossSize = 12;
        ctx.fillStyle = '#ff7675';
        ctx.fillRect(cx - crossSize/2, cy - 4, crossSize, 8);
        ctx.fillRect(cx - 4, cy - crossSize/2, 8, crossSize);
        return;
    }
    if (pixelPattern === 'scanner') { // CT/MRI [修复]
        ctx.fillStyle = '#b2bec3'; 
        drawPseudoCircle(ctx, cx, cy, Math.min(w,h)/2, '#b2bec3'); // 外壳
        ctx.fillStyle = '#2d3436';
        drawPseudoCircle(ctx, cx, cy, Math.min(w,h)/3, '#2d3436'); // 洞
        
        // 扫描床 [修复]：使用正确的绝对坐标计算高度
        // cy 是中心的绝对Y坐标，y+h 是底部的绝对Y坐标
        ctx.fillStyle = '#74b9ff';
        const bedTop = cy + 15; // 床面起始Y
        const bedH = Math.max(0, (y + h) - bedTop);
        // 让床稍微窄一点居中
        ctx.fillRect(x + 10, bedTop, w - 20, bedH);
        return;
    }
    if (pixelPattern === 'server') { // 服务器机柜
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(x, y, w, h);
        const time = Date.now();
        for (let i = 5; i < h - 5; i += 8) {
            ctx.fillStyle = (Math.sin(time/200 + i) > 0) ? '#00b894' : '#000';
            ctx.fillRect(x + w - 8, y + i, 4, 4);
            ctx.fillStyle = (Math.cos(time/300 + i) > 0) ? '#ff7675' : '#000';
            ctx.fillRect(x + w - 16, y + i, 4, 4);
        }
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(x + 4, y + 4, w - 24, h - 8);
        return;
    }

    // 5. 🏡 居家生活
    if (pixelPattern === 'kitchen' || pixelPattern === 'fridge') { // 橱柜/冰箱
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; 
        if (w > h) { // 橱柜
            ctx.fillRect(x, y + 4, w, 2); 
            ctx.fillRect(x + w/3, y + 6, 2, h-6);
            ctx.fillRect(x + w*2/3, y + 6, 2, h-6);
            if (f.tags?.includes('stove')) {
                ctx.fillStyle = '#2d3436';
                drawPseudoCircle(ctx, x + w/6, y + h/2, 6, '#2d3436');
                drawPseudoCircle(ctx, x + w/2, y + h/2, 6, '#2d3436');
            }
        } else { // 冰箱
            ctx.fillRect(x, y + h/3, w, 2); 
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(x + 4, y + h/3 + 10, 4, 20); 
        }
        return;
    }
    if (pixelPattern === 'toilet') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + w/4, y, w/2, 10);
        drawPseudoCircle(ctx, cx, cy + 5, 12, '#fff');
        return;
    }
    if (pixelPattern === 'shower_stall') {
        ctx.fillStyle = 'rgba(129, 236, 236, 0.3)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x,y,w,h);
        ctx.fillStyle = '#b2bec3';
        ctx.fillRect(cx - 2, y, 4, 10);
        drawPseudoCircle(ctx, cx, y+10, 4, '#b2bec3');
        return;
    }
    
    // 6. 🛋️ 座椅沙发增强
    if (pixelPattern === 'sofa_vip' || pixelPattern === 'boss_chair') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, 15);
        ctx.fillRect(x, y, 15, h);
        ctx.fillRect(x + w - 15, y, 15, h);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 15, y + 15, w - 30, h - 15);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        if (pixelPattern === 'boss_chair') {
            ctx.fillRect(cx-2, y+5, 4, 4);
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
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(x + w - 4, y, 4, h);
    ctx.fillRect(x, y + h - 4, w, 4);
    
    if (f.label) {
        if (f.label.includes('电脑')) {
            ctx.fillStyle = '#81ecec'; ctx.fillRect(x+w/2-6, y+h/2-6, 12, 10);
        } else if (f.label.includes('书')) {
            ctx.fillStyle = '#a29bfe'; 
            for(let i=4; i<w-4; i+=6) ctx.fillRect(x+i, y+4, 4, h-8);
        }
    }
};