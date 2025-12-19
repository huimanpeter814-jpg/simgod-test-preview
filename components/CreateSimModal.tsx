import React, { useState, useRef, useEffect } from 'react';
import { GameStore } from '../utils/simulation';
import { SimInitConfig } from '../utils/logic/SimInitializer';
import { CONFIG, ASSET_CONFIG, MBTI_TYPES, LIFE_GOALS, AGE_CONFIG, ZODIACS, SURNAMES, GIVEN_NAMES } from '../constants';
import { AgeStage, SimData } from '../types';
import { drawAvatarHead } from '../utils/render/pixelArt'; // 复用渲染逻辑

interface CreateSimModalProps {
    onClose: () => void;
}

// 默认空配置工厂
const createEmptySimConfig = (): SimInitConfig => ({
    name: '新市民',
    gender: 'M',
    ageStage: AgeStage.Adult,
    mbti: 'ISTJ',
    lifeGoal: LIFE_GOALS[0],
    
    // 基础属性
    iq: 50,
    eq: 50,
    constitution: 50,
    appearanceScore: 50,
    luck: 50,
    morality: 50,
    creativity: 50,

    // 外观
    skinColor: CONFIG.COLORS.skin[0],
    hairColor: CONFIG.COLORS.hair[0],
    clothesColor: CONFIG.COLORS.clothes[0],
    pantsColor: CONFIG.COLORS.pants[0],
    appearance: {
        face: ASSET_CONFIG.face[0] || '',
        hair: ASSET_CONFIG.hair[0] || '',
        clothes: '',
        pants: ''
    }
});

const CreateSimModal: React.FC<CreateSimModalProps> = ({ onClose }) => {
    // === 状态管理 ===
    const [familyMembers, setFamilyMembers] = useState<SimInitConfig[]>([createEmptySimConfig()]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const currentSim = familyMembers[selectedIndex];

    // === 辅助逻辑 ===

    // 更新当前选中的市民
    const updateCurrentSim = (changes: Partial<SimInitConfig>) => {
        const updated = [...familyMembers];
        updated[selectedIndex] = { ...updated[selectedIndex], ...changes };
        // 如果修改了外观对象，需要深度合并
        if (changes.appearance) {
            updated[selectedIndex].appearance = {
                ...familyMembers[selectedIndex].appearance,
                ...changes.appearance
            } as any;
        }
        setFamilyMembers(updated);
    };

    // 随机化（仅部分属性，保留发型/脸型）
    const randomizeVisuals = () => {
        const gender = Math.random() > 0.5 ? 'M' : 'F';
        const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
        const name = surname + GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
        
        updateCurrentSim({
            name,
            gender: gender as any,
            skinColor: CONFIG.COLORS.skin[Math.floor(Math.random() * CONFIG.COLORS.skin.length)],
            // 发型颜色随机，但发型样式保留（除非之前为空）
            hairColor: CONFIG.COLORS.hair[Math.floor(Math.random() * CONFIG.COLORS.hair.length)],
            clothesColor: CONFIG.COLORS.clothes[Math.floor(Math.random() * CONFIG.COLORS.clothes.length)],
            pantsColor: CONFIG.COLORS.pants[Math.floor(Math.random() * CONFIG.COLORS.pants.length)],
        });
    };

    const addMember = () => {
        if (familyMembers.length >= 8) return;
        const newSim = createEmptySimConfig();
        // 自动继承当前姓氏
        const currentSurname = currentSim.name.substring(0, 1);
        newSim.name = currentSurname + GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
        setFamilyMembers([...familyMembers, newSim]);
        setSelectedIndex(familyMembers.length);
    };

    const removeMember = (index: number) => {
        if (familyMembers.length <= 1) return;
        const updated = familyMembers.filter((_, i) => i !== index);
        setFamilyMembers(updated);
        setSelectedIndex(Math.max(0, index - 1));
    };

    const handleCreateFamily = () => {
        GameStore.spawnCustomFamily(familyMembers);
        onClose();
    };

    // 资源循环辅助
    const cycleAsset = (type: 'hair' | 'face', dir: number) => {
        const list = ASSET_CONFIG[type];
        if (list.length === 0) return;
        const currentVal = currentSim.appearance?.[type];
        let idx = list.indexOf(currentVal || '');
        if (idx === -1) idx = 0;
        
        const newIdx = (idx + dir + list.length) % list.length;
        updateCurrentSim({
            appearance: {
                ...currentSim.appearance!,
                [type]: list[newIdx]
            }
        });
    };

    // === 绘制全身预览 (核心逻辑复用自 GameCanvas) ===
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // 清空画布
        ctx.clearRect(0, 0, 300, 400);
        ctx.imageSmoothingEnabled = false;

        const centerX = 150;
        const centerY = 280; // 脚底位置
        const scale = 5; // 放大倍数

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);

        // 构建临时 Mock 对象用于渲染
        const mockSim: any = {
            id: 'preview_sim', // id用于发型哈希，这里固定或随机
            ...currentSim
        };

        // 获取年龄配置
        const ageConfig = AGE_CONFIG[currentSim.ageStage || AgeStage.Adult];
        const w = ageConfig.width || 20;
        const h = ageConfig.height || 42;
        const headSize = ageConfig.headSize || 13;
        const headY = -h + (headSize * 0.4);

        // 1. 绘制后发 (Back Hair)
        drawAvatarHead(ctx, 0, headY, headSize, mockSim, 'back');

        // 2. 绘制身体 (Body)
        if (currentSim.ageStage === AgeStage.Infant || currentSim.ageStage === AgeStage.Toddler) {
            // 婴儿/幼儿连体衣
            ctx.fillStyle = '#ffffff'; 
            ctx.beginPath(); 
            // @ts-ignore
            if(ctx.roundRect) ctx.roundRect(-w / 2 + 1, -h * 0.45, w - 2, h * 0.45, 4);
            else ctx.fillRect(-w / 2 + 1, -h * 0.45, w - 2, h * 0.45);
            ctx.fill();
            
            ctx.fillStyle = currentSim.clothesColor || '#ff9ff3'; 
            ctx.fillRect(-w / 2, -h + (headSize * 1), w, h * 0.4);
        } else {
            // 裤子
            ctx.fillStyle = currentSim.pantsColor || '#455A64'; 
            ctx.fillRect(-w / 2, -h * 0.45, w, h * 0.45);
            
            // 上衣
            const shoulderY = -h + (headSize * 0.6); 
            const shirtBottomY = -h * 0.25;
            ctx.fillStyle = currentSim.clothesColor || '#e66767'; 
            ctx.fillRect(-w / 2, shoulderY, w, shirtBottomY - shoulderY); 
        }

        // 3. 绘制头部/脸/前发 (Head/Face/Front Hair)
        drawAvatarHead(ctx, 0, headY, headSize, mockSim, 'front');

        // 绘制地面阴影
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

    }, [currentSim]);

    // 初始化随机一次
    useEffect(() => {
        randomizeVisuals();
    }, []);

    // === 组件渲染 ===

    const renderSlider = (label: string, field: keyof SimInitConfig, min=0, max=100) => (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-16 text-gray-400">{label}</span>
            <input 
                type="range" 
                min={min} max={max} 
                value={(currentSim[field] as number) || 50} 
                onChange={(e) => updateCurrentSim({ [field]: parseInt(e.target.value) })}
                className="flex-1 accent-accent h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-8 text-right font-mono text-gray-300">{(currentSim[field] as number) || 50}</span>
        </div>
    );

    const renderColorPicker = (label: string, field: keyof SimInitConfig, options: string[]) => (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500">{label}</span>
            <div className="flex flex-wrap gap-1">
                {options.map(c => (
                    <button
                        key={c}
                        onClick={() => updateCurrentSim({ [field]: c })}
                        className={`w-4 h-4 rounded-full border ${currentSim[field] === c ? 'border-white scale-110' : 'border-white/10 hover:border-white/50'}`}
                        style={{ background: c }}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="w-[950px] h-[700px] bg-[#1e222e] border border-white/20 rounded-xl shadow-2xl flex overflow-hidden">
                
                {/* 1. Left: Family Members List */}
                <div className="w-20 bg-black/30 border-r border-white/10 flex flex-col items-center py-4 gap-3">
                    {familyMembers.map((sim, idx) => (
                        <div key={idx} className="relative group">
                            <button 
                                onClick={() => setSelectedIndex(idx)}
                                className={`w-12 h-12 rounded-full border-2 overflow-hidden bg-white/5 transition-all ${selectedIndex === idx ? 'border-accent shadow-[0_0_10px_rgba(162,155,254,0.5)]' : 'border-white/10 hover:border-white/50'}`}
                            >
                                {/* 简单显示首字 */}
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                    {sim.name.charAt(0)}
                                </div>
                            </button>
                            {/* Remove Button */}
                            {familyMembers.length > 1 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeMember(idx); }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {familyMembers.length < 8 && (
                        <button 
                            onClick={addMember}
                            className="w-10 h-10 rounded-full border border-dashed border-white/20 text-white/20 hover:text-white hover:border-white hover:bg-white/5 flex items-center justify-center text-xl transition-all"
                        >
                            +
                        </button>
                    )}
                </div>

                {/* 2. Center: Preview & Basic Info */}
                <div className="w-[320px] bg-gradient-to-b from-[#2d3436] to-[#1e222e] relative flex flex-col border-r border-white/10">
                    {/* Header Controls */}
                    <div className="p-4 flex justify-between z-10">
                        <div className="flex flex-col">
                            <input 
                                type="text" 
                                value={currentSim.name}
                                onChange={(e) => updateCurrentSim({ name: e.target.value })}
                                className="bg-transparent border-b border-white/20 text-xl font-bold text-white w-full outline-none focus:border-accent"
                            />
                            <div className="flex gap-2 mt-2">
                                <select 
                                    value={currentSim.gender}
                                    onChange={(e) => updateCurrentSim({ gender: e.target.value as any })}
                                    className="bg-black/20 text-xs text-gray-300 rounded px-1 py-0.5 border border-white/10 outline-none"
                                >
                                    <option value="M">♂ 男</option>
                                    <option value="F">♀ 女</option>
                                </select>
                                <select 
                                    value={currentSim.ageStage}
                                    onChange={(e) => updateCurrentSim({ ageStage: e.target.value as any })}
                                    className="bg-black/20 text-xs text-gray-300 rounded px-1 py-0.5 border border-white/10 outline-none"
                                >
                                    {Object.keys(AGE_CONFIG).map(s => <option key={s} value={s}>{AGE_CONFIG[s as AgeStage].label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Preview */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05),_transparent_70%)]"></div>
                        <canvas ref={canvasRef} width={300} height={400} className="relative z-0" />
                        
                        {/* Quick Style Randomizer */}
                        <button 
                            onClick={randomizeVisuals}
                            className="absolute bottom-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur border border-white/10 shadow-lg transition-all active:scale-95"
                            title="随机穿搭"
                        >
                            🎲
                        </button>
                    </div>
                </div>

                {/* 3. Right: Detailed Controls */}
                <div className="flex-1 flex flex-col bg-[#121212] overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">详细设定</span>
                        <div className="text-xs text-gray-500">成员 {selectedIndex + 1} / {familyMembers.length}</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                        
                        {/* Appearance Assets */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold text-accent uppercase mb-2">外观资产</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-2 rounded border border-white/5">
                                    <span className="text-[10px] text-gray-500 block mb-1">发型样式</span>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => cycleAsset('hair', -1)} className="w-6 h-6 bg-black/20 hover:bg-white/10 rounded text-gray-300">‹</button>
                                        <span className="text-xs font-mono text-white truncate max-w-[80px]">Style</span>
                                        <button onClick={() => cycleAsset('hair', 1)} className="w-6 h-6 bg-black/20 hover:bg-white/10 rounded text-gray-300">›</button>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-2 rounded border border-white/5">
                                    <span className="text-[10px] text-gray-500 block mb-1">脸型/五官</span>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => cycleAsset('face', -1)} className="w-6 h-6 bg-black/20 hover:bg-white/10 rounded text-gray-300">‹</button>
                                        <span className="text-xs font-mono text-white truncate max-w-[80px]">Face</span>
                                        <button onClick={() => cycleAsset('face', 1)} className="w-6 h-6 bg-black/20 hover:bg-white/10 rounded text-gray-300">›</button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Colors */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold text-accent uppercase mb-2">色彩风格</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {renderColorPicker('皮肤', 'skinColor', CONFIG.COLORS.skin)}
                                {renderColorPicker('头发', 'hairColor', CONFIG.COLORS.hair)}
                                {renderColorPicker('上衣', 'clothesColor', CONFIG.COLORS.clothes)}
                                {renderColorPicker('下装', 'pantsColor', CONFIG.COLORS.pants)}
                            </div>
                        </section>

                        {/* Personality */}
                        <section className="space-y-3">
                            <h3 className="text-xs font-bold text-accent uppercase mb-2">性格与目标</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">MBTI 人格</label>
                                    <select 
                                        value={currentSim.mbti}
                                        onChange={(e) => updateCurrentSim({ mbti: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-accent"
                                    >
                                        {MBTI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1">人生目标</label>
                                    <select 
                                        value={currentSim.lifeGoal}
                                        onChange={(e) => updateCurrentSim({ lifeGoal: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-accent"
                                    >
                                        {LIFE_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Detailed Attributes (Sliders) */}
                        <section className="space-y-2">
                            <h3 className="text-xs font-bold text-accent uppercase mb-2">详细属性 (0-100)</h3>
                            <div className="space-y-2 bg-black/20 p-3 rounded border border-white/5">
                                {renderSlider("智商 (IQ)", 'iq')}
                                {renderSlider("情商 (EQ)", 'eq')}
                                {renderSlider("体质", 'constitution')}
                                {renderSlider("魅力", 'appearanceScore')}
                                {renderSlider("幸运", 'luck')}
                                {renderSlider("创造力", 'creativity')}
                                {renderSlider("道德", 'morality')}
                            </div>
                        </section>

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end gap-3 shrink-0">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 rounded text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleCreateFamily}
                            className="px-6 py-2 rounded bg-success hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-green-900/50 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <span>✓</span> 创建家庭 ({familyMembers.length}人)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateSimModal;