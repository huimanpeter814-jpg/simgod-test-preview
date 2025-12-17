export interface Vector2 {
  x: number;
  y: number;
}

// 1. 定义核心 Enums 以替换 Magic Strings
export enum SimAction {
    Idle = 'idle',
    Working = 'working',
    Sleeping = 'sleeping',
    Eating = 'eating',
    Talking = 'talking',
    Using = 'using',
    Moving = 'moving',
    Wandering = 'wandering',
    Commuting = 'commuting',
    CommutingSchool = 'commuting_school', // 上学通勤
    Schooling = 'schooling',              // 在校学习
    WatchingMovie = 'watching_movie',
    Phone = 'phone',
    PlayingHome = 'playing_home',
    Following = 'following',
    MovingHome = 'moving_home',
    EatingOut = 'eat_out'
}

export enum JobType {
    Unemployed = 'unemployed',
    Internet = 'internet',
    Design = 'design',
    Business = 'business',
    Store = 'store',
    Restaurant = 'restaurant',
    Library = 'library',
    School = 'school',
    Nightlife = 'nightlife'
}

export enum NeedType {
    Hunger = 'hunger',
    Energy = 'energy',
    Fun = 'fun',
    Social = 'social',
    Bladder = 'bladder',
    Hygiene = 'hygiene',
    Comfort = 'comfort'
}

export enum AgeStage {
    Infant = 'Infant',
    Toddler = 'Toddler',
    Child = 'Child',
    Teen = 'Teen',
    Adult = 'Adult',
    MiddleAged = 'MiddleAged',
    Elder = 'Elder'
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
    width?: number; 
    height?: number;
    customName?: string;  
    customColor?: string; 
    customType?: string;  
}

export interface EditorState {
  mode: 'none' | 'plot' | 'furniture' | 'floor'; 
  selectedPlotId: string | null;
  selectedFurnitureId: string | null;
  selectedRoomId: string | null;
  
  isDragging: boolean;
  dragOffset: { x: number, y: number };
  
  placingTemplateId: string | null;
  placingFurniture: Partial<Furniture> | null;
  
  drawingPlot: {
      startX: number;
      startY: number;
      currX: number;
      currY: number;
      templateId: string;
  } | null;

  drawingFloor: {
      startX: number;
      startY: number;
      currX: number;
      currY: number;
      pattern: string;
      color: string;
      label: string;
      hasWall: boolean; 
  } | null;

  previewPos: { x: number, y: number } | null;
}

export interface EditorAction {
    type: 'add' | 'remove' | 'move' | 'modify';
    entityType: 'plot' | 'furniture' | 'room';
    id: string;
    prevData?: any; 
    newData?: any;  
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
  isCustom?: boolean;
  hasWall?: boolean; 
}

// Update Needs to use dynamic keys but generally match NeedType
export type Needs = {
  [key in NeedType]: number;
} & { [key: string]: number | undefined };

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
  companyType?: JobType | string; // Use Enum
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
  ageStage: AgeStage; // Use Enum
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

  action: SimAction | string; // Use Enum
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

export interface SaveMetadata {
    slot: number;
    timestamp: number;
    timeLabel: string;
    pop: number;
    realTime: string;
}