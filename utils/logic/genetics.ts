import { Sim } from '../Sim';
import { CONFIG, SURNAMES } from '../../constants';
import { SocialLogic } from './social';
import { HousingUnit, AgeStage } from '../../types';

// 定义一个包含绝对坐标的类型，与 GameStore.housingUnits 保持一致
type HousingUnitWithPos = HousingUnit & { x: number; y: number };

// 生成家庭的逻辑
export const FamilyGenerator = {
    // 参数类型改为 HousingUnitWithPos[]
    generate(count: number, housingUnits: HousingUnitWithPos[], allSims: Sim[]): Sim[] {
        const familyId = Math.random().toString(36).substring(2, 8);
        const r = Math.random();
        let wealthClass: 'poor' | 'middle' | 'rich';
        let baseMoney = 0;

        // 1. 决定阶级
        if (r < 0.15) { wealthClass = 'rich'; baseMoney = 10000 + Math.floor(Math.random() * 20000); } 
        else if (r < 0.8) { wealthClass = 'middle'; baseMoney = 2500 + Math.floor(Math.random() * 6500); } 
        else { wealthClass = 'poor'; baseMoney = 1000 + Math.floor(Math.random() * 500); }

        // 2. 寻找合适的住所
        let targetHomeTypes: string[] = wealthClass === 'rich' ? ['villa', 'apartment'] : (wealthClass === 'middle' ? ['apartment', 'public_housing'] : ['public_housing']); 

        const availableHomes = housingUnits.filter(unit => {
            const occupants = allSims.filter(s => s.homeId === unit.id).length;
            return targetHomeTypes.includes(unit.type) && (occupants + count <= unit.capacity);
        });

        // 住所优先级排序
        availableHomes.sort((a, b) => targetHomeTypes.indexOf(a.type) - targetHomeTypes.indexOf(b.type));

        let homeId: string | null = null;
        let homeX = 100 + Math.random() * (CONFIG.CANVAS_W - 200);
        let homeY = 400 + Math.random() * (CONFIG.CANVAS_H - 500);

        if (availableHomes.length > 0) {
            const bestType = availableHomes[0].type;
            const bestHomes = availableHomes.filter(h => h.type === bestType);
            const home = bestHomes[Math.floor(Math.random() * bestHomes.length)];
            homeId = home.id;
            // 现在 home 被识别为 HousingUnitWithPos，包含 x 和 y 属性
            homeX = home.x + home.area.w / 2;
            homeY = home.y + home.area.h / 2;
        }

        const getSurname = () => SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
        const members: Sim[] = [];
        
        // 3. 生成父母
        const parentCount = (count > 1 && Math.random() > 0.3) ? 2 : 1; 
        const isSameSex = parentCount === 2 && Math.random() < 0.1; 
        
        const p1Gender: 'M' | 'F' = Math.random() > 0.5 ? 'M' : 'F';
        let p2Gender: 'M' | 'F' = p1Gender === 'M' ? 'F' : 'M';
        if (isSameSex) p2Gender = p1Gender;

        const p1Surname = getSurname();
        const parent1 = new Sim({ x: homeX, y: homeY, surname: p1Surname, familyId, ageStage: AgeStage.Adult, gender: p1Gender, homeId, money: baseMoney });
        members.push(parent1);

        let parent2: Sim | null = null;
        if (parentCount === 2) {
            const p2Surname = getSurname(); 
            parent2 = new Sim({ x: homeX + 10, y: homeY + 10, surname: p2Surname, familyId, ageStage: AgeStage.Adult, gender: p2Gender, homeId, money: 0 });
            members.push(parent2);
            SocialLogic.marry(parent1, parent2, true); 
        }

        // 4. 生成孩子
        const childCount = count - parentCount;
        for (let i = 0; i < childCount; i++) {
            const r2 = Math.random();
            const ageStage = r2 > 0.6 ? AgeStage.Child : (r2 > 0.3 ? AgeStage.Teen : AgeStage.Toddler);
            let childSurname = p1Surname;
            if (parent2 && Math.random() > 0.5) childSurname = parent2.surname;
            
            const child = new Sim({ 
                x: homeX + (i+1)*15, y: homeY + 15, surname: childSurname, familyId, ageStage, homeId, 
                fatherId: p1Gender === 'M' ? parent1.id : (parent2 && p2Gender === 'M' ? parent2.id : undefined),
                motherId: p1Gender === 'F' ? parent1.id : (parent2 && p2Gender === 'F' ? parent2.id : undefined),
                money: 0
            });
            
            // 建立亲属关系
            members.forEach(p => {
                if (p.ageStage === AgeStage.Adult) {
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
        return members;
    }
};