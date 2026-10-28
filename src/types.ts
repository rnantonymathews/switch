// TypeScript Interfaces for SWITCH Fitness Application

export interface Profile {
  username: string;
  avatarEmoji: string;
  weight: number;
  goalWeight: number;
  height: number;
  age: number;
  gender?: 'male' | 'female' | 'unspecified';
  goalType: string; // 'fatLoss' | 'recomp' | 'muscleGain' | string
  deadlineMonths: number;
  onboardingCompleted?: boolean;
  notificationPreferences?: {
    hydrationAlerts: boolean;
    workoutAlerts: boolean;
    macroAlerts: boolean;
    soundEnabled: boolean;
  };
  createdAt: number;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id?: string;
  name: string;
  primaryMuscle?: string;
  rpe?: number;
  sets?: WorkoutSet[];
  bestWeight?: number;
  bestReps?: number;
  setsCount?: number;
  bestSetLabel?: string;
}

export interface WorkoutSession {
  id?: string;
  sessionName: string;
  exercises: (string | WorkoutExercise)[];
}

export interface WorkoutSplit {
  id: string;
  title: string;
  sessions: WorkoutSession[];
}

export interface WorkoutDraft {
  id: string;
  splitId: string;
  splitTitle: string;
  sessionName: string;
  dateKey: string;
  startedAt: number;
  lastActiveTimestamp: number;
  isPaused: boolean;
  pausedAt: number | null;
  restEndTime: number | null;
  waterMl: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutLog {
  id: string;
  dateKey: string;
  startedAt: number;
  endedAt: number;
  sessionName: string;
  exercises: WorkoutExercise[];
  totalVolumeKg: number;
  kcalBurned: number;
  avgRpe: number;
  musclesWorked?: Record<string, boolean>;
}

export interface CardioLog {
  id: string;
  dateKey: string;
  timestamp: number;
  cardioId: string;
  name: string;
  durationMins: number;
  distanceKm: number;
  resistance: number;
  kcalBurned: number;
  approxSteps: number;
}

export interface SportsLog {
  id: string;
  dateKey: string;
  timestamp: number;
  sportId: string;
  name: string;
  durationMins: number;
  rpe: number;
  kcalBurned: number;
  fatigueScore: number;
}

export interface BodyLog {
  id: string;
  dateKey: string;
  timestamp: number;
  weight: number;
  waist?: number;
  belly?: number;
  chest?: number;
  wrist?: number;
}

export interface FoodNutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  source?: string;
}

export interface FoodDatabaseItem {
  id: string;
  name: string;
  keywords: string[];
  per100g: FoodNutrition;
  pieceWeightG?: number;
  source: string;
}

export interface CustomFood extends FoodDatabaseItem {
  createdAt?: number;
}

export interface ParsedFoodRow {
  id: string;
  name: string;
  qty: number;
  unit: string;
  customKcal?: string | number;
  customProtein?: string | number;
  customCarbs?: string | number;
  customFats?: string | number;
  customFiber?: string | number;
  customSugar?: string | number;
  customSodium?: string | number;
  saveToMyFoods?: boolean;
  customPieceWeight?: string | number;
}

export interface FoodLog extends FoodNutrition {
  id: string;
  dateKey: string;
  timestamp: number;
  name: string;
  dishName?: string;
  meal?: string;
}

export interface BeverageLog {
  id: string;
  dateKey: string;
  timestamp: number;
  bevId: string;
  name: string;
  ml: number;
  kcal: number;
}

export interface EncryptedPayload {
  v: 1;
  salt: string; // base64
  iv: string;   // base64
  ct: string;   // base64 ciphertext
}

export interface NoteClip {
  id: string;
  durationSec: number;
  createdAt: number;
  audioDataUrl?: string; // stored in subcollection, omitted on parent doc
}

export interface Note {
  id: string;
  title: string;
  category: string;
  isPinned: boolean;
  isLocked: boolean;
  updatedAt: number;
  createdAt: number;
  body?: string; // present only when decrypted in memory
  checklist?: { id: string; text: string; done: boolean }[];
  tags?: string[];
  clipIds?: string[];
  clips?: NoteClip[];
  enc?: EncryptedPayload;
  pinCode?: string; // legacy only, cleared on migration
}

export interface Reminder {
  id: string;
  timeStr: string;
  title: string;
  notes?: string;
  enabled: boolean;
  days: string[];
  category: string;
  snoozedUntilMs?: number;
  lastTriggeredDate?: string;
  createdAt: number;
}

export interface ZestMember {
  uid: string;
  username: string;
  avatarEmoji: string;
  fairZestScore: number;
  sevenDayZestScore?: number;
  todayVolumeKg: number;
  todayAvgRpe?: number;
  todayKcalBurn: number;
  pureFoodMacroPct: number;
  pureFoodProteinG?: number;
  waterMl: number;
  waterTargetMl?: number;
  waterPct: number;
  beveragesCount?: number;
  prDisplay?: string;
  pbDisplay?: string;
  sevenDayVolumeKg?: number;
  sevenDayKcalBurn?: number;
  updatedAt: number;
  // Private to user's device, not published in public member doc:
  weight?: number;
  age?: number;
}

export interface ZestGroup {
  code: string;
  name?: string;
  title?: string;
  ownerUid: string;
  createdBy?: string;
  createdAt: number;
  members?: ZestMember[];
}

export interface ZestBubble {
  id: string;
  zestCode?: string;
  senderUid?: string;
  fromUid: string;
  fromUsername: string;
  fromEmoji: string;
  toUid?: string;
  toUsername?: string;
  message: string;
  replies?: string[];
  timestamp: number;
}

export interface StudyChapter {
  id: string;
  serialNo: number;
  title: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  completedAt?: number | null;
}

export interface ActivityScheduleItem {
  id: string;
  dayName: string;
  activity: string;
  fromTime: string;
  toTime: string;
  startMinutes?: number;
  endMinutes?: number;
  status?: 'completed' | 'current' | 'remaining';
  fillPct?: number;
}
