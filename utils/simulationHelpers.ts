import { Job, Furniture } from '../types';

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

// 🆕 标签辅助函数：获取家具的所有标签（包含向下兼容）
export const getFurnitureTags = (f: Furniture): string[] => {
    // 1. 如果有明确的 tags，直接返回
    if (f.tags && f.tags.length > 0) return f.tags;

    // 2. 否则，根据 label, utility, pixelPattern 进行推断 (兼容旧存档)
    const inferred: string[] = [];
    
    const label = f.label || '';
    const utility = f.utility || '';
    const pattern = f.pixelPattern || '';

    // 办公设备
    if (label.includes('电脑') || pattern.includes('pc')) inferred.push('computer', 'work');
    if (label.includes('办公桌') || label.includes('工位') || pattern.includes('desk')) inferred.push('desk', 'work');
    if (label.includes('会议') || pattern.includes('meet')) inferred.push('meeting', 'work');
    if (label.includes('老板') || label.includes('保险')) inferred.push('boss_chair', 'work');
    
    // 商业设施
    if (label.includes('收银') || pattern.includes('cashier')) inferred.push('cashier', 'work');
    if (label.includes('货架') || label.includes('柜台')) inferred.push('shelf', 'counter', 'work');
    if (label.includes('吧台') || label.includes('酒')) inferred.push('bar', 'work');
    
    // 餐饮
    if (label.includes('灶') || utility === 'cook') inferred.push('stove', 'kitchen', 'work');
    if (label.includes('餐桌') || label.includes('椅')) inferred.push('table', 'seat');
    
    // 医疗/教育
    if (label.includes('病床') || utility === 'healing') inferred.push('medical_bed', 'bed', 'work');
    if (label.includes('黑板') || label.includes('讲台')) inferred.push('blackboard', 'work');
    
    // 娱乐/其他
    if (label.includes('DJ')) inferred.push('dj_booth', 'work');
    if (label.includes('画架')) inferred.push('easel', 'art', 'work');
    if (label.includes('床') || utility === 'energy') inferred.push('bed');
    if (label.includes('沙发') || utility === 'comfort') inferred.push('sofa', 'seat');

    return inferred;
};

// 🆕 检查家具是否满足标签要求
export const hasRequiredTags = (f: Furniture, requiredTags?: string[]): boolean => {
    if (!requiredTags || requiredTags.length === 0) return true; // 无要求则通过
    const furnitureTags = getFurnitureTags(f);
    // 只要包含其中任意一个标签即可 (OR 逻辑)，或者根据需求改为 AND
    // 这里假设是 OR 逻辑：只要家具具备职业所需的任意关键功能即可
    return requiredTags.some(tag => furnitureTags.includes(tag));
};