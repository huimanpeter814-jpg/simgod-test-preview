import { PALETTES, HOLIDAYS, BUFFS, JOBS, FURNITURE, CONFIG } from '../constants'; 
import { LogEntry, GameTime, Job, Furniture } from '../types';
import { Sim } from './Sim';
import { SpatialHashGrid } from './spatialHash';
import { PathFinder } from './pathfinding'; 
import { batchGenerateDiaries } from '../services/geminiService'; 

export { Sim } from './Sim';
export { drawAvatarHead, minutes, getJobCapacity } from './simulationHelpers';

export class GameStore {
    static sims: Sim[] = [];
    static particles: { x: number; y: number; life: number }[] = [];
    static time: GameTime = { day: 1, hour: 8, minute: 0, speed: 2, weekday: 1, month: 1, date: 2 };
    static timeAccumulator: number = 0;
    static logs: LogEntry[] = [];
    static selectedSimId: string | null = null;
    static listeners: (() => void)[] = [];

    // 索引系统
    static furnitureIndex: Map<string, Furniture[]> = new Map();
    static worldGrid: SpatialHashGrid = new SpatialHashGrid(100);
    
    // [新增] 寻路网格实例
    static pathFinder: PathFinder = new PathFinder(CONFIG.CANVAS_W, CONFIG.CANVAS_H, 20);

    static subscribe(cb: () => void) {
        this.listeners.push(cb);
        return () => { this.listeners = this.listeners.filter(l => l !== cb); };
    }

    static notify() {
        this.listeners.forEach(cb => cb());
    }

    static initIndex() {
        this.furnitureIndex.clear();
        this.worldGrid.clear();
        this.pathFinder.clear(); // [新增] 清空旧路径数据

        // [新增] 注册障碍物
        // 我们可以根据家具类型决定是否阻挡。目前假设所有家具都阻挡。
        // 可以排除地毯 (rug) 等
        const passableTypes = ['rug_fancy', 'rug_persian', 'rug_art', 'pave_fancy', 'stripes', 'zebra', 'manhole'];

        FURNITURE.forEach(f => {
            // 1. 类型索引
            if (!this.furnitureIndex.has(f.utility)) {
                this.furnitureIndex.set(f.utility, []);
            }
            this.furnitureIndex.get(f.utility)!.push(f);

            // 2. 空间索引 (用于点击检测)
            this.worldGrid.insert({
                id: f.id,
                x: f.x,
                y: f.y,
                w: f.w,
                h: f.h,
                type: 'furniture',
                ref: f
            });

            // 3. [新增] 寻路阻挡注册
            // 稍微缩小一点阻挡范围 (padding)，让路更宽一点，避免卡在狭窄通道
            const padding = 4;
            const isPassable = f.pixelPattern && passableTypes.some(t => f.pixelPattern?.includes(t));
            
            if (!isPassable) {
                this.pathFinder.setObstacle(
                    f.x + padding, 
                    f.y + padding, 
                    Math.max(1, f.w - padding * 2), 
                    Math.max(1, f.h - padding * 2)
                );
            }
        });
        
        console.log(`[System] Indexes Built. PathFinder ready (${this.pathFinder.cols}x${this.pathFinder.rows}).`);
    }

    static spawnHeart(x: number, y: number) {
        this.particles.push({ x, y, life: 1.0 });
    }

    static addLog(sim: Sim | null, text: string, type: any, isAI = false) {
        const timeStr = `Day ${this.time.day} ${String(this.time.hour).padStart(2, '0')}:${String(this.time.minute).padStart(2, '0')}`;
        let category: 'sys' | 'chat' | 'rel' = 'chat';
        if (type === 'sys' || type === 'money') category = 'sys';
        else if (type === 'rel_event' || type === 'jealous') category = 'rel';
        else if (type === 'love' && (text.includes('表白') || text.includes('分手'))) category = 'rel';

        const entry: LogEntry = {
            id: Math.random(),
            time: timeStr,
            text: text,
            type: type,
            category: category,
            isAI: isAI,
            simName: sim ? sim.name : '系统'
        };
        this.logs.unshift(entry);
        if (this.logs.length > 200) this.logs.pop();
        this.notify();
    }

