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

// 绘制头像 (支持图片绘制)
export function drawAvatarHead(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, sim: SimData) {
    let s = size;

    // 1. 尝试绘制脸部图片
    const faceImg = getAsset(sim.appearance.face);
    if (faceImg) {
        ctx.drawImage(faceImg, x - s, y - s, s * 2, s * 2);
    } else {
        // [回退] 默认绘制逻辑
        ctx.fillStyle = sim.skinColor;
        ctx.fillRect(x - s, y - s, s * 2, s * 2);

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.fillRect(x - s / 2, y - 1, 2, 2);
        ctx.fillRect(x + s / 2 - 2, y - 1, 2, 2);
    }

    // 2. 尝试绘制发型图片
    const hairImg = getAsset(sim.appearance.hair);
    if (hairImg) {
        ctx.drawImage(hairImg, x - s-(s*0.25), y - s - (s * 0.3), s * 2.5, s * 2.5);
    } else {
        // [回退] 默认绘制逻辑
        ctx.fillStyle = sim.hairColor;
        ctx.fillRect(x - s, y - s - 2, s * 2, s * 0.6);
        if (sim.gender === 'F') {
            ctx.fillRect(x - s - 2, y - s, s * 0.4, s * 2.5);
            ctx.fillRect(x + s - 2, y - s, s * 0.4, s * 2.5);
        } else {
            ctx.fillRect(x - s, y - s, s * 0.4, s);
            ctx.fillRect(x + s - 4, y - s, s * 0.4, s);
        }
    }
}