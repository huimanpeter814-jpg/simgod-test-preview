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
  dir: string;
  multiUser: boolean;
  gender: string;
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
  isSpouse: boolean; // [新增] 是否为配偶
  hasRomance: boolean;
  kinship?: 'parent' | 'child' | 'sibling' | 'spouse' | 'none'; // [新增] 亲属关系
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
    type: 'job' | 'social' | 'life' | 'achievement' | 'bad' | 'diary' | 'family'; // [新增] family 类型
    text: string;
    relatedSimId?: string; 
}

// [新增] 年龄阶段枚举
export type AgeStage = 'Infant' | 'Toddler' | 'Child' | 'Teen' | 'Adult' | 'MiddleAged' | 'Elder';

export interface SimData {
  id: string;
  familyId: string; // [新增] 家庭ID
  name: string;
  surname: string; // [新增] 单独存储姓氏以便子女继承
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
  appearance: SimAppearance;
  mbti: string;
  zodiac: Zodiac;
  
  age: number;
  ageStage: AgeStage; // [修改] 使用枚举
  health: number; // [新增] 健康值 0-100
  
  // [新增] 家族树相关ID
  partnerId: string | null;
  fatherId: string | null;
  motherId: string | null;
  childrenIds: string[];

  // [新增] 怀孕相关
  isPregnant: boolean;
  pregnancyTimer: number; // 倒计时
  partnerForBabyId: string | null; // 孩子父亲/另一个母亲的ID

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
}

export interface LogEntry {
  id: number;
  time: string;
  text: string;
  type: 'normal' | 'sys' | 'act' | 'chat' | 'love' | 'bad' | 'jealous' | 'rel_event' | 'money' | 'family';
  category: 'sys' | 'chat' | 'rel';
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