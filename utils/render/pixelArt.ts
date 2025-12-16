import { SimData, AgeStage } from '../../types';
import { getAsset } from '../assetLoader';

// ==========================================
// 🎨 像素风格渲染库
// 包含：家具绘制、程序化发型、头像合成
// ==========================================

// 1. 绘制像素发型 (更新支持年龄段)
const drawPixelHair = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    s: number, 
    color: string, 
    styleIndex: number, 
    ageStage: AgeStage,
    layer: 'back' | 'front'
) => {    
    // 婴儿：只有前层 (毛发稀疏，没有后发)
    if (ageStage === 'Infant') {
        if (layer === 'back') return; // 婴儿没有后发
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - s - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 4, y - s, 2, 2);
        ctx.fillRect(x + 2, y - s, 2, 2);
        return;
    }

    // 老人颜色处理
    let finalColor = color;
    let effectiveStyle = styleIndex;

    if (ageStage === 'Elder') {
        const greyScale = ['#dcdde1', '#7f8fa6', '#b2bec3'];
        finalColor = greyScale[styleIndex % greyScale.length];
        if (styleIndex % 3 === 0) effectiveStyle = 9; // 地中海
    }

    ctx.fillStyle = finalColor;

    // --- 1. 辅助绘制函数 ---

    // 高光 (仅在前层绘制)
    const drawHighlight = (offY: number = 0, widthScale: number = 1.0) => {
        if (layer === 'back') return; 
        if (finalColor === '#ffffff' || finalColor === '#dcdde1') return;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        const w = s * 1.2 * widthScale;
        const h = s * 0.25;
        ctx.beginPath();
        // 配合头型的高光圆角
        ctx.roundRect(x - w/2, y - s - s*0.2 + offY, w, h, 4);
        ctx.fill();
        ctx.fillStyle = finalColor;
    };

    

    // 基础头套 (Base Shape) - 绝大多数属于前层
    // [Fix] 之前半径设为 s 导致太圆露出头皮，现在改为 s*0.45，既有圆角又能覆盖头顶两侧
    const drawBaseCap = () => {
         const noBaseStyles = [6, 7, 9, 14]; 
         if (!noBaseStyles.includes(effectiveStyle)) {
            const r = s * 0.45; 
            ctx.beginPath();
            // 顶部圆角，底部直角
            ctx.roundRect(x - s, y - s - 2, s * 2, s * 1.2, [r, r, 0, 0]); 
            ctx.fill();
        }
    };

    // --- 2. 分层绘制逻辑 ---

    if (layer === 'front') {
        // === 前层绘制 (Front Layer) ===
        
        drawBaseCap(); 

        const topRadius = s * 0.45; // 统一顶部圆角半径

        switch (effectiveStyle) {
            case 0: // Standard Short
                // [Fix] 顶部改为圆角，避免方形头
                ctx.beginPath();
                ctx.roundRect(x - s, y - s, s * 0.4, s * 0.8, [topRadius, 0, 0, 0]);
                ctx.fill();
                ctx.beginPath();
                ctx.roundRect(x + s - s * 0.4, y - s, s * 0.4, s * 0.8, [0, topRadius, 0, 0]);
                ctx.fill();
                ctx.fillRect(x - s * 0.5, y - s, s, s * 0.4); 
                drawHighlight();
                break;
            case 1: // Bob
                // [Fix] 齐刘海顶部改为圆角
                ctx.beginPath();
                ctx.roundRect(x - s, y - s, s * 2, s * 0.5, [topRadius, topRadius, 0, 0]);
                ctx.fill();
                // 两侧包脸部分
                ctx.fillRect(x - s - 2, y - s, s * 0.6, s * 1.8);
                ctx.fillRect(x + s + 2 - s * 0.6, y - s, s * 0.6, s * 1.8);
                drawHighlight(0, 1.2);
                break;
            case 2: // Spiky
                // 刺猬头基础覆盖
                ctx.beginPath();
                ctx.moveTo(x - s, y - s + 4); // 起点下移一点，利用BaseCap处理圆角
                ctx.lineTo(x - s * 0.5, y - s - 6);
                ctx.lineTo(x, y - s - 3);
                ctx.lineTo(x + s * 0.5, y - s - 7);
                ctx.lineTo(x + s, y - s + 4);
                ctx.fill();
                // 两侧鬓角
                ctx.fillRect(x - s, y - s, s * 0.3, s * 0.6);
                ctx.fillRect(x + s - s * 0.3, y - s, s * 0.3, s * 0.6);
                break;
            case 3: // Slicked Back
                ctx.beginPath();
                ctx.roundRect(x - s, y - s, s * 2, s * 0.5, [topRadius, topRadius, 0, 0]);
                ctx.fill();
                ctx.fillRect(x - s, y - s, s * 0.5, s * 1.2);
                ctx.fillRect(x + s - s * 0.5, y - s, s * 0.5, s * 1.2);
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(x + s * 0.2, y - s - 2, 1, s * 0.8);
                ctx.fillStyle = finalColor;
                drawHighlight();
                break;
            case 4: // Bun
                ctx.fillRect(x - s, y - s, s * 0.3, s * 1.0);
                ctx.fillRect(x + s - s * 0.3, y - s, s * 0.3, s * 1.0);
                ctx.beginPath();
                ctx.arc(x, y - s - 5, s * 0.6, 0, Math.PI * 2);
                ctx.fill();
                drawHighlight(-2);
                break;
            case 5: // Hime Cut (前)
                ctx.fillRect(x - s + 1, y, s * 0.4, s * 0.8); 
                ctx.fillRect(x + s - s * 0.4 - 1, y, s * 0.4, s * 0.8);
                // 刘海顶部圆角
                ctx.beginPath();
                ctx.roundRect(x - s + 2, y - s, s * 2 - 4, s * 0.4, [topRadius, topRadius, 0, 0]);
                ctx.fill();
                drawHighlight(0, 1.3);
                break;
            case 6: // Afro (前)
                // 1. 核心主体块 (覆盖额头和头顶)
                // 从 y - s * 1.1 开始，比头皮位置更靠上
                ctx.fillRect(x - s * 1.0, y - s * 1.1, s * 2.0, s * 1.0);
                
                // 2. 顶部隆起 (增加高度，形成圆顶阶梯)
                ctx.fillRect(x - s * 0.7, y - s * 1.3, s * 1.4, s * 0.2);
                
                // 3. 底部/鬓角加宽 (包住脸颊)
                ctx.fillRect(x - s * 1.15, y - s * 0.6, s * 0.15, s * 0.8); // 左宽
                ctx.fillRect(x + s * 1.0, y - s * 0.6, s * 0.15, s * 0.8);  // 右宽
                
                // 4. 底部边缘修整 (让下方稍微收一点，不要太方)
                // 遮挡一点前额，让发际线看起来自然
                ctx.fillRect(x - s * 0.8, y - s * 0.2, s * 1.6, s * 0.2);

                break;
            case 7: // Mohawk (前)
                ctx.fillRect(x - s*0.5, y - s - 9, s * 1, s * 1.8);
                ctx.fillStyle = 'rgba(0,0,0,0.15)'; 
                ctx.beginPath();
                ctx.roundRect(x - s, y - s, s * 2, s * 0.8, [topRadius, topRadius, 0, 0]);
                ctx.fill();
                break;
            case 8: // Twin Tails (前)
                ctx.fillStyle = '#FF5252'; // 或者使用 finalColor 并调暗
                // 左侧发圈
                ctx.fillRect(x - s - 3, y - s * 0.1, 4, 4);
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; // 高光
                ctx.fillRect(x - s - 3, y - s * 0.1, 2, 2);
                
                ctx.fillStyle = '#FF5252';
                // 右侧发圈
                ctx.fillRect(x + s - 1, y - s * 0.1, 4, 4);
                ctx.fillStyle = 'rgba(255,255,255,0.3)'; // 高光
                ctx.fillRect(x + s - 1, y - s * 0.1, 2, 2);
                break;
            case 9: // Balding (前)
                ctx.beginPath();
                ctx.roundRect(x - s - 3, y - s * 0.6, s * 0.6, s * 0.8, 2);
                ctx.fill();
                ctx.roundRect(x + s - s * 0.4 , y - s * 0.6, s * 0.6, s * 0.8, 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(x - 2, y - s - 2, 4, 2);
                break;
            case 10: // Curtains
                // [Fix] BaseCap 已经提供了顶部覆盖，这里只需绘制垂下的部分
                // 调整起点，避免太圆露头皮
                ctx.beginPath();
                ctx.moveTo(x, y - s - 2);
                ctx.quadraticCurveTo(x - s, y - s, x - s - 2, y + s * 0.8);
                ctx.lineTo(x - s, y + s * 0.8);
                ctx.quadraticCurveTo(x - s * 0.5, y, x, y - s);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x, y - s - 2);
                ctx.quadraticCurveTo(x + s, y - s, x + s + 2, y + s * 0.8);
                ctx.lineTo(x + s, y + s * 0.8);
                ctx.quadraticCurveTo(x + s * 0.5, y, x, y - s);
                ctx.fill();
                drawHighlight();
                break;
            case 11: // High Ponytail (前)
                // BaseCap 负责头顶形状，这里只加发圈
                ctx.fillRect(x - s * 0.3, y - s - 4, s * 0.6, 4); 
                drawHighlight(-4);
                break;
            case 12: // Mullet (前)
                // [Fix] 顶部圆角化
                ctx.beginPath();
                ctx.roundRect(x - s - 1, y - s, s * 2 + 2, s * 0.5, [topRadius, topRadius, 0, 0]);
                ctx.fill();
                ctx.fillRect(x - s, y, s * 0.4, s * 0.8);
                ctx.fillRect(x + s - s * 0.4, y, s * 0.4, s * 0.8);
                drawHighlight();
                break;
            case 13: // Emo
                // [Fix] 顶部圆角化 (起点圆滑处理)
                ctx.beginPath();
                // 从圆角开始
                ctx.moveTo(x - s, y - s + topRadius); 
                ctx.quadraticCurveTo(x - s, y - s - 2, x - s + topRadius, y - s - 2); // 左上圆角
                ctx.lineTo(x + s, y - s - 2); 
                ctx.lineTo(x + s, y - s * 0.5); 
                ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.2, x - s * 0.5, y + s); 
                ctx.lineTo(x - s - 2, y + s * 0.5);
                ctx.lineTo(x - s, y - s + topRadius); // 回到左侧
                ctx.fill();
                drawHighlight();
                break;
            case 14: // Dreads (前)
                // [Fix] 发际线上移 (高度变小)，避免遮脸
                // 高度 s * 0.2 (很短的发根)
                ctx.beginPath();
                ctx.roundRect(x - s, y - s - 2, s * 2, s * 0.3, [topRadius, topRadius, 0, 0]);
                ctx.fill();
                // 侧边缩短，不遮眼
                ctx.fillRect(x - s, y - s, s * 0.2, s * 0.4); 
                ctx.fillRect(x + s - s * 0.2, y - s, s * 0.2, s * 0.4);
                break;
            case 15: // Wavy (前)
                // [Fix] 发根部圆角化
                ctx.beginPath();
                ctx.roundRect(x - s - 2, y - s, s * 0.6, s, [topRadius, 0, 0, 0]);
                ctx.fill();
                ctx.beginPath();
                ctx.roundRect(x + s + 2 - s * 0.6, y - s, s * 0.6, s, [0, topRadius, 0, 0]);
                ctx.fill();
                drawHighlight();
                break;
            case 16: // Half-Up (前)
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(x - s * 0.5, y - s * 0.2, s, 2);
                ctx.fillStyle = finalColor;
                drawHighlight();
                break;
        }

    } else {
        // === 后层绘制 (Back Layer) ===
        // 这里绘制：长发的背景部分、马尾、后脑勺蓬松处
        
        // [Fix] 后层形状统一稍微圆润一点，避免穿帮
        const backRadius = s * 0.5;

        switch (effectiveStyle) {
            case 1: // Bob (后)
                ctx.beginPath();
                ctx.roundRect(x - s - 2, y - s, s * 2 + 4, s * 1.8, [backRadius, backRadius, 4, 4]); 
                ctx.fill();
                break;
            case 5: // Hime Cut (后)
                ctx.beginPath();
                // 公主切后发也要圆顶
                ctx.roundRect(x - s - 1, y - s, s * 2 + 2, s * 2.5, [backRadius, backRadius, 0, 0]);
                ctx.fill();
                break;
            case 6: // Afro (后)
                // 主背景块 (比前层更大更低)
                ctx.fillRect(x - s * 1.1, y - s * 0.6, s * 2.2, s * 1.0);
                // 顶部边缘
                ctx.fillRect(x - s * 0.8, y - s * 0.8, s * 1.6, s * 0.2);
                // 底部两侧边缘，增加体积感
                ctx.fillRect(x - s * 1.2, y - s * 0.2, s * 0.2, s * 0.8);
                ctx.fillRect(x + s * 1.0, y - s * 0.2, s * 0.2, s * 0.8);
                // 底部收口
                ctx.fillRect(x - s * 0.9, y + s * 0.4, s * 1.8, s * 0.2);
                break;
            case 7: 
                break;
            case 8: // Twin Tails (后)
                const tailW = s * 0.45;
                const tailH = s * 1.5;
                const tailOffX = s * 1.05;
                
                // --- 左马尾 ---
                // 上段 (连接处)
                ctx.fillRect(x - tailOffX - tailW + 4, y - s * 0.1, tailW - 2, tailH * 0.3);
                // 中段 (稍微变宽)
                ctx.fillRect(x - tailOffX - tailW + 2, y + s * 0.2, tailW, tailH * 0.4);
                // 下段 (末端散开)
                ctx.fillRect(x - tailOffX - tailW, y + s * 0.6, tailW + 2, tailH * 0.3);

                ctx.fillStyle = finalColor; // 重置颜色

                // --- 右马尾 (镜像) ---
                // 上段
                ctx.fillRect(x + tailOffX, y - s * 0.1, tailW - 2, tailH * 0.3);
                // 中段
                ctx.fillRect(x + tailOffX, y + s * 0.2, tailW, tailH * 0.4);
                // 下段
                ctx.fillRect(x + tailOffX, y + s * 0.6, tailW + 2, tailH * 0.3);

                break;
            case 9: // Balding (后)
                ctx.fillRect(x - s, y + s * 0.5, s * 2, s * 0.4);
                break;
            case 11: // High Ponytail (后)
                ctx.beginPath();
                ctx.roundRect(x - s * 0.6, y - s - 12, s * 1.2, s * 1.2, 4);
                ctx.fill();
                ctx.fillRect(x - s * 0.3, y - s - 4, s * 0.6, s * 1.5);
                break;
            case 12: // Mullet (后)
                ctx.beginPath();
                ctx.moveTo(x - s, y + s * 0.5);
                ctx.lineTo(x - s * 1.4, y + s * 1.5);
                ctx.lineTo(x + s * 1.4, y + s * 1.5);
                ctx.lineTo(x + s, y + s * 0.5);
                ctx.fill();
                break;
            case 14: // Dreads (后)
                for(let i = 0; i < 5; i++) {
                    let off = (i - 2) * (s * 0.5);
                    ctx.fillStyle = finalColor;
                    ctx.beginPath();
                    // [Fix] 后方脏辫不再画在头顶上，而是从后脑勺出来
                    ctx.roundRect(x + off - 2, y - s * 0.5, 4, s * 2.0, 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                    ctx.fillRect(x + off - 2, y + s * 0.5, 4, 1);
                    ctx.fillRect(x + off - 2, y + s, 4, 1);
                }
                break;
            case 15: // Wavy (后)
                ctx.beginPath(); ctx.roundRect(x - s - 2, y, s * 0.6, s * 2, 3); ctx.fill();
                ctx.beginPath(); ctx.roundRect(x + s + 2 - s * 0.6, y, s * 0.6, s * 2, 3); ctx.fill();
                ctx.fillRect(x - s - 4, y + s * 1.5, 4, 4);
                ctx.fillRect(x + s, y + s * 1.5, 4, 4);
                break;
            case 16: // Half-Up (后)
                ctx.fillRect(x - s * 0.8, y, s * 1.6, s * 2.2);
                break;
        }
    }
};

