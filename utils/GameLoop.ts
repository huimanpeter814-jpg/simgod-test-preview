import { GameStore } from './GameStore';
import { PALETTES, HOLIDAYS, TIME_CONFIG } from '../constants';
import { NarrativeSystem } from './logic/narrative';
import { EconomyLogic } from './logic/EconomyLogic';
import { LifeCycleLogic } from './logic/LifeCycleLogic';
import { CareerLogic } from './logic/career';
import { SchoolLogic } from './logic/school';

export function getActivePalette() {
    const h = GameStore.time.hour;
    if (h >= 5 && h < 9) return PALETTES.earlyMorning;
    if (h >= 9 && h < 15) return PALETTES.noon;
    if (h >= 15 && h < 18) return PALETTES.afternoon;
    if (h >= 18 && h < 21) return PALETTES.dusk;
    if (h >= 21 || h < 0) return PALETTES.night;
    return PALETTES.lateNight;
}

export function updateTime() {
    if (GameStore.editor.mode !== 'none') return;
    if (GameStore.time.speed === 0) return;

    GameStore.timeAccumulator += GameStore.time.speed;
    
    // 使用配置中的 Ticks (120)，确保和 action duration 的比例正确
    const ticksPerMin = TIME_CONFIG.TICKS_PER_MINUTE;

    // 使用 while 循环处理高倍速下的时间累积 (防止丢帧)
    // 并且使用减法而不是重置为0，以保持时间精确同步
    while (GameStore.timeAccumulator >= ticksPerMin) {
        GameStore.timeAccumulator -= ticksPerMin;
        GameStore.time.minute++;
        
        // 触发低频逻辑 (每游戏分钟一次)
        // 传入 0 作为 dt，因为移动已经在 gameLoopStep 的高频更新中处理了
        GameStore.sims.forEach(s => s.update(0, true));

        if (GameStore.time.minute >= 60) {
            GameStore.time.minute = 0;
            GameStore.time.hour++;
            GameStore.sims.forEach(s => s.checkSpending());

            if (GameStore.time.hour >= 24) {
                GameStore.time.hour = 0;
                
                NarrativeSystem.handleDailyDiaries(GameStore.sims, GameStore.time, (msg) => GameStore.addLog(null, msg, 'sys', true));

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
                    s.dailyExpense = 0; s.dailyIncome = 0; s.payRent(); s.calculateDailyBudget(); s.applyMonthlyEffects(currentMonth, holiday);
                });
                
                GameStore.saveGame(1);
            }
        }
        // 如果速度非常快，这里可能一帧处理多分钟，需要通知 UI 更新
        GameStore.notify();
    }
}

export function gameLoopStep() {
    try {
        updateTime();
        if (GameStore.editor.mode === 'none') {
            // 高频逻辑：处理移动、动画和动作持续时间衰减
            // 这里的 dt 直接使用 speed，确保动作消耗的时间和时钟流逝的时间是 1:1 的关系
            GameStore.sims.forEach(s => s.update(GameStore.time.speed, false));
        }
    } catch (error) {
        console.error("Game Loop Error:", error);
        GameStore.time.speed = 0; 
        GameStore.notify();
    }
}