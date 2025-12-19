import { PlotTemplate, Furniture } from '../types';

// ==========================================
// 🎨 配色与工具
// ==========================================
const PALETTE = {
    wood: '#d4a373', dark_wood: '#8b4513', stone: '#dcdde1',
    grass: '#2ecc71', water: '#5a8fff', asphalt: '#3d404b',
    wall: '#fff', floor_office: '#f1f2f6', floor_home: '#f7f1e3'
};

// 辅助：快速生成矩阵家具 (例如一排办公桌)
const createGrid = (baseId: string, startX: number, startY: number, cols: number, rows: number, gapX: number, gapY: number, props: any) => {
    let items: Furniture[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            items.push({
                ...props, id: `${baseId}_${r}_${c}`,
                x: startX + c * gapX, y: startY + r * gapY
            });
        }
    }
    return items;
};

// ==========================================
// 🏠 居住类 (Residential)
// ==========================================

// 1. 便宜小公寓 (300x300) - 一卧一卫一厨
const PLOT_APT_CHEAP: PlotTemplate = {
    id: 'apt_cheap', width: 300, height: 300, type: 'residential',
    housingUnits: [{ id: 'unit', name: '温馨蜗居', capacity: 2, cost: 600, type: 'apartment', area: { x: 5, y: 5, w: 290, h: 290 } }],
    rooms: [
        { id: 'main', x: 5, y: 5, w: 290, h: 290, label: '起居室', color: '#fff', pixelPattern: 'wood', hasWall: true },
        { id: 'bath_room', x: 220, y: 220, w: 70, h: 70, label: '卫', color: '#dfe6e9', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        { id: 'bed', x: 20, y: 20, w: 60, h: 80, color: '#ff7675', label: '双人床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true, tags: ['bed', 'sleep'] },
        { id: 'desk', x: 100, y: 20, w: 50, h: 30, color: '#a29bfe', label: '电脑桌', utility: 'play', pixelPattern: 'pc_pixel', tags: ['computer', 'desk'] },
        { id: 'kitchen', x: 20, y: 150, w: 80, h: 40, color: '#b2bec3', label: '简易厨房', utility: 'cook', pixelPattern: 'kitchen', tags: ['stove', 'kitchen'] },
        { id: 'table', x: 120, y: 150, w: 40, h: 40, color: '#fab1a0', label: '餐桌', utility: 'hunger', pixelPattern: 'table_dining', tags: ['table'] },
        { id: 'toilet', x: 230, y: 230, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] },
        { id: 'shower', x: 230, y: 265, w: 30, h: 30, color: '#81ecec', label: '淋浴', utility: 'hygiene', pixelPattern: 'shower_stall', tags: ['shower'] }
    ]
};

// 2. 高级公寓 (400x350) - 两卧一卫一厨一厅
const PLOT_APT_LUXURY: PlotTemplate = {
    id: 'apt_luxury', width: 400, height: 350, type: 'residential',
    housingUnits: [{ id: 'unit', name: '豪华公寓', capacity: 4, cost: 2000, type: 'apartment', area: { x: 5, y: 5, w: 390, h: 340 } }],
    rooms: [
        { id: 'living', x: 5, y: 5, w: 250, h: 340, label: '大厅/厨', color: '#f7f1e3', pixelPattern: 'pave_fancy', hasWall: true },
        { id: 'bed_1', x: 260, y: 5, w: 135, h: 140, label: '主卧', color: '#fff', pixelPattern: 'wood', hasWall: true },
        { id: 'bed_2', x: 260, y: 150, w: 135, h: 120, label: '次卧', color: '#fff', pixelPattern: 'wood', hasWall: true },
        { id: 'bath', x: 260, y: 275, w: 135, h: 70, label: '卫生间', color: '#dfe6e9', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        // 客厅
        { id: 'sofa', x: 20, y: 20, w: 100, h: 40, color: '#74b9ff', label: '真皮沙发', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['sofa'] },
        { id: 'tv', x: 20, y: 80, w: 80, h: 10, color: '#2d3436', label: '大电视', utility: 'play', tags: ['tv'] },
        // 厨房
        { id: 'kitchen', x: 20, y: 250, w: 100, h: 40, color: '#b2bec3', label: '整体橱柜', utility: 'cook', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'dining', x: 140, y: 250, w: 60, h: 60, color: '#fab1a0', label: '餐桌', utility: 'hunger', pixelPattern: 'table_dining', tags: ['table'] },
        // 卧室
        { id: 'bed_m', x: 280, y: 20, w: 80, h: 90, color: '#ff7675', label: 'KingSize床', utility: 'energy', pixelPattern: 'bed_king', multiUser: true, tags: ['bed'] },
        { id: 'bed_s', x: 280, y: 160, w: 60, h: 80, color: '#ff9f43', label: '单人床', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed'] },
        // 卫生间
        { id: 'bath_tub', x: 270, y: 280, w: 60, h: 40, color: '#fff', label: '浴缸', utility: 'hygiene', pixelPattern: 'bath_tub', tags: ['bath'] },
        { id: 'toilet', x: 350, y: 280, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
    ]
};

// 3. 别墅 (500x400) - 两卧一卫一厨一厅一书房一花园
const PLOT_VILLA: PlotTemplate = {
    id: 'villa', width: 500, height: 400, type: 'residential',
    housingUnits: [{ id: 'unit', name: '私家庄园', capacity: 5, cost: 8000, type: 'villa', area: { x: 5, y: 5, w: 490, h: 390 } }],
    rooms: [
        { id: 'garden', x: 0, y: 0, w: 500, h: 400, label: '花园', color: PALETTE.grass, pixelPattern: 'grass_dense' },
        { id: 'house', x: 20, y: 20, w: 350, h: 360, label: '主楼', color: '#fff', pixelPattern: 'wood', hasWall: true },
        // 内部分区示意 (通过家具区分，不物理分割以保持通透)
    ],
    furniture: [
        // 花园
        { id: 'bush1', x: 400, y: 50, w: 40, h: 40, color: '#27ae60', label: '灌木', utility: 'none', pixelPattern: 'bush', tags: ['plant'] },
        { id: 'bush2', x: 400, y: 300, w: 40, h: 40, color: '#27ae60', label: '灌木', utility: 'none', pixelPattern: 'bush', tags: ['plant'] },
        { id: 'fountain', x: 380, y: 150, w: 100, h: 100, color: '#74b9ff', label: '私人喷泉', utility: 'none', pixelPattern: 'water', tags: ['decor'] },
        // 客厅
        { id: 'sofa_l', x: 40, y: 40, w: 120, h: 50, color: '#e17055', label: '豪华沙发', utility: 'comfort', pixelPattern: 'sofa_vip', tags: ['sofa'] },
        { id: 'piano', x: 200, y: 40, w: 60, h: 80, color: '#2d3436', label: '钢琴', utility: 'play', pixelPattern: 'piano', tags: ['piano'] },
        // 书房
        { id: 'desk_work', x: 40, y: 120, w: 60, h: 40, color: '#8b4513', label: '书桌', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk'] },
        { id: 'bookshelf', x: 110, y: 120, w: 40, h: 80, color: '#a29bfe', label: '书架', utility: 'none', pixelPattern: 'closet', tags: ['bookshelf'] },
        // 厨房
        { id: 'kitchen', x: 250, y: 250, w: 100, h: 40, color: '#b2bec3', label: '开放厨房', utility: 'cook', pixelPattern: 'kitchen', tags: ['stove'] },
        // 卧室
        { id: 'bed_main', x: 40, y: 250, w: 80, h: 90, color: '#ff7675', label: '主卧床', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed'] },
        { id: 'bed_sec', x: 150, y: 250, w: 60, h: 80, color: '#fab1a0', label: '次卧床', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed'] },
        // 卫生间
        { id: 'bath', x: 300, y: 40, w: 50, h: 50, color: '#fff', label: '浴缸', utility: 'hygiene', pixelPattern: 'bath_tub', tags: ['bath'] },
    ]
};

// 4. 养老院 (500x400)
const PLOT_ELDER_HOME: PlotTemplate = {
    id: 'elder_home', width: 500, height: 400, type: 'residential',
    housingUnits: [{ id: 'u_e', name: '养老社区', capacity: 8, cost: 1200, type: 'elder_care', area: { x: 5, y: 5, w: 490, h: 390 } }],
    rooms: [
        { id: 'main', x: 5, y: 5, w: 490, h: 390, label: '疗养区', color: '#f0fff4', pixelPattern: 'wood', hasWall: true },
        { id: 'office', x: 350, y: 20, w: 130, h: 100, label: '办公室', color: '#fff', pixelPattern: 'tile', hasWall: true },
        { id: 'bath', x: 350, y: 130, w: 130, h: 100, label: '公共卫浴', color: '#dff9fb', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        // 单间 (模拟隔断)
        ...createGrid('bed_e', 30, 30, 2, 4, 150, 90, { w: 60, h: 70, color: '#fff', label: '护理床', utility: 'energy', pixelPattern: 'bed_king', tags: ['bed', 'medical_bed'] }),
        // 护工位
        { id: 'nurse_desk', x: 360, y: 40, w: 60, h: 40, color: '#fff', label: '护工站', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        // 卫浴
        { id: 'toilet_e1', x: 360, y: 140, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] },
        { id: 'shower_e1', x: 400, y: 140, w: 30, h: 30, color: '#81ecec', label: '淋', utility: 'hygiene', pixelPattern: 'shower_stall', tags: ['shower'] },
        // 公共活动
        { id: 'sofa_e', x: 200, y: 200, w: 80, h: 40, color: '#fab1a0', label: '休息区', utility: 'comfort', pixelPattern: 'sofa_pixel', tags: ['sofa'] }
    ]
};

// ==========================================
// 🏢 办公类 (Workplace)
// ==========================================

// 通用办公辅助：生成办公区、厕所、饭堂、老板房
const createOfficeLayout = (id: string, w: number, h: number, type: string, deskType: string, deskColor: string): PlotTemplate => {
    return {
        id, width: w, height: h, type: 'work',
        rooms: [
            { id: 'office', x: 5, y: 5, w: w-150, h: h-10, label: '办公区', color: '#f5f6fa', pixelPattern: 'grid', hasWall: true },
            { id: 'boss', x: w-140, y: 5, w: 135, h: 100, label: '老板室', color: '#dcdde1', pixelPattern: 'wood', hasWall: true },
            { id: 'canteen', x: w-140, y: 110, w: 135, h: 100, label: '食堂', color: '#ffeaa7', pixelPattern: 'tile', hasWall: true },
            { id: 'toilet', x: w-140, y: 215, w: 135, h: 80, label: '厕所', color: '#fff', pixelPattern: 'tile', hasWall: true }
        ],
        furniture: [
            // 办公区
            ...createGrid('desk', 20, 20, Math.floor((w-180)/70), Math.floor((h-40)/60), 70, 60, { w: 50, h: 40, color: deskColor, label: '工位', utility: 'work', pixelPattern: deskType, tags: ['desk', 'computer'] }),
            // 老板
            { id: 'boss_desk', x: w-120, y: 30, w: 80, h: 40, color: '#2d3436', label: '老板桌', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk', 'boss_desk'] },
            // 食堂
            { id: 'eat_table', x: w-120, y: 140, w: 60, h: 40, color: '#fab1a0', label: '餐桌', utility: 'eat_canteen', pixelPattern: 'table_dining', tags: ['table'] },
            { id: 'food_counter', x: w-130, y: 115, w: 100, h: 20, color: '#b2bec3', label: '配餐台', utility: 'none', pixelPattern: 'kitchen', tags: ['kitchen'] },
            // 厕所
            { id: 'wc1', x: w-130, y: 230, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] },
            { id: 'wc2', x: w-90, y: 230, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
        ]
    };
};

// 5. 互联网公司 (小型/大型)
const PLOT_IT_S = createOfficeLayout('it_s', 400, 300, 'internet', 'desk_pixel', '#74b9ff');
const PLOT_IT_L = createOfficeLayout('it_l', 600, 400, 'internet', 'desk_pixel', '#0984e3');
// 给大型加点服务器
PLOT_IT_L.furniture.push(...createGrid('server', 20, 350, 4, 1, 50, 0, { w: 40, h: 30, color: '#00cec9', label: '服务器', utility: 'none', pixelPattern: 'server', tags: ['server'] }));

// 6. 商务公司 (小型/大型)
const PLOT_BIZ_S = createOfficeLayout('biz_s', 400, 300, 'business', 'desk_simple', '#b2bec3');
const PLOT_BIZ_L = createOfficeLayout('biz_l', 600, 400, 'business', 'desk_simple', '#636e72');

// 7. 设计公司 (小型/大型) - 区别：总监室、画架
const createDesignOffice = (id: string, w: number, h: number): PlotTemplate => {
    let tpl = createOfficeLayout(id, w, h, 'design', 'desk_wood', '#ff7675');
    tpl.rooms[1].label = '总监室'; // 改名
    // 替换部分工位为画架
    tpl.furniture = tpl.furniture.filter((f, i) => i % 3 !== 0); // 删掉一些桌子
    tpl.furniture.push({ id: 'easel1', x: 30, y: h-60, w: 40, h: 50, color: '#fab1a0', label: '画架', utility: 'paint', pixelPattern: 'easel', tags: ['easel', 'art'] });
    tpl.furniture.push({ id: 'easel2', x: 80, y: h-60, w: 40, h: 50, color: '#fab1a0', label: '画架', utility: 'paint', pixelPattern: 'easel', tags: ['easel', 'art'] });
    return tpl;
};
const PLOT_DESIGN_S = createDesignOffice('design_s', 400, 300);
const PLOT_DESIGN_L = createDesignOffice('design_l', 600, 400);


// ==========================================
// 🛍️ 商业与服务 (Commercial & Service)
// ==========================================

// 8. 餐厅 (400x300)
const PLOT_RESTAURANT: PlotTemplate = {
    id: 'restaurant', width: 400, height: 300, type: 'commercial',
    rooms: [
        { id: 'hall', x: 5, y: 5, w: 280, h: 290, label: '用餐区', color: '#ffeb3b', pixelPattern: 'tile', hasWall: true },
        { id: 'kitchen', x: 290, y: 5, w: 105, h: 190, label: '后厨', color: '#b2bec3', pixelPattern: 'tile', hasWall: true },
        { id: 'wc', x: 290, y: 200, w: 105, h: 95, label: '公厕', color: '#fff', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        { id: 'reception', x: 20, y: 20, w: 60, h: 30, color: '#e17055', label: '前台', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] },
        ...createGrid('table', 20, 80, 3, 3, 80, 70, { w: 60, h: 50, color: '#fab1a0', label: '餐位', utility: 'eat_out', pixelPattern: 'table_dining', tags: ['table'] }),
        { id: 'stove1', x: 300, y: 20, w: 80, h: 40, color: '#636e72', label: '灶台', utility: 'cook', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'stove2', x: 300, y: 70, w: 80, h: 40, color: '#636e72', label: '灶台', utility: 'cook', pixelPattern: 'kitchen', tags: ['stove'] },
        { id: 'toilet', x: 320, y: 230, w: 30, h: 30, color: '#fff', label: '马桶', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
    ]
};

// 9. 咖啡厅 (300x300)
const PLOT_CAFE: PlotTemplate = {
    id: 'cafe', width: 300, height: 300, type: 'commercial',
    rooms: [
        { id: 'hall', x: 5, y: 5, w: 290, h: 290, label: '咖啡厅', color: '#d4a373', pixelPattern: 'wood', hasWall: true }
    ],
    furniture: [
        { id: 'counter', x: 20, y: 20, w: 150, h: 40, color: '#8b4513', label: '料理台', utility: 'work', pixelPattern: 'counter_cosmetic', tags: ['bar', 'cashier'] },
        ...createGrid('cafe_table', 20, 80, 3, 2, 80, 80, { w: 40, h: 40, color: '#fff', label: '圆桌', utility: 'eat_out', pixelPattern: 'table_dining', tags: ['table'] }),
        { id: 'wc', x: 250, y: 250, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
    ]
};

// 10. 美术馆 (400x300)
const PLOT_GALLERY: PlotTemplate = {
    id: 'gallery', width: 400, height: 300, type: 'public',
    rooms: [{ id: 'hall', x: 5, y: 5, w: 390, h: 290, label: '展厅', color: '#fff', pixelPattern: 'simple', hasWall: true }],
    furniture: [
        ...createGrid('art', 50, 50, 4, 3, 90, 80, { w: 40, h: 40, color: '#fab1a0', label: '展品', utility: 'art', pixelPattern: 'statue', tags: ['art'] }),
        { id: 'wc', x: 350, y: 250, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
    ]
};

// 11. 幼儿园 (400x300)
const PLOT_KINDERGARTEN: PlotTemplate = {
    id: 'kindergarten', width: 400, height: 300, type: 'public',
    rooms: [
        { id: 'rest', x: 5, y: 5, w: 190, h: 290, label: '休息区', color: '#ff9ff3', pixelPattern: 'wood', hasWall: true },
        { id: 'play', x: 200, y: 5, w: 195, h: 200, label: '玩耍区', color: '#55efc4', pixelPattern: 'tile', hasWall: true },
        { id: 'office', x: 200, y: 210, w: 95, h: 80, label: '办公室', color: '#fff', pixelPattern: 'simple', hasWall: true },
        { id: 'wc', x: 300, y: 210, w: 95, h: 80, label: '厕所', color: '#74b9ff', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        ...createGrid('crib', 20, 20, 2, 4, 60, 60, { w: 40, h: 40, color: '#fab1a0', label: '婴儿床', utility: 'nap_crib', pixelPattern: 'bed_crib', tags: ['bed', 'baby'] }),
        { id: 'slide', x: 220, y: 20, w: 60, h: 80, color: '#ff7675', label: '滑梯', utility: 'play', pixelPattern: 'slide', tags: ['play'] },
        { id: 'blocks', x: 300, y: 50, w: 60, h: 60, color: '#fdcb6e', label: '积木', utility: 'play_blocks', pixelPattern: 'play_mat', tags: ['play'] },
        { id: 'teacher_desk', x: 210, y: 220, w: 50, h: 30, color: '#a29bfe', label: '讲台', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] }
    ]
};

// 12. 小学 (500x400)
const PLOT_SCHOOL_ELEM: PlotTemplate = {
    id: 'school_elem', width: 500, height: 400, type: 'public',
    rooms: [
        { id: 'class', x: 5, y: 5, w: 290, h: 300, label: '教学楼', color: '#fff', pixelPattern: 'wood', hasWall: true },
        { id: 'play', x: 300, y: 5, w: 195, h: 300, label: '操场', color: '#e55039', pixelPattern: 'run_track', hasWall: false },
        { id: 'canteen', x: 5, y: 310, w: 390, h: 85, label: '食堂', color: '#ffeaa7', pixelPattern: 'tile', hasWall: true },
        { id: 'wc', x: 400, y: 310, w: 95, h: 85, label: '厕', color: '#74b9ff', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        { id: 'board', x: 100, y: 10, w: 100, h: 10, color: '#2d3436', label: '黑板', utility: 'none', tags: ['blackboard'] },
        ...createGrid('desk', 30, 40, 4, 4, 60, 50, { w: 40, h: 30, color: '#fdcb6e', label: '课桌', utility: 'study', pixelPattern: 'desk_school', tags: ['desk', 'study'] }),
        { id: 'hoop', x: 450, y: 150, w: 20, h: 40, color: '#e17055', label: '篮筐', utility: 'play', pixelPattern: 'hoop', tags: ['sports'] },
        { id: 'gate', x: 450, y: 250, w: 30, h: 30, color: '#636e72', label: '门卫', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        { id: 'kitchen', x: 10, y: 320, w: 80, h: 40, color: '#b2bec3', label: '后厨', utility: 'work', pixelPattern: 'kitchen', tags: ['stove'] },
        ...createGrid('eat', 100, 320, 3, 1, 80, 0, { w: 60, h: 40, color: '#fab1a0', label: '餐桌', utility: 'eat_canteen', pixelPattern: 'table_dining', tags: ['table'] })
    ]
};

// 13. 中学 (600x400) - 类似小学但更大
const PLOT_SCHOOL_HIGH: PlotTemplate = {
    ...PLOT_SCHOOL_ELEM, 
    id: 'school_high', width: 600, height: 400,
    rooms: [
        { id: 'class', x: 5, y: 5, w: 340, h: 390, label: '教学楼', color: '#dfe6e9', pixelPattern: 'wood', hasWall: true },
        { id: 'play', x: 350, y: 5, w: 245, h: 390, label: '大操场', color: '#e55039', pixelPattern: 'run_track', hasWall: false }
    ]
    // 复用家具逻辑，坐标会自动适配，这里为了简单直接沿用
};

// 14. 医院 (600x400)
const PLOT_HOSPITAL: PlotTemplate = {
    id: 'hospital', width: 600, height: 400, type: 'public',
    rooms: [
        { id: 'clinic', x: 5, y: 5, w: 190, h: 390, label: '门诊', color: '#fff', pixelPattern: 'tile', hasWall: true },
        { id: 'ward', x: 200, y: 5, w: 290, h: 250, label: '住院部', color: '#81ecec', pixelPattern: 'simple', hasWall: true },
        { id: 'surgery', x: 200, y: 260, w: 290, h: 135, label: '手术室', color: '#a29bfe', pixelPattern: 'tile', hasWall: true },
        { id: 'wc', x: 500, y: 5, w: 95, h: 190, label: '卫浴', color: '#74b9ff', pixelPattern: 'tile', hasWall: true }
    ],
    furniture: [
        { id: 'nurse', x: 220, y: 20, w: 80, h: 40, color: '#fff', label: '护士站', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        ...createGrid('hbed', 220, 80, 3, 2, 80, 80, { w: 60, h: 60, color: '#fff', label: '病床', utility: 'healing', pixelPattern: 'bed_king', tags: ['medical_bed', 'bed'] }),
        { id: 'doc', x: 20, y: 20, w: 60, h: 40, color: '#fff', label: '诊室', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        { id: 'op_table', x: 300, y: 300, w: 80, h: 50, color: '#fff', label: '手术台', utility: 'work', pixelPattern: 'bed_king', tags: ['medical_bed'] }
    ]
};

// 15. 便利店 (200x200)
const PLOT_STORE_CONVENIENCE: PlotTemplate = {
    id: 'store_conv', width: 200, height: 200, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 190, h: 190, label: '便利店', color: '#fff', pixelPattern: 'tile', hasWall: true }],
    furniture: [
        { id: 'cash', x: 20, y: 150, w: 60, h: 30, color: '#2c3e50', label: '收银', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] },
        ...createGrid('shelf', 20, 20, 2, 1, 80, 0, { w: 60, h: 100, color: '#ffdd59', label: '货架', utility: 'buy_item', pixelPattern: 'shelf_food', tags: ['shelf'] }),
        { id: 'wh', x: 150, y: 150, w: 30, h: 30, color: '#636e72', label: '库', utility: 'none', tags: ['storage'] }
    ]
};

// 16. 书店 (300x300)
const PLOT_BOOKSTORE: PlotTemplate = {
    id: 'store_book', width: 300, height: 300, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 290, h: 290, label: '书店', color: '#f7f1e3', pixelPattern: 'wood', hasWall: true }],
    furniture: [
        { id: 'cash', x: 20, y: 250, w: 60, h: 30, color: '#8b4513', label: '收银', utility: 'work', pixelPattern: 'cashier', tags: ['cashier', 'desk'] },
        ...createGrid('shelf', 20, 20, 3, 3, 90, 70, { w: 60, h: 40, color: '#a29bfe', label: '书架', utility: 'buy_book', pixelPattern: 'closet', tags: ['shelf', 'bookshelf'] })
    ]
};

// 17. 电影院 (400x400)
const PLOT_CINEMA: PlotTemplate = {
    id: 'cinema', width: 400, height: 400, type: 'commercial',
    rooms: [
        { id: 'lobby', x: 5, y: 5, w: 390, h: 100, label: '大厅', color: '#2d3436', pixelPattern: 'mall', hasWall: true },
        { id: 'hall', x: 5, y: 110, w: 390, h: 285, label: '影厅', color: '#000', pixelPattern: 'simple', hasWall: true }
    ],
    furniture: [
        { id: 'ticket', x: 150, y: 20, w: 100, h: 40, color: '#e17055', label: '售票处', utility: 'work', pixelPattern: 'reception', tags: ['desk'] },
        { id: 'gate', x: 180, y: 80, w: 40, h: 20, color: '#fff', label: '检票', utility: 'none', tags: ['gate'] },
        { id: 'screen', x: 50, y: 120, w: 300, h: 10, color: '#fff', label: '银幕', utility: 'none', tags: ['screen'] },
        ...createGrid('seat', 50, 160, 6, 4, 50, 50, { w: 40, h: 40, color: '#d63031', label: '座位', utility: 'cinema_3d', pixelPattern: 'sofa_pixel', tags: ['seat'] }),
        { id: 'wc', x: 350, y: 20, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
    ]
};

// 18. 超市 (中/大)
const PLOT_SUPERMARKET_M: PlotTemplate = {
    id: 'super_m', width: 400, height: 300, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 390, h: 290, label: '生活超市', color: '#fff', pixelPattern: 'tile', hasWall: true }],
    furniture: [
        ...createGrid('cash', 20, 250, 3, 1, 80, 0, { w: 60, h: 30, color: '#636e72', label: '收银', utility: 'work', pixelPattern: 'cashier', tags: ['cashier'] }),
        ...createGrid('shelf', 20, 20, 4, 3, 90, 70, { w: 60, h: 40, color: '#00b894', label: '货架', utility: 'buy_item', pixelPattern: 'shelf_food', tags: ['shelf'] }),
        { id: 'wc', x: 350, y: 250, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
    ]
};
const PLOT_SUPERMARKET_L = { ...PLOT_SUPERMARKET_M, id: 'super_l', width: 600, height: 400 }; // 简化处理，实际应更多货架

// 19. 服装店 (300x300)
const PLOT_CLOTHING: PlotTemplate = {
    id: 'store_clothes', width: 300, height: 300, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 290, h: 290, label: '潮牌店', color: '#f5f6fa', pixelPattern: 'tile', hasWall: true }],
    furniture: [
        { id: 'cash', x: 20, y: 250, w: 60, h: 30, color: '#a29bfe', label: '收银', utility: 'work', pixelPattern: 'cashier', tags: ['cashier'] },
        ...createGrid('rack', 20, 20, 3, 3, 90, 70, { w: 10, h: 60, color: '#ff7675', label: '衣架', utility: 'buy_item', pixelPattern: 'clothes_rack', tags: ['shelf'] })
    ]
};

// 20. 网吧 (300x300)
const PLOT_NETCAFE: PlotTemplate = {
    id: 'netcafe', width: 300, height: 300, type: 'commercial',
    rooms: [{ id: 'main', x: 5, y: 5, w: 290, h: 290, label: '极速网咖', color: '#2f3542', pixelPattern: 'grid', hasWall: true }],
    furniture: [
        { id: 'admin', x: 20, y: 250, w: 60, h: 30, color: '#a29bfe', label: '网管', utility: 'work', pixelPattern: 'desk_simple', tags: ['desk'] },
        ...createGrid('pc', 20, 20, 4, 3, 70, 70, { w: 50, h: 40, color: '#70a1ff', label: '电脑', utility: 'play', pixelPattern: 'pc_pixel', tags: ['computer', 'game'] }),
        { id: 'wc', x: 250, y: 250, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
    ]
};

// 21. 夜店 (400x400)
const PLOT_NIGHTCLUB_FULL: PlotTemplate = {
    id: 'nightclub_full', width: 400, height: 400, type: 'commercial',
    rooms: [
        { id: 'main', x: 5, y: 5, w: 390, h: 390, label: 'Club', color: '#000', pixelPattern: 'stripes', hasWall: true }
    ],
    furniture: [
        { id: 'dj', x: 130, y: 20, w: 140, h: 60, color: '#a29bfe', label: 'DJ台', utility: 'music', pixelPattern: 'dj_stage', pixelGlow: true, tags: ['dj_booth'] },
        { id: 'floor', x: 100, y: 100, w: 200, h: 200, color: '#e84393', label: '舞池', utility: 'dance', pixelPattern: 'dance_machine', pixelGlow: true, tags: ['dance'] },
        { id: 'bar', x: 20, y: 320, w: 150, h: 60, color: '#636e72', label: '吧台', utility: 'buy_drink', pixelPattern: 'counter_cosmetic', tags: ['bar'] },
        { id: 'wc', x: 350, y: 350, w: 30, h: 30, color: '#fff', label: '厕', utility: 'bladder', pixelPattern: 'toilet', tags: ['toilet'] }
    ]
};

// 22. 图书馆 (400x300)
const PLOT_LIBRARY: PlotTemplate = {
    id: 'library', width: 400, height: 300, type: 'public',
    rooms: [{ id: 'main', x: 5, y: 5, w: 390, h: 290, label: '图书馆', color: '#f7f1e3', pixelPattern: 'wood', hasWall: true }],
    furniture: [
        { id: 'admin', x: 20, y: 250, w: 60, h: 30, color: '#8b4513', label: '管理员', utility: 'work', pixelPattern: 'desk_wood', tags: ['desk'] },
        ...createGrid('shelf', 20, 20, 4, 3, 90, 70, { w: 60, h: 40, color: '#8b4513', label: '书架', utility: 'buy_book', pixelPattern: 'closet', tags: ['bookshelf'] }),
        ...createGrid('read', 300, 20, 1, 3, 0, 80, { w: 60, h: 40, color: '#fab1a0', label: '阅览桌', utility: 'study', pixelPattern: 'table_dining', tags: ['table'] })
    ]
};

export const PLOTS: Record<string, PlotTemplate> = {
    'apt_cheap': PLOT_APT_CHEAP,
    'apt_luxury': PLOT_APT_LUXURY,
    'villa': PLOT_VILLA,
    'elder_home': PLOT_ELDER_HOME,
    'it_s': PLOT_IT_S,
    'it_l': PLOT_IT_L,
    'biz_s': PLOT_BIZ_S,
    'biz_l': PLOT_BIZ_L,
    'design_s': PLOT_DESIGN_S,
    'design_l': PLOT_DESIGN_L,
    'restaurant': PLOT_RESTAURANT,
    'cafe': PLOT_CAFE,
    'gallery': PLOT_GALLERY,
    'kindergarten': PLOT_KINDERGARTEN,
    'school_elem': PLOT_SCHOOL_ELEM,
    'school_high': PLOT_SCHOOL_HIGH,
    'hospital': PLOT_HOSPITAL,
    'store_conv': PLOT_STORE_CONVENIENCE,
    'store_book': PLOT_BOOKSTORE,
    'cinema': PLOT_CINEMA,
    'super_m': PLOT_SUPERMARKET_M,
    'super_l': PLOT_SUPERMARKET_L,
    'store_clothes': PLOT_CLOTHING,
    'netcafe': PLOT_NETCAFE,
    'nightclub': PLOT_NIGHTCLUB_FULL,
    'library': PLOT_LIBRARY
};