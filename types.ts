export interface Vector2 {
  x: number;
  y: number;
}

export interface Furniture {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
  utility: string;
  dir?: string;
  multiUser?: boolean;
  gender?: string;
  reserved?: string;
  cost?: number;
  tier?: string;
  imagePath?: string;
  pixelPattern?: string;
  pixelOutline?: boolean;
  pixelGlow?: boolean;
  pixelShadow?: boolean;
  glowColor?: string;
  outlineColor?: string;
  shadowColor?: string;
  shape?: 'rectangle' | 'circle' | 'ellipse' | 'l-shape' | 't-shape' | 'polygon';
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  points?: {x: number, y: number}[];
  fill?: boolean;
  borderWidth?: number;
  borderColor?: string;
  homeId?: string; 
}

export interface HousingUnit {
    id: string;       
    name: string;     
    capacity: number; 
    cost: number;     
    type: 'public_housing' | 'apartment' | 'villa'; 
    area: { x: number, y: number, w: number, h: number }; 
    // Add optional max bounds for runtime calculation convenience
    maxX?: number;
    maxY?: number;
}

export interface PlotTemplate {
    id: string;
    width: number;
    height: number;
    type: 'residential' | 'commercial' | 'public' | 'work';
    rooms: any[]; 
    furniture: Furniture[];
    housingUnits?: HousingUnit[];
}

export interface WorldPlot {
    id: string;
    templateId: string;
    x: number;
    y: number;
}

// [修改] 增强的编辑器状态接口
export interface EditorState {
    mode: 'none' | 'plot' | 'furniture';
    selectedPlotId: string | null;
    selectedFurnitureId: string | null;
    
    // 拖拽状态
    isDragging: boolean;
    dragOffset: { x: number, y: number };
    
    // 新增放置状态
    placingTemplateId: string | null; // 正在放置的地皮模板ID
    placingFurniture: Partial<Furniture> | null; // 正在放置的家具数据
    
    // 预览坐标 (用于 Canvas 渲染预览框)
    previewPos: { x: number, y: number } | null;
}

export interface RoomDef {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    color: string;
    pixelPattern?: string;
    imagePath?: string;
    homeId?: string;
}

export interface Needs {
  hunger: number;
  energy: number;
  fun: number;
  social: number;
  bladder: number;
  hygiene: number;
  comfort?: number;
  [key: string]: number | undefined;
}

export interface Skills {
  cooking: number;
  athletics: number;
  music: number;
  dancing: number;
  logic: number;
  creativity: number;
  gardening: number;
  fishing: number;
  [key: string]: number;
}

export interface Zodiac {
  name: string;
  element: string;
  icon: string;
}

export interface Relationship {
  friendship: number;
  romance: number;
  isLover: boolean;
  isSpouse: boolean; 
  hasRomance: boolean;
  kinship?: 'parent' | 'child' | 'sibling' | 'spouse' | 'none';
}

export interface Job {
  id: string;
  title: string;
  level: number;
  salary: number;
  startHour: number;
  endHour: number;
  vacationMonths?: number[]; 
  companyType?: string; 
}

export interface Buff {
  id: string;
  label: string;
  type: 'good' | 'bad' | 'neutral';
  duration: number;
  source: string;
}

export interface SimAppearance {
    face: string;
    hair: string;
    clothes: string;
    pants: string;
}

export interface Memory {
    id: string;
    time: string; 
    type: 'job' | 'social' | 'life' | 'achievement' | 'bad' | 'diary' | 'family'; 
    text: string;
    relatedSimId?: string; 
}

export type AgeStage = 'Infant' | 'Toddler' | 'Child' | 'Teen' | 'Adult' | 'MiddleAged' | 'Elder';

export interface SimData {
  id: string;
  familyId: string; 
  homeId: string | null;
  name: string;
  surname: string; 
  pos: Vector2;
  gender: 'M' | 'F';
  height: number;         
  weight: number;         
  appearanceScore: number;
  luck: number;         
  constitution: number; 
  eq: number;           
  iq: number;           
  reputation: number;   
  morality: number;     
  creativity: number;   
  skinColor: string;
  hairColor: string;
  clothesColor: string;
  pantsColor: string; 
  appearance: SimAppearance;
  mbti: string;
  zodiac: Zodiac;
  
  age: number;
  ageStage: AgeStage; 
  health: number; 
  
  partnerId: string | null;
  fatherId: string | null;
  motherId: string | null;
  childrenIds: string[];

  isPregnant: boolean;
  pregnancyTimer: number; 
  partnerForBabyId: string | null; 

  lifeGoal: string;
  orientation: string;
  faithfulness: number;
  needs: Needs;
  skills: Skills;
  relationships: Record<string, Relationship>;
  
  money: number;
  dailyBudget: number;
  workPerformance: number;
  job: Job;
  dailyExpense: number;
  dailyIncome: number; 
  isSideHustle?: boolean;
  
  buffs: Buff[];
  mood: number;

  memories: Memory[];

  action: string;
  bubble?: { text: string | null; type: string; timer: number };
  target?: Vector2 | null;
  interactionTarget?: any;

  schoolPerformance?: number; 
}

export interface LogEntry {
  id: number;
  time: string;
  text: string;
  type: 'normal' | 'sys' | 'act' | 'chat' | 'love' | 'bad' | 'jealous' | 'rel_event' | 'money' | 'family';
  // [修改] 更新后的分类
  category: 'sys' | 'chat' | 'rel' | 'life';
  isAI: boolean;
  simName?: string;
}

export interface GameTime {
  totalDays: number; 
  year: number;      
  month: number;     
  hour: number;
  minute: number;
  speed: number;
}