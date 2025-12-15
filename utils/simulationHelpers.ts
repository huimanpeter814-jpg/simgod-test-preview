import { SimData, Job } from '../types';
import { CONFIG, FURNITURE } from '../constants';
import { getAsset } from './assetLoader'; 

// 将游戏分钟转换为 tick 数 (1 游戏分钟 = 60 ticks)
export const minutes = (m: number) => m * 60;

// 计算特定职业的工位容量
export const getJobCapacity = (job: Job) => {
    // [修改] 暂时取消基于家具数量的判断
    // 直接返回固定数值，确保每个岗位都有充足的名额
    // 这样所有市民都能找到工作，不再受限于地图上的椅子数量
    const FIXED_CAPACITY = 50; 
    
    // 如果是老板，还是保持稀缺性（可选）
    if (job.level >= 4) return 1;

    return FIXED_CAPACITY;

    /* 原有逻辑备份：基于家具计算容量
    let searchLabels: string[] = [];
    let searchCategories: string[] = ['work', 'work_group']; 

    if (job.companyType === 'internet') {
        searchLabels = job.level >= 4 ? ['老板椅'] : ['码农工位', '控制台'];
    } else if (job.companyType === 'design') {
        searchLabels = ['画架'];
        searchCategories.push('paint'); 
    } else if (job.companyType === 'business') {
        searchLabels = job.level >= 4 ? ['老板椅'] : ['商务工位'];
    } else if (job.companyType === 'store') {
        searchLabels = ['服务台', '影院服务台', '售票处'];
        searchCategories.push('pay'); 
    } else if (job.companyType === 'restaurant') {
        if (job.title.includes('厨')) {
            searchLabels = ['后厨'];
        } else {
            searchLabels = ['餐厅前台', '雅座'];
            searchCategories.push('eat_out'); 
        }
    } else if(job.companyType === 'library'){
        searchLabels = ['管理员'];
    }
    else {
        return 0; // Unemployed
    }

    let capacity = FURNITURE.filter(f => 
        searchCategories.includes(f.utility) && 
        searchLabels.some(l => f.label.includes(l))
    ).length;

    if (job.companyType === 'store' || job.companyType === 'restaurant') {
        capacity = Math.max(capacity, 2); 
        if (job.level < 3) capacity *= 2; 
    }
    
    if (job.level === 4 && job.companyType !== 'restaurant') {
        return Math.max(1, capacity);
    }

    return Math.max(1, capacity);
    */
};
// --- 🎨 新增：程序化像素发型库 ---
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

// 绘制头像 (支持图片绘制，及优化的像素绘制)
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
        ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
        ctx.fillRect(x - eyeOffset - 2, y + 4, 4, 2);
        ctx.fillRect(x + eyeOffset - 2, y + 4, 4, 2);
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