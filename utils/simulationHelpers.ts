import { Job } from '../types';

// 将游戏分钟转换为 tick 数 (1 游戏分钟 = 60 ticks)
export const minutes = (m: number) => m * 60;

// 计算特定职业的工位容量
export const getJobCapacity = (job: Job) => {
    // [修改] 暂时取消基于家具数量的判断
    // 直接返回固定数值，确保每个岗位都有充足的名额
    const FIXED_CAPACITY = 50; 
    
    // 如果是老板，还是保持稀缺性（可选）
    if (job.level >= 4) return 1;

    return FIXED_CAPACITY;
};