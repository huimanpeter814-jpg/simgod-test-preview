import { Sim } from '../Sim';
import { GameStore } from '../simulation';
import { AgeStage, SimAction, Vector2 } from '../../types';

export const MovementLogic = {
    /**
     * 朝目标移动一帧
     * @returns boolean 是否到达目标
     */
    moveTowardsTarget(sim: Sim, dt: number): boolean {
        if (!sim.target) return true;

        const distToTarget = Math.sqrt(Math.pow(sim.target.x - sim.pos.x, 2) + Math.pow(sim.target.y - sim.pos.y, 2));
        
        // 到达判定阈值
        if (distToTarget <= 10) {
            sim.pos = { ...sim.target };
            sim.target = null;
            sim.path = [];
            sim.currentPathIndex = 0;
            return true;
        }

        // 路径规划
        if (sim.path.length === 0) {
            sim.path = GameStore.pathFinder.findPath(sim.pos.x, sim.pos.y, sim.target.x, sim.target.y);
            sim.currentPathIndex = 0;
            
            // 如果找不到路径，尝试直线兜底（防止卡死）
            if (sim.path.length === 0) {
                sim.decisionTimer = 60; // 增加决策冷却
                sim.path.push({ x: sim.target.x, y: sim.target.y });
            }
        }

        // 沿路径移动
        if (sim.currentPathIndex < sim.path.length) {
            const nextNode = sim.path[sim.currentPathIndex];
            const dx = nextNode.x - sim.pos.x;
            const dy = nextNode.y - sim.pos.y;
            const distToNext = Math.sqrt(dx * dx + dy * dy);

            // 计算速度修正
            let speedMod = 1.0;
            if (sim.ageStage === AgeStage.Infant) speedMod = 0.3;
            else if (sim.ageStage === AgeStage.Toddler) speedMod = 0.5;
            else if (sim.ageStage === AgeStage.Elder) speedMod = 0.7;
            
            if (sim.isPregnant) speedMod *= 0.6;
            if (sim.action === SimAction.Escorting) speedMod *= 0.8;

            const moveStep = sim.speed * speedMod * (dt * 0.1);

            if (distToNext <= moveStep) {
                // 到达当前节点，前往下一个
                sim.pos = { x: nextNode.x, y: nextNode.y };
                sim.currentPathIndex++;
            } else {
                // 向当前节点移动
                const angle = Math.atan2(dy, dx);
                sim.pos.x += Math.cos(angle) * moveStep;
                sim.pos.y += Math.sin(angle) * moveStep;
            }
        } else {
            // 路径走完，强制吸附终点
            sim.pos = { ...sim.target };
            sim.target = null;
            sim.path = [];
            return true;
        }

        return false;
    }
};