// 2. 绘制头像 (支持分层：后发 -> 脸 -> 前发)
export function drawAvatarHead(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number, 
    sim: SimData,
    renderLayer: 'all' | 'back' | 'front' = 'all'
) {
    let s = size;
    const hairImg = getAsset(sim.appearance.hair);
    const faceImg = getAsset(sim.appearance.face);

    const hash = sim.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const styleIndex = hash % 17;

    // --- 第一层：后发 ---
    if (renderLayer === 'all' || renderLayer === 'back') {
        if (!hairImg) {
            drawPixelHair(ctx, x, y, s, sim.hairColor, styleIndex, sim.ageStage, 'back');
        }
    }

    if (renderLayer === 'back') return;

    // --- 第二层：脸部 ---
    if (faceImg) {
        ctx.drawImage(faceImg, x - s, y - s, s * 2, s * 2);
    } else {
        ctx.fillStyle = sim.skinColor;
        ctx.beginPath();
        ctx.roundRect(x - s, y - s, s * 2, s * 2, 4);
        ctx.fill();

        ctx.fillStyle = '#121212';
        const eyeSize = Math.max(2, s * 0.15);
        const eyeOffset = s * 0.45;
        const eyeyOffset = s * 0.2;
        ctx.fillRect(x - eyeOffset, y + eyeyOffset, eyeSize, eyeSize);     
        ctx.fillRect(x + eyeOffset - eyeSize, y + eyeyOffset, eyeSize, eyeSize); 
        
        if (sim.ageStage === 'Toddler' || sim.ageStage === 'Child' || sim.gender === 'F') {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.31)';
            ctx.fillRect(x - eyeOffset - 2, y + 6, 4, 2);
            ctx.fillRect(x + eyeOffset - 2, y + 6, 4, 2);
        }
        
        if (sim.ageStage === 'Elder') {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x - s + 4, y + 8, 4, 1);
            ctx.fillRect(x + s - 8, y + 8, 4, 1);
        }
    }

    // --- 第三层：前发 ---
    if (renderLayer === 'all' || renderLayer === 'front') {
        if (hairImg) {
            ctx.drawImage(hairImg, x - s-(s*0.25), y - s - (s * 0.3), s * 2.5, s * 2.5);
        } else {
            drawPixelHair(ctx, x, y, s, sim.hairColor, styleIndex, sim.ageStage, 'front');
        }
    }
}

