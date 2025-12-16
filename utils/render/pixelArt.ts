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
        if (layer === 'back') return; // 后层不画高光
        if (finalColor === '#ffffff' || finalColor === '#dcdde1') return;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        const w = s * 1.2 * widthScale;
        const h = s * 0.25;
        ctx.beginPath();
        ctx.roundRect(x - w/2, y - s - s*0.2 + offY, w, h, 2);
        ctx.fill();
        ctx.fillStyle = finalColor;
    };

    // 基础头套 (Base Shape) - 绝大多数属于前层
    // 作用：覆盖头皮，连接后发。
    const drawBaseCap = () => {
         const noBaseStyles = [6, 7, 9, 14]; 
         if (!noBaseStyles.includes(effectiveStyle)) {
            ctx.beginPath();
            ctx.roundRect(x - s, y - s - 2, s * 2, s * 1.2, [6, 6, 0, 0]); 
            ctx.fill();
        }
    };

    // --- 2. 分层绘制逻辑 ---

    if (layer === 'front') {
        // === 前层绘制 (Front Layer) ===
        // 这里绘制：头顶、刘海、鬓角、高光
        
        drawBaseCap(); // 画头顶基础部分

        switch (effectiveStyle) {
            case 0: // Standard Short
                ctx.fillRect(x - s, y - s, s * 0.4, s * 0.8);
                ctx.fillRect(x + s - s * 0.4, y - s, s * 0.4, s * 0.8);
                ctx.fillRect(x - s * 0.5, y - s, s, s * 0.4); 
                drawHighlight();
                break;
            case 1: // Bob
                ctx.fillRect(x - s, y - s, s * 2, s * 0.5); // 齐刘海
                // 两侧包脸部分
                ctx.fillRect(x - s - 2, y - s, s * 0.6, s * 1.8);
                ctx.fillRect(x + s + 2 - s * 0.6, y - s, s * 0.6, s * 1.8);
                drawHighlight(0, 1.2);
                break;
            case 2: // Spiky
                ctx.beginPath();
                ctx.moveTo(x - s, y - s);
                ctx.lineTo(x - s * 0.5, y - s - 6);
                ctx.lineTo(x, y - s - 3);
                ctx.lineTo(x + s * 0.5, y - s - 7);
                ctx.lineTo(x + s, y - s);
                ctx.fill();
                ctx.fillRect(x - s, y - s, s * 0.3, s * 0.6);
                ctx.fillRect(x + s - s * 0.3, y - s, s * 0.3, s * 0.6);
                break;
            case 3: // Slicked Back
                ctx.fillRect(x - s, y - s, s * 2, s * 0.5);
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
                // 丸子算前层，因为它在头顶
                ctx.beginPath();
                ctx.arc(x, y - s - 5, s * 0.6, 0, Math.PI * 2);
                ctx.fill();
                drawHighlight(-2);
                break;
            case 5: // Hime Cut (前)
                // 只画切发和刘海
                ctx.fillRect(x - s + 1, y, s * 0.4, s * 0.8); // 脸颊切
                ctx.fillRect(x + s - s * 0.4 - 1, y, s * 0.4, s * 0.8);
                ctx.fillRect(x - s + 2, y - s, s * 2 - 4, s * 0.4); // 刘海
                drawHighlight(0, 1.3);
                break;
            case 6: // Afro (前)
                // 前层只画纹理细节，主体在后层
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.beginPath(); ctx.arc(x - s*0.5, y - s, s*0.2, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(x + s*0.5, y - s - 2, s*0.3, 0, Math.PI*2); ctx.fill();
                break;
            case 7: // Mohawk (前)
                ctx.fillRect(x - s * 0.4, y - s - 10, s * 0.8, s * 2.0);
                // 侧边青皮
                ctx.fillStyle = 'rgba(0,0,0,0.15)'; 
                ctx.beginPath();
                ctx.roundRect(x - s, y - s, s * 2, s * 0.8, 4);
                ctx.fill();
                break;
            case 8: // Twin Tails (前)
                // 前层画皮筋，后层画马尾
                ctx.fillStyle = '#FF5252';
                ctx.fillRect(x - s - 2, y - s * 0.2, 4, 4);
                ctx.fillRect(x + s - 2, y - s * 0.2, 4, 4);
                break;
            case 9: // Balding (前)
                // 侧边保留一点点头发
                ctx.beginPath();
                ctx.roundRect(x - s - 2, y - s * 0.2, s * 0.6, s * 1.2, 2);
                ctx.fill();
                ctx.roundRect(x + s - s * 0.4 + 2, y - s * 0.2, s * 0.6, s * 1.2, 2);
                ctx.fill();
                break;
            case 10: // Curtains
                // 全部在前层，因为它要盖住脸
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
                // 只画发根那一圈
                ctx.fillRect(x - s * 0.3, y - s - 4, s * 0.6, 4); 
                drawHighlight(-4);
                break;
            case 12: // Mullet (前)
                // 顶部和鬓角
                ctx.fillRect(x - s - 1, y - s, s * 2 + 2, s * 0.5);
                ctx.fillRect(x - s, y, s * 0.4, s * 0.8);
                ctx.fillRect(x + s - s * 0.4, y, s * 0.4, s * 0.8);
                drawHighlight();
                break;
            case 13: // Emo
                // 遮眼必须在前层
                ctx.beginPath();
                ctx.moveTo(x - s, y - s - 2);
                ctx.lineTo(x + s + 2, y - s - 2);
                ctx.lineTo(x + s + 2, y + s);
                ctx.lineTo(x + s * 0.2, y + s * 0.8); 
                ctx.lineTo(x - s * 1.2, y + s * 0.2);
                ctx.lineTo(x - s, y - s);
                ctx.fill();
                drawHighlight();
                break;
            case 14: // Dreads (前)
                // 头顶的发根部分
                ctx.roundRect(x - s, y - s - 2, s * 2, s * 0.8, 4);
                ctx.fill();
                break;
            case 15: // Wavy (前)
                // 发根
                ctx.fillRect(x - s - 2, y - s, s * 0.6, s);
                ctx.fillRect(x + s + 2 - s * 0.6, y - s, s * 0.6, s);
                drawHighlight();
                break;
            case 16: // Half-Up (前)
                // 束发处的细节
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(x - s * 0.5, y - s * 0.2, s, 2);
                ctx.fillStyle = finalColor;
                drawHighlight();
                break;
        }

    } else {
        // === 后层绘制 (Back Layer) ===
        // 这里绘制：长发的背景部分、马尾、后脑勺蓬松处
        // 这些部分会被脸遮住
        
        switch (effectiveStyle) {
            case 1: // Bob (后)
                // 后脑勺下方
                ctx.roundRect(x - s - 2, y - s, s * 2 + 4, s * 1.8, [4, 4, 4, 4]); 
                ctx.fill();
                break;
            case 5: // Hime Cut (后)
                // 巨大的长方形背景
                ctx.fillRect(x - s - 1, y - s, s * 2 + 2, s * 2.5);
                break;
            case 6: // Afro (后)
                // 那个大圆球
                const drawPuff = (px: number, py: number, r: number) => {
                    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
                };
                drawPuff(x, y - s * 0.8, s * 1.5);
                drawPuff(x - s * 0.9, y - s * 0.5, s * 0.8);
                drawPuff(x + s * 0.9, y - s * 0.5, s * 0.8);
                break;
            case 8: // Twin Tails (后)
                // 两个大马尾
                ctx.beginPath();
                ctx.ellipse(x - s * 1.4, y, s * 0.6, s * 1.2, -0.2, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(x + s * 1.4, y, s * 0.6, s * 1.2, 0.2, 0, Math.PI*2);
                ctx.fill();
                break;
            case 9: // Balding (后)
                // 后脑勺那一圈
                ctx.fillRect(x - s, y + s * 0.5, s * 2, s * 0.4);
                break;
            case 11: // High Ponytail (后)
                // 马尾本体
                ctx.beginPath();
                ctx.roundRect(x - s * 0.6, y - s - 12, s * 1.2, s * 1.2, 4);
                ctx.fill();
                // 垂下的发梢
                ctx.fillRect(x - s * 0.3, y - s - 4, s * 0.6, s * 1.5);
                break;
            case 12: // Mullet (后)
                // 颈部狼尾
                ctx.beginPath();
                ctx.moveTo(x - s, y + s * 0.5);
                ctx.lineTo(x - s * 1.4, y + s * 1.5);
                ctx.lineTo(x + s * 1.4, y + s * 1.5);
                ctx.lineTo(x + s, y + s * 0.5);
                ctx.fill();
                break;
            case 14: // Dreads (后)
                // 所有的辫子
                for(let i = 0; i < 5; i++) {
                    let off = (i - 2) * (s * 0.5);
                    ctx.fillStyle = finalColor;
                    ctx.roundRect(x + off - 2, y - s - 2, 4, s * 2.5, 2);
                    ctx.fill();
                    // 纹理
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                    ctx.fillRect(x + off - 2, y - s + 2, 4, 1);
                    ctx.fillRect(x + off - 2, y - s * 0.5, 4, 1);
                    ctx.fillRect(x + off - 2, y, 4, 1);
                }
                break;
            case 15: // Wavy (后)
                // 两个大卷
                ctx.beginPath(); ctx.roundRect(x - s - 2, y, s * 0.6, s * 2, 3); ctx.fill();
                ctx.beginPath(); ctx.roundRect(x + s + 2 - s * 0.6, y, s * 0.6, s * 2, 3); ctx.fill();
                ctx.fillRect(x - s - 4, y + s * 1.5, 4, 4);
                ctx.fillRect(x + s, y + s * 1.5, 4, 4);
                break;
            case 16: // Half-Up (后)
                // 披肩部分
                ctx.fillRect(x - s * 0.8, y, s * 1.6, s * 2.2);
                break;
        }
    }
};

// 2. 绘制头像 (三层结构：后发 -> 脸 -> 前发)
export function drawAvatarHead(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, sim: SimData) {
    let s = size;
    const hairImg = getAsset(sim.appearance.hair);
    const faceImg = getAsset(sim.appearance.face);

    // 计算发型样式 (无论是否使用图片，如果是程序化生成都需要这个index)
    const hash = sim.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const styleIndex = hash % 17;

    // --- 第一层：后发 (Back Hair) ---
    // 如果有图片资源，通常图片包含整体，就不拆分了(或者根据你的资源逻辑调整)
    // 这里假设只有程序化发型才支持拆分
    if (!hairImg) {
        drawPixelHair(ctx, x, y, s, sim.hairColor, styleIndex, sim.ageStage, 'back');
    }

    // --- 第二层：脸部 (Face) ---
    if (faceImg) {
        ctx.drawImage(faceImg, x - s, y - s, s * 2, s * 2);
    } else {
        // 脸部形状
        ctx.fillStyle = sim.skinColor;
        ctx.beginPath();
        ctx.roundRect(x - s, y - s, s * 2, s * 2, 4);
        ctx.fill();

        // 豆豆眼
        ctx.fillStyle = '#121212';
        const eyeSize = Math.max(2, s * 0.15);
        const eyeOffset = s * 0.45;
        const eyeyOffset = s * 0.2;
        ctx.fillRect(x - eyeOffset, y + eyeyOffset, eyeSize, eyeSize);     
        ctx.fillRect(x + eyeOffset - eyeSize, y + eyeyOffset, eyeSize, eyeSize); 
        
        // 腮红
        if (sim.ageStage === 'Toddler' || sim.ageStage === 'Child' || sim.gender === 'F') {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.31)';
            ctx.fillRect(x - eyeOffset - 2, y + 6, 4, 2);
            ctx.fillRect(x + eyeOffset - 2, y + 6, 4, 2);
        }
        
        // 皱纹
        if (sim.ageStage === 'Elder') {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x - s + 4, y + 8, 4, 1);
            ctx.fillRect(x + s - 8, y + 8, 4, 1);
        }
    }

    // --- 第三层：前发 (Front Hair) ---
    if (hairImg) {
        // 图片模式下，简单覆盖在上面 (如果图片支持透明通道，效果没问题)
        ctx.drawImage(hairImg, x - s-(s*0.25), y - s - (s * 0.3), s * 2.5, s * 2.5);
    } else {
        drawPixelHair(ctx, x, y, s, sim.hairColor, styleIndex, sim.ageStage, 'front');
    }
}

// 3. 绘制像素家具/物体 (从 GameCanvas 提取)
export const drawPixelProp = (ctx: CanvasRenderingContext2D, f: any, p: any) => {
    const { x, y, w, h, color, pixelPattern } = f;
    
    // 基础颜色处理
    ctx.fillStyle = color;

    // --- 🌳 自然景观 (树木/灌木) ---
    if (pixelPattern === 'tree_pixel') {
        // 树干 (深棕色)
        ctx.fillStyle = '#6D4C41';
        const trunkW = w * 0.3;
        ctx.fillRect(x + (w - trunkW) / 2, y + h * 0.6, trunkW, h * 0.4);
        
        // 树冠 (三层乐高堆叠)
        // 底层 (深色阴影)
        ctx.fillStyle = '#1B5E20'; 
        ctx.fillRect(x, y + h * 0.3, w, h * 0.4);
        // 中层 (主色)
        ctx.fillStyle = '#2E7D32'; 
        ctx.fillRect(x + 2, y + h * 0.15, w - 4, h * 0.4);
        // 顶层 (高光)
        ctx.fillStyle = '#4CAF50'; 
        ctx.fillRect(x + 6, y, w - 12, h * 0.3);
        return;
    }
    
    if (pixelPattern === 'bush') {
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(x, y + h*0.2, w, h*0.8);
        ctx.fillStyle = '#4CAF50'; // 高光顶
        ctx.fillRect(x + 4, y, w - 8, h*0.4);
        // 点缀浆果
        ctx.fillStyle = '#FF5252';
        ctx.fillRect(x + 6, y + 10, 4, 4);
        ctx.fillRect(x + w - 10, y + 15, 4, 4);
        return;
    }

    // --- 🛋️ 家具类 ---
    if (pixelPattern && pixelPattern.startsWith('bed')) {
        // 床头板
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x, y, w, 6);
        // 床垫 (白)
        ctx.fillStyle = '#ECEFF1';
        ctx.fillRect(x, y + 6, w, h - 6);
        // 枕头 (区分单双人)
        ctx.fillStyle = '#FFFFFF';
        if (pixelPattern === 'bed_king' || pixelPattern === 'bed_bunk') {
            ctx.fillRect(x + 6, y + 10, w / 2 - 10, 14); // 左枕头
            ctx.fillRect(x + w / 2 + 4, y + 10, w / 2 - 10, 14); // 右枕头
        } else {
            ctx.fillRect(x + w/2 - 10, y + 10, 20, 14);
        }
        // 被子 (使用家具主色)
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, y + 30, w - 4, h - 32);
        // 被子折痕阴影
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x + 2, y + 30, w - 4, 4);
        return;
    }

    if (pixelPattern === 'sofa_pixel' || pixelPattern === 'sofa_lazy' || pixelPattern === 'sofa_vip') {
        // 沙发底座
        ctx.fillStyle = color;
        ctx.fillRect(x, y + h/2, w, h/2); // 底座
        ctx.fillRect(x, y, w, h); // 靠背
        // 扶手 (深色一点)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, y + 10, 6, h - 10); // 左扶手
        ctx.fillRect(x + w - 6, y + 10, 6, h - 10); // 右扶手
        // 坐垫高光
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 6, y + h/2, w - 12, h/2 - 2);
        return;
    }

    // --- 💻 办公/科技类 ---
    if (pixelPattern === 'desk_pixel' || pixelPattern === 'desk_simple') {
        // 桌腿
        ctx.fillStyle = '#455A64';
        ctx.fillRect(x + 2, y, 4, h);
        ctx.fillRect(x + w - 6, y, 4, h);
        // 桌面
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h * 0.8);
        // 侧边阴影
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, y + h * 0.8, w, 4);
        return;
    }
    
    if (pixelPattern === 'pc_pixel' || pixelPattern === 'console') {
        // 底座
        ctx.fillStyle = '#37474F';
        ctx.fillRect(x + w/2 - 6, y + h - 4, 12, 4);
        // 屏幕边框
        ctx.fillStyle = '#263238';
        ctx.fillRect(x, y, w, h - 6);
        // 屏幕内容 (呼吸灯效果)
        const time = Date.now() % 2000;
        ctx.fillStyle = time < 1000 ? '#00BCD4' : '#0097A7';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 10);
        return;
    }

    if (pixelPattern === 'server') {
        ctx.fillStyle = '#212121';
        ctx.fillRect(x, y, w, h);
        // 闪烁的灯
        for(let i=0; i<4; i++) {
             ctx.fillStyle = Math.random() > 0.5 ? '#00E676' : '#212121';
             ctx.fillRect(x + w - 8, y + 5 + i*8, 4, 4);
        }
        // 通风口线条
        ctx.fillStyle = '#424242';
        for(let i=0; i<h; i+=4) {
            ctx.fillRect(x + 4, y + i, w - 16, 2);
        }
        return;
    }

    // --- 🏙️ 城市设施 ---
    if (pixelPattern === 'vending') {
        // 机身
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        // 顶部灯箱
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(x + 2, y + 2, w - 4, 6);
        // 玻璃窗
        ctx.fillStyle = '#81D4FA';
        ctx.fillRect(x + 4, y + 12, w * 0.6, h * 0.5);
        // 饮料罐 (像素点)
        ctx.fillStyle = '#FF5252';
        ctx.fillRect(x + 6, y + 16, 4, 6);
        ctx.fillStyle = '#FFD740';
        ctx.fillRect(x + 12, y + 16, 4, 6);
        // 按钮区
        ctx.fillStyle = '#263238';
        ctx.fillRect(x + w * 0.7, y + 12, w * 0.2, h * 0.3);
        // 取货口
        ctx.fillStyle = '#212121';
        ctx.fillRect(x + 4, y + h - 10, w - 8, 8);
        return;
    }

    if (pixelPattern === 'bench_park') {
        // 木条纹理
        ctx.fillStyle = '#A1887F';
        for (let i = 0; i < h; i += 6) {
            ctx.fillRect(x, y + i, w, 4);
        }
        // 扶手
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x, y - 2, 4, h + 4);
        ctx.fillRect(x + w - 4, y - 2, 4, h + 4);
        return;
    }

    // --- 🛍️ 商店货架 ---
    if (pixelPattern && pixelPattern.startsWith('shelf')) {
        // 柜体
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(x, y, w, h);
        // 层板阴影
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x, y + h/3, w, 2);
        ctx.fillRect(x, y + h*2/3, w, 2);
        
        // 商品 (随机色块模拟)
        const colors = pixelPattern === 'shelf_veg' ? ['#66BB6A', '#9CCC65'] : 
                       pixelPattern === 'shelf_meat' ? ['#EF5350', '#EC407A'] : 
                       ['#FFCA28', '#42A5F5', '#AB47BC'];
                       
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
                ctx.fillStyle = colors[(r+c)%colors.length];
                const itemW = w/4 - 2;
                ctx.fillRect(x + 1 + c * (w/4), y + 2 + r * (h/3), itemW, h/3 - 4);
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
        // 画框
        ctx.fillStyle = '#dcdde1'; // 银色边框
        ctx.fillRect(x, y, w, h);
        // 画布背景
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        
        // 抽象画内容 (随机色块)
        const seed = (x + y) % 5; // 伪随机
        if (seed === 0) { // 蒙德里安风格
            ctx.fillStyle = '#e84118'; ctx.fillRect(x + 4, y + 4, w/2, h/2);
            ctx.fillStyle = '#0097e6'; ctx.fillRect(x + w/2 + 2, y + h/2 + 2, w/2 - 6, h/2 - 6);
            ctx.fillStyle = '#fbc531'; ctx.fillRect(x + w - 10, y + 4, 6, 6);
        } else if (seed === 1) { // 风景风格
            ctx.fillStyle = '#4cd137'; ctx.fillRect(x + 4, y + h/2, w - 8, h/2 - 4); // 草地
            ctx.fillStyle = '#00a8ff'; ctx.fillRect(x + 4, y + 4, w - 8, h/2); // 天空
            ctx.fillStyle = '#fbc531'; ctx.beginPath(); ctx.arc(x + w - 10, y + 10, 4, 0, Math.PI*2); ctx.fill(); // 太阳
        } else { // 现代抽象
            ctx.fillStyle = color; 
            ctx.beginPath(); ctx.arc(x + w/2, y + h/2, w/4, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#2f3640'; ctx.lineWidth = 1; ctx.stroke();
        }
        return;
    }

    if (pixelPattern === 'statue') {
        // 底座
        ctx.fillStyle = '#7f8fa6';
        ctx.fillRect(x + 4, y + h - 10, w - 8, 10);
        // 雕塑主体 (抽象形状)
        ctx.fillStyle = '#f5f6fa'; // 石膏白
        // 身体
        ctx.fillRect(x + w/2 - 6, y + 10, 12, h - 20);
        // 头部
        ctx.beginPath(); ctx.arc(x + w/2, y + 10, 8, 0, Math.PI*2); ctx.fill();
        // 手臂/装饰
        ctx.fillStyle = '#dcdde1';
        ctx.fillRect(x + w/2 - 12, y + 20, 6, 20);
        ctx.fillRect(x + w/2 + 6, y + 25, 6, 15);
        
        // 增加阴影立体感
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x + w/2 + 2, y + 10, 4, h - 20);
        return;
    }

    // 💎 展示柜
    if (pixelPattern === 'display_case') {
        // 玻璃罩
        ctx.fillStyle = 'rgba(129, 236, 236, 0.3)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        // 底座
        ctx.fillStyle = '#2f3640';
        ctx.fillRect(x, y + h - 10, w, 10);
        
        // 内部展品 (随机)
        ctx.fillStyle = color; // 展品颜色
        if (f.label.includes('钻石')) {
             ctx.beginPath(); ctx.moveTo(x+w/2, y+h/2-5); ctx.lineTo(x+w/2+5, y+h/2); ctx.lineTo(x+w/2, y+h/2+5); ctx.lineTo(x+w/2-5, y+h/2); ctx.fill();
        } else {
             ctx.fillRect(x + w/2 - 4, y + h/2 + 5, 8, 8);
        }
        return;
    }

    // --- 🎲 通用乐高风格回退 (Enhanced Box) ---
    // 1. 主体
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    
    // 2. 顶部高光 (模拟立体感)
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, w, 4); // 顶边
    ctx.fillRect(x, y, 4, h); // 左边
    
    // 3. 底部阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + h - 4, w, 4); // 底边
    ctx.fillRect(x + w - 4, y, 4, h); // 右边

    // 4. 内部细节 (如果是桌子或柜子)
    if (f.label.includes('柜') || f.label.includes('桌')) {
         ctx.fillStyle = 'rgba(0,0,0,0.1)';
         ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    }
};