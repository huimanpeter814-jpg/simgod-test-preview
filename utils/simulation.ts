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
    
    // [修改] 时间结构：totalDays(总月数), year, month
    static time: GameTime = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };
    
    static timeAccumulator: number = 0;
    static logs: LogEntry[] = [];
    static selectedSimId: string | null = null;
    static listeners: (() => void)[] = [];

    // 索引系统
    static furnitureIndex: Map<string, Furniture[]> = new Map();
    static worldGrid: SpatialHashGrid = new SpatialHashGrid(100);
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
        this.pathFinder.clear(); 

        const passableTypes = ['rug_fancy', 'rug_persian', 'rug_art', 'pave_fancy', 'stripes', 'zebra', 'manhole'];

        FURNITURE.forEach(f => {
            if (!this.furnitureIndex.has(f.utility)) {
                this.furnitureIndex.set(f.utility, []);
            }
            this.furnitureIndex.get(f.utility)!.push(f);

            this.worldGrid.insert({
                id: f.id,
                x: f.x,
                y: f.y,
                w: f.w,
                h: f.h,
                type: 'furniture',
                ref: f
            });

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
        // [修改] 日志时间格式
        const timeStr = `Y${this.time.year} M${this.time.month} | ${String(this.time.hour).padStart(2, '0')}:${String(this.time.minute).padStart(2, '0')}`;
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
            if (s.interactionTarget && (s.interactionTarget as any).ref) {
                s.interactionTarget = null;
                s.action = 'idle';
                s.target = null;
                // @ts-ignore
                s.path = []; 
                s.bubble = { text: null, timer: 0, type: 'normal' };
            }
            return s;
        });

        const saveData = {
            version: 2.2, // Version bump
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

            // Version check or migration could go here
            if (data.version < 2.2) {
                 console.warn("Save too old, resetting for new time system");
                 return false;
            }

            this.time = { ...data.time };
            this.logs = data.logs || [];
            
            this.sims = data.sims.map((sData: any) => {
                const sim = new Sim(sData.pos.x, sData.pos.y);
                Object.assign(sim, sData);
                
                if (!sim.height || sim.height < 50) sim.height = 170;
                if (!sim.weight || sim.weight < 20) sim.weight = 60;
                if (sim.appearanceScore === undefined) sim.appearanceScore = 50;
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
                sim.path = [];
                
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
        GameStore.addLog(null, "存档读取成功 (时间系统已更新)", "sys");
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

                const currentSimMonth = GameStore.time.totalDays; // 使用 totalDays 作为历史记录的 ID
                handleDailyDiaries(currentSimMonth);

                // [修改] 时间推进逻辑：1天 = 1月
                GameStore.time.totalDays++;
                GameStore.time.month++;
                if (GameStore.time.month > 12) {
                    GameStore.time.month = 1;
                    GameStore.time.year++;
                    GameStore.addLog(null, `🎆 新年快乐！进入第 ${GameStore.time.year} 年`, 'sys');
                }

                const currentMonth = GameStore.time.month;
                let dailyLog = `进入 ${GameStore.time.year} 年 ${currentMonth} 月`;
                
                const holiday = HOLIDAYS[currentMonth];
                if (holiday) {
                    dailyLog += ` | 🎉 本月是: ${holiday.name}`;
                    GameStore.addLog(null, `🎉 ${holiday.name} 到了！本月大家都有些特别的想法...`, 'sys');
                }
                GameStore.addLog(null, dailyLog, 'sys');

                GameStore.sims.forEach(s => {
                    s.dailyExpense = 0;
                    s.dailyIncome = 0; 
                    s.calculateDailyBudget(); 
                    
                    // [修改] 触发每月(每日)的节日Buff逻辑
                    s.applyMonthlyEffects(currentMonth, holiday);
                });
                
                GameStore.saveGame();
            }
        }
        
        GameStore.notify();
    }
}

async function handleDailyDiaries(monthIndex: number) {
    console.log(`[AI] 开始生成第 ${monthIndex} 月的市民日记...`);
    
    // 1. 准备数据
    const allSimsData = GameStore.sims.map(sim => sim.getDaySummary(monthIndex));
    
    // 2. 获取环境上下文 (Context)
    const currentMonth = GameStore.time.month;
    const holiday = HOLIDAYS[currentMonth];
    let contextStr = `现在的季节是 ${currentMonth}月。`;
    if (holiday) {
        contextStr += ` 本月是【${holiday.name}】(${holiday.type})，全城都在过节！`;
    }
    const BATCH_SIZE = 20;
    
    for (let i = 0; i < allSimsData.length; i += BATCH_SIZE) {
        const batch = allSimsData.slice(i, i + BATCH_SIZE);
        try {
            const diariesMap = await batchGenerateDiaries(batch, contextStr);
            Object.entries(diariesMap).forEach(([simId, diaryContent]) => {
                const sim = GameStore.sims.find(s => s.id === simId);
                if (sim) {
                    sim.addDiary(diaryContent);
                }
            });
            await new Promise(resolve => setTimeout(resolve, 4000));
        } catch (error) {
            console.error("[AI] 批次生成失败:", error);
        }
    }
    GameStore.addLog(null, `第 ${monthIndex} 月的市民日记已生成完毕。`, 'sys', true);
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