// 3. 绘制像素家具/物体 (优化版：增加内部细节)
export const drawPixelProp = (ctx: CanvasRenderingContext2D, f: any, p: any) => {
    const { x, y, w, h, color, pixelPattern } = f;
    
    ctx.fillStyle = color;

    // --- 🌳 自然景观 (树木/灌木) ---
    if (pixelPattern === 'tree_pixel') {
        ctx.fillStyle = '#6D4C41';
        const trunkW = w * 0.3;
        ctx.fillRect(x + (w - trunkW) / 2, y + h * 0.6, trunkW, h * 0.4);
        
        ctx.fillStyle = '#1B5E20'; 
        ctx.fillRect(x, y + h * 0.3, w, h * 0.4);
        ctx.fillStyle = '#2E7D32'; 
        ctx.fillRect(x + 2, y + h * 0.15, w - 4, h * 0.4);
        ctx.fillStyle = '#4CAF50'; 
        ctx.fillRect(x + 6, y, w - 12, h * 0.3);
        return;
    }
    
    if (pixelPattern === 'bush') {
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(x, y + h*0.2, w, h*0.8);
        ctx.fillStyle = '#4CAF50'; 
        ctx.fillRect(x + 4, y, w - 8, h*0.4);
        ctx.fillStyle = '#FF5252';
        ctx.fillRect(x + 6, y + 10, 4, 4);
        ctx.fillRect(x + w - 10, y + 15, 4, 4);
        return;
    }

    // --- 🛋️ 家具类 (增加细节) ---
    if (pixelPattern && pixelPattern.startsWith('bed')) {
        // 床头板
        ctx.fillStyle = '#5D4037'; 
        ctx.fillRect(x, y, w, 8);
        // 床体
        ctx.fillStyle = color; 
        ctx.fillRect(x + 2, y + 8, w - 4, h - 8);
        // 被子 (覆盖下半部分)
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(x + 2, y + 30, w - 4, h - 32);
        // 枕头
        ctx.fillStyle = '#FFFFFF';
        if (pixelPattern === 'bed_king' || pixelPattern === 'bed_bunk') {
            ctx.fillRect(x + 6, y + 12, w / 2 - 10, 12); 
            ctx.fillRect(x + w / 2 + 4, y + 12, w / 2 - 10, 12); 
        } else {
            ctx.fillRect(x + w/2 - 10, y + 12, 20, 12);
        }
        return;
    }

    if (pixelPattern === 'sofa_pixel' || pixelPattern === 'sofa_lazy' || pixelPattern === 'sofa_vip') {
        ctx.fillStyle = color;
        // 靠背
        ctx.fillRect(x, y, w, h); 
        // 扶手阴影
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x, y + 10, 8, h - 10); 
        ctx.fillRect(x + w - 8, y + 10, 8, h - 10); 
        // 坐垫高光
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 8, y + h/2, w - 16, h/2 - 2);
        return;
    }

    // --- 💻 办公/科技类 (增加细节) ---
    if (pixelPattern === 'desk_pixel' || pixelPattern === 'desk_simple' || pixelPattern === 'desk_wood') {
        // 桌面
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        
        // 桌面高光
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x, y, w, h * 0.8);
        
        // 抽屉轮廓
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(x + w - 14, y + 4, 10, h - 8);
        // 抽屉拉手
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(x + w - 10, y + h/2 - 1, 2, 2);
        return;
    }
    
    if (pixelPattern === 'pc_pixel' || pixelPattern === 'console') {
        // 支架
        ctx.fillStyle = '#37474F';
        ctx.fillRect(x + w/2 - 6, y + h - 6, 12, 6);
        // 屏幕边框
        ctx.fillStyle = '#263238';
        ctx.fillRect(x, y, w, h - 6);
        // 屏幕发光内容
        const time = Date.now() % 2000;
        ctx.fillStyle = time < 1000 ? '#00BCD4' : '#0097A7';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 10);
        return;
    }

    if (pixelPattern === 'server') {
        ctx.fillStyle = '#212121';
        ctx.fillRect(x, y, w, h);
        // 闪烁指示灯
        for(let i=0; i<4; i++) {
             ctx.fillStyle = Math.random() > 0.5 ? '#00E676' : '#212121';
             ctx.fillRect(x + w - 8, y + 5 + i*8, 4, 4);
        }
        // 散热槽
        ctx.fillStyle = '#424242';
        for(let i=0; i<h; i+=4) {
            ctx.fillRect(x + 4, y + i, w - 16, 2);
        }
        return;
    }

    // --- 🏙️ 城市设施 ---
    if (pixelPattern === 'vending') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(x + 2, y + 2, w - 4, 6);
        // 内部饮料格
        ctx.fillStyle = '#81D4FA';
        ctx.fillRect(x + 4, y + 12, w * 0.6, h * 0.5);
        ctx.fillStyle = '#263238'; // 取货口
        ctx.fillRect(x + 4, y + h - 10, w - 8, 8);
        // 按钮
        ctx.fillStyle = '#FF5252';
        ctx.fillRect(x + w - 10, y + 16, 4, 4);
        ctx.fillStyle = '#FFD740';
        ctx.fillRect(x + w - 10, y + 22, 4, 4);
        return;
    }

    // --- 🛍️ 商店货架 (增加商品色块) ---
    if (pixelPattern && pixelPattern.startsWith('shelf')) {
        ctx.fillStyle = '#E0E0E0'; // 货架白底
        ctx.fillRect(x, y, w, h);
        
        const colors = pixelPattern === 'shelf_veg' ? ['#66BB6A', '#9CCC65'] : 
                       pixelPattern === 'shelf_meat' ? ['#EF5350', '#EC407A'] : 
                       ['#FFCA28', '#42A5F5', '#AB47BC'];
                       
        // 绘制三层商品
        for (let r = 0; r < 3; r++) {
            // 每层阴影
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x, y + (h/3)*r + (h/3)-2, w, 2);
            
            for (let c = 0; c < 4; c++) {
                ctx.fillStyle = colors[(r+c)%colors.length];
                const itemW = w/4 - 2;
                const itemH = h/3 - 6;
                // 商品块
                ctx.fillRect(x + 1 + c * (w/4), y + 2 + r * (h/3), itemW, itemH);
            }
        }
        return;
    }
    
    // --- 🚦 交通标识 ---
    if (pixelPattern === 'zebra') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, w, h);
        return;
    }

    // --- 🎨 艺术品 ---
    if (pixelPattern === 'painting') {
        ctx.fillStyle = '#dcdde1'; 
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        
        const seed = (x + y) % 5; 
        if (seed === 0) { 
            ctx.fillStyle = '#e84118'; ctx.fillRect(x + 4, y + 4, w/2, h/2);
            ctx.fillStyle = '#0097e6'; ctx.fillRect(x + w/2 + 2, y + h/2 + 2, w/2 - 6, h/2 - 6);
            ctx.fillStyle = '#fbc531'; ctx.fillRect(x + w - 10, y + 4, 6, 6);
        } else if (seed === 1) { 
            ctx.fillStyle = '#4cd137'; ctx.fillRect(x + 4, y + h/2, w - 8, h/2 - 4); 
            ctx.fillStyle = '#00a8ff'; ctx.fillRect(x + 4, y + 4, w - 8, h/2); 
            ctx.fillStyle = '#fbc531'; ctx.beginPath(); ctx.arc(x + w - 10, y + 10, 4, 0, Math.PI*2); ctx.fill(); 
        } else { 
            ctx.fillStyle = color; 
            ctx.beginPath(); ctx.arc(x + w/2, y + h/2, w/4, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#2f3640'; ctx.lineWidth = 1; ctx.stroke();
        }
        return;
    }

    if (pixelPattern === 'statue') {
        ctx.fillStyle = '#7f8fa6';
        ctx.fillRect(x + 4, y + h - 10, w - 8, 10);
        ctx.fillStyle = '#f5f6fa'; 
        ctx.fillRect(x + w/2 - 6, y + 10, 12, h - 20);
        ctx.beginPath(); ctx.arc(x + w/2, y + 10, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#dcdde1';
        ctx.fillRect(x + w/2 - 12, y + 20, 6, 20);
        ctx.fillRect(x + w/2 + 6, y + 25, 6, 15);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x + w/2 + 2, y + 10, 4, h - 20);
        return;
    }

    // 💎 展示柜
    if (pixelPattern === 'display_case') {
        ctx.fillStyle = 'rgba(129, 236, 236, 0.3)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = '#2f3640';
        ctx.fillRect(x, y + h - 10, w, 10);
        
        ctx.fillStyle = color; 
        if (f.label.includes('钻石')) {
             ctx.beginPath(); ctx.moveTo(x+w/2, y+h/2-5); ctx.lineTo(x+w/2+5, y+h/2); ctx.lineTo(x+w/2, y+h/2+5); ctx.lineTo(x+w/2-5, y+h/2); ctx.fill();
        } else {
             ctx.fillRect(x + w/2 - 4, y + h/2 + 5, 8, 8);
        }
        return;
    }

    // --- 🎲 通用乐高风格回退 ---
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    
    // 增加边缘立体感
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, w, 4); 
    ctx.fillRect(x, y, 4, h); 
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + h - 4, w, 4); 
    ctx.fillRect(x + w - 4, y, 4, h); 

    // 如果是柜子或桌子，画个内框
    if (f.label.includes('柜') || f.label.includes('桌')) {
         ctx.fillStyle = 'rgba(0,0,0,0.1)';
         ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    }
};