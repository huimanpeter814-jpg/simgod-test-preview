import { SimData } from '../../types';
import { getAsset } from '../assetLoader';

// ==========================================
// 🎨 像素风格渲染库
// 包含：家具绘制、程序化发型、头像合成
// ==========================================

// 1. 绘制像素发型
const drawPixelHair = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, styleIndex: number) => {
    ctx.fillStyle = color;
    
    // 基础发量（除秃顶/莫霍克外，大部分发型通用的后脑勺部分）
    const isBalding = styleIndex === 9;
    const isMohawk = styleIndex === 7;
    
    if (!isBalding && !isMohawk) {
        ctx.fillRect(x - s, y - s - 4, s * 2, s); 
    }

    switch (styleIndex) {
        // --- 原有发型 (0-4) ---
        case 0: // 普通短发
            ctx.fillRect(x - s, y - s, s * 2, s * 0.4); 
            ctx.fillRect(x - s, y - s, s * 0.4, s * 1.2); 
            ctx.fillRect(x + s - s * 0.4, y - s, s * 0.4, s * 1.2); 
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x - s * 0.6, y - s - 2, s * 0.6, s * 0.4);
            break;
            
        case 1: // 波波头
            ctx.fillRect(x - s - 1, y - s, s * 2 + 2, s * 0.6); 
            ctx.fillRect(x - s - 1, y - s, s * 0.6, s * 2); 
            ctx.fillRect(x + s - s * 0.6 + 1, y - s, s * 0.6, s * 2); 
            ctx.fillRect(x - s, y + s * 0.8, s * 0.4, s * 0.3);
            ctx.fillRect(x + s - s * 0.4, y + s * 0.8, s * 0.4, s * 0.3);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x + s * 0.2, y - s - 2, s * 0.8, s * 0.3);
            break;

        case 2: // 刺猬头
            ctx.beginPath();
            ctx.moveTo(x - s, y - s);
            ctx.lineTo(x - s * 0.5, y - s - 6);
            ctx.lineTo(x, y - s - 2);
            ctx.lineTo(x + s * 0.5, y - s - 7); 
            ctx.lineTo(x + s, y - s);
            ctx.lineTo(x + s, y - s + s * 0.5);
            ctx.lineTo(x - s, y - s + s * 0.5);
            ctx.fill();
            ctx.fillRect(x - s, y - s, s * 0.4, s * 0.8);
            ctx.fillRect(x + s - s * 0.4, y - s, s * 0.4, s * 0.8);
            break;

        case 3: // 侧分/背头
            ctx.fillRect(x - s, y - s, s * 2, s * 0.5);
            ctx.fillRect(x - s, y - s, s * 0.4, s * 1.0); 
            ctx.fillRect(x + s - s * 0.6, y - s, s * 0.6, s * 1.4); 
            ctx.fillRect(x - s, y - s - 2, s * 2, 2);
            break;

        case 4: // 丸子头
            ctx.fillRect(x - s, y - s, s * 2, s * 0.5); 
            ctx.fillRect(x - s * 0.8, y - s, s * 0.3, s * 1.5); 
            ctx.fillRect(x + s * 0.5, y - s, s * 0.3, s * 1.5); 
            ctx.fillRect(x - s * 0.5, y - s - 8, s, s * 0.6);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x - s * 0.3, y - s - 7, s * 0.3, s * 0.2);
            break;

        // --- 🆕 新增发型 (5-14) ---

        case 5: // 长直发 (Long Straight / Hime Cut)
            ctx.fillRect(x - s, y - s, s * 2, s * 0.5); // 齐刘海
            ctx.fillRect(x - s - 1, y - s, s * 0.5, s * 2.8); // 左长发
            ctx.fillRect(x + s - s * 0.5 + 1, y - s, s * 0.5, s * 2.8); // 右长发
            // 姬发式鬓角
            ctx.fillRect(x - s + 2, y, s * 0.2, s * 0.8);
            ctx.fillRect(x + s - s * 0.2 - 2, y, s * 0.2, s * 0.8);
            break;

        case 6: // 爆炸头 (Afro)
            // 一个围绕头部的大圆/方块
            ctx.beginPath();
            ctx.roundRect(x - s * 1.5, y - s * 1.8, s * 3, s * 2.5, s);
            ctx.fill();
            // 纹理细节
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x - s, y - s, 2, 2);
            ctx.fillRect(x + s/2, y - s*1.2, 2, 2);
            break;

        case 7: // 莫霍克 (Mohawk)
            ctx.fillStyle = color;
            // 中间竖条
            ctx.fillRect(x - s * 0.3, y - s - 8, s * 0.6, s * 1.5);
            // 稍微有些发茬在侧面
            ctx.fillStyle = 'rgba(0,0,0,0.1)'; // 看起来像青皮
            ctx.fillRect(x - s, y - s, s * 2, s * 0.8);
            break;

        case 8: // 双马尾 (Twin Tails)
            ctx.fillRect(x - s, y - s, s * 2, s * 0.5); // 刘海
            // 左辫子
            ctx.fillRect(x - s * 1.6, y - s * 0.5, s * 0.6, s * 0.6); // 扎结处
            ctx.fillRect(x - s * 1.8, y, s * 0.5, s * 1.5); // 下垂
            // 右辫子
            ctx.fillRect(x + s, y - s * 0.5, s * 0.6, s * 0.6); // 扎结处
            ctx.fillRect(x + s * 1.3, y, s * 0.5, s * 1.5); // 下垂
            break;

        case 9: // 地中海/谢顶 (Balding)
            // 只有侧边有头发
            ctx.fillRect(x - s - 1, y - s * 0.2, s * 0.4, s * 1.2); // 左侧
            ctx.fillRect(x + s - s * 0.4 + 1, y - s * 0.2, s * 0.4, s * 1.2); // 右侧
            // 后脑勺一点点
            ctx.fillRect(x - s, y - s * 0.5, s * 2, s * 0.2);
            break;

        case 10: // 中分/窗帘头 (Curtains / Middle Part)
            // 左半边刘海
            ctx.beginPath();
            ctx.moveTo(x, y - s);
            ctx.lineTo(x - s - 1, y - s);
            ctx.lineTo(x - s - 1, y + s * 0.5);
            ctx.lineTo(x - s * 0.5, y - s * 0.2); // 弧度
            ctx.lineTo(x, y - s);
            ctx.fill();
            // 右半边刘海
            ctx.beginPath();
            ctx.moveTo(x, y - s);
            ctx.lineTo(x + s + 1, y - s);
            ctx.lineTo(x + s + 1, y + s * 0.5);
            ctx.lineTo(x + s * 0.5, y - s * 0.2); // 弧度
            ctx.lineTo(x, y - s);
            ctx.fill();
            break;

        case 11: // 高马尾 (High Ponytail)
            ctx.fillRect(x - s, y - s, s * 2, s * 0.6); // 紧贴头皮
            // 头顶马尾
            ctx.fillRect(x - s * 0.4, y - s - 9, s * 0.8, s * 0.8); // 发根
            ctx.fillRect(x - s * 0.2, y - s - 10, s * 1.2, s * 1.5); // 发尾垂下（向右偏）
            break;

        case 12: // 狼尾/鲻鱼头 (Mullet)
            ctx.fillRect(x - s, y - s, s * 2, s * 0.3); // 短刘海
            ctx.fillRect(x - s, y - s, s * 0.4, s * 0.8); // 鬓角
            ctx.fillRect(x + s - s * 0.4, y - s, s * 0.4, s * 0.8);
            // 后面的长发，宽出头部
            ctx.fillRect(x - s * 1.2, y + s * 0.5, s * 2.4, s * 1.2);
            break;
            
        case 13: // 遮眼侧刘海 (Emo / Side Swept)
            ctx.fillRect(x - s, y - s - 2, s * 2, s * 0.8); // 顶部
            // 巨大的刘海遮住右眼
            ctx.beginPath();
            ctx.moveTo(x - s, y - s);
            ctx.lineTo(x + s + 1, y - s);
            ctx.lineTo(x + s + 1, y + s * 0.8); // 右侧垂下
            ctx.lineTo(x - s * 0.5, y + s * 0.2);
            ctx.lineTo(x - s, y);
            ctx.fill();
            break;

        case 14: // 脏辫/玉米垄 (Braids/Dreads)
            // 绘制多条竖线代表辫子
            for(let i = 0; i < 5; i++) {
                let off = (i - 2) * (s * 0.45);
                ctx.fillRect(x + off - 1, y - s - 2, 3, s * 2.2);
            }
            break;
    }
};

// 2. 绘制头像 (支持图片绘制，及优化的像素绘制)
export function drawAvatarHead(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, sim: SimData) {
    let s = size;

    // 1. 尝试绘制脸部图片
    const faceImg = getAsset(sim.appearance.face);
    if (faceImg) {
        ctx.drawImage(faceImg, x - s, y - s, s * 2, s * 2);
    } else {
        // [优化] 脸部形状：圆角矩形，更有乐高感
        ctx.fillStyle = sim.skinColor;
        ctx.beginPath();
        ctx.roundRect(x - s, y - s, s * 2, s * 2, 4); // 4px圆角
        ctx.fill();

        // [保持] 豆豆眼
        ctx.fillStyle = '#121212';
        const eyeSize = Math.max(2, s * 0.15);
        const eyeOffset = s * 0.45;
        const eyeyOffset = s * 0.2;
        ctx.fillRect(x - eyeOffset, y + eyeyOffset, eyeSize, eyeSize);     // 左眼
        ctx.fillRect(x + eyeOffset - eyeSize, y + eyeyOffset, eyeSize, eyeSize); // 右眼
        
        // 腮红 (可爱细节)
        ctx.fillStyle = 'rgba(255, 100, 100, 0.31)';
        ctx.fillRect(x - eyeOffset - 2, y + 6, 4, 2);
        ctx.fillRect(x + eyeOffset - 2, y + 6, 4, 2);
    }

    // 2. 尝试绘制发型图片
    const hairImg = getAsset(sim.appearance.hair);
    if (hairImg) {
        ctx.drawImage(hairImg, x - s-(s*0.25), y - s - (s * 0.3), s * 2.5, s * 2.5);
    } else {
        // [优化] 程序化像素发型
        // 使用 sim.id 的哈希值来确定发型，保证每个人物固定一种发型
        const hash = sim.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const styleIndex = hash % 5; 
        
        drawPixelHair(ctx, x, y, s, sim.hairColor, styleIndex);
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