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
  hasRomance: boolean;
}

export interface Job {
  id: string;
  title: string;
  level: number;
  salary: number;
  startHour: number;
  endHour: number;
  workDays: number[]; 
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

// [新增] 记忆接口
export interface Memory {
    id: string;
    time: string; // 记录发生的时间字符串
    type: 'job' | 'social' | 'life' | 'achievement' | 'bad';
    text: string;
    relatedSimId?: string; // 如果是社交事件，记录对方ID
}

export interface SimData {
  id: string;
  name: string;
  pos: Vector2;
  gender: 'M' | 'F';
  skinColor: string;
  hairColor: string;
  clothesColor: string;
  appearance: SimAppearance;
  mbti: string;
  zodiac: Zodiac;
  age: number;
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

  // [新增] 市民的记忆列表
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
  type: 'normal' | 'sys' | 'act' | 'chat' | 'love' | 'bad' | 'jealous' | 'rel_event' | 'money';
  category: 'sys' | 'chat' | 'rel';
  isAI: boolean;
  simName?: string;
}

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  speed: number;
  weekday: number;
  month: number;
  date: number;
}