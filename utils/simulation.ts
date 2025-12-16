import { PALETTES, HOLIDAYS, BUFFS, JOBS, CONFIG, SURNAMES } from '../constants'; 
import { PLOTS } from '../data/plots'; 
import { WORLD_LAYOUT, ROADS, STREET_PROPS } from '../data/world'; 
import { LogEntry, GameTime, Job, Furniture, RoomDef, HousingUnit } from '../types';
import { Sim } from './Sim';
import { SpatialHashGrid } from './spatialHash';
import { PathFinder } from './pathfinding'; 
import { batchGenerateDiaries } from '../services/geminiService'; 
import { SocialLogic } from './logic/social';

export { Sim } from './Sim';
export { minutes, getJobCapacity } from './simulationHelpers';
export { drawAvatarHead } from './render/pixelArt'; 

export class GameStore {
    static sims: Sim[] = [];
    static particles: { x: number; y: number; life: number }[] = [];
    
    static time: GameTime = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };
    
    static timeAccumulator: number = 0;
    static logs: LogEntry[] = [];
    static selectedSimId: string | null = null;
    static listeners: (() => void)[] = [];

    static rooms: RoomDef[] = [];
    static furniture: Furniture[] = [];
    static housingUnits: (HousingUnit & { x: number, y: number })[] = [];

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

    static removeSim(id: string) {
        this.sims = this.sims.filter(s => s.id !== id);
        if (this.selectedSimId === id) this.selectedSimId = null;
        this.notify();
    }

    // 重建世界：将地皮数据转化为绝对坐标数据
    static rebuildWorld() {
        this.rooms = [];
        this.furniture = [];
        this.housingUnits = [];
        
        // 1. 添加基础设施 (道路)
        // @ts-ignore
        this.rooms.push(...ROADS);
        // @ts-ignore
        this.furniture.push(...STREET_PROPS);

        // 2. 遍历地皮配置
        WORLD_LAYOUT.forEach(plot => {
            const template = PLOTS[plot.templateId];
            if (!template) {
                console.error(`Plot template not found: ${plot.templateId}`);
                return;
            }

            // 临时存储该地皮的 HousingUnits 绝对坐标，供后续家具查找归属
            const plotUnits: (HousingUnit & { x: number, y: number, maxX: number, maxY: number })[] = [];

            if (template.housingUnits) {
                template.housingUnits.forEach(u => {
                    const unitAbs = {
                        ...u,
                        id: `${plot.id}_${u.id}`,
                        x: u.area.x + plot.x,
                        y: u.area.y + plot.y,
                        maxX: u.area.x + plot.x + u.area.w,
                        maxY: u.area.y + plot.y + u.area.h
                    };
                    this.housingUnits.push(unitAbs);
                    plotUnits.push(unitAbs);
                });
            }

            // 转换房间坐标
            template.rooms.forEach(r => {
                const absX = r.x + plot.x;
                const absY = r.y + plot.y;
                
                // 检查房间是否属于某个 HousingUnit
                const ownerUnit = plotUnits.find(u => 
                    absX >= u.x && absX < u.maxX && 
                    absY >= u.y && absY < u.maxY
                );

                this.rooms.push({
                    ...r,
                    id: `${plot.id}_${r.id}`,
                    x: absX,
                    y: absY,
                    homeId: ownerUnit ? ownerUnit.id : undefined // 标记归属
                });
            });

            // 转换家具坐标
            template.furniture.forEach(f => {
                const absX = f.x + plot.x;
                const absY = f.y + plot.y;

                // 检查家具是否属于某个 HousingUnit
                const ownerUnit = plotUnits.find(u => 
                    absX >= u.x && absX < u.maxX && 
                    absY >= u.y && absY < u.maxY
                );

                this.furniture.push({
                    ...f,
                    id: `${plot.id}_${f.id}`,
                    x: absX,
                    y: absY,
                    homeId: ownerUnit ? ownerUnit.id : undefined // 标记归属
                });
            });
        });

        console.log(`[System] World Rebuilt. Rooms: ${this.rooms.length}, Furniture: ${this.furniture.length}, Homes: ${this.housingUnits.length}`);
        
        // 3. 重建索引
        this.initIndex();
    }

    static initIndex() {
        this.furnitureIndex.clear();
        this.worldGrid.clear();
        this.pathFinder.clear(); 

        const passableTypes = ['rug_fancy', 'rug_persian', 'rug_art', 'pave_fancy', 'stripes', 'zebra', 'manhole'];

        this.furniture.forEach(f => {
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
        const timeStr = `Y${this.time.year} M${this.time.month} | ${String(this.time.hour).padStart(2, '0')}:${String(this.time.minute).padStart(2, '0')}`;
        let category: 'sys' | 'chat' | 'rel' = 'chat';
        if (type === 'sys' || type === 'money' || type === 'family') category = 'sys';
        else if (type === 'rel_event' || type === 'jealous') category = 'rel';
        else if (type === 'love') category = 'rel';

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
            version: 2.4, // Bump version
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
            if (!data.version || data.version < 2.4) {
                 console.warn("Save too old, resetting for new time system");
                 return false;
            }

            this.time = { ...data.time };
            this.logs = data.logs || [];
            
            this.sims = data.sims.map((sData: any) => {
                const sim = new Sim({ x: sData.pos.x, y: sData.pos.y }); 
                Object.assign(sim, sData);
                if (!sim.childrenIds) sim.childrenIds = [];
                if (!sim.health) sim.health = 100;
                if (!sim.ageStage) sim.ageStage = 'Adult';
                
                if (sim.interactionTarget) sim.interactionTarget = null;
                
                const currentJobDefinition = JOBS.find(j => j.id === sim.job.id);
                if (currentJobDefinition) {
                    sim.job = { ...currentJobDefinition };
                }

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

    static spawnFamily() {
        const size = 1 + Math.floor(Math.random() * 4); 
        const fam = generateFamily(size);
        this.sims.push(...fam);
        this.addLog(null, `新家庭搬入城市！共 ${fam.length} 人。`, "sys");
        this.notify();
    }
}

// 按照家庭生成初始人口
function generateFamily(count: number) {
    const familyId = Math.random().toString(36).substring(2, 8);
    
    // [新逻辑] 1. 随机决定家庭阶级 (贫富差距大)
    const r = Math.random();
    let wealthClass: 'poor' | 'middle' | 'rich';
    let baseMoney = 0;

    if (r < 0.2) {
        wealthClass = 'rich';
        baseMoney = 10000 + Math.floor(Math.random() * 20000); // 1万 - 3万
    } else if (r < 0.6) {
        wealthClass = 'middle';
        baseMoney = 2000 + Math.floor(Math.random() * 3000); // 2千 - 5千
    } else {
        wealthClass = 'poor';
        baseMoney = 50 + Math.floor(Math.random() * 450); // 50 - 500
    }

    // [新逻辑] 2. 根据阶级分配住房
    // 筛选未满员的住房
    let targetHomeTypes: string[] = [];
    if (wealthClass === 'rich') targetHomeTypes = ['villa', 'apartment']; // 富人首选别墅，其次公寓
    else if (wealthClass === 'middle') targetHomeTypes = ['apartment', 'public_housing']; // 中产首选公寓
    else targetHomeTypes = ['public_housing']; // 穷人住公租房/宿舍

    const availableHomes = GameStore.housingUnits.filter(unit => {
        const occupants = GameStore.sims.filter(s => s.homeId === unit.id).length;
        // 匹配类型 且 容量足够
        return targetHomeTypes.includes(unit.type) && (occupants + count <= unit.capacity);
    });

    // 排序：优先匹配首选类型 (数组顺序)
    availableHomes.sort((a, b) => {
        const idxA = targetHomeTypes.indexOf(a.type);
        const idxB = targetHomeTypes.indexOf(b.type);
        return idxA - idxB;
    });

    let homeId: string | null = null;
    let homeX = 100 + Math.random() * (CONFIG.CANVAS_W - 200);
    let homeY = 400 + Math.random() * (CONFIG.CANVAS_H - 500);
    let homeTypeStr = "露宿街头";

    if (availableHomes.length > 0) {
        // 优先选最好的
        const bestType = availableHomes[0].type;
        const bestHomes = availableHomes.filter(h => h.type === bestType);
        const home = bestHomes[Math.floor(Math.random() * bestHomes.length)];
        
        homeId = home.id;
        homeX = home.x + home.area.w / 2;
        homeY = home.y + home.area.h / 2;
        homeTypeStr = home.name;
    }

    // 父母各自的姓氏
    const getSurname = () => SURNAMES[Math.floor(Math.random() * SURNAMES.length)];

    const members: Sim[] = [];

    // 1. 生成家长 (1-2人)
    const parentCount = (count > 1 && Math.random() > 0.3) ? 2 : 1; 
    const isSameSex = parentCount === 2 && Math.random() < 0.1; 
    
    const p1Gender: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
    let p2Gender: 'M' | 'F' = p1Gender === 'M' ? 'F' : 'M';
    if (isSameSex) p2Gender = p1Gender;

    const p1Surname = getSurname();
    const parent1 = new Sim({ 
        x: homeX, y: homeY, 
        surname: p1Surname, familyId, ageStage: 'Adult', gender: p1Gender, homeId,
        money: baseMoney // 初始资金由家庭共享(这里赋予户主)
    });
    members.push(parent1);

    let parent2: Sim | null = null;
    if (parentCount === 2) {
        const p2Surname = getSurname(); 
        parent2 = new Sim({ 
            x: homeX + 10, y: homeY + 10, 
            surname: p2Surname, familyId, ageStage: 'Adult', gender: p2Gender, homeId,
            money: 0 // 配偶初始没钱 (或者可以给点私房钱)
        });
        members.push(parent2);
        
        SocialLogic.marry(parent1, parent2, true); 
    }

    // 2. 生成孩子
    const childCount = count - parentCount;
    for (let i = 0; i < childCount; i++) {
        const r = Math.random();
        const ageStage = r > 0.6 ? 'Child' : (r > 0.3 ? 'Teen' : 'Toddler');
        
        let childSurname = p1Surname;
        if (parent2 && Math.random() > 0.5) childSurname = parent2.surname;

        const child = new Sim({ 
            x: homeX + (i+1)*15, 
            y: homeY + 15, 
            surname: childSurname, 
            familyId, 
            ageStage,
            homeId, // 孩子跟随家庭住址
            fatherId: p1Gender === 'M' ? parent1.id : (parent2 && p2Gender === 'M' ? parent2.id : undefined),
            motherId: p1Gender === 'F' ? parent1.id : (parent2 && p2Gender === 'F' ? parent2.id : undefined),
            money: 0
        });
        
        members.forEach(p => {
            if (p.ageStage === 'Adult') {
                SocialLogic.setKinship(p, child, 'child');
                SocialLogic.setKinship(child, p, 'parent');
                p.childrenIds.push(child.id);
            } else {
                SocialLogic.setKinship(p, child, 'sibling');
                SocialLogic.setKinship(child, p, 'sibling');
            }
        });
        
        members.push(child);
    }

    console.log(`Spawned family [${wealthClass}] at ${homeTypeStr} (${homeId}). Money: ${baseMoney}`);
    return members;
}

export function initGame() {
    GameStore.sims = [];
    GameStore.particles = [];
    GameStore.logs = []; 
    GameStore.time = { totalDays: 1, year: 1, month: 1, hour: 8, minute: 0, speed: 2 };

    GameStore.rebuildWorld();

    if (GameStore.loadGame()) {
        GameStore.addLog(null, "存档读取成功", "sys");
    } else {
        const familyCount = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < familyCount; i++) {
            const size = 1 + Math.floor(Math.random() * 4); 
            const fam = generateFamily(size);
            GameStore.sims.push(...fam);
        }
        
        GameStore.addLog(null, `新世界已生成。共 ${familyCount} 个家庭，${GameStore.sims.length} 位市民。`, "sys");
    }
    GameStore.notify();
}

export function updateTime() {
    if (GameStore.time.speed === 0) return;

    GameStore.timeAccumulator += GameStore.time.speed;
    
    if (GameStore.timeAccumulator >= 60) {
        GameStore.timeAccumulator = 0;
        GameStore.time.minute++;

        GameStore.sims.forEach(s => s.update(1, true));

        if (GameStore.time.minute >= 60) {
            GameStore.time.minute = 0;
            GameStore.time.hour++;

            GameStore.sims.forEach(s => s.checkSpending());

            if (GameStore.time.hour >= 24) {
                GameStore.time.hour = 0;

                const currentSimMonth = GameStore.time.totalDays; 
                handleDailyDiaries(currentSimMonth);

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
                    s.payRent(); 
                    
                    s.calculateDailyBudget(); 
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
    
    const allSimsData = GameStore.sims.map(sim => sim.getDaySummary(monthIndex));
    
    const currentMonth = GameStore.time.month;
    const holiday = HOLIDAYS[currentMonth];
    let contextStr = `现在的季节是 ${currentMonth}月。`;
    if (holiday) {
        contextStr += ` 本月是【${holiday.name}】(${holiday.type})，全城都在过节！`;
    }
    const BATCH_SIZE = 5;
    
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