    static saveGame() {
        const safeSims = this.sims.map(sim => {
            const s = Object.assign({}, sim);
            // 序列化时清除临时状态
            if (s.interactionTarget && (s.interactionTarget as any).ref) {
                s.interactionTarget = null;
                s.action = 'idle';
                s.target = null;
                // @ts-ignore
                s.path = []; // 清除路径
                s.bubble = { text: null, timer: 0, type: 'normal' };
            }
            return s;
        });

        const saveData = {
            version: 2.1, 
            time: this.time,
            logs: this.logs,
            sims: safeSims
        };

        try {
            localStorage.setItem('pixel_life_save_v1', JSON.stringify(saveData));
        } catch (e) {
            console.error("Save failed", e);
        }
    }

    static loadGame(): boolean {
        try {
            const json = localStorage.getItem('pixel_life_save_v1');
            if (!json) return false;
            
            const data = JSON.parse(json);

            if (!data.version && data.sims.length > 0) {
                console.warn("[System] Save file is too old. Resetting.");
                return false;
            }

            this.time = { ...data.time };
            this.logs = data.logs || [];
            
            this.sims = data.sims.map((sData: any) => {
                const sim = new Sim(sData.pos.x, sData.pos.y);
                Object.assign(sim, sData);
                
                // [数据修正]
                if (!sim.height || sim.height < 50) sim.height = 170;
                if (!sim.weight || sim.weight < 20) sim.weight = 60;
                if (sim.appearanceScore === undefined) sim.appearanceScore = 50;

                // [新增] 补全 Luck, Constitution, EQ
                if (sim.luck === undefined) sim.luck = 50;
                if (sim.constitution === undefined) sim.constitution = 60;
                if (sim.eq === undefined) sim.eq = 50;
                if (sim.iq === undefined) sim.iq = 50;
                if (sim.reputation === undefined) sim.reputation = 20;
                if (sim.morality === undefined) sim.morality = 50;
                if (sim.creativity === undefined) sim.creativity = 50;

                sim.interactionTarget = null;
                sim.target = null;
                // @ts-ignore
                sim.path = []; // 重置路径
                
                if (sim.action !== 'sleeping') {
                    sim.action = 'idle';
                }
                
                const currentJobDefinition = JOBS.find(j => j.id === sim.job.id);
                if (currentJobDefinition) {
                    sim.job = { ...currentJobDefinition };
                } else {
                    sim.job = JOBS.find(j => j.id === 'unemployed')!;
                }

                if (sim.dailyIncome === undefined) sim.dailyIncome = 0;

                return sim;
            });
            
            this.notify();
            return true;
        } catch (e) {
            console.error("Load failed", e);
            return false;
        }
    }

    static clearSave() {
        if (confirm('确定要删除存档并重置世界吗？\n这将清除当前进度并刷新页面。')) {
            localStorage.removeItem('pixel_life_save_v1');
            location.reload();
        }
    }
}

export function initGame() {
    GameStore.initIndex();

    if (GameStore.loadGame()) {
        GameStore.addLog(null, "存档读取成功 (已重置当前动作以防冲突)", "sys");
    } else {
        GameStore.sims.push(new Sim(120, 120));
        GameStore.sims.push(new Sim(150, 150));
        GameStore.addLog(null, "新世界已生成。", "sys");
    }
    GameStore.notify();
}

export function updateTime() {
    if (GameStore.time.speed === 0) return;

    GameStore.timeAccumulator += GameStore.time.speed;
    
    if (GameStore.timeAccumulator >= 60) {
        GameStore.timeAccumulator = 0;
        GameStore.time.minute++;

        GameStore.sims.forEach(s => s.update(0, true));

        if (GameStore.time.minute >= 60) {
            GameStore.time.minute = 0;
            GameStore.time.hour++;

            GameStore.sims.forEach(s => s.checkSpending());

            if (GameStore.time.hour >= 24) {
                GameStore.time.hour = 0;

                // === 在这里插入 AI 日记逻辑 ===
                // 此时 day 即将 +1，我们生成的是“刚过去的这一天”的日记，所以传入 GameStore.time.day
                const targetDay = GameStore.time.day; 
                
                // 异步触发，不要阻塞游戏主循环
                handleDailyDiaries(targetDay);

                GameStore.time.day++;
                
                GameStore.time.date++;
                GameStore.time.weekday++;
                if (GameStore.time.weekday > 7) GameStore.time.weekday = 1;
                if (GameStore.time.date > 30) {
                    GameStore.time.date = 1;
                    GameStore.time.month++;
                    if (GameStore.time.month > 12) GameStore.time.month = 1;
                }

                let dailyLog = `Day ${GameStore.time.day} | ${GameStore.time.month}月${GameStore.time.date}日`;
                GameStore.addLog(null, dailyLog, 'sys');

                const holiday = HOLIDAYS.find(h => h.month === GameStore.time.month && h.day === GameStore.time.date);
                if (holiday) {
                    GameStore.addLog(null, `🎉 今天是 ${holiday.name}！`, 'sys');
                }

                GameStore.sims.forEach(s => {
                    s.dailyExpense = 0;
                    s.dailyIncome = 0; 
                    s.calculateDailyBudget(); 

                    if (holiday) s.addBuff(BUFFS.holiday_joy);
                    else if (GameStore.time.weekday >= 6) s.addBuff(BUFFS.weekend_vibes);
                });
                
                GameStore.saveGame();
            }
        }
        
        GameStore.notify();
    }
}

// === 新增：处理日记生成的独立函数 ===
async function handleDailyDiaries(day: number) {
    console.log(`[AI] 开始生成 Day ${day} 的市民日记...`);
    
    // 1. 准备数据
    const allSimsData = GameStore.sims.map(sim => sim.getDaySummary(day));
    
    // 2. 分批处理 (Batching)
    // 建议每批 20 人，这样 100 人只需要 5 次请求，既不会超时也不会超限
    const BATCH_SIZE = 20;
    
    for (let i = 0; i < allSimsData.length; i += BATCH_SIZE) {
        const batch = allSimsData.slice(i, i + BATCH_SIZE);
        
        try {
            console.log(`[AI] 发送批次 ${i/BATCH_SIZE + 1}... (${batch.length}人)`);
            
            // 调用 API
            const diariesMap = await batchGenerateDiaries(batch);
            
            // 3. 分发结果
            Object.entries(diariesMap).forEach(([simId, diaryContent]) => {
                const sim = GameStore.sims.find(s => s.id === simId);
                if (sim) {
                    sim.addDiary(diaryContent);
                }
            });
            
            // 简单延时，防止瞬间并发太高（虽然是串行 await，但加个 1秒 间隔对免费版更友好）
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error("[AI] 批次生成失败:", error);
        }
    }
    
    // 4. 完成通知
    GameStore.addLog(null, `Day ${day} 的市民日记已生成完毕。`, 'sys', true);
}

export function getActivePalette() {
    const h = GameStore.time.hour;
    if (h >= 5 && h < 9) return PALETTES.earlyMorning;
    if (h >= 9 && h < 15) return PALETTES.noon;
    if (h >= 15 && h < 18) return PALETTES.afternoon;
    if (h >= 18 && h < 21) return PALETTES.dusk;
    if (h >= 21 || h < 0) return PALETTES.night;
    return PALETTES.lateNight;
}

export function gameLoopStep() {
    try {
        updateTime();
        GameStore.sims.forEach(s => s.update(GameStore.time.speed, false));
    } catch (error) {
        console.error("Game Loop Error:", error);
        GameStore.time.speed = 0; 
        GameStore.notify();
    }
}