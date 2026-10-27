import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  addDoc
} from 'firebase/firestore';
import {
  Dumbbell,
  Flame,
  Trophy,
  User,
  Lock,
  ArrowLeftRight,
  Timer,
  Droplets,
  Plus,
  Trash2,
  Check,
  X,
  Edit3,
  FileSpreadsheet,
  Upload,
  Sparkles,
  Send,
  ShieldAlert,
  Activity,
  Utensils,
  ShoppingBag,
  Copy,
  Calculator,
  Wine,
  Coffee,
  Play,
  Settings,
  Bell,
  FileText,
  ChevronDown,
  ChevronRight,
  Mic,
  Square,
  Volume2,
  KeyRound,
  ArrowLeft,
  CalendarClock,
  BookOpen,
  GraduationCap,
  SkipForward,
  RotateCcw
} from 'lucide-react';

// ==========================================
// 1. SAFE FIREBASE INITIALIZATION
// ==========================================
const appId = typeof __app_id !== 'undefined' ? __app_id : 'switch-fitness-app';
let db = null;
let auth = null;

try {
  const rawConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
  if (rawConfig) {
    const firebaseConfig = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
    if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      db = getFirestore(app);
      auth = getAuth(app);
    }
  }
} catch (err) {
  console.warn('Firebase fallback to in-memory mode:', err);
}

// ==========================================
// 2. CONSTANTS, CATALOGS & SOUND ENGINE
// ==========================================
const AVATAR_EMOJIS = ['🦍', '⚡', '🔥', '🦈', '🦁', '🤖', '🥷', '🦖', '🏋️', '🥊', '🦅', '🐺', '🦊', '🐉', '👑', '🚀'];
const ANONYMOUS_ADJECTIVES = ['Iron', 'Volt', 'Alpha', 'Titan', 'Apex', 'Shadow', 'Storm', 'Beast'];
const ANONYMOUS_NOUNS = ['Wolf', 'Ninja', 'Grip', 'Lifter', 'Puma', 'Viper', 'Tank', 'Savage'];

const PRESET_HYPE_BUBBLES = [
  'Lezzz gooo @username!! 🔥',
  'Look at @username burning kcals like a furnace!! 🚒',
  '@username woke up and chose violence in the gym today 🦍',
  'Someone check on @username, lifting heavy-heavy today! 🏋️‍♂️',
  '@username where you at?! The Zest leaderboard is waiting 👀',
  'Respect the grind @username! Consistency king/queen 👑',
  'Catch me if you can @username 🏃‍♂️💨',
  'Hydration check @username! Drink your water 💧'
];

const CARDIO_TYPES = [
  { id: 'treadmill_walk', name: 'Treadmill Incline Walk', baseMet: 4.8, stepsPerMin: 105 },
  { id: 'outdoor_run', name: 'Outdoor Running', baseMet: 9.2, stepsPerMin: 162 },
  { id: 'stair_climber', name: 'Steps Cardio Machine', baseMet: 8.8, stepsPerMin: 95 },
  { id: 'stationary_bike', name: 'Stationary Cycling', baseMet: 6.8, stepsPerMin: 0 },
  { id: 'rowing', name: 'Rowing Ergometer', baseMet: 7.5, stepsPerMin: 0 },
  { id: 'elliptical', name: 'Cross Trainer / Elliptical', baseMet: 5.5, stepsPerMin: 120 }
];

const SPORTS_TYPES = [
  { id: 'badminton', name: 'Badminton', baseMet: 6.5 },
  { id: 'football', name: 'Football / Soccer', baseMet: 8.5 },
  { id: 'basketball', name: 'Basketball', baseMet: 8.0 },
  { id: 'cricket', name: 'Cricket', baseMet: 5.2 },
  { id: 'pickleball', name: 'Pickleball / Tennis', baseMet: 6.8 },
  { id: 'swimming', name: 'Swimming Laps', baseMet: 8.2 },
  { id: 'boxing', name: 'Boxing / MMA Sparring', baseMet: 9.5 }
];

const BEVERAGE_CATALOG = [
  { id: 'tea', name: 'Masala / Milk Tea', color: '#b45309', textColor: '#fef3c7', kcalPer100ml: 42, sugarPer100ml: 5, defaultMl: 150 },
  { id: 'black_coffee', name: 'Black Coffee / Espresso', color: '#1c1917', textColor: '#e7e5e4', kcalPer100ml: 2, sugarPer100ml: 0, defaultMl: 150 },
  { id: 'iced_latte', name: 'Cold Coffee / Latte', color: '#78350f', textColor: '#fde68a', kcalPer100ml: 58, sugarPer100ml: 6, defaultMl: 250 },
  { id: 'tequila', name: 'Tequila Shot', color: '#e2e8f0', textColor: '#0f172a', kcalPer100ml: 231, sugarPer100ml: 0, defaultMl: 30 },
  { id: 'vodka', name: 'Vodka', color: '#cbd5e1', textColor: '#0f172a', kcalPer100ml: 231, sugarPer100ml: 0, defaultMl: 30 },
  { id: 'whiskey', name: 'Whiskey / Bourbon', color: '#d97706', textColor: '#0f172a', kcalPer100ml: 250, sugarPer100ml: 0, defaultMl: 45 },
  { id: 'beer', name: 'Beer Pint', color: '#f59e0b', textColor: '#0f172a', kcalPer100ml: 43, sugarPer100ml: 1, defaultMl: 330 },
  { id: 'wine', name: 'Red Wine', color: '#881337', textColor: '#ffe4e6', kcalPer100ml: 85, sugarPer100ml: 0.8, defaultMl: 150 },
  { id: 'cola', name: 'Soda / Soft Drink', color: '#ea580c', textColor: '#fff7ed', kcalPer100ml: 42, sugarPer100ml: 10.6, defaultMl: 250 }
];

const OFFLINE_FOOD_DB = [
  { keywords: ['chicken curry'], per100g: { kcal: 145, protein: 16, carbs: 4.5, fats: 7, fiber: 0.8, sugar: 1.2, sodium: 320 } },
  { keywords: ['chicken breast', 'grilled chicken', 'chicken'], per100g: { kcal: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, sugar: 0, sodium: 74 } },
  { keywords: ['chapatti', 'roti', 'phulka'], perPiece: { weightG: 40, kcal: 104, protein: 3.1, carbs: 20, fats: 1.2, fiber: 2.5, sugar: 0.4, sodium: 90 } },
  { keywords: ['eggs whole', 'whole egg', 'egg', 'boiled egg'], perPiece: { weightG: 50, kcal: 72, protein: 6.3, carbs: 0.4, fats: 4.8, fiber: 0, sugar: 0.2, sodium: 71 } },
  { keywords: ['egg white', 'egg whites'], perPiece: { weightG: 33, kcal: 17, protein: 3.6, carbs: 0.2, fats: 0.1, fiber: 0, sugar: 0.2, sodium: 55 } },
  { keywords: ['milk boiled', 'milk', 'toned milk'], per100g: { kcal: 62, protein: 3.3, carbs: 4.8, fats: 3.2, fiber: 0, sugar: 4.8, sodium: 44 } },
  { keywords: ['rice', 'white rice', 'steamed rice', 'brown rice'], per100g: { kcal: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.6, sugar: 0.1, sodium: 5 } },
  { keywords: ['paneer', 'cottage cheese'], per100g: { kcal: 265, protein: 18.3, carbs: 3.4, fats: 20.8, fiber: 0, sugar: 1, sodium: 22 } },
  { keywords: ['dal', 'lentils', 'toor dal'], per100g: { kcal: 116, protein: 7.6, carbs: 20, fats: 0.8, fiber: 4.2, sugar: 1, sodium: 180 } },
  { keywords: ['whey', 'whey protein', 'protein scoop'], perPiece: { weightG: 32, kcal: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0, sugar: 1, sodium: 95 } },
  { keywords: ['oats', 'oatmeal'], per100g: { kcal: 389, protein: 16.9, carbs: 66, fats: 6.9, fiber: 10.6, sugar: 1, sodium: 2 } },
  { keywords: ['banana'], perPiece: { weightG: 118, kcal: 105, protein: 1.3, carbs: 27, fats: 0.4, fiber: 3.1, sugar: 14, sodium: 1 } },
  { keywords: ['veggies', 'mixed veggies', 'broccoli', 'salad'], per100g: { kcal: 45, protein: 2.6, carbs: 8, fats: 0.4, fiber: 3.2, sugar: 2.1, sodium: 35 } }
];

// Weekday (3 Hours = 180m) & Weekend (5 Hours = 300m) Study Protocols
const STUDY_PROTOCOLS = {
  weekday: {
    id: 'weekday',
    name: 'Weekday 3-Hour Plan',
    totalMins: 180,
    blocks: [
      { id: 'wd-1', type: 'study', label: 'Study Block 1', durationMins: 45 },
      { id: 'wd-2', type: 'break', label: 'Short Break 1', durationMins: 15 },
      { id: 'wd-3', type: 'study', label: 'Study Block 2', durationMins: 45 },
      { id: 'wd-4', type: 'break', label: 'Short Break 2', durationMins: 15 },
      { id: 'wd-5', type: 'study', label: 'Final Study Hour', durationMins: 60 }
    ]
  },
  weekend: {
    id: 'weekend',
    name: 'Weekend 5-Hour Plan',
    totalMins: 300,
    blocks: [
      { id: 'we-1', type: 'study', label: 'Study Block 1', durationMins: 45 },
      { id: 'we-2', type: 'break', label: 'Short Break 1', durationMins: 15 },
      { id: 'we-3', type: 'study', label: 'Study Block 2', durationMins: 45 },
      { id: 'we-4', type: 'break', label: 'Short Break 2', durationMins: 15 },
      { id: 'we-5', type: 'study', label: 'Study Block 3', durationMins: 45 },
      { id: 'we-6', type: 'break', label: 'Half-Hour Break', durationMins: 30 },
      { id: 'we-7', type: 'study', label: 'Study Block 4', durationMins: 45 },
      { id: 'we-8', type: 'break', label: 'Short Break 4', durationMins: 15 },
      { id: 'we-9', type: 'study', label: 'Final Half-Hour Sprint', durationMins: 30 }
    ]
  }
};

// Web Audio Synthesizer for 3-2-1 Beep + 0s Ting-Ting-Ting-Ting
const soundEngine = {
  ctx: null,
  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      // Ignore audio errors
    }
  },
  playBeep() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  },
  playTing4x() {
    try {
      this.init();
      if (!this.ctx) return;
      [0, 0.16, 0.32, 0.48].forEach((offset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1480, this.ctx.currentTime + offset);
        gain.gain.setValueAtTime(0.22, this.ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + offset + 0.13);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + offset);
        osc.stop(this.ctx.currentTime + offset + 0.14);
      });
    } catch (e) {}
  }
};

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================
function generateRandomUsername() {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const noun = ANONYMOUS_NOUNS[Math.floor(Math.random() * ANONYMOUS_NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}${noun}_${num}`;
}

function getLocalDateKey(dateObj = new Date()) {
  const yr = dateObj.getFullYear();
  const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
  const da = String(dateObj.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

function getLast14DaysChain() {
  const chain = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    chain.push({
      key: getLocalDateKey(d),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate()
    });
  }
  return chain;
}

function inferMusclesFromText(exName = '', sessionName = '') {
  const combined = `${exName} ${sessionName}`.toLowerCase();
  const hits = [];
  if (/bench|chest|pushup|fly|dip|incline|pec/.test(combined)) hits.push('Chest');
  if (/shoulder|ohp|overhead|lateral|delt|military/.test(combined)) hits.push('Shoulders');
  if (/back|pull|row|lat|deadlift|chin/.test(combined)) hits.push('Back');
  if (/squat|quad|leg press|lunge|extension/.test(combined)) hits.push('Quads');
  if (/rdl|hamstring|leg curl|hinge/.test(combined)) hits.push('Hamstrings');
  if (/glute|hip thrust|squat|lunge/.test(combined)) hits.push('Glutes');
  if (/core|plank|ab|crunch/.test(combined)) hits.push('Core');
  return hits.length > 0 ? hits : ['Chest'];
}

function calculateFairZestScore(stats = {}) {
  const bw = Math.max(40, Number(stats.weight) || 70);
  const vol = Number(stats.todayVolumeKg) || 0;
  const rpe = Number(stats.todayAvgRpe) || 7.5;
  const kcal = Number(stats.todayKcalBurn) || 0;
  const macroHitPct = Number(stats.pureFoodMacroPct) || 0;
  const waterHitPct = Number(stats.waterPct) || 0;

  const relativeVolRatio = (vol / bw) * (rpe / 7.5);
  const strengthPts = Math.min(45, Math.round(relativeVolRatio * 0.45));

  const targetBurn = bw * 10;
  const burnPts = Math.min(25, Math.round((kcal / Math.max(250, targetBurn)) * 25));

  const macroPts = macroHitPct >= 90 ? 15 : Math.round((macroHitPct / 90) * 15);
  const waterPts = waterHitPct >= 95 ? 15 : Math.round((waterHitPct / 95) * 15);

  return {
    totalScore: strengthPts + burnPts + macroPts + waterPts,
    strengthPts,
    burnPts,
    macroPts,
    waterPts
  };
}

function buildSmartRepliesForBubble(senderHandle, messageText = '') {
  const isRoastOrNudge = /000|rest day|where you at|liquid layers|scared|drink your water/i.test(messageText);
  if (isRoastOrNudge) {
    return [
      `Rest day today, coming for the #1 spot tomorrow 😤`,
      `Check the leaderboard again in 2 hours ⏳🔥`,
      `Talk is cheap @${senderHandle}, let's see your kgs today! 🏋️‍♂️`
    ];
  }
  return [
    `Light weight baby!! 💪🔥`,
    `Just getting started! Watch tomorrow's log 🚀`,
    `Appreciate it @${senderHandle}! Your turn now 🤝`
  ];
}

function parseFoodTextToRows(rawString = '') {
  if (!rawString.trim()) return [];
  return rawString
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((chunk, idx) => {
      const dashParts = chunk.split('-').map((s) => s.trim());
      const name = dashParts[0] || 'Food Item';
      const qtyRaw = dashParts[1] || '100g';
      const numMatch = qtyRaw.match(/(\d+(\.\d+)?)/);
      const qty = numMatch ? Number(numMatch[1]) : 100;
      const unit = /piece|pcs|slice|scoop|egg|roti/i.test(qtyRaw)
        ? 'pieces'
        : /ml/i.test(qtyRaw)
        ? 'ml'
        : 'g';
      return { id: `row-${Date.now()}-${idx}`, name, qty, unit };
    });
}

function estimateMacrosLocally(name = '', qty = 100, unit = 'g') {
  const lower = name.toLowerCase();
  const match = OFFLINE_FOOD_DB.find((item) => item.keywords.some((k) => lower.includes(k)));
  if (match) {
    if (match.perPiece && unit === 'pieces') {
      const mult = Math.max(0.25, Number(qty) || 1);
      return {
        kcal: Math.round(match.perPiece.kcal * mult),
        protein: Number((match.perPiece.protein * mult).toFixed(1)),
        carbs: Number((match.perPiece.carbs * mult).toFixed(1)),
        fats: Number((match.perPiece.fats * mult).toFixed(1)),
        fiber: Number((match.perPiece.fiber * mult).toFixed(1)),
        sugar: Number((match.perPiece.sugar * mult).toFixed(1)),
        sodium: Math.round(match.perPiece.sodium * mult)
      };
    }
    const base = match.per100g || {
      kcal: (match.perPiece.kcal / match.perPiece.weightG) * 100,
      protein: (match.perPiece.protein / match.perPiece.weightG) * 100,
      carbs: (match.perPiece.carbs / match.perPiece.weightG) * 100,
      fats: (match.perPiece.fats / match.perPiece.weightG) * 100,
      fiber: 1,
      sugar: 1,
      sodium: 100
    };
    const grams = unit === 'pieces' ? Number(qty) * 55 : Number(qty) || 100;
    const ratio = grams / 100;
    return {
      kcal: Math.round(base.kcal * ratio),
      protein: Number((base.protein * ratio).toFixed(1)),
      carbs: Number((base.carbs * ratio).toFixed(1)),
      fats: Number((base.fats * ratio).toFixed(1)),
      fiber: Number(((base.fiber || 0) * ratio).toFixed(1)),
      sugar: Number(((base.sugar || 0) * ratio).toFixed(1)),
      sodium: Math.round((base.sodium || 80) * ratio)
    };
  }
  return null;
}

// Activity Pill Helpers (Time & Schedule Parser)
const DAY_ALIASES = {
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
  sat: 'Saturday',
  saturday: 'Saturday',
  sun: 'Sunday',
  sunday: 'Sunday',
  daily: 'Daily',
  everyday: 'Daily',
  today: 'Daily'
};

function getTodayWeekdayName(dateObj = new Date()) {
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
}

function parseClockToMinutes(rawStr = '') {
  const clean = rawStr.trim().toLowerCase();
  if (!clean) return null;
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');
  const stripped = clean.replace(/[ap]m/g, '').trim();

  let hours = 0;
  let mins = 0;

  if (stripped.includes(':')) {
    const parts = stripped.split(':');
    hours = parseInt(parts[0], 10);
    mins = parseInt(parts[1] || '0', 10);
  } else if (/^\d{3,4}$/.test(stripped)) {
    const padded = stripped.padStart(4, '0');
    hours = parseInt(padded.slice(0, 2), 10);
    mins = parseInt(padded.slice(2, 4), 10);
  } else if (/^\d{1,2}$/.test(stripped)) {
    hours = parseInt(stripped, 10);
    mins = 0;
  } else {
    return null;
  }

  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return Math.max(0, Math.min(1439, hours * 60 + mins));
}

function formatMinutesToHHMM(totalMins = 0) {
  const clamped = Math.max(0, Math.min(1439, Math.round(totalMins)));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function parseTypeFormatToActivities(text = '') {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let currentDay = getTodayWeekdayName();
  const parsed = [];

  lines.forEach((line, idx) => {
    const cleanLine = line.replace(/^\[|\]$/g, '').trim();
    if (!cleanLine) return;

    const lowerDay = DAY_ALIASES[cleanLine.toLowerCase()];
    if (lowerDay && !cleanLine.includes('-')) {
      currentDay = lowerDay;
      return;
    }

    const dashIdx = cleanLine.lastIndexOf('-');
    if (dashIdx > 0) {
      const activityName = cleanLine.slice(0, dashIdx).trim();
      const timeRangePart = cleanLine.slice(dashIdx + 1).trim();

      let fromStr = '';
      let toStr = '';

      const colonParts = timeRangePart.split(/\s+:\s+|\s+to\s+|\s*-\s*/i);
      if (colonParts.length >= 2) {
        fromStr = colonParts[0].trim();
        toStr = colonParts[1].trim();
      } else {
        const allColons = timeRangePart.split(':').map((s) => s.trim());
        if (allColons.length === 4) {
          fromStr = `${allColons[0]}:${allColons[1]}`;
          toStr = `${allColons[2]}:${allColons[3]}`;
        } else if (allColons.length === 2) {
          fromStr = allColons[0];
          toStr = allColons[1];
        }
      }

      const startMins = parseClockToMinutes(fromStr);
      const endMins = parseClockToMinutes(toStr);

      if (activityName && startMins !== null && endMins !== null && endMins > startMins) {
        parsed.push({
          id: `act-${idx}-${startMins}`,
          day: currentDay,
          activity: activityName,
          fromTime: formatMinutesToHHMM(startMins),
          toTime: formatMinutesToHHMM(endMins),
          startMins,
          endMins
        });
      }
    }
  });

  return parsed;
}

function serializeActivitiesToTypeFormat(activities = []) {
  if (!activities || activities.length === 0) return '';
  const byDay = {};
  activities.forEach((a) => {
    const d = a.day || 'Daily';
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(a);
  });

  const blocks = [];
  Object.keys(byDay).forEach((dayName) => {
    blocks.push(`[${dayName}]`);
    byDay[dayName].forEach((act) => {
      blocks.push(`[${act.activity} - ${act.fromTime} : ${act.toTime}]`);
    });
    blocks.push('');
  });

  return blocks.join('\n').trim();
}

function parseActivityCsvToActivities(rawCsv = '') {
  const chunks = rawCsv
    .split(/\r?\n|;/)
    .map((c) => c.trim())
    .filter(Boolean);
  const results = [];

  chunks.forEach((chunk, idx) => {
    const cols = chunk.split(',').map((c) => c.trim()).filter(Boolean);
    if (cols.length < 4) return;
    if (idx === 0 && cols[0].toLowerCase() === 'day') return;

    const rawDay = cols[0].replace(/^\[|\]$/g, '').trim();
    const day = DAY_ALIASES[rawDay.toLowerCase()] || rawDay || getTodayWeekdayName();
    const activity = cols[1].replace(/^\[|\]$/g, '').trim();
    const startMins = parseClockToMinutes(cols[2]);
    const endMins = parseClockToMinutes(cols[3]);

    if (activity && startMins !== null && endMins !== null && endMins > startMins) {
      results.push({
        id: `csv-act-${Date.now()}-${idx}`,
        day,
        activity,
        fromTime: formatMinutesToHHMM(startMins),
        toTime: formatMinutesToHHMM(endMins),
        startMins,
        endMins
      });
    }
  });

  return results;
}

// ==========================================
// 4. MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [bottomTab, setBottomTab] = useState('fitness'); // 'fitness' | 'macros' | 'rno' | 'study'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSectionTab, setProfileSectionTab] = useState('leaderboard'); // 'leaderboard' | 'settings'
  const [showRoutineChoiceModal, setShowRoutineChoiceModal] = useState(false);
  const [routineSubPage, setRoutineSubPage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showCard1aBack, setShowCard1aBack] = useState(false);
  const [showMathInspector, setShowMathInspector] = useState(false);

  const dateChain = useMemo(() => getLast14DaysChain(), []);
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey());

  // User Profile & Identity State
  const [profile, setProfile] = useState({
    username: generateRandomUsername(),
    avatarEmoji: '🦍',
    weight: 76,
    goalWeight: 70,
    height: 176,
    age: 26,
    goalType: 'recomp',
    deadlineMonths: 6,
    createdAt: Date.now()
  });

  // Workout Splits State (Card 1b)
  const [workoutSplits, setWorkoutSplits] = useState([
    {
      id: 'default-ppl',
      title: 'Push Pull Legs (PPL)',
      sessions: [
        {
          id: 'sess-push',
          sessionName: 'Push',
          exercises: [
            { name: 'Bench Press (Barbell)', primaryMuscle: 'Chest' },
            { name: 'Overhead Press (Dumbbell)', primaryMuscle: 'Shoulders' },
            { name: 'Tricep Rope Pushdown', primaryMuscle: 'Chest' }
          ]
        },
        {
          id: 'sess-pull',
          sessionName: 'Pull',
          exercises: [
            { name: 'Lat Pulldown (Cable)', primaryMuscle: 'Back' },
            { name: 'Barbell Row', primaryMuscle: 'Back' },
            { name: 'Barbell Bicep Curl', primaryMuscle: 'Back' }
          ]
        },
        {
          id: 'sess-legs',
          sessionName: 'Legs',
          exercises: [
            { name: 'Barbell Squat', primaryMuscle: 'Quads' },
            { name: 'Romanian Deadlift', primaryMuscle: 'Hamstrings' },
            { name: 'Hip Thrust', primaryMuscle: 'Glutes' }
          ]
        }
      ]
    }
  ]);
  const [activeSplitId, setActiveSplitId] = useState('default-ppl');
  const [scratchTitle, setScratchTitle] = useState('');
  const [scratchBlocks, setScratchBlocks] = useState([
    {
      id: 'blk-1',
      sessionName: 'Push',
      exercises: [
        { name: 'Bench Press', primaryMuscle: 'Chest' },
        { name: 'Incline DB Press', primaryMuscle: 'Chest' }
      ]
    }
  ]);
  const [csvError, setCsvError] = useState('');

  // Active Workout Logger State
  const [activeDraft, setActiveDraft] = useState(null);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [pauseMinutesLeft, setPauseMinutesLeft] = useState(30);

  // Logs Collections
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [cardioLogs, setCardioLogs] = useState([]);
  const [sportsLogs, setSportsLogs] = useState([]);
  const [bodyLogs, setBodyLogs] = useState([
    {
      id: 'init-b1',
      dateKey: getLocalDateKey(),
      timestamp: Date.now() - 86400000 * 2,
      weight: 76,
      chest: 100,
      waist: 84,
      belly: 86,
      wrist: 17
    }
  ]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [beverageLogs, setBeverageLogs] = useState([]);
  const [waterLogsByDate, setWaterLogsByDate] = useState({});

  // Card 1c Cardio Sliders
  const [selectedCardioId, setSelectedCardioId] = useState(CARDIO_TYPES[0].id);
  const [cardioDurationMins, setCardioDurationMins] = useState(30);
  const [cardioDistanceKm, setCardioDistanceKm] = useState(2.5);
  const [cardioResistance, setCardioResistance] = useState(6);

  // Card 1d Sports Sliders
  const [selectedSportId, setSelectedSportId] = useState(SPORTS_TYPES[0].id);
  const [sportDurationMins, setSportDurationMins] = useState(45);
  const [sportRpe, setSportRpe] = useState(8);

  // Card 1e Biometric Tracker State
  const [selectedTrackerMetric, setSelectedTrackerMetric] = useState('weight'); // 'weight' | 'waist' | 'belly' | 'chest' | 'wrist'
  const [trackerInput, setTrackerInput] = useState({ weight: '', chest: '', waist: '', belly: '', wrist: '' });

  // Tab 2 (Macros) State
  const [foodInputMode, setFoodInputMode] = useState('manual'); // 'manual' | 'csv'
  const [manualRawText, setManualRawText] = useState('chicken curry - 200g, chapatti - 2 pieces, eggs whole - 2 pieces');
  const [manualParsedRows, setManualParsedRows] = useState(() =>
    parseFoodTextToRows('chicken curry - 200g, chapatti - 2 pieces, eggs whole - 2 pieces')
  );
  const [isLoggingFood, setIsLoggingFood] = useState(false);
  const [mealCsvPlan, setMealCsvPlan] = useState([
    {
      id: 'dish-1',
      meal: 'Breakfast',
      dishName: 'Power Eggs & Toast',
      ingredientsText: 'Eggs Whole - 3 pieces, Chapatti - 2 pieces, Milk Boiled - 200ml',
      kcal: 548,
      protein: 31.7,
      carbs: 50.8,
      fats: 23.2,
      fiber: 5,
      sugar: 11,
      sodium: 480
    },
    {
      id: 'dish-2',
      meal: 'Lunch',
      dishName: 'Chicken Rice Bowl',
      ingredientsText: 'Chicken Breast - 200g, Rice - 100g, Veggies - 100g',
      kcal: 505,
      protein: 67.3,
      carbs: 36,
      fats: 7.9,
      fiber: 3.8,
      sugar: 2.2,
      sodium: 188
    },
    {
      id: 'dish-3',
      meal: 'Dinner',
      dishName: 'High-Protein Paneer & Roti',
      ingredientsText: 'Paneer - 150g, Chapatti - 2 pieces, Dal - 150g',
      kcal: 779,
      protein: 45,
      carbs: 75,
      fats: 34.8,
      fiber: 11.3,
      sugar: 3.8,
      sodium: 483
    }
  ]);
  const [expandedMealCategory, setExpandedMealCategory] = useState('Breakfast');
  const [mealCsvError, setMealCsvError] = useState('');

  // Card 5 Beverages State
  const [selectedBeverageId, setSelectedBeverageId] = useState(BEVERAGE_CATALOG[0].id);
  const [beverageMlInput, setBeverageMlInput] = useState(150);

  // Card 6 Grocery List State
  const [groceryRawText, setGroceryRawText] = useState('chicken breast, whole eggs, chapatti flour, toned milk, broccoli, paneer');
  const [groceryItems, setGroceryItems] = useState([
    'chicken breast',
    'whole eggs',
    'chapatti flour',
    'toned milk',
    'broccoli',
    'paneer'
  ]);

  // v4 Reminders & Notes (RNO) State
  const [rnoOpenSection, setRnoOpenSection] = useState('reminders'); // 'reminders' | 'notes'
  const [showRnoPlusPrompt, setShowRnoPlusPrompt] = useState(false);
  const [rnoActiveView, setRnoActiveView] = useState('list'); // 'list' | 'reminderForm' | 'noteForm'
  const [remindersList, setRemindersList] = useState([
    {
      id: 'rem-1',
      title: 'Take Creatine (5g) & Electrolytes',
      date: getLocalDateKey(),
      time: '08:30',
      isRepeating: true,
      repeatEvery: '1 DAY',
      customDays: ['M', 'T', 'W', 'H', 'F', 'S', 'U'],
      repeatUntil: 'INFINITE',
      repeatUntilCustomDate: '',
      preRemindMode: 'just_before',
      preRemindInterval: '15 mins'
    },
    {
      id: 'rem-2',
      title: 'Sunday Weekly Meal Prep & Weigh-In',
      date: getLocalDateKey(),
      time: '18:00',
      isRepeating: true,
      repeatEvery: 'CUSTOM',
      customDays: ['U'],
      repeatUntil: 'INFINITE',
      repeatUntilCustomDate: '',
      preRemindMode: 'every',
      preRemindInterval: '1 hour'
    }
  ]);
  const [notesList, setNotesList] = useState([
    {
      id: 'note-1',
      title: 'Progressive Overload Cues (Push Day)',
      body: 'Keep scapular retraction tight on flat bench. Pause 1 second at chest before driving up.',
      voiceClips: [],
      isLocked: false,
      pinCode: ''
    },
    {
      id: 'note-2',
      title: 'Private Supplement & Bloodwork Log',
      body: 'Vitamin D3 60k IU weekly + Magnesium Glycinate 400mg before sleep.',
      voiceClips: [],
      isLocked: true,
      pinCode: '123456'
    }
  ]);
  const [editingReminder, setEditingReminder] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [pinUnlockTargetNote, setPinUnlockTargetNote] = useState(null);
  const [pinUnlockInput, setPinUnlockInput] = useState('');
  const [pinUnlockError, setPinUnlockError] = useState('');
  const [isSttListening, setIsSttListening] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [mediaRecorderRefState, setMediaRecorderRefState] = useState(null);

  // v3 Competition Zests & Bubbles State
  const [publicZests, setPublicZests] = useState([]);
  const [activeZestCode, setActiveZestCode] = useState('');
  const [newZestTitleInput, setNewZestTitleInput] = useState('');
  const [joinZestCodeInput, setJoinZestCodeInput] = useState('');
  const [zestTimeframe, setZestTimeframe] = useState('today'); // 'today' | '7day'
  const [zestSortMetric, setZestSortMetric] = useState('fairScore'); // 'fairScore' | 'kgs' | 'kcal' | 'discipline'
  const [peekMemberUid, setPeekMemberUid] = useState(null);
  const [selectedBubbleTarget, setSelectedBubbleTarget] = useState(null);
  const [aiGeneratedBubbleText, setAiGeneratedBubbleText] = useState('');
  const [isGeneratingAiTaunt, setIsGeneratingAiTaunt] = useState(false);
  const [incomingBubblesQueue, setIncomingBubblesQueue] = useState([]);
  const [dismissedBubbleIds, setDismissedBubbleIds] = useState([]);

  // v5 Header Activity Pill State
  const [activitySchedule, setActivitySchedule] = useState([]);
  const [activityTypeText, setActivityTypeText] = useState('');
  const [showActivityPillModal, setShowActivityPillModal] = useState(false);
  const [activityModalTab, setActivityModalTab] = useState('timeline'); // 'timeline' | 'edit' | 'csv'
  const [activityCsvError, setActivityCsvError] = useState('');
  const [nowClockMs, setNowClockMs] = useState(Date.now());
  const [notifiedActivityIds, setNotifiedActivityIds] = useState([]);

  // v6 Study Hub State
  const [examTargetDate, setExamTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return getLocalDateKey(d);
  });
  const [studyChapters, setStudyChapters] = useState(() => {
    const todayStr = getLocalDateKey();
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 2);
    const tmrwStr = getLocalDateKey(tmrw);
    return [
      {
        id: 'ch-1',
        serialNo: '1',
        title: 'Foundations & Core Principles',
        startDate: todayStr,
        endDate: todayStr,
        completed: true,
        timeSpentMins: 90
      },
      {
        id: 'ch-2',
        serialNo: '2',
        title: 'Quantitative Problem Solving & Case Studies',
        startDate: todayStr,
        endDate: tmrwStr,
        completed: false,
        timeSpentMins: 45
      },
      {
        id: 'ch-3',
        serialNo: '3',
        title: 'Advanced Systems Architecture & Mock Review',
        startDate: todayStr,
        endDate: tmrwStr,
        completed: false,
        timeSpentMins: 0
      }
    ];
  });
  const [totalStudyMinutesLogged, setTotalStudyMinutesLogged] = useState(135);
  const [studyFilterMode, setStudyFilterMode] = useState('today'); // 'today' | 'all'
  const [studyCsvError, setStudyCsvError] = useState('');
  const [isStudyModeActive, setIsStudyModeActive] = useState(false);
  const [studyPlanKey, setStudyPlanKey] = useState(() => {
    const dayNum = new Date().getDay();
    return dayNum === 0 || dayNum === 6 ? 'weekend' : 'weekday';
  });
  const [studyBlockIndex, setStudyBlockIndex] = useState(0);
  const [studySecondsLeft, setStudySecondsLeft] = useState(45 * 60);
  const [isStudyTimerPaused, setIsStudyTimerPaused] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isProfileComplete = Boolean(
    profile.username &&
      Number(profile.weight) > 25 &&
      Number(profile.goalWeight) > 25 &&
      Number(profile.height) > 90 &&
      Number(profile.age) > 10 &&
      Number(profile.deadlineMonths) >= 3
  );

  const activeSplit = useMemo(() => {
    return workoutSplits.find((s) => s.id === activeSplitId) || workoutSplits[0] || null;
  }, [workoutSplits, activeSplitId]);

  // ==========================================
  // 5. FIREBASE AUTH & REALTIME LISTENERS
  // ==========================================
  useEffect(() => {
    if (!auth) return;
    let isMounted = true;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Auth warning:', err);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (isMounted) setUser(u);
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
    const unsubConfig = onSnapshot(
      configDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.profile) setProfile(data.profile);
          if (Array.isArray(data.workoutSplits) && data.workoutSplits.length > 0) setWorkoutSplits(data.workoutSplits);
          if (data.activeSplitId) setActiveSplitId(data.activeSplitId);
          if (Array.isArray(data.mealCsvPlan) && data.mealCsvPlan.length > 0) setMealCsvPlan(data.mealCsvPlan);
          if (data.waterLogsByDate) setWaterLogsByDate(data.waterLogsByDate);
          if (data.activeZestCode) setActiveZestCode(data.activeZestCode);
          if (Array.isArray(data.dismissedBubbleIds)) setDismissedBubbleIds(data.dismissedBubbleIds);
          if (Array.isArray(data.activitySchedule)) {
            setActivitySchedule(data.activitySchedule);
            setActivityTypeText(serializeActivitiesToTypeFormat(data.activitySchedule));
          }
          if (Array.isArray(data.groceryItems)) {
            setGroceryItems(data.groceryItems);
            setGroceryRawText(data.groceryItems.join(', '));
          }
          if (Array.isArray(data.studyChapters)) {
            setStudyChapters(data.studyChapters);
          }
          if (data.examTargetDate) {
            setExamTargetDate(data.examTargetDate);
          }
          if (typeof data.totalStudyMinutesLogged === 'number') {
            setTotalStudyMinutesLogged(data.totalStudyMinutesLogged);
          }
        }
      },
      (err) => console.warn('Config listener warning:', err)
    );

    const draftDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'drafts', 'activeWorkout');
    const unsubDraft = onSnapshot(
      draftDocRef,
      (snap) => {
        if (snap.exists() && snap.data().draft) {
          setActiveDraft(snap.data().draft);
        }
      },
      (err) => console.warn('Draft listener warning:', err)
    );

    const createColListener = (name, setter, sortAsc = false) =>
      onSnapshot(
        collection(db, 'artifacts', appId, 'users', user.uid, name),
        (snap) => {
          const items = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
          if (sortAsc) items.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          if (items.length > 0 || name !== 'bodyLogs') setter(items);
        },
        (err) => console.warn(`${name} listener warning:`, err)
      );

    const unsubW = createColListener('workoutLogs', setWorkoutLogs);
    const unsubC = createColListener('cardioLogs', setCardioLogs);
    const unsubS = createColListener('sportsLogs', setSportsLogs);
    const unsubB = createColListener('bodyLogs', setBodyLogs, true);
    const unsubF = createColListener('foodLogs', setFoodLogs, true);
    const unsubBev = createColListener('beverageLogs', setBeverageLogs, true);
    const unsubRem = createColListener('reminders', setRemindersList);
    const unsubNotes = createColListener('notes', setNotesList);

    const unsubPublicZests = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'competitionZests'),
      (snap) => {
        const zList = [];
        snap.forEach((d) => zList.push({ id: d.id, ...d.data() }));
        setPublicZests(zList);
      },
      (err) => console.warn('Public Zests listener warning:', err)
    );

    const unsubPublicBubbles = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'zestBubbles'),
      (snap) => {
        const bList = [];
        snap.forEach((d) => bList.push({ id: d.id, ...d.data() }));
        bList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setIncomingBubblesQueue(bList);
      },
      (err) => console.warn('Public Bubbles listener warning:', err)
    );

    return () => {
      unsubConfig();
      unsubDraft();
      unsubW();
      unsubC();
      unsubS();
      unsubB();
      unsubF();
      unsubBev();
      unsubRem();
      unsubNotes();
      unsubPublicZests();
      unsubPublicBubbles();
    };
  }, [user]);

  const saveUserConfig = async (newProfile, newSplits, newActiveSplitId, newActiveZestCode) => {
    if (!user || !db) return;
    try {
      const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
      await setDoc(
        configDocRef,
        {
          profile: newProfile !== undefined ? newProfile : profile,
          workoutSplits: newSplits !== undefined ? newSplits : workoutSplits,
          activeSplitId: newActiveSplitId !== undefined ? newActiveSplitId : activeSplitId,
          activeZestCode: newActiveZestCode !== undefined ? newActiveZestCode : activeZestCode,
          updatedAt: Date.now()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Save config warning:', e);
    }
  };

  const saveDraftToFirestore = async (draftObj) => {
    setActiveDraft(draftObj);
    if (!user || !db) return;
    try {
      const draftDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'drafts', 'activeWorkout');
      if (draftObj) {
        await setDoc(draftDocRef, { draft: draftObj, updatedAt: Date.now() });
      } else {
        await deleteDoc(draftDocRef);
      }
    } catch (e) {}
  };

  const updateDailyWaterTotal = async (dateKey, deltaMl) => {
    const current = Number(waterLogsByDate[dateKey]) || 0;
    const nextVal = Math.max(0, current + deltaMl);
    const nextMap = { ...waterLogsByDate, [dateKey]: nextVal };
    setWaterLogsByDate(nextMap);
    if (user && db) {
      try {
        const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
        await setDoc(configDocRef, { waterLogsByDate: nextMap }, { merge: true });
      } catch (e) {}
    }
  };

  const finalizeAndSaveWorkout = async (draftToSave, isAutoSaved = false) => {
    if (!draftToSave) return;
    let totalVolumeKg = 0;
    let totalRpeSum = 0;
    let rpeCount = 0;
    const musclesWorked = {};

    const cleanedExercises = (draftToSave.exercises || []).map((ex) => {
      const validSets = (ex.sets || []).filter((s) => s.completed);
      const setsToUse = validSets.length > 0 ? validSets : ex.sets || [];
      let bestWeight = 0;
      let bestReps = 0;
      setsToUse.forEach((s) => {
        const w = Number(s.weight) || 0;
        const r = Number(s.reps) || 0;
        totalVolumeKg += w * r;
        if (w >= bestWeight) {
          bestWeight = w;
          bestReps = r;
        }
      });
      totalRpeSum += Number(ex.rpe) || 8;
      rpeCount += 1;
      const mList = inferMusclesFromText(ex.name, draftToSave.sessionName);
      mList.forEach((m) => {
        musclesWorked[m] = true;
      });
      return {
        name: ex.name,
        rpe: Number(ex.rpe) || 8,
        setsCount: setsToUse.length,
        bestWeight,
        bestReps,
        bestSetLabel: `${bestWeight}kg × ${bestReps}`
      };
    });

    const avgRpe = rpeCount > 0 ? Number((totalRpeSum / rpeCount).toFixed(1)) : 8;
    const bw = Number(profile.weight) || 75;
    const durationMins = Math.max(12, Math.round((Date.now() - (draftToSave.startedAt || Date.now())) / 60000));
    const kcalBurned = Math.round((bw * 5.2 * (durationMins / 60) * (avgRpe / 7.5)) + totalVolumeKg * 0.015);

    const newLog = {
      id: `wlog-${Date.now()}`,
      dateKey: draftToSave.dateKey || getLocalDateKey(),
      timestamp: Date.now(),
      sessionName: draftToSave.sessionName || 'Workout',
      totalVolumeKg: Math.round(totalVolumeKg),
      avgRpe,
      kcalBurned,
      musclesWorked,
      exercises: cleanedExercises
    };

    setWorkoutLogs((prev) => [newLog, ...prev]);
    if (user && db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'workoutLogs'), newLog);
      } catch (e) {}
    }
    await saveDraftToFirestore(null);
    setIsLoggerOpen(false);
    triggerToast(
      isAutoSaved
        ? `30m inactivity reached: Auto-saved ${newLog.sessionName} (${newLog.totalVolumeKg} kg)!`
        : `Saved ${newLog.sessionName} (${newLog.totalVolumeKg} kg • ${newLog.kcalBurned} kcal)!`
    );
  };

  // Real-time Timestamp Ticker for Rest Timer (3-2-1 Beep + 0s Ting) & 30-Minute Auto-Save
  useEffect(() => {
    if (!activeDraft) {
      setRestSecondsLeft(0);
      setPauseMinutesLeft(30);
      return;
    }
    let lastBeepSecond = null;
    const interval = setInterval(() => {
      const now = Date.now();
      if (activeDraft.restEndTime) {
        const diffSec = Math.ceil((activeDraft.restEndTime - now) / 1000);
        if (diffSec > 0) {
          setRestSecondsLeft(diffSec);
          if ((diffSec === 3 || diffSec === 2 || diffSec === 1) && lastBeepSecond !== diffSec) {
            lastBeepSecond = diffSec;
            soundEngine.playBeep();
          }
        } else if (diffSec <= 0 && restSecondsLeft > 0) {
          setRestSecondsLeft(0);
          soundEngine.playTing4x();
        }
      } else {
        setRestSecondsLeft(0);
      }

      const refTime = activeDraft.isPaused
        ? activeDraft.pausedAt || activeDraft.lastActiveTimestamp || now
        : activeDraft.lastActiveTimestamp || now;
      const elapsedMs = now - refTime;
      const minsRemaining = Math.max(0, Math.ceil((30 * 60 * 1000 - elapsedMs) / 60000));
      setPauseMinutesLeft(minsRemaining);

      if (elapsedMs >= 30 * 60 * 1000) {
        finalizeAndSaveWorkout(activeDraft, true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [activeDraft, restSecondsLeft]);

  // Real-Time Activity Pill Ticker & 3-Minute Pre-Activity Notification Engine
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNowClockMs(now.getTime());

      const todayDayName = getTodayWeekdayName(now).toLowerCase();
      const currentMinsFloat = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      const todayKey = getLocalDateKey(now);

      activitySchedule.forEach((act) => {
        const actDay = (act.day || '').toLowerCase();
        const isToday = actDay === todayDayName || actDay === 'daily' || actDay === 'everyday';
        if (!isToday) return;

        const minsUntilStart = act.startMins - currentMinsFloat;
        const notifId = `${todayKey}-${act.id}-${act.startMins}`;

        // Trigger notification when inside the 3-minute pre-start window (2.0 to 3.1 mins before start)
        if (minsUntilStart > 0 && minsUntilStart <= 3.05 && !notifiedActivityIds.includes(notifId)) {
          setNotifiedActivityIds((prev) => [...prev, notifId]);
          soundEngine.playTing4x();
          triggerToast(`⏰ Heads up! "${act.activity}" starts in 3 mins (${act.fromTime})!`);
          try {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('SWITCH Activity Pill', {
                body: `"${act.activity}" starts in 3 minutes (${act.fromTime} - ${act.toTime})!`
              });
            }
          } catch (e) {}
        }
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [activitySchedule, notifiedActivityIds]);

  // Computed Today's Activity Pill Status & Dynamic Fill %
  const todayActivityStatus = useMemo(() => {
    const now = new Date(nowClockMs);
    const todayName = getTodayWeekdayName(now);
    const currentMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const todaysList = activitySchedule
      .filter((a) => {
        const d = (a.day || '').toLowerCase();
        return d === todayName.toLowerCase() || d === 'daily' || d === 'everyday';
      })
      .sort((a, b) => a.startMins - b.startMins)
      .map((a) => {
        let status = 'remaining';
        let fillPct = 0;
        if (currentMins >= a.endMins) {
          status = 'completed';
          fillPct = 100;
        } else if (currentMins >= a.startMins && currentMins < a.endMins) {
          status = 'current';
          const totalDur = Math.max(1, a.endMins - a.startMins);
          fillPct = Math.min(100, Math.max(0, Math.round(((currentMins - a.startMins) / totalDur) * 100)));
        }
        return { ...a, status, fillPct };
      });

    const currentAct = todaysList.find((a) => a.status === 'current') || null;
    const nextAct = todaysList.find((a) => a.status === 'remaining') || null;
    const completedCount = todaysList.filter((a) => a.status === 'completed').length;

    return {
      todayName,
      currentTimeStr: formatMinutesToHHMM(currentMins),
      todaysList,
      currentAct,
      nextAct,
      completedCount
    };
  }, [activitySchedule, nowClockMs]);

  const handleSaveActivitySchedule = async (newSchedule) => {
    setActivitySchedule(newSchedule);
    setActivityTypeText(serializeActivitiesToTypeFormat(newSchedule));
    if (user && db) {
      try {
        const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
        await setDoc(configDocRef, { activitySchedule: newSchedule, updatedAt: Date.now() }, { merge: true });
      } catch (e) {}
    }
  };

  const handleSaveTypedActivities = async () => {
    const parsed = parseTypeFormatToActivities(activityTypeText);
    if (parsed.length === 0 && activityTypeText.trim() !== '') {
      triggerToast('Format: [Day] then [Activity - 12:00 : 12:30]');
      return;
    }
    await handleSaveActivitySchedule(parsed);
    setActivityModalTab('timeline');
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } catch (e) {}
    triggerToast(`Saved ${parsed.length} activity slot(s) to Activity Pill!`);
  };

  const handleActivityCsvUpload = (e) => {
    setActivityCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (typeof content !== 'string' || !content.trim()) return;
      const parsed = parseActivityCsvToActivities(content);
      if (parsed.length === 0) {
        setActivityCsvError('Invalid format. Use: Day, Activity, from time, to time; Day, Activity...');
        return;
      }
      await handleSaveActivitySchedule(parsed);
      setActivityModalTab('edit'); // Automatically opens in Type format so user can inspect or edit
      triggerToast(`Imported ${parsed.length} activities from .CSV! Editable in Type format.`);
    };
    reader.readAsText(file);
  };

  // ==========================================
  // v6 STUDY HUB ENGINE, TIMETABLE CSV & TIMER
  // ==========================================
  const activeStudyProtocol = useMemo(() => {
    return STUDY_PROTOCOLS[studyPlanKey] || STUDY_PROTOCOLS.weekday;
  }, [studyPlanKey]);

  const currentStudyBlock = useMemo(() => {
    return activeStudyProtocol.blocks[studyBlockIndex] || activeStudyProtocol.blocks[0];
  }, [activeStudyProtocol, studyBlockIndex]);

  const saveStudyDataToFirestore = async (nextChapters, nextExamDate, nextTotalMins) => {
    if (!user || !db) return;
    try {
      const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
      await setDoc(
        configDocRef,
        {
          studyChapters: nextChapters !== undefined ? nextChapters : studyChapters,
          examTargetDate: nextExamDate !== undefined ? nextExamDate : examTargetDate,
          totalStudyMinutesLogged: nextTotalMins !== undefined ? nextTotalMins : totalStudyMinutesLogged,
          updatedAt: Date.now()
        },
        { merge: true }
      );
    } catch (e) {}
  };

  const handleToggleChapterComplete = async (chapterId) => {
    const nextChapters = studyChapters.map((ch) => {
      if (ch.id !== chapterId) return ch;
      const nextDone = !ch.completed;
      return {
        ...ch,
        completed: nextDone,
        timeSpentMins: nextDone && (!ch.timeSpentMins || ch.timeSpentMins === 0) ? 45 : ch.timeSpentMins
      };
    });
    setStudyChapters(nextChapters);
    await saveStudyDataToFirestore(nextChapters, examTargetDate, totalStudyMinutesLogged);
    triggerToast('Updated chapter completion status!');
  };

  const handleStudyTimetableCsvUpload = (e) => {
    setStudyCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (typeof content !== 'string' || !content.trim()) return;
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const parsedChapters = [];

      lines.forEach((line, idx) => {
        const cols = line.split(',').map((c) => c.trim());
        if (cols.length < 4) return;
        // Skip header row if detected
        if (idx === 0 && /serial|s\.no|sno|chapter/i.test(cols[0] + ' ' + cols[1])) return;

        const serialNo = cols[0] || String(idx + 1);
        const title = cols[1];
        const startDate = cols[2] || getLocalDateKey();
        const endDate = cols[3] || startDate;

        if (title) {
          parsedChapters.push({
            id: `ch-csv-${Date.now()}-${idx}`,
            serialNo,
            title,
            startDate,
            endDate,
            completed: false,
            timeSpentMins: 0
          });
        }
      });

      if (parsedChapters.length === 0) {
        setStudyCsvError('Invalid CSV format. Required columns: Serial Number, Chapter Title, Start Date, End Date');
        return;
      }

      setStudyChapters(parsedChapters);
      setStudyFilterMode('all');
      await saveStudyDataToFirestore(parsedChapters, examTargetDate, totalStudyMinutesLogged);
      triggerToast(`Imported ${parsedChapters.length} chapters into Study Timetable!`);
    };
    reader.readAsText(file);
  };

  const startFullScreenStudySession = () => {
    soundEngine.init();
    const dayNum = new Date().getDay();
    const autoKey = dayNum === 0 || dayNum === 6 ? 'weekend' : 'weekday';
    setStudyPlanKey(autoKey);
    const firstBlock = STUDY_PROTOCOLS[autoKey].blocks[0];
    setStudyBlockIndex(0);
    setStudySecondsLeft(firstBlock.durationMins * 60);
    setIsStudyTimerPaused(false);
    setIsStudyModeActive(true);
  };

  const switchStudyProtocolPlan = (newKey) => {
    const proto = STUDY_PROTOCOLS[newKey] || STUDY_PROTOCOLS.weekday;
    setStudyPlanKey(newKey);
    setStudyBlockIndex(0);
    setStudySecondsLeft(proto.blocks[0].durationMins * 60);
    setIsStudyTimerPaused(false);
  };

  const jumpToStudyBlock = (idx) => {
    const blk = activeStudyProtocol.blocks[idx];
    if (!blk) return;
    setStudyBlockIndex(idx);
    setStudySecondsLeft(blk.durationMins * 60);
  };

  // Full-Screen Study Timer Ticker:
  // - Alerts at 15 minutes remaining (900s) during Study blocks
  // - Plays tick-tick-tick beep at 3, 2, 1 seconds remaining (both Study & Break)
  // - Plays 4x ting bell at 0 seconds and auto-transitions to next block
  useEffect(() => {
    if (!isStudyModeActive || isStudyTimerPaused) return;

    const timer = setInterval(() => {
      setStudySecondsLeft((prevSec) => {
        const nextSec = prevSec - 1;

        // 15 minutes remaining notification (900 seconds) during a 45m/60m study block
        if (
          currentStudyBlock?.type === 'study' &&
          currentStudyBlock.durationMins > 15 &&
          nextSec === 15 * 60
        ) {
          soundEngine.playTing4x();
          triggerToast('⏰ 15 minutes left in this study block! Keep pushing!');
        }

        // 3, 2, 1 seconds remaining tick-tick-tick sound (for both Study and Break)
        if (nextSec === 3 || nextSec === 2 || nextSec === 1) {
          soundEngine.playBeep();
        }

        // 0 seconds reached -> Play completion bell and advance to next block
        if (nextSec <= 0) {
          soundEngine.playTing4x();
          const finishedBlock = activeStudyProtocol.blocks[studyBlockIndex];
          if (finishedBlock?.type === 'study') {
            const updatedMins = totalStudyMinutesLogged + finishedBlock.durationMins;
            setTotalStudyMinutesLogged(updatedMins);
            saveStudyDataToFirestore(studyChapters, examTargetDate, updatedMins);
          }

          const nextIdx = studyBlockIndex + 1;
          if (nextIdx < activeStudyProtocol.blocks.length) {
            const nextBlk = activeStudyProtocol.blocks[nextIdx];
            setStudyBlockIndex(nextIdx);
            triggerToast(
              nextBlk.type === 'break'
                ? `🎉 Study block complete! Starting ${nextBlk.durationMins}m Break.`
                : `🔥 Break over! Starting ${nextBlk.label} (${nextBlk.durationMins}m).`
            );
            return nextBlk.durationMins * 60;
          } else {
            setIsStudyModeActive(false);
            triggerToast(`🏆 Completed full ${activeStudyProtocol.name}! Incredible discipline!`);
            return 0;
          }
        }

        return nextSec;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isStudyModeActive,
    isStudyTimerPaused,
    studyBlockIndex,
    activeStudyProtocol,
    currentStudyBlock,
    totalStudyMinutesLogged,
    studyChapters,
    examTargetDate
  ]);

  const studyHubSummary = useMemo(() => {
    const totalChapters = studyChapters.length;
    const completedChapters = studyChapters.filter((c) => c.completed).length;
    const completionPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    // Average time taken per completed chapter
    const avgMinsPerChapter =
      completedChapters > 0 ? Math.round(totalStudyMinutesLogged / completedChapters) : 0;
    const avgHoursFormatted =
      avgMinsPerChapter >= 60
        ? `${(avgMinsPerChapter / 60).toFixed(1)}h (${avgMinsPerChapter}m)`
        : `${avgMinsPerChapter} mins`;

    // Days remaining for exam
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const examDateObj = new Date(examTargetDate + 'T00:00:00');
    const diffDays = Math.max(
      0,
      Math.ceil((examDateObj.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
    );

    const todayKey = getLocalDateKey();
    const todaysChapters = studyChapters.filter(
      (c) => (!c.startDate || c.startDate <= todayKey) && (!c.endDate || c.endDate >= todayKey)
    );

    return {
      totalChapters,
      completedChapters,
      completionPct,
      avgHoursFormatted,
      diffDays,
      todaysChapters
    };
  }, [studyChapters, totalStudyMinutesLogged, examTargetDate]);

  // ==========================================
  // 6. SUMMARIES & MATHEMATICAL ENGINES
  // ==========================================
  const dailySummary = useMemo(() => {
    const dayWorkouts = workoutLogs.filter((w) => w.dateKey === selectedDate);
    const dayCardio = cardioLogs.filter((c) => c.dateKey === selectedDate);
    const daySports = sportsLogs.filter((s) => s.dateKey === selectedDate);

    const totalKgs = dayWorkouts.reduce((acc, w) => acc + (Number(w.totalVolumeKg) || 0), 0);
    const formattedKgs = totalKgs === 0 ? '000' : totalKgs.toLocaleString();

    const workoutKcal = dayWorkouts.reduce((acc, w) => acc + (Number(w.kcalBurned) || 0), 0);
    const cardioKcal = dayCardio.reduce((acc, c) => acc + (Number(c.kcalBurned) || 0), 0);
    const sportsKcal = daySports.reduce((acc, s) => acc + (Number(s.kcalBurned) || 0), 0);
    const totalKcal = workoutKcal + cardioKcal + sportsKcal;

    let prWeight = 0;
    let prExercise = '';
    let pbScore = 0;
    let pbLabel = '0 kg × 0';
    const flatExercises = [];
    const combinedMuscles = {};

    dayWorkouts.forEach((w) => {
      if (w.musclesWorked) {
        Object.keys(w.musclesWorked).forEach((m) => {
          combinedMuscles[m] = true;
        });
      }
      (w.exercises || []).forEach((ex) => {
        flatExercises.push(ex);
        if ((Number(ex.bestWeight) || 0) > prWeight) {
          prWeight = Number(ex.bestWeight);
          prExercise = ex.name;
        }
        const volSet = (Number(ex.bestWeight) || 0) * (Number(ex.bestReps) || 0);
        if (volSet > pbScore) {
          pbScore = volSet;
          pbLabel = `${ex.name} (${ex.bestWeight}kg × ${ex.bestReps})`;
        }
      });
    });

    const targetBurn = Math.max(350, Math.round((Number(profile.weight) || 75) * 10));
    const burnPercent = Math.min(100, Math.round((totalKcal / targetBurn) * 100));

    return {
      totalKgs,
      formattedKgs,
      workoutKcal,
      cardioKcal,
      sportsKcal,
      totalKcal,
      prDisplay: prWeight > 0 ? `${prExercise} (${prWeight}kg)` : '0 kg',
      pbDisplay: pbScore > 0 ? pbLabel : '0 kg × 0',
      flatExercises,
      dayCardio,
      daySports,
      combinedMuscles,
      burnPercent,
      totalWaterMl: Number(waterLogsByDate[selectedDate]) || 0
    };
  }, [workoutLogs, cardioLogs, sportsLogs, selectedDate, profile.weight, waterLogsByDate]);

  // Biometric & Wishnofsky Mathematical Engine (Card 1e)
  const biometricEngine = useMemo(() => {
    const w0 = Number(bodyLogs[0]?.weight) || Number(profile.weight) || 75;
    const wGoal = Number(profile.goalWeight) || 70;
    const heightCm = Number(profile.height) || 175;
    const age = Number(profile.age) || 26;
    const deadlineDays = Math.max(30, Math.round((Number(profile.deadlineMonths) || 6) * 30.4375));

    // Mifflin-St Jeor BMR & TDEE
    const bmr = Math.round(10 * w0 + 6.25 * heightCm - 5 * age + 5);
    const sedTdee = Math.round(bmr * 1.25);

    const latestBody = bodyLogs[bodyLogs.length - 1] || { weight: w0, waist: 84, belly: 86, chest: 100, wrist: 17 };
    const rfmBodyFatPct = Number((64 - 20 * (heightCm / Math.max(55, Number(latestBody.waist) || 84))).toFixed(1));
    const wristFrameRatio = Number((heightCm / Math.max(12, Number(latestBody.wrist) || 17)).toFixed(2));

    const dailyWeightSlopeKg = (wGoal - w0) / deadlineDays;
    const requiredDailyKcalDelta = Math.round(dailyWeightSlopeKg * 7700);

    // Anthropometric coupling coefficients (cm per kg change)
    const couplingMap = {
      weight: 1.0,
      waist: 0.88,
      belly: 0.95,
      chest: 0.5,
      wrist: 0.06
    };
    const alpha = couplingMap[selectedTrackerMetric] || 1.0;
    const startMetricVal = Number(bodyLogs[0]?.[selectedTrackerMetric]) || Number(latestBody[selectedTrackerMetric]) || w0;

    const t0 = bodyLogs[0]?.timestamp || profile.createdAt || Date.now();
    let cumulativeNetEnergyKcal = 0;

    const points = bodyLogs.map((log, idx) => {
      const elapsedDays = Math.max(0, Math.round(((log.timestamp || Date.now()) - t0) / 86400000)) || idx;
      const actualVal = Number(log[selectedTrackerMetric]) || startMetricVal;
      const targetVal = Number((startMetricVal + dailyWeightSlopeKg * elapsedDays * alpha).toFixed(2));

      const dayKey = log.dateKey || getLocalDateKey();
      const dayExerciseBurn =
        workoutLogs.filter((w) => w.dateKey === dayKey).reduce((s, w) => s + (Number(w.kcalBurned) || 0), 0) +
        cardioLogs.filter((c) => c.dateKey === dayKey).reduce((s, c) => s + (Number(c.kcalBurned) || 0), 0) +
        sportsLogs.filter((sp) => sp.dateKey === dayKey).reduce((s, sp) => s + (Number(sp.kcalBurned) || 0), 0);

      const dayFoodConsumed = foodLogs
        .filter((f) => f.dateKey === dayKey)
        .reduce((s, f) => s + (Number(f.kcal) || 0), 0);

      if (dayFoodConsumed > 0) {
        cumulativeNetEnergyKcal += dayFoodConsumed - (sedTdee + dayExerciseBurn);
      } else {
        cumulativeNetEnergyKcal -= dayExerciseBurn;
      }

      const projVal = Number((startMetricVal + (cumulativeNetEnergyKcal / 7700) * alpha).toFixed(2));
      return {
        day: elapsedDays,
        dateKey: dayKey,
        actual: actualVal,
        target: targetVal,
        proj: projVal
      };
    });

    // Append a horizon point so user sees trajectory direction
    const lastDay = points.length > 0 ? points[points.length - 1].day : 0;
    const previewDay = Math.min(deadlineDays, Math.max(14, lastDay + 14));
    const totalActiveBurnAllDays =
      workoutLogs.reduce((s, w) => s + (Number(w.kcalBurned) || 0), 0) +
      cardioLogs.reduce((s, c) => s + (Number(c.kcalBurned) || 0), 0) +
      sportsLogs.reduce((s, sp) => s + (Number(sp.kcalBurned) || 0), 0);

    points.push({
      day: previewDay,
      dateKey: `Day ${previewDay}`,
      actual: points[points.length - 1]?.actual || startMetricVal,
      target: Number((startMetricVal + dailyWeightSlopeKg * previewDay * alpha).toFixed(2)),
      proj: Number((startMetricVal - (totalActiveBurnAllDays / 7700) * alpha).toFixed(2))
    });

    return {
      bmr,
      sedTdee,
      deadlineDays,
      rfmBodyFatPct,
      wristFrameRatio,
      requiredDailyKcalDelta,
      totalActiveBurnAllDays,
      points
    };
  }, [bodyLogs, profile, selectedTrackerMetric, workoutLogs, cardioLogs, sportsLogs, foodLogs]);

  // Daily Macro & Hydration Summary (Tab 2)
  const dailyMacroSummary = useMemo(() => {
    const dayFoods = foodLogs.filter((f) => f.dateKey === selectedDate);
    const dayBevs = beverageLogs.filter((b) => b.dateKey === selectedDate);

    const foodKcal = dayFoods.reduce((s, f) => s + (Number(f.kcal) || 0), 0);
    const bevKcal = dayBevs.reduce((s, b) => s + (Number(b.kcal) || 0), 0);
    const consumedKcal = foodKcal + bevKcal;

    const bw = Number(profile.weight) || 75;
    const goalOffset = profile.goalType === 'fatloss' ? -450 : profile.goalType === 'muscle' ? 300 : -150;
    const requiredKcal = Math.max(1400, Math.round(biometricEngine.sedTdee + dailySummary.totalKcal + goalOffset));

    const proteinG = Number(dayFoods.reduce((s, f) => s + (Number(f.protein) || 0), 0).toFixed(1));
    const carbsG = Number(dayFoods.reduce((s, f) => s + (Number(f.carbs) || 0), 0).toFixed(1));
    const fatsG = Number(dayFoods.reduce((s, f) => s + (Number(f.fats) || 0), 0).toFixed(1));

    const proteinTargetG = Math.round(bw * 2.0);
    const fatsTargetG = Math.round(bw * 0.9);
    const carbsTargetG = Math.max(90, Math.round((requiredKcal - proteinTargetG * 4 - fatsTargetG * 9) / 4));

    const fiberG = Number(dayFoods.reduce((s, f) => s + (Number(f.fiber) || 0), 0).toFixed(1));
    const sugarG = Number(
      (
        dayFoods.reduce((s, f) => s + (Number(f.sugar) || 0), 0) +
        dayBevs.reduce((s, b) => s + (Number(b.sugar) || 0), 0)
      ).toFixed(1)
    );
    const sodiumMg = Math.round(dayFoods.reduce((s, f) => s + (Number(f.sodium) || 0), 0));
    const microsScorePct = Math.min(100, Math.round((fiberG / 30) * 60 + (sodiumMg <= 2300 ? 40 : 20)));

    // Water Sweet Spot (2500 - 4000 ml)
    const waterTargetMl = Math.min(4000, Math.max(2500, Math.round(bw * 38 + dailySummary.totalKcal * 0.6)));
    const currentWaterMl = Number(waterLogsByDate[selectedDate]) || 0;
    const waterPercent = Math.min(100, Math.round((currentWaterMl / waterTargetMl) * 100));

    const mealGroups = {};
    mealCsvPlan.forEach((dish) => {
      const m = dish.meal || 'Meals';
      if (!mealGroups[m]) mealGroups[m] = [];
      mealGroups[m].push(dish);
    });

    const consumedDishCounts = {};
    dayFoods.forEach((f) => {
      const key = (f.dishName || f.name || '').toLowerCase();
      consumedDishCounts[key] = (consumedDishCounts[key] || 0) + 1;
    });

    // Pure Food Macro Adherence % (strictly excluding Other Beverages for Fair Zest Score)
    const pureFoodProteinG = proteinG;
    const pureFoodKcal = foodKcal;
    const pureProteinAdherence = Math.min(100, Math.round((pureFoodProteinG / Math.max(1, proteinTargetG)) * 100));
    const pureCalorieAdherence =
      pureFoodKcal === 0
        ? 0
        : Math.max(0, 100 - Math.min(100, Math.round((Math.abs(pureFoodKcal - requiredKcal) / requiredKcal) * 100)));
    const pureFoodMacroPct = Math.round(pureProteinAdherence * 0.65 + pureCalorieAdherence * 0.35);

    return {
      dayFoods,
      dayBevs,
      foodKcal,
      bevKcal,
      consumedKcal,
      requiredKcal,
      kcalDiff: requiredKcal - consumedKcal,
      proteinG,
      proteinTargetG,
      proteinPct: Math.min(100, Math.round((proteinG / Math.max(1, proteinTargetG)) * 100)),
      carbsG,
      carbsTargetG,
      carbsPct: Math.min(100, Math.round((carbsG / Math.max(1, carbsTargetG)) * 100)),
      fatsG,
      fatsTargetG,
      fatsPct: Math.min(100, Math.round((fatsG / Math.max(1, fatsTargetG)) * 100)),
      fiberG,
      sugarG,
      sodiumMg,
      microsScorePct,
      waterTargetMl,
      currentWaterMl,
      waterPercent,
      mealGroups,
      consumedDishCounts,
      pureFoodMacroPct,
      pureFoodProteinG
    };
  }, [foodLogs, beverageLogs, selectedDate, profile.weight, profile.goalType, biometricEngine.sedTdee, dailySummary.totalKcal, waterLogsByDate, mealCsvPlan]);

  // Live & 7-Day Zest Stats for Current User
  const myLiveZestMemberStats = useMemo(() => {
    const todayKey = getLocalDateKey();
    const todayWorkouts = workoutLogs.filter((w) => w.dateKey === todayKey);
    const todayCardio = cardioLogs.filter((c) => c.dateKey === todayKey);
    const todaySports = sportsLogs.filter((s) => s.dateKey === todayKey);

    const todayVolumeKg = todayWorkouts.reduce((s, w) => s + (Number(w.totalVolumeKg) || 0), 0);
    const todayAvgRpe =
      todayWorkouts.length > 0
        ? Number((todayWorkouts.reduce((s, w) => s + (Number(w.avgRpe) || 7.5), 0) / todayWorkouts.length).toFixed(1))
        : 7.5;
    const todayKcalBurn =
      todayWorkouts.reduce((s, w) => s + (Number(w.kcalBurned) || 0), 0) +
      todayCardio.reduce((s, c) => s + (Number(c.kcalBurned) || 0), 0) +
      todaySports.reduce((s, sp) => s + (Number(sp.kcalBurned) || 0), 0);

    const last7Keys = dateChain.slice(-7).map((d) => d.key);
    const sevenDayVolumeKg = workoutLogs
      .filter((w) => last7Keys.includes(w.dateKey))
      .reduce((s, w) => s + (Number(w.totalVolumeKg) || 0), 0);
    const sevenDayKcalBurn =
      workoutLogs.filter((w) => last7Keys.includes(w.dateKey)).reduce((s, w) => s + (Number(w.kcalBurned) || 0), 0) +
      cardioLogs.filter((c) => last7Keys.includes(c.dateKey)).reduce((s, c) => s + (Number(c.kcalBurned) || 0), 0) +
      sportsLogs.filter((sp) => last7Keys.includes(sp.dateKey)).reduce((s, sp) => s + (Number(sp.kcalBurned) || 0), 0);

    const baseStats = {
      uid: user?.uid || 'local-user',
      username: profile.username || 'IronWolf_42',
      avatarEmoji: profile.avatarEmoji || '🦍',
      weight: Number(profile.weight) || 75,
      todayVolumeKg,
      todayAvgRpe,
      todayKcalBurn,
      pureFoodMacroPct: dailyMacroSummary.pureFoodMacroPct || 0,
      pureFoodProteinG: dailyMacroSummary.pureFoodProteinG || 0,
      waterMl: dailyMacroSummary.currentWaterMl || 0,
      waterTargetMl: dailyMacroSummary.waterTargetMl || 2800,
      waterPct: dailyMacroSummary.waterPercent || 0,
      beveragesCount: dailyMacroSummary.dayBevs.length,
      prDisplay: dailySummary.prDisplay || '0 kg',
      pbDisplay: dailySummary.pbDisplay || '0 kg × 0',
      sevenDayVolumeKg,
      sevenDayKcalBurn,
      updatedAt: Date.now()
    };

    const scoreBreakdown = calculateFairZestScore(baseStats);
    return {
      ...baseStats,
      fairZestScore: scoreBreakdown.totalScore,
      sevenDayZestScore: scoreBreakdown.totalScore + Math.min(350, Math.round(sevenDayVolumeKg / 250 + sevenDayKcalBurn / 80)),
      scoreBreakdown
    };
  }, [user, profile, workoutLogs, cardioLogs, sportsLogs, dailyMacroSummary, dailySummary, dateChain]);

  // Auto-sync user stats to Active Public Zest
  useEffect(() => {
    if (!user || !db || !activeZestCode) return;
    const currentZest = publicZests.find((z) => z.code === activeZestCode);
    if (!currentZest) return;
    const zDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', activeZestCode);
    const existingMembers = Array.isArray(currentZest.members) ? currentZest.members : [];
    const idx = existingMembers.findIndex((m) => m.uid === user.uid);
    const nextMembers =
      idx >= 0
        ? existingMembers.map((m, i) => (i === idx ? myLiveZestMemberStats : m))
        : [...existingMembers, myLiveZestMemberStats];
    setDoc(zDocRef, { members: nextMembers, updatedAt: Date.now() }, { merge: true }).catch(() => {});
  }, [
    user,
    activeZestCode,
    myLiveZestMemberStats.fairZestScore,
    myLiveZestMemberStats.todayVolumeKg,
    myLiveZestMemberStats.todayKcalBurn,
    myLiveZestMemberStats.waterMl,
    profile.username,
    profile.avatarEmoji
  ]);

  const activeZestObj = useMemo(() => {
    if (activeZestCode) {
      const found = publicZests.find((z) => z.code === activeZestCode);
      if (found) return found;
    }
    return publicZests[0] || null;
  }, [publicZests, activeZestCode]);

  // ==========================================
  // 7. EVENT HANDLERS (FITNESS, MACROS & ZESTS)
  // ==========================================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updatedProfile = {
      ...profile,
      weight: Number(profile.weight),
      goalWeight: Number(profile.goalWeight),
      height: Number(profile.height),
      age: Number(profile.age),
      deadlineMonths: Number(profile.deadlineMonths),
      createdAt: profile.createdAt || Date.now()
    };
    setProfile(updatedProfile);
    await saveUserConfig(updatedProfile, workoutSplits, activeSplitId, activeZestCode);
    triggerToast('Athlete Identity & Profile saved!');
  };

  const startSessionFromSplit = (sessionObj) => {
    if (!isProfileComplete) {
      setShowProfileModal(true);
      setProfileSectionTab('settings');
      return;
    }
    const todayKey = getLocalDateKey();
    const currentWater = Number(waterLogsByDate[todayKey]) || 0;
    const draft = {
      splitId: activeSplit?.id || 'custom',
      splitTitle: activeSplit?.title || 'Routine',
      sessionName: sessionObj.sessionName,
      dateKey: todayKey,
      startedAt: Date.now(),
      lastActiveTimestamp: Date.now(),
      isPaused: false,
      pausedAt: null,
      restEndTime: null,
      waterMl: currentWater,
      exercises: (sessionObj.exercises || []).map((ex, idx) => ({
        id: `ex-${Date.now()}-${idx}`,
        name: typeof ex === 'string' ? ex : ex.name,
        primaryMuscle:
          typeof ex === 'string'
            ? inferMusclesFromText(ex, sessionObj.sessionName)[0]
            : ex.primaryMuscle || 'Chest',
        rpe: 8,
        sets: [
          { weight: 40, reps: 10, completed: false },
          { weight: 40, reps: 10, completed: false },
          { weight: 40, reps: 10, completed: false }
        ]
      }))
    };
    saveDraftToFirestore(draft);
    setIsLoggerOpen(true);
  };

  const handleLogCardio = async () => {
    if (!isProfileComplete) {
      setShowProfileModal(true);
      setProfileSectionTab('settings');
      return;
    }
    const cType = CARDIO_TYPES.find((c) => c.id === selectedCardioId) || CARDIO_TYPES[0];
    const bw = Number(profile.weight) || 75;
    const resistFactor = 1 + (Number(cardioResistance) || 0) * 0.03;
    const kcalBurned = Math.round(cType.baseMet * resistFactor * bw * (cardioDurationMins / 60));
    const approxSteps = Math.round(cType.stepsPerMin * cardioDurationMins);
    const entry = {
      id: `clog-${Date.now()}`,
      dateKey: selectedDate,
      timestamp: Date.now(),
      cardioId: cType.id,
      name: cType.name,
      durationMins: cardioDurationMins,
      distanceKm: cardioDistanceKm,
      resistance: cardioResistance,
      kcalBurned,
      approxSteps
    };
    setCardioLogs((prev) => [entry, ...prev]);
    if (user && db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'cardioLogs'), entry);
      } catch (e) {}
    }
    triggerToast(`Logged ${cType.name} (${kcalBurned} kcal)!`);
  };

  const handleLogSports = async () => {
    if (!isProfileComplete) {
      setShowProfileModal(true);
      setProfileSectionTab('settings');
      return;
    }
    const sType = SPORTS_TYPES.find((s) => s.id === selectedSportId) || SPORTS_TYPES[0];
    const bw = Number(profile.weight) || 75;
    const rpeMultiplier = 0.75 + (Number(sportRpe) / 10) * 0.5;
    const kcalBurned = Math.round(sType.baseMet * rpeMultiplier * bw * (sportDurationMins / 60));
    const sRpeLoad = Math.round(sportDurationMins * sportRpe);
    const entry = {
      id: `slog-${Date.now()}`,
      dateKey: selectedDate,
      timestamp: Date.now(),
      sportId: sType.id,
      name: sType.name,
      durationMins: sportDurationMins,
      rpe: sportRpe,
      sRpeLoad,
      kcalBurned
    };
    setSportsLogs((prev) => [entry, ...prev]);
    if (user && db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sportsLogs'), entry);
      } catch (e) {}
    }
    triggerToast(`Logged ${sType.name} (${kcalBurned} kcal • Load ${sRpeLoad})!`);
  };

  const handleLogBodyMetrics = async (e) => {
    e.preventDefault();
    const lastLog = bodyLogs[bodyLogs.length - 1] || {};
    const record = {
      id: `blog-${Date.now()}`,
      dateKey: selectedDate,
      timestamp: Date.now(),
      weight: Number(trackerInput.weight) || Number(lastLog.weight) || Number(profile.weight) || 75,
      chest: Number(trackerInput.chest) || Number(lastLog.chest) || 100,
      waist: Number(trackerInput.waist) || Number(lastLog.waist) || 84,
      belly: Number(trackerInput.belly) || Number(lastLog.belly) || 86,
      wrist: Number(trackerInput.wrist) || Number(lastLog.wrist) || 17
    };
    setBodyLogs((prev) => [...prev, record]);
    if (user && db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'bodyLogs'), record);
      } catch (e) {}
    }
    setTrackerInput({ weight: '', chest: '', waist: '', belly: '', wrist: '' });
    triggerToast('Biometric measurements logged!');
  };

  const handleWorkoutCsvUpload = (e) => {
    setCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (typeof content !== 'string' || !content.trim()) return;
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let splitTitle = 'Uploaded Split';
      const sessions = [];
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim()).filter(Boolean);
        if (i === 0 && cols[0]?.toLowerCase().includes('split')) continue;
        if (cols.length < 3) {
          setCsvError(`Row ${i + 1} invalid: Needs Split Title, Session Name, and at least 1 Exercise.`);
          return;
        }
        splitTitle = cols[0];
        const sessionName = cols[1];
        const exercises = cols.slice(2).map((exName) => ({
          name: exName,
          primaryMuscle: inferMusclesFromText(exName, sessionName)[0] || 'Chest'
        }));
        sessions.push({ id: `sess-${Date.now()}-${i}`, sessionName, exercises });
      }
      if (!sessions.length) {
        setCsvError('No valid workout sessions found in CSV.');
        return;
      }
      const newSplit = { id: 'split-' + Date.now(), title: splitTitle, sessions };
      const nextSplits = [...workoutSplits, newSplit];
      setWorkoutSplits(nextSplits);
      setActiveSplitId(newSplit.id);
      await saveUserConfig(profile, nextSplits, newSplit.id, activeZestCode);
      setShowRoutineChoiceModal(false);
      setRoutineSubPage(null);
      triggerToast(`Imported "${splitTitle}" (${sessions.length} sessions)!`);
    };
    reader.readAsText(file);
  };

  // Log Manual Food Rows (Offline DB + Gemini AI Fallback)
  const handleLogManualFoods = async () => {
    if (manualParsedRows.length === 0) return;
    setIsLoggingFood(true);
    const newEntries = [];

    for (const row of manualParsedRows) {
      let macros = estimateMacrosLocally(row.name, row.qty, row.unit);
      if (!macros) {
        try {
          const apiKey = '';
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Estimate nutrition for "${row.name}" quantity ${row.qty} ${row.unit}. Return JSON with integer kcal, protein, carbs, fats, fiber, sugar, sodium.`
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json'
              }
            })
          });
          const data = await res.json();
          const parsed = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
          if (parsed.kcal) macros = parsed;
        } catch (err) {}
      }
      if (!macros) {
        macros = { kcal: 160, protein: 8, carbs: 18, fats: 5, fiber: 2, sugar: 2, sodium: 140 };
      }
      const entry = {
        id: `flog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dateKey: selectedDate,
        timestamp: Date.now(),
        name: `${row.name} (${row.qty}${row.unit})`,
        dishName: row.name,
        ...macros
      };
      newEntries.push(entry);
      if (user && db) {
        try {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'foodLogs'), entry);
        } catch (e) {}
      }
    }

    setFoodLogs((prev) => [...prev, ...newEntries]);
    setIsLoggingFood(false);
    triggerToast(`Logged ${newEntries.length} food item(s) to Macro Summary!`);
  };

  // Structure 1 Meal CSV Upload
  const handleMealCsvUpload = (e) => {
    setMealCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (typeof content !== 'string' || !content.trim()) return;
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parsedDishes = [];
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim()).filter(Boolean);
        if (i === 0 && cols[0]?.toLowerCase() === 'meal') continue;
        if (cols.length < 3) {
          setMealCsvError(`Row ${i + 1} invalid: Format must be Meal, Dish Name, Ingredient 1 - Qty...`);
          return;
        }
        const meal = cols[0];
        const dishName = cols[1];
        const ingCols = cols.slice(2);
        const rows = parseFoodTextToRows(ingCols.join(', '));
        let kcal = 0,
          protein = 0,
          carbs = 0,
          fats = 0,
          fiber = 0,
          sugar = 0,
          sodium = 0;
        rows.forEach((r) => {
          const m = estimateMacrosLocally(r.name, r.qty, r.unit) || {
            kcal: 140,
            protein: 7,
            carbs: 15,
            fats: 4,
            fiber: 1.5,
            sugar: 1,
            sodium: 100
          };
          kcal += m.kcal;
          protein += m.protein;
          carbs += m.carbs;
          fats += m.fats;
          fiber += m.fiber;
          sugar += m.sugar;
          sodium += m.sodium;
        });
        parsedDishes.push({
          id: `dish-${Date.now()}-${i}`,
          meal,
          dishName,
          ingredientsText: ingCols.join(', '),
          kcal: Math.round(kcal),
          protein: Number(protein.toFixed(1)),
          carbs: Number(carbs.toFixed(1)),
          fats: Number(fats.toFixed(1)),
          fiber: Number(fiber.toFixed(1)),
          sugar: Number(sugar.toFixed(1)),
          sodium: Math.round(sodium)
        });
      }
      if (!parsedDishes.length) {
        setMealCsvError('No valid dishes found in CSV.');
        return;
      }
      setMealCsvPlan(parsedDishes);
      setExpandedMealCategory(parsedDishes[0].meal);
      if (user && db) {
        const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
        await setDoc(configDocRef, { mealCsvPlan: parsedDishes }, { merge: true }).catch(() => {});
      }
      triggerToast(`Uploaded ${parsedDishes.length} dishes to Meal Plan!`);
    };
    reader.readAsText(file);
  };

  const handleQuickLogCsvDish = async (dish) => {
    const entry = {
      id: `flog-${Date.now()}`,
      dateKey: selectedDate,
      timestamp: Date.now(),
      name: `${dish.dishName} (${dish.meal})`,
      dishName: dish.dishName,
      kcal: dish.kcal,
      protein: dish.protein,
      carbs: dish.carbs,
      fats: dish.fats,
      fiber: dish.fiber || 3,
      sugar: dish.sugar || 2,
      sodium: dish.sodium || 220
    };
    setFoodLogs((prev) => [...prev, entry]);
    if (user && db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'foodLogs'), entry);
      } catch (e) {}
    }
    triggerToast(`Logged "${dish.dishName}" (+${dish.protein}g Protein)!`);
  };

  const handleAddBeverageLayer = async () => {
    const bev = BEVERAGE_CATALOG.find((b) => b.id === selectedBeverageId) || BEVERAGE_CATALOG[0];
    const ml = Math.max(10, Number(beverageMlInput) || bev.defaultMl);
    const kcal = Math.round((bev.kcalPer100ml * ml) / 100);
    const sugar = Number(((bev.sugarPer100ml * ml) / 100).toFixed(1));
    const entry = {
      id: `bev-${Date.now()}`,
      dateKey: selectedDate,
      timestamp: Date.now(),
      bevId: bev.id,
      name: bev.name,
      color: bev.color,
      textColor: bev.textColor,
      ml,
      kcal,
      sugar
    };
    setBeverageLogs((prev) => [...prev, entry]);
    if (user && db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'beverageLogs'), entry);
      } catch (e) {}
    }
    triggerToast(`Poured ${ml}ml ${bev.name} (${kcal} kcal)!`);
  };

  const syncGroceryItems = async (nextItems) => {
    setGroceryItems(nextItems);
    setGroceryRawText(nextItems.join(', '));
    if (user && db) {
      const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
      await setDoc(configDocRef, { groceryItems: nextItems }, { merge: true }).catch(() => {});
    }
  };

  const handleCopyGroceryCommaList = () => {
    const str = groceryItems.join(', ');
    const ta = document.createElement('textarea');
    ta.value = str;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    triggerToast('Copied comma list for Swiggy / Zepto / BigBasket!');
  };

  // v3 Competition Zests Handlers
  const handleCreatePublicZest = async () => {
    const code = `SW-${Math.floor(1000 + Math.random() * 9000)}`;
    const title = newZestTitleInput.trim() || `${profile.username}'s Squad Zest`;
    const newZestData = {
      code,
      title,
      createdBy: user?.uid || 'local-user',
      createdAt: Date.now(),
      members: [myLiveZestMemberStats]
    };
    setPublicZests((prev) => [newZestData, ...prev]);
    setActiveZestCode(code);
    setNewZestTitleInput('');
    if (user && db) {
      const zestDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', code);
      await setDoc(zestDocRef, newZestData).catch(() => {});
      await saveUserConfig(profile, workoutSplits, activeSplitId, code);
    }
    triggerToast(`Created Competition Zest "${title}" (Code: ${code})!`);
  };

  const handleJoinPublicZest = async () => {
    const code = joinZestCodeInput.trim().toUpperCase();
    if (!code) return;
    const targetZest = publicZests.find((z) => z.code === code);
    if (!targetZest) {
      triggerToast(`No Zest found with code "${code}". Check the code!`);
      return;
    }
    const existing = Array.isArray(targetZest.members) ? targetZest.members : [];
    const filtered = existing.filter((m) => m.uid !== (user?.uid || 'local-user'));
    const nextMembers = [...filtered, myLiveZestMemberStats];
    setPublicZests((prev) => prev.map((z) => (z.code === code ? { ...z, members: nextMembers } : z)));
    setActiveZestCode(code);
    setJoinZestCodeInput('');
    if (user && db) {
      const zDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', code);
      await setDoc(zDocRef, { members: nextMembers, updatedAt: Date.now() }, { merge: true }).catch(() => {});
      await saveUserConfig(profile, workoutSplits, activeSplitId, code);
    }
    triggerToast(`Joined "${targetZest.title}" (${code})!`);
  };

  const handleAddDemoSquadMates = async () => {
    if (!activeZestObj) return;
    const demoMates = [
      {
        uid: 'demo-volt-ninja',
        username: 'VoltNinja_99',
        avatarEmoji: '🥷',
        weight: 56,
        todayVolumeKg: 5400,
        todayAvgRpe: 9.2,
        todayKcalBurn: 610,
        pureFoodMacroPct: 96,
        pureFoodProteinG: 118,
        waterMl: 2900,
        waterTargetMl: 2600,
        waterPct: 100,
        beveragesCount: 0,
        prDisplay: 'Incline DB (28kg)',
        pbDisplay: 'Leg Press (160kg × 12)',
        sevenDayVolumeKg: 28400,
        sevenDayKcalBurn: 3420,
        updatedAt: Date.now()
      },
      {
        uid: 'demo-titan-tank',
        username: 'TitanTank_88',
        avatarEmoji: '🦖',
        weight: 94,
        todayVolumeKg: 7200,
        todayAvgRpe: 7.0,
        todayKcalBurn: 520,
        pureFoodMacroPct: 72,
        pureFoodProteinG: 135,
        waterMl: 1800,
        waterTargetMl: 3500,
        waterPct: 51,
        beveragesCount: 2,
        prDisplay: 'Bench Press (105kg)',
        pbDisplay: 'Bench Press (95kg × 8)',
        sevenDayVolumeKg: 34100,
        sevenDayKcalBurn: 2890,
        updatedAt: Date.now()
      }
    ].map((m) => {
      const sc = calculateFairZestScore(m);
      return {
        ...m,
        fairZestScore: sc.totalScore,
        sevenDayZestScore: sc.totalScore + Math.round(m.sevenDayVolumeKg / 250 + m.sevenDayKcalBurn / 80),
        scoreBreakdown: sc
      };
    });

    const existing = (activeZestObj.members || []).filter(
      (m) => m.uid !== 'demo-volt-ninja' && m.uid !== 'demo-titan-tank'
    );
    const updatedMembers = [...existing, ...demoMates];
    setPublicZests((prev) =>
      prev.map((z) => (z.code === activeZestObj.code ? { ...z, members: updatedMembers } : z))
    );
    if (user && db) {
      const zDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', activeZestObj.code);
      await setDoc(zDocRef, { members: updatedMembers, updatedAt: Date.now() }, { merge: true }).catch(() => {});
    }
    triggerToast('Added @VoltNinja_99 (56kg) & @TitanTank_88 (94kg) to unlock 3+ Member Track Records!');
  };

  const handleSendZestBubble = async (targetMember, rawTemplateText) => {
    if (!targetMember) return;
    const finalMessage = rawTemplateText.replace(/@username/g, `@${targetMember.username}`);
    const newBubble = {
      id: `bub-${Date.now()}`,
      zestCode: activeZestObj?.code || 'GLOBAL',
      fromUid: user?.uid || 'local-user',
      fromUsername: profile.username,
      fromEmoji: profile.avatarEmoji,
      toUid: targetMember.uid,
      toUsername: targetMember.username,
      message: finalMessage,
      replies: buildSmartRepliesForBubble(profile.username, finalMessage),
      timestamp: Date.now()
    };
    setIncomingBubblesQueue((prev) => [newBubble, ...prev]);
    if (user && db) {
      const bubbleCol = collection(db, 'artifacts', appId, 'public', 'data', 'zestBubbles');
      await addDoc(bubbleCol, newBubble).catch(() => {});
    }
    setSelectedBubbleTarget(null);
    setAiGeneratedBubbleText('');
    triggerToast(`Sent bubble to @${targetMember.username}!`);
  };

  const handleGenerateAiBubble = async (targetMember) => {
    if (!targetMember) return;
    setIsGeneratingAiTaunt(true);
    const apiKey = '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const prompt = `Write a short, punchy 1-sentence gym squad hype or friendly roast bubble for @${targetMember.username}.
Their live stats today:
- Bodyweight: ${targetMember.weight}kg
- Workout Volume: ${targetMember.todayVolumeKg} kgs (Avg RPE: ${targetMember.todayAvgRpe})
- Active Burn: ${targetMember.todayKcalBurn} kcal
- Pure Food Macro Target Hit: ${targetMember.pureFoodMacroPct}% (Protein: ${targetMember.pureFoodProteinG}g)
- Water Logged: ${targetMember.waterMl} / ${targetMember.waterTargetMl} ml
- Other Beverages/Spirits Layers: ${targetMember.beveragesCount || 0}
- PR Today: ${targetMember.prDisplay}
Keep it under 18 words, include @${targetMember.username}, and use 1-2 emojis.`;

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        setAiGeneratedBubbleText(text.replace(/^["']|["']$/g, ''));
      } else {
        throw new Error('Fallback');
      }
    } catch (e) {
      if ((targetMember.todayVolumeKg || 0) === 0) {
        setAiGeneratedBubbleText(
          `@${targetMember.username} sitting at 000 kgs today... taking a rest day or scared of the Zest? 😴👀`
        );
      } else if ((targetMember.beveragesCount || 0) >= 2) {
        setAiGeneratedBubbleText(
          `We see those ${targetMember.beveragesCount} liquid layers in your tank @${targetMember.username} 🥃👀 Better burn it off!`
        );
      } else {
        setAiGeneratedBubbleText(
          `@${targetMember.username} just moved ${targetMember.todayVolumeKg} kgs at RPE ${targetMember.todayAvgRpe} today! Absolute beast mode! 🏗️🔥`
        );
      }
    } finally {
      setIsGeneratingAiTaunt(false);
    }
  };

  const activeUnreadPopupBubble = useMemo(() => {
    return incomingBubblesQueue.find(
      (b) =>
        !dismissedBubbleIds.includes(b.id) &&
        (b.toUsername === profile.username || b.toUid === user?.uid)
    );
  }, [incomingBubblesQueue, dismissedBubbleIds, profile.username, user?.uid]);

  const dismissStartupBubble = async (bubbleId) => {
    const nextDismissed = [...dismissedBubbleIds, bubbleId];
    setDismissedBubbleIds(nextDismissed);
    if (user && db) {
      const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
      await setDoc(configDocRef, { dismissedBubbleIds: nextDismissed }, { merge: true }).catch(() => {});
    }
  };

  // ==========================================
  // v4 REMINDERS & NOTES (RNO) HANDLERS
  // ==========================================
  const openNewReminderForm = () => {
    setEditingReminder({
      id: `rem-${Date.now()}`,
      title: '',
      date: getLocalDateKey(),
      time: '09:00',
      isRepeating: false,
      repeatEvery: '1 DAY', // '1 DAY' | '1 WEEK' | '1 MONTH' | '1 YEAR' | 'CUSTOM'
      customDays: ['M', 'W', 'F'], // M T W H F S U
      repeatUntil: 'INFINITE', // '1 DAY' | '1 WEEK' | '1 MONTH' | '1 YEAR' | 'INFINITE' | 'CUSTOM'
      repeatUntilCustomDate: getLocalDateKey(),
      preRemindMode: 'just_before', // 'every' | 'just_before'
      preRemindInterval: '15 mins'
    });
    setShowRnoPlusPrompt(false);
    setRnoActiveView('reminderForm');
  };

  const openExistingReminder = (rem) => {
    setEditingReminder({ ...rem, customDays: Array.isArray(rem.customDays) ? rem.customDays : [] });
    setRnoActiveView('reminderForm');
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    if (!editingReminder?.title?.trim()) {
      triggerToast('Please enter a Reminder Title!');
      return;
    }
    const cleanRem = {
      ...editingReminder,
      title: editingReminder.title.trim(),
      updatedAt: Date.now()
    };
    setRemindersList((prev) => {
      const exists = prev.some((r) => r.id === cleanRem.id);
      return exists ? prev.map((r) => (r.id === cleanRem.id ? cleanRem : r)) : [cleanRem, ...prev];
    });
    if (user && db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', cleanRem.id), cleanRem);
      } catch (err) {}
    }
    setRnoActiveView('list');
    setRnoOpenSection('reminders');
    triggerToast(`Saved reminder "${cleanRem.title}"!`);
  };

  const handleDeleteReminder = async (remId) => {
    setRemindersList((prev) => prev.filter((r) => r.id !== remId));
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'reminders', remId));
      } catch (err) {}
    }
    setRnoActiveView('list');
    triggerToast('Reminder deleted');
  };

  const openNewNoteForm = () => {
    setEditingNote({
      id: `note-${Date.now()}`,
      title: '',
      body: '',
      voiceClips: [],
      isLocked: false,
      pinCode: ''
    });
    setShowRnoPlusPrompt(false);
    setRnoActiveView('noteForm');
  };

  const handleTapNoteItem = (note) => {
    if (note.isLocked && note.pinCode) {
      setPinUnlockTargetNote(note);
      setPinUnlockInput('');
      setPinUnlockError('');
    } else {
      setEditingNote({ ...note, voiceClips: Array.isArray(note.voiceClips) ? note.voiceClips : [] });
      setRnoActiveView('noteForm');
    }
  };

  const handleVerifyNotePin = (e) => {
    e.preventDefault();
    if (!pinUnlockTargetNote) return;
    if (pinUnlockInput === pinUnlockTargetNote.pinCode) {
      setEditingNote({
        ...pinUnlockTargetNote,
        voiceClips: Array.isArray(pinUnlockTargetNote.voiceClips) ? pinUnlockTargetNote.voiceClips : []
      });
      setPinUnlockTargetNote(null);
      setPinUnlockInput('');
      setPinUnlockError('');
      setRnoActiveView('noteForm');
    } else {
      setPinUnlockError('Incorrect 6-digit PIN. Remember: Lost PINs cannot be reset.');
    }
  };

  const handleToggleSttDictation = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      triggerToast('Speech-to-Text supported in Chrome/Safari/Edge mobile browsers.');
      return;
    }
    if (isSttListening) {
      setIsSttListening(false);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      setIsSttListening(true);
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setEditingNote((prev) => ({
            ...prev,
            body: prev.body ? `${prev.body} ${transcript}` : transcript
          }));
        }
      };
      rec.onend = () => setIsSttListening(false);
      rec.onerror = () => setIsSttListening(false);
      rec.start();
    } catch (err) {
      setIsSttListening(false);
    }
  };

  const handleToggleVoiceRecording = async () => {
    if (isVoiceRecording && mediaRecorderRefState) {
      try {
        mediaRecorderRefState.stop();
      } catch (e) {}
      setIsVoiceRecording(false);
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const simulatedClip = {
        id: `vc-${Date.now()}`,
        label: `Voice Memo (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        audioDataUrl: null
      };
      setEditingNote((prev) => ({
        ...prev,
        voiceClips: [...(prev.voiceClips || []), simulatedClip]
      }));
      triggerToast('Added Voice Memo timestamp!');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          setEditingNote((prev) => ({
            ...prev,
            voiceClips: [
              ...(prev.voiceClips || []),
              {
                id: `vc-${Date.now()}`,
                label: `Voice Note (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
                audioDataUrl: typeof base64Audio === 'string' ? base64Audio : null
              }
            ]
          }));
          triggerToast('Voice recording attached to note!');
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setMediaRecorderRefState(recorder);
      setIsVoiceRecording(true);
    } catch (err) {
      const fallbackClip = {
        id: `vc-${Date.now()}`,
        label: `Voice Memo (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        audioDataUrl: null
      };
      setEditingNote((prev) => ({
        ...prev,
        voiceClips: [...(prev.voiceClips || []), fallbackClip]
      }));
      triggerToast('Mic permission unavailable in preview — saved Voice Memo slot!');
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!editingNote?.title?.trim()) {
      triggerToast('Please enter a Notes Title!');
      return;
    }
    if (editingNote.isLocked && !/^\d{6}$/.test(editingNote.pinCode || '')) {
      triggerToast('Lock Notes requires an exact 6-digit numeric PIN!');
      return;
    }
    const cleanNote = {
      ...editingNote,
      title: editingNote.title.trim(),
      updatedAt: Date.now()
    };
    setNotesList((prev) => {
      const exists = prev.some((n) => n.id === cleanNote.id);
      return exists ? prev.map((n) => (n.id === cleanNote.id ? cleanNote : n)) : [cleanNote, ...prev];
    });
    if (user && db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', cleanNote.id), cleanNote);
      } catch (err) {}
    }
    setRnoActiveView('list');
    setRnoOpenSection('notes');
    triggerToast(`Saved note "${cleanNote.title}"!`);
  };

  const handleDeleteNote = async (noteId) => {
    setNotesList((prev) => prev.filter((n) => n.id !== noteId));
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', noteId));
      } catch (err) {}
    }
    setRnoActiveView('list');
    triggerToast('Note deleted');
  };

  // ==========================================
  // 8. RENDER UI
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-extrabold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-lg tracking-tight leading-none">
                SWI<span className="text-emerald-400">TCH</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Habit Engine
              </p>
            </div>
          </div>

          {/* HEADER ACTIVITY PILL (Dynamic Time-Elapsed Color Fill) */}
          <button
            type="button"
            onClick={() => {
              if (activitySchedule.length === 0) {
                const sample = `[${getTodayWeekdayName()}]\n[Deep Work Sprint - 10:00 : 11:30]\n[Lunch & Hydration - 12:00 : 12:30]\n[Gym Session - 18:00 : 19:30]`;
                if (!activityTypeText) setActivityTypeText(sample);
                setActivityModalTab('edit');
              } else {
                setActivityTypeText(serializeActivitiesToTypeFormat(activitySchedule));
                setActivityModalTab('timeline');
              }
              setShowActivityPillModal(true);
            }}
            className="relative overflow-hidden flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-slate-700/90 bg-slate-900 hover:border-emerald-500/60 text-xs font-bold transition min-w-[135px] max-w-[205px] shadow-inner"
          >
            {/* Dynamic Color Fill Bar based on time passed in current activity */}
            {todayActivityStatus.currentAct && (
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/45 via-teal-500/45 to-emerald-400/45 transition-all duration-500 pointer-events-none"
                style={{ width: `${todayActivityStatus.currentAct.fillPct}%` }}
              />
            )}
            <div className="relative z-10 flex items-center space-x-1.5 truncate w-full justify-between">
              <div className="flex items-center space-x-1.5 truncate">
                <CalendarClock
                  className={`w-3.5 h-3.5 shrink-0 ${
                    todayActivityStatus.currentAct ? 'text-emerald-300 animate-pulse' : 'text-slate-400'
                  }`}
                />
                {activitySchedule.length === 0 ? (
                  <span className="text-slate-300 truncate font-extrabold">+ Activity Pill</span>
                ) : todayActivityStatus.currentAct ? (
                  <span className="text-white font-black truncate">
                    {todayActivityStatus.currentAct.activity}
                  </span>
                ) : todayActivityStatus.nextAct ? (
                  <span className="text-slate-200 truncate">
                    Next: {todayActivityStatus.nextAct.activity} ({todayActivityStatus.nextAct.fromTime})
                  </span>
                ) : (
                  <span className="text-slate-400 truncate">
                    Done ({todayActivityStatus.completedCount}/{todayActivityStatus.todaysList.length})
                  </span>
                )}
              </div>
              {todayActivityStatus.currentAct && (
                <span className="text-[10px] font-mono font-black text-emerald-300 shrink-0 ml-1">
                  {todayActivityStatus.currentAct.fillPct}%
                </span>
              )}
            </div>
          </button>

          {/* Active Workout Resume Pill if Minimized */}
          {activeDraft && !isLoggerOpen && (
            <button
              onClick={() => setIsLoggerOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black animate-pulse shrink-0"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{restSecondsLeft > 0 ? `${restSecondsLeft}s` : 'Logger'}</span>
            </button>
          )}

          {/* Top-Right Profile / Squad Zest Pill */}
          <button
            onClick={() => {
              setShowProfileModal(true);
              setProfileSectionTab(isProfileComplete ? 'leaderboard' : 'settings');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition shrink-0 ${
              isProfileComplete
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:border-emerald-500/50'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-bounce'
            }`}
          >
            <span className="text-base">{profile.avatarEmoji}</span>
            <span className="truncate max-w-[72px] hidden xs:inline">{profile.username}</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </button>
        </div>
      </header>

      {/* ====================================================
          HEADER ACTIVITY PILL MODAL (Timeline + Type Editor + CSV Import)
      ==================================================== */}
      {showActivityPillModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Daily Activity Pill</h3>
                  <p className="text-[11px] text-slate-400">
                    {todayActivityStatus.todayName} • {todayActivityStatus.currentTimeStr} • Alerts 3m before start
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityPillModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-black">
              <button
                type="button"
                onClick={() => setActivityModalTab('timeline')}
                className={`py-2 rounded-xl transition ${
                  activityModalTab === 'timeline' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Today's List
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!activityTypeText && activitySchedule.length > 0) {
                    setActivityTypeText(serializeActivitiesToTypeFormat(activitySchedule));
                  }
                  setActivityModalTab('edit');
                }}
                className={`py-2 rounded-xl transition ${
                  activityModalTab === 'edit' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Type / Edit
              </button>
              <button
                type="button"
                onClick={() => setActivityModalTab('csv')}
                className={`py-2 rounded-xl transition ${
                  activityModalTab === 'csv' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Import .CSV
              </button>
            </div>

            {/* TAB 1: TODAY'S TIMELINE (Completed Greyed Out, Current Colored + Fill, Remaining White) */}
            {activityModalTab === 'timeline' && (
              <div className="space-y-3">
                {todayActivityStatus.todaysList.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
                    <p className="text-xs font-extrabold text-slate-300">
                      No activities scheduled for {todayActivityStatus.todayName} yet.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActivityModalTab('edit')}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs"
                      >
                        Type Activities
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityModalTab('csv')}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs"
                      >
                        Import .CSV
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayActivityStatus.todaysList.map((item) => {
                      if (item.status === 'completed') {
                        // Completed: Greyed out
                        return (
                          <div
                            key={item.id}
                            className="bg-slate-950/60 border border-slate-800/60 rounded-2xl px-4 py-3 flex items-center justify-between opacity-55"
                          >
                            <div className="flex items-center space-x-2.5">
                              <Check className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="text-xs font-bold text-slate-500 line-through">{item.activity}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">
                              {item.fromTime} – {item.toTime}
                            </span>
                          </div>
                        );
                      }

                      if (item.status === 'current') {
                        // Current Activity: Colored with dynamic progress fill
                        return (
                          <div
                            key={item.id}
                            className="relative overflow-hidden bg-slate-950 border-2 border-emerald-400 rounded-2xl px-4 py-3.5 shadow-lg shadow-emerald-500/10"
                          >
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-emerald-400/30 transition-all duration-500 pointer-events-none"
                              style={{ width: `${item.fillPct}%` }}
                            />
                            <div className="relative z-10 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                                  ● Active Now ({item.fillPct}% Elapsed)
                                </span>
                                <span className="text-sm font-black text-emerald-400">{item.activity}</span>
                              </div>
                              <span className="text-xs font-mono font-black text-emerald-300">
                                {item.fromTime} – {item.toTime}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Remaining Activity: Crisp White
                      return (
                        <div
                          key={item.id}
                          className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                            <span className="text-xs font-extrabold text-white">{item.activity}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-white">
                            {item.fromTime} – {item.toTime}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <span>🔔 Automatic notification 3 mins before each activity</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActivityTypeText(serializeActivitiesToTypeFormat(activitySchedule));
                      setActivityModalTab('edit');
                    }}
                    className="text-emerald-400 font-black hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Schedule</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TYPE / EDIT ACTIVITIES IN BRACKET FORMAT */}
            {activityModalTab === 'edit' && (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-[11px] text-slate-300 space-y-1">
                  <p className="font-black text-emerald-400 uppercase text-[10px]">
                    Type Format (Uploaded .CSVs also open here for editing):
                  </p>
                  <pre className="font-mono text-[11px] text-slate-400 whitespace-pre-wrap">
{`[${todayActivityStatus.todayName}]
[Morning Mobility - 08:00 : 08:30]
[Deep Work Block - 12:00 : 12:30]`}
                  </pre>
                </div>

                <textarea
                  rows={8}
                  value={activityTypeText}
                  onChange={(e) => setActivityTypeText(e.target.value)}
                  placeholder={`[${todayActivityStatus.todayName}]\n[Activity 1 - 12:00 : 12:30]\n[Activity 2 - 15:00 : 16:00]`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const startM = now.getHours() * 60 + now.getMinutes() - 10;
                      const endM = startM + 20;
                      const nextM = endM + 3;
                      const demoText = `[${getTodayWeekdayName(now)}]\n[Morning Warmup - 07:00 : 07:30]\n[Current Focus Block - ${formatMinutesToHHMM(
                        startM
                      )} : ${formatMinutesToHHMM(endM)}]\n[Upcoming Sprint - ${formatMinutesToHHMM(
                        nextM
                      )} : ${formatMinutesToHHMM(nextM + 30)}]`;
                      setActivityTypeText(demoText);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px]"
                  >
                    Load Live Demo Now
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTypedActivities}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider"
                  >
                    Save Activity Schedule
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: IMPORT .CSV */}
            {activityModalTab === 'csv' && (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-slate-300">
                  <p className="font-black text-sky-400 uppercase text-[10px]">.CSV Format Instructions:</p>
                  <p className="font-mono text-[11px] text-white">
                    Day, Activity, from time, to time; Day, Activity, from time, to time
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Example: <code className="text-emerald-300">{todayActivityStatus.todayName}, Deep Work, 12:00, 12:30; {todayActivityStatus.todayName}, Gym Session, 18:00, 19:30</code>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Once uploaded, it automatically populates the <b>Type / Edit</b> tab so you can tweak times anytime!
                  </p>
                </div>

                {activityCsvError && (
                  <p className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
                    {activityCsvError}
                  </p>
                )}

                <label className="w-full py-6 rounded-2xl border-2 border-dashed border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10 text-sky-300 font-extrabold flex flex-col items-center justify-center cursor-pointer transition">
                  <Upload className="w-6 h-6 mb-1.5 text-sky-400" />
                  <span>[Upload Activity .CSV]</span>
                  <input type="file" accept=".csv,.txt" onChange={handleActivityCsvUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Startup Pop-up AI / Preset Bubble Stack */}
      {activeUnreadPopupBubble && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Incoming Zest Bubble
              </span>
              <button
                onClick={() => dismissStartupBubble(activeUnreadPopupBubble.id)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="text-base">{activeUnreadPopupBubble.fromEmoji || '🔥'}</span>
                <span>
                  From <b className="text-emerald-400">@{activeUnreadPopupBubble.fromUsername}</b>:
                </span>
              </p>
              <p className="text-sm font-extrabold text-white">"{activeUnreadPopupBubble.message}"</p>
            </div>
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 block">1-Tap Smart Auto-Reply:</span>
              {(
                activeUnreadPopupBubble.replies ||
                buildSmartRepliesForBubble(activeUnreadPopupBubble.fromUsername, activeUnreadPopupBubble.message)
              ).map((replyText, rIdx) => (
                <button
                  key={rIdx}
                  onClick={async () => {
                    await handleSendZestBubble(
                      { uid: activeUnreadPopupBubble.fromUid, username: activeUnreadPopupBubble.fromUsername },
                      replyText
                    );
                    await dismissStartupBubble(activeUnreadPopupBubble.id);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-200 transition"
                >
                  💬 {replyText}
                </button>
              ))}
            </div>
            <button
              onClick={() => dismissStartupBubble(activeUnreadPopupBubble.id)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs"
            >
              [Skip / Next]
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="max-w-lg mx-auto px-4 pt-4 space-y-6">
        {!isProfileComplete && (
          <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border border-amber-500/40 rounded-3xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-extrabold text-white">Setup Required to Unlock SWITCH</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Configure your Athlete Profile & Anonymous Zest Handle in the top-right pill.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowProfileModal(true);
                setProfileSectionTab('settings');
              }}
              className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-lg"
            >
              Setup Now
            </button>
          </div>
        )}

        {/* ====================================================
            TAB 1: FITNESS (Cards 1a, 1b, 1c, 1d, 1e)
        ==================================================== */}
        {bottomTab === 'fitness' && (
          <div className={`space-y-6 ${!isProfileComplete ? 'opacity-50 pointer-events-none select-none' : ''}`}>
            {/* CARD 1a: Flippable Daily Fitness Summary Card */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {showCard1aBack ? '1a • Muscle Fatigue & Burn % (Back)' : '1a • Daily Fitness Summary (Front)'}
                </span>
                <button
                  onClick={() => setShowCard1aBack(!showCard1aBack)}
                  className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-emerald-500/20 transition"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>{showCard1aBack ? 'Flip to Summary' : 'Swipe / Flip Card'}</span>
                </button>
              </div>

              {/* 14-Day Horizontal Date Chain */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
                {dateChain.map((d) => {
                  const active = d.key === selectedDate;
                  return (
                    <button
                      key={d.key}
                      onClick={() => setSelectedDate(d.key)}
                      className={`flex flex-col items-center justify-center min-w-[50px] py-2 px-2 rounded-2xl border text-xs transition shrink-0 ${
                        active
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-950/70 border-slate-800/90 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] uppercase opacity-80">{d.dayName}</span>
                      <span className="text-sm font-extrabold mt-0.5">{d.dayNum}</span>
                    </button>
                  );
                })}
              </div>

              {!showCard1aBack ? (
                <>
                  {/* Hero Volume & Kcal Burn */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/90 border border-slate-800 rounded-2xl p-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Workout Volume
                      </span>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                          {dailySummary.formattedKgs}
                        </span>
                        <span className="text-xs font-bold text-emerald-400">kg</span>
                      </div>
                      <div className="mt-1 space-y-0.5 text-[10px] text-slate-400">
                        <p>
                          PR: <b className="text-slate-200">{dailySummary.prDisplay}</b>
                        </p>
                        <p>
                          PB: <b className="text-slate-200">{dailySummary.pbDisplay}</b>
                        </p>
                      </div>
                    </div>
                    <div className="border-l border-slate-800 pl-4 flex flex-col justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Total Kcal Burn
                      </span>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                          {dailySummary.totalKcal}
                        </span>
                        <span className="text-xs font-bold text-slate-400">kcal</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        W: {dailySummary.workoutKcal} • C: {dailySummary.cardioKcal} • S: {dailySummary.sportsKcal}
                      </span>
                    </div>
                  </div>

                  {/* Daily Breakdown Lists */}
                  <div className="space-y-2 text-xs">
                    {dailySummary.flatExercises.length > 0 && (
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-400">Workout Breakdown</span>
                        {dailySummary.flatExercises.map((ex, i) => (
                          <div key={i} className="flex justify-between text-slate-300">
                            <span>
                              {ex.name} ({ex.setsCount} sets)
                            </span>
                            <span className="font-mono text-slate-400">{ex.bestSetLabel}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {dailySummary.dayCardio.length > 0 && (
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-amber-400">
                          Cardio Logged ({dailySummary.cardioKcal} kcal)
                        </span>
                        {dailySummary.dayCardio.map((c, i) => (
                          <div key={i} className="flex justify-between text-slate-300">
                            <span>
                              {c.name} ({c.durationMins}m • {c.distanceKm}km)
                            </span>
                            <span className="font-mono text-amber-300">{c.kcalBurned} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {dailySummary.daySports.length > 0 && (
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-teal-400">
                          Sports Played ({dailySummary.sportsKcal} kcal)
                        </span>
                        {dailySummary.daySports.map((s, i) => (
                          <div key={i} className="flex justify-between text-slate-300">
                            <span>
                              {s.name} ({s.durationMins}m • RPE {s.rpe})
                            </span>
                            <span className="font-mono text-teal-300">{s.kcalBurned} kcal</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Back of Card 1a: Muscle Fatigue Map + Burn % */
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs">
                    <span className="text-slate-400 font-bold">Daily Active Burn Target</span>
                    <span className="font-black text-amber-400 font-mono">{dailySummary.burnPercent}% Achieved</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/85 border border-slate-800 rounded-2xl p-3">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 mb-1">Anterior</span>
                      <svg viewBox="0 0 120 220" className="w-24 h-36">
                        <circle cx="60" cy="20" r="12" fill="#334155" />
                        <rect
                          x="26"
                          y="36"
                          width="14"
                          height="18"
                          rx="6"
                          fill={dailySummary.combinedMuscles['Shoulders'] ? '#f43f5e' : '#1e293b'}
                        />
                        <rect
                          x="80"
                          y="36"
                          width="14"
                          height="18"
                          rx="6"
                          fill={dailySummary.combinedMuscles['Shoulders'] ? '#f43f5e' : '#1e293b'}
                        />
                        <rect
                          x="42"
                          y="36"
                          width="36"
                          height="24"
                          rx="5"
                          fill={dailySummary.combinedMuscles['Chest'] ? '#f43f5e' : '#1e293b'}
                        />
                        <rect
                          x="44"
                          y="62"
                          width="32"
                          height="38"
                          rx="5"
                          fill={dailySummary.combinedMuscles['Core'] ? '#f43f5e' : '#1e293b'}
                        />
                        <rect
                          x="40"
                          y="104"
                          width="17"
                          height="52"
                          rx="7"
                          fill={dailySummary.combinedMuscles['Quads'] ? '#f43f5e' : '#1e293b'}
                        />
                        <rect
                          x="63"
                          y="104"
                          width="17"
                          height="52"
                          rx="7"
                          fill={dailySummary.combinedMuscles['Quads'] ? '#f43f5e' : '#1e293b'}
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 mb-1">Posterior</span>
                      <svg viewBox="0 0 120 220" className="w-24 h-36">
                        <circle cx="60" cy="20" r="12" fill="#334155" />
                        <polygon
                          points="40,36 80,36 74,88 46,88"
                          fill={dailySummary.combinedMuscles['Back'] ? '#f43f5e' : '#1e293b'}
                        />
                        <rect
                          x="41"
                          y="90"
                          width="38"
                          height="22"
                          rx="8"
                          fill={dailySummary.combinedMuscles['Glutes'] ? '#f43f5e' : '#1e293b'}
                        />
                        <rect
                          x="41"
                          y="115"
                          width="17"
                          height="42"
                          rx="6"
                          fill={dailySummary.combinedMuscles['Hamstrings'] ? '#f43f5e' : '#1e293b'}
                        />
                        <rect
                          x="62"
                          y="115"
                          width="17"
                          height="42"
                          rx="6"
                          fill={dailySummary.combinedMuscles['Hamstrings'] ? '#f43f5e' : '#1e293b'}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 1b: Generic Workout Logger & Split Buttons */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    1b • Generic Workout Logger
                  </span>
                  <h3 className="text-base font-black text-white mt-1.5">
                    {activeSplit ? activeSplit.title : 'No Routine Set'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowRoutineChoiceModal(true);
                    setRoutineSubPage(null);
                  }}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 transition flex items-center gap-1 text-xs font-bold"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Switch / Edit Plan</span>
                </button>
              </div>

              {!activeSplit ? (
                <button
                  onClick={() => {
                    setShowRoutineChoiceModal(true);
                    setRoutineSubPage(null);
                  }}
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg"
                >
                  [Create Workout Routine]
                </button>
              ) : (
                <div className="space-y-3">
                  {workoutSplits.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {workoutSplits.map((sp) => (
                        <button
                          key={sp.id}
                          onClick={() => setActiveSplitId(sp.id)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold border shrink-0 ${
                            activeSplit.id === sp.id
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          {sp.title}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(activeSplit.sessions || []).map((sess, idx) => (
                      <button
                        key={sess.id || idx}
                        onClick={() => startSessionFromSplit(sess)}
                        className="bg-slate-950 hover:bg-emerald-500/15 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3.5 text-left transition group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-white group-hover:text-emerald-400">
                            [{sess.sessionName}]
                          </span>
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          {(sess.exercises || []).map((e) => (typeof e === 'string' ? e : e.name)).join(', ')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CARD 1c: Cardio Tracker Card */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  1c • Cardio Logger Card
                </span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CARDIO_TYPES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCardioId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition ${
                      selectedCardioId === c.id
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-400">Time (HH:MM)</span>
                    <span className="text-white font-mono">
                      {String(Math.floor(cardioDurationMins / 60)).padStart(2, '0')}:
                      {String(cardioDurationMins % 60).padStart(2, '0')} ({cardioDurationMins}m)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={cardioDurationMins}
                    onChange={(e) => setCardioDurationMins(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-400">Distance</span>
                    <span className="text-white font-mono">{cardioDistanceKm.toFixed(2)} km</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="25"
                    step="0.25"
                    value={cardioDistanceKm}
                    onChange={(e) => setCardioDistanceKm(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-400">Resistance / Incline</span>
                    <span className="text-white font-mono">
                      {cardioResistance >= 21 ? '20+ Max' : `Level ${cardioResistance}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="21"
                    step="1"
                    value={cardioResistance}
                    onChange={(e) => setCardioResistance(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3">
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated Output</span>
                  <span className="font-black text-amber-400 text-sm">
                    {Math.round(
                      (CARDIO_TYPES.find((c) => c.id === selectedCardioId)?.baseMet || 5) *
                        (1 + cardioResistance * 0.03) *
                        (Number(profile.weight) || 75) *
                        (cardioDurationMins / 60)
                    )}{' '}
                    kcal • ~
                    {Math.round(
                      (CARDIO_TYPES.find((c) => c.id === selectedCardioId)?.stepsPerMin || 0) * cardioDurationMins
                    )}{' '}
                    steps
                  </span>
                </div>
                <button
                  onClick={handleLogCardio}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow"
                >
                  + Log Cardio
                </button>
              </div>
            </div>

            {/* CARD 1d: Sports Tracker Card */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
                  1d • Sports Tracker Card (Time × RPE)
                </span>
                <Activity className="w-4 h-4 text-teal-400" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {SPORTS_TYPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSportId(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition ${
                      selectedSportId === s.id
                        ? 'bg-teal-400 text-slate-950 border-teal-300 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-400">Match / Session Duration</span>
                    <span className="text-white font-mono">{sportDurationMins} mins</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={sportDurationMins}
                    onChange={(e) => setSportDurationMins(Number(e.target.value))}
                    className="w-full accent-teal-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-400">Intensity RPE (1 - 10)</span>
                    <span className="text-white font-mono">RPE {sportRpe} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={sportRpe}
                    onChange={(e) => setSportRpe(Number(e.target.value))}
                    className="w-full accent-teal-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3">
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">sRPE Training Load</span>
                  <span className="font-black text-teal-400 text-sm">
                    Load {Math.round(sportDurationMins * sportRpe)} AU •{' '}
                    {Math.round(
                      (SPORTS_TYPES.find((s) => s.id === selectedSportId)?.baseMet || 6.5) *
                        (0.75 + (sportRpe / 10) * 0.5) *
                        (Number(profile.weight) || 75) *
                        (sportDurationMins / 60)
                    )}{' '}
                    kcal
                  </span>
                </div>
                <button
                  onClick={handleLogSports}
                  className="bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow"
                >
                  + Log Sport
                </button>
              </div>
            </div>

            {/* CARD 1e: The Biometric & Thermodynamic Trajectory Tracker */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    1e • The Biometric Tracker
                  </span>
                  <h3 className="text-base font-black text-white mt-1">Goal vs. Actual vs. Thermodynamic Projection</h3>
                </div>
                <button
                  onClick={() => setShowMathInspector(!showMathInspector)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sky-400 text-[11px] font-bold flex items-center gap-1"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{showMathInspector ? 'Hide Math' : 'Inspect Math'}</span>
                </button>
              </div>

              {showMathInspector && (
                <div className="bg-slate-950 border border-sky-500/30 rounded-2xl p-3.5 text-[11px] space-y-1.5 text-slate-300">
                  <p className="font-black text-sky-400 uppercase text-[10px]">
                    Live Mifflin-St Jeor & Wishnofsky (7,700 kcal/kg) Engine:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      BMR: <b className="text-white font-mono">{biometricEngine.bmr} kcal/d</b>
                    </div>
                    <div>
                      Base TDEE: <b className="text-white font-mono">{biometricEngine.sedTdee} kcal/d</b>
                    </div>
                    <div>
                      RFM Body Fat: <b className="text-emerald-400 font-mono">{biometricEngine.rfmBodyFatPct}%</b>
                    </div>
                    <div>
                      Wrist Frame Ratio: <b className="text-amber-400 font-mono">{biometricEngine.wristFrameRatio}</b>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    Horizon: {biometricEngine.deadlineDays} days • Required Daily Slope:{' '}
                    <b className="text-white">{biometricEngine.requiredDailyKcalDelta} kcal/day</b>
                  </p>
                </div>
              )}

              {/* Metric Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'weight', label: 'Weight (kg)' },
                  { id: 'waist', label: 'Waist (cm)' },
                  { id: 'belly', label: 'Belly (cm)' },
                  { id: 'chest', label: 'Chest (cm)' },
                  { id: 'wrist', label: 'Wrist (cm)' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedTrackerMetric(m.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold border shrink-0 ${
                      selectedTrackerMetric === m.id
                        ? 'bg-sky-400 text-slate-950 border-sky-300 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* 3-Line SVG Trajectory Graph */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-emerald-400">● Actual Logged</span>
                  <span className="text-slate-400">-- Target Goal Slope</span>
                  <span className="text-amber-400">● Burn + Macro Projection</span>
                </div>
                {(() => {
                  const pts = biometricEngine.points;
                  const allVals = pts.flatMap((p) => [p.actual, p.target, p.proj]);
                  const minV = Math.min(...allVals) - 1.5;
                  const maxV = Math.max(...allVals) + 1.5;
                  const span = Math.max(1, maxV - minV);
                  const toX = (i) => 24 + (i / Math.max(1, pts.length - 1)) * 270;
                  const toY = (v) => 110 - ((v - minV) / span) * 90;

                  const actualPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.actual)}`).join(' ');
                  const targetPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.target)}`).join(' ');
                  const projPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.proj)}`).join(' ');

                  return (
                    <svg viewBox="0 0 315 125" className="w-full h-36">
                      <path d={targetPath} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
                      <path d={projPath} fill="none" stroke="#fbbf24" strokeWidth="2.2" />
                      <path d={actualPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={toX(i)} cy={toY(p.actual)} r="3.5" fill="#10b981" />
                          <circle cx={toX(i)} cy={toY(p.proj)} r="3" fill="#fbbf24" />
                        </g>
                      ))}
                    </svg>
                  );
                })()}
              </div>

              {/* Log New Biometrics Form */}
              <form onSubmit={handleLogBodyMetrics} className="grid grid-cols-5 gap-1.5 text-xs">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Kg"
                  value={trackerInput.weight}
                  onChange={(e) => setTrackerInput({ ...trackerInput, weight: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-center text-white font-bold"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Chest"
                  value={trackerInput.chest}
                  onChange={(e) => setTrackerInput({ ...trackerInput, chest: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-center text-white font-bold"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Waist"
                  value={trackerInput.waist}
                  onChange={(e) => setTrackerInput({ ...trackerInput, waist: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-center text-white font-bold"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Belly"
                  value={trackerInput.belly}
                  onChange={(e) => setTrackerInput({ ...trackerInput, belly: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-center text-white font-bold"
                />
                <button
                  type="submit"
                  className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-black rounded-xl text-[11px]"
                >
                  + Log
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB 2: MACROS (Concept 3 Circular Dials + Cards 2, 3, 5, 6)
        ==================================================== */}
        {bottomTab === 'macros' && (
          <div className="space-y-6">
            {/* CARD 1: Macro Summary Card (Locked to Concept 3: Circular Dials) */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Card 1 • Daily Macro & Micro Dials
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  Pure Food Hit: <b className="text-emerald-400">{dailyMacroSummary.pureFoodMacroPct}%</b>
                </span>
              </div>

              {/* Date Chain */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
                {dateChain.map((d) => {
                  const active = d.key === selectedDate;
                  return (
                    <button
                      key={d.key}
                      onClick={() => setSelectedDate(d.key)}
                      className={`flex flex-col items-center justify-center min-w-[50px] py-2 px-2 rounded-2xl border text-xs transition shrink-0 ${
                        active
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-950/70 border-slate-800/90 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] uppercase opacity-80">{d.dayName}</span>
                      <span className="text-sm font-extrabold mt-0.5">{d.dayNum}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dual Hero Header: Consumed vs Required Kcal */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Consumed / Target</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white font-mono">{dailyMacroSummary.consumedKcal}</span>
                    <span className="text-xs text-slate-400 font-mono">/ {dailyMacroSummary.requiredKcal} kcal</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {dailyMacroSummary.kcalDiff >= 0
                      ? `${dailyMacroSummary.kcalDiff} kcal remaining`
                      : `${Math.abs(dailyMacroSummary.kcalDiff)} kcal over`}
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Hydration & Spirits</span>
                  <p className="text-xs font-extrabold text-sky-400 mt-1">
                    💧 {dailyMacroSummary.currentWaterMl} / {dailyMacroSummary.waterTargetMl} ml
                  </p>
                  <p className="text-[10px] text-amber-400 font-bold">
                    🥃 {dailyMacroSummary.dayBevs.length} Beverage Layers ({dailyMacroSummary.bevKcal} kcal)
                  </p>
                </div>
              </div>

              {/* Concept 3: 4 Circular Dials (Protein, Carbs, Fats, Micros) */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-3">
                {[
                  {
                    label: 'Protein',
                    val: `${dailyMacroSummary.proteinG}g`,
                    sub: `/ ${dailyMacroSummary.proteinTargetG}g`,
                    pct: dailyMacroSummary.proteinPct,
                    color: '#10b981'
                  },
                  {
                    label: 'Carbs',
                    val: `${dailyMacroSummary.carbsG}g`,
                    sub: `/ ${dailyMacroSummary.carbsTargetG}g`,
                    pct: dailyMacroSummary.carbsPct,
                    color: '#38bdf8'
                  },
                  {
                    label: 'Fats',
                    val: `${dailyMacroSummary.fatsG}g`,
                    sub: `/ ${dailyMacroSummary.fatsTargetG}g`,
                    pct: dailyMacroSummary.fatsPct,
                    color: '#fbbf24'
                  },
                  {
                    label: 'Micros',
                    val: `${dailyMacroSummary.fiberG}g`,
                    sub: `Fib • ${dailyMacroSummary.sodiumMg}mg Na`,
                    pct: dailyMacroSummary.microsScorePct,
                    color: '#a855f7'
                  }
                ].map((dial, idx) => {
                  const radius = 24;
                  const circum = 2 * Math.PI * radius;
                  const dashOffset = circum - (Math.min(100, dial.pct) / 100) * circum;
                  return (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r={radius} stroke="#1e293b" strokeWidth="5" fill="none" />
                          <circle
                            cx="30"
                            cy="30"
                            r={radius}
                            stroke={dial.color}
                            strokeWidth="5"
                            strokeDasharray={circum}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-black text-white font-mono">{dial.val}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-200 mt-1">{dial.label}</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-full">{dial.sub}</span>
                    </div>
                  );
                })}
              </div>

              {/* Logged Foods & Beverages List */}
              {(dailyMacroSummary.dayFoods.length > 0 || dailyMacroSummary.dayBevs.length > 0) && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase text-emerald-400 block">Today's Logged Intake</span>
                  {dailyMacroSummary.dayFoods.map((f, i) => (
                    <div key={f.id || i} className="flex justify-between text-slate-300">
                      <span className="truncate pr-2">{f.name}</span>
                      <span className="font-mono text-emerald-300 shrink-0">
                        {f.kcal} kcal • {f.protein}g P
                      </span>
                    </div>
                  ))}
                  {dailyMacroSummary.dayBevs.map((b, i) => (
                    <div key={b.id || i} className="flex justify-between text-amber-300">
                      <span>
                        🥃 {b.name} ({b.ml}ml)
                      </span>
                      <span className="font-mono">{b.kcal} kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD 2: Food Tracker Card (Hybrid Manual Parser + Structure 1 CSV Meal Buttons) */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Card 2 • Food & Meal Tracker
                </span>
                <Utensils className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-black">
                <button
                  onClick={() => setFoodInputMode('manual')}
                  className={`py-2 rounded-xl transition ${
                    foodInputMode === 'manual' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  [Manually Enter Meals]
                </button>
                <button
                  onClick={() => setFoodInputMode('csv')}
                  className={`py-2 rounded-xl transition ${
                    foodInputMode === 'csv' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  [Meal Plan & .CSV]
                </button>
              </div>

              {foodInputMode === 'manual' ? (
                <div className="space-y-3 text-xs">
                  <label className="text-[11px] text-slate-400 block">
                    Type comma-separated items (<b className="text-emerald-400">item - quantity</b>):
                  </label>
                  <textarea
                    rows={2}
                    value={manualRawText}
                    onChange={(e) => {
                      setManualRawText(e.target.value);
                      setManualParsedRows(parseFoodTextToRows(e.target.value));
                    }}
                    placeholder="chicken curry - 200g, chapatti - 2 pieces, eggs whole - 2 pieces..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white font-semibold"
                  />

                  {/* Structured Rows (Approach 2 Synced) */}
                  <div className="space-y-1.5">
                    {manualParsedRows.map((row, idx) => (
                      <div key={row.id || idx} className="grid grid-cols-12 gap-1.5 items-center">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => {
                            const next = [...manualParsedRows];
                            next[idx].name = e.target.value;
                            setManualParsedRows(next);
                          }}
                          className="col-span-6 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-bold"
                        />
                        <input
                          type="number"
                          value={row.qty}
                          onChange={(e) => {
                            const next = [...manualParsedRows];
                            next[idx].qty = Number(e.target.value);
                            setManualParsedRows(next);
                          }}
                          className="col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-center text-emerald-400 font-bold"
                        />
                        <select
                          value={row.unit}
                          onChange={(e) => {
                            const next = [...manualParsedRows];
                            next[idx].unit = e.target.value;
                            setManualParsedRows(next);
                          }}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-1 py-1.5 text-slate-300"
                        >
                          <option value="g">g</option>
                          <option value="pieces">pcs</option>
                          <option value="ml">ml</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setManualParsedRows(manualParsedRows.filter((_, i) => i !== idx))}
                          className="col-span-1 text-slate-500 hover:text-rose-400 flex justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setManualParsedRows([
                          ...manualParsedRows,
                          { id: `row-${Date.now()}`, name: 'Eggs Whole', qty: 2, unit: 'pieces' }
                        ])
                      }
                      className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold"
                    >
                      + Add More
                    </button>
                    <button
                      type="button"
                      disabled={isLoggingFood}
                      onClick={handleLogManualFoods}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                    >
                      {isLoggingFood ? 'Calculating Macros...' : 'Calculate & Log Meals'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {/* Meal Category Buttons: [Breakfast] [Lunch] [Dinner] */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {Object.keys(dailyMacroSummary.mealGroups).map((mealName) => (
                      <button
                        key={mealName}
                        onClick={() => setExpandedMealCategory(mealName)}
                        className={`px-3.5 py-2 rounded-xl font-black border transition ${
                          expandedMealCategory === mealName
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        [{mealName}]
                      </button>
                    ))}
                  </div>

                  {/* Dishes inside Selected Meal Category */}
                  <div className="space-y-2">
                    {(dailyMacroSummary.mealGroups[expandedMealCategory] || []).map((dish) => {
                      const countConsumed =
                        dailyMacroSummary.consumedDishCounts[(dish.dishName || '').toLowerCase()] || 0;
                      return (
                        <button
                          key={dish.id}
                          onClick={() => handleQuickLogCsvDish(dish)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between ${
                            countConsumed > 0
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                              : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm">{dish.dishName}</span>
                              {countConsumed > 0 && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                                  Consumed ×{countConsumed} (Tap to Add Again)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{dish.ingredientsText}</p>
                          </div>
                          <div className="text-right font-mono shrink-0 ml-2">
                            <span className="font-black text-emerald-400 block">{dish.kcal} kcal</span>
                            <span className="text-[10px] text-slate-300">{dish.protein}g Protein</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Upload Custom Structure 1 CSV */}
                  {mealCsvError && <p className="text-rose-400 font-bold">{mealCsvError}</p>}
                  <label className="w-full py-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500/50 text-slate-300 font-bold flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Custom Meal .CSV (Meal, Dish, Ing - Qty...)</span>
                    <input type="file" accept=".csv" onChange={handleMealCsvUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* CARD 3: Water Logger (Synced with Workout Water Logger) */}
            <div className="relative overflow-hidden bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl">
              {/* Rising Water Fill Background */}
              <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-500/25 via-sky-500/15 to-transparent transition-all duration-500 pointer-events-none"
                style={{ height: `${dailyMacroSummary.waterPercent}%` }}
              />
              <div className="relative z-10 flex items-center justify-between gap-3">
                <button
                  onClick={() => updateDailyWaterTotal(selectedDate, -100)}
                  className="w-14 h-14 rounded-2xl bg-slate-950/90 hover:bg-slate-800 border border-slate-700 text-white font-black text-sm shrink-0 shadow-lg"
                >
                  -100ml
                </button>
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                    Card 3 • Synced Water Tank
                  </span>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">
                    {dailyMacroSummary.currentWaterMl}{' '}
                    <span className="text-xs text-sky-300">/ {dailyMacroSummary.waterTargetMl} ml</span>
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Sweet Spot: 2,500 – 4,000 ml ({dailyMacroSummary.waterPercent}%)
                  </span>
                </div>
                <button
                  onClick={() => updateDailyWaterTotal(selectedDate, 100)}
                  className="w-14 h-14 rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-sm shrink-0 shadow-lg shadow-sky-500/20"
                >
                  +100ml
                </button>
              </div>
            </div>

            {/* CARD 5: Other Beverages Tracker (Layered Liquid Tank with Overflow) */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Card 5 • Other Beverages & Spirits Tank
                </span>
                <Wine className="w-4 h-4 text-amber-400" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {BEVERAGE_CATALOG.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBeverageId(b.id);
                      setBeverageMlInput(b.defaultMl);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition ${
                      selectedBeverageId === b.id
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 text-xs">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex-1">
                  <span className="text-slate-400 font-bold mr-2">Pour Volume (ml):</span>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={beverageMlInput}
                    onChange={(e) => setBeverageMlInput(Number(e.target.value))}
                    className="w-full bg-transparent text-white font-black font-mono focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleAddBeverageLayer}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black"
                >
                  + [Add Layer]
                </button>
              </div>

              {/* Rectangular Liquid Tank (Overflows oldest bottom layers when > 6 layers) */}
              <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl h-44 flex flex-col justify-end overflow-hidden p-1.5 space-y-1">
                {dailyMacroSummary.dayBevs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 font-bold">
                    Tank Empty Today (Water Excluded)
                  </div>
                ) : (
                  dailyMacroSummary.dayBevs.slice(-6).map((layer) => (
                    <div
                      key={layer.id}
                      style={{ backgroundColor: layer.color, color: layer.textColor }}
                      className="w-full py-1.5 px-3 rounded-xl text-[11px] font-black flex items-center justify-between shadow-inner transition-all"
                    >
                      <span>
                        {layer.name} ({layer.ml}ml)
                      </span>
                      <span className="font-mono">{layer.kcal} kcal</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CARD 6: Grocery List (Swiggy / Zepto / BigBasket Comma-Separated Sync) */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Card 6 • Quick-Commerce Grocery List
                </span>
                <button
                  onClick={handleCopyGroceryCommaList}
                  className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Comma List</span>
                </button>
              </div>

              <textarea
                rows={2}
                value={groceryRawText}
                onChange={(e) => {
                  const val = e.target.value;
                  setGroceryRawText(val);
                  const list = val
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setGroceryItems(list);
                }}
                placeholder="chicken breast, eggs, chapatti flour, milk..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white font-semibold"
              />

              <div className="flex flex-wrap gap-2">
                {groceryItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => syncGroceryItems(groceryItems.filter((_, i) => i !== idx))}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/40 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <span className="w-3.5 h-3.5 rounded border border-emerald-400 flex items-center justify-center text-[9px] text-emerald-400">
                      ✓
                    </span>
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB 3: RNO (v4 - Reminders & Notes Accordion + Editors)
        ==================================================== */}
        {bottomTab === 'rno' && (
          <div className="space-y-5 relative pb-12">
            {/* MAIN DROPDOWN ACCORDION VIEW */}
            {rnoActiveView === 'list' && (
              <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      v4 • RNO Command Center
                    </span>
                    <h2 className="text-base font-black text-white mt-1.5">Reminders & Notes</h2>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {remindersList.length} Rem • {notesList.length} Notes
                  </span>
                </div>

                {/* REMINDERS DROPDOWN SECTION */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setRnoOpenSection(rnoOpenSection === 'reminders' ? 'notes' : 'reminders')}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-900/70 transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="font-black text-sm text-white tracking-wide">Reminders</span>
                      <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {remindersList.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        rnoOpenSection === 'reminders' ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>

                  {rnoOpenSection === 'reminders' && (
                    <div className="border-t border-slate-800/90 divide-y divide-slate-800/60 px-3 py-2 space-y-1">
                      {remindersList.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center font-semibold">
                          No reminders yet. Tap the + button at the bottom right to create one.
                        </p>
                      ) : (
                        remindersList.map((rem, idx) => (
                          <button
                            key={rem.id || idx}
                            type="button"
                            onClick={() => openExistingReminder(rem)}
                            className="w-full py-2.5 px-2 flex items-center justify-between text-xs hover:bg-slate-900 rounded-xl transition group"
                          >
                            <div className="flex items-center min-w-0 flex-1 pr-2">
                              <span className="font-extrabold text-slate-100 group-hover:text-emerald-400 truncate">
                                {rem.title}
                              </span>
                              <span className="flex-1 border-b border-dotted border-slate-700 mx-2 mt-1" />
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {rem.time} {rem.isRepeating ? `(${rem.repeatEvery})` : ''}
                              </span>
                            </div>
                            <span className="font-mono font-black text-emerald-400 shrink-0">[&gt;]</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* HORIZONTAL DIVIDER */}
                <div className="border-t border-slate-800/80" />

                {/* NOTES DROPDOWN SECTION */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setRnoOpenSection(rnoOpenSection === 'notes' ? 'reminders' : 'notes')}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-900/70 transition"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="font-black text-sm text-white tracking-wide">Notes</span>
                      <span className="text-[10px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                        {notesList.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        rnoOpenSection === 'notes' ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  {rnoOpenSection === 'notes' && (
                    <div className="border-t border-slate-800/90 divide-y divide-slate-800/60 px-3 py-2 space-y-1">
                      {notesList.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center font-semibold">
                          No notes yet. Tap the + button at the bottom right to create one.
                        </p>
                      ) : (
                        notesList.map((note, idx) => (
                          <button
                            key={note.id || idx}
                            type="button"
                            onClick={() => handleTapNoteItem(note)}
                            className="w-full py-2.5 px-2 flex items-center justify-between text-xs hover:bg-slate-900 rounded-xl transition group"
                          >
                            <div className="flex items-center min-w-0 flex-1 pr-2">
                              {note.isLocked && <Lock className="w-3.5 h-3.5 text-rose-400 mr-1.5 shrink-0" />}
                              <span className="font-extrabold text-slate-100 group-hover:text-amber-400 truncate">
                                {note.title}
                              </span>
                              <span className="flex-1 border-b border-dotted border-slate-700 mx-2 mt-1" />
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {note.isLocked
                                  ? 'PIN Locked'
                                  : note.voiceClips?.length
                                  ? `🎤 ${note.voiceClips.length}`
                                  : 'Open'}
                              </span>
                            </div>
                            <span className="font-mono font-black text-amber-400 shrink-0">[&gt;]</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REMINDER "WILL HAVE" DETAIL / EDITOR PAGE */}
            {rnoActiveView === 'reminderForm' && editingReminder && (
              <form
                onSubmit={handleSaveReminder}
                className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <button
                    type="button"
                    onClick={() => setRnoActiveView('list')}
                    className="flex items-center space-x-1.5 text-slate-400 hover:text-white font-bold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to RNO</span>
                  </button>
                  <span className="text-[11px] font-black uppercase text-emerald-400">Reminder Settings</span>
                  {remindersList.some((r) => r.id === editingReminder.id) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(editingReminder.id)}
                      className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Reminder Title */}
                <div>
                  <label className="font-black text-slate-300 uppercase text-[10px] block mb-1">Reminder Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Take Evening Creatine & Drink 500ml Water"
                    value={editingReminder.title}
                    onChange={(e) => setEditingReminder({ ...editingReminder, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold"
                  />
                </div>

                {/* Date & Time + Repeating Toggle */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-black text-slate-300 uppercase text-[10px] block mb-1">Reminder Date</label>
                    <input
                      type="date"
                      value={editingReminder.date}
                      onChange={(e) => setEditingReminder({ ...editingReminder, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-black text-slate-300 uppercase text-[10px] block mb-1">Reminder Time</label>
                    <input
                      type="time"
                      value={editingReminder.time}
                      onChange={(e) => setEditingReminder({ ...editingReminder, time: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Repeating Switch */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white">Repeating Reminder?</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingReminder({ ...editingReminder, isRepeating: !editingReminder.isRepeating })
                      }
                      className={`px-3 py-1 rounded-full font-black text-[11px] transition ${
                        editingReminder.isRepeating
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {editingReminder.isRepeating ? 'REPEATING ON' : 'ONE-TIME'}
                    </button>
                  </div>

                  {editingReminder.isRepeating && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      {/* Repeating Every: 1 DAY / WEEK / MONTH / YEAR / CUSTOM */}
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                          Repeating Every
                        </span>
                        <div className="grid grid-cols-5 gap-1.5">
                          {['1 DAY', '1 WEEK', '1 MONTH', '1 YEAR', 'CUSTOM'].map((freq) => (
                            <button
                              key={freq}
                              type="button"
                              onClick={() => setEditingReminder({ ...editingReminder, repeatEvery: freq })}
                              className={`py-2 px-1 rounded-xl font-black text-[10px] border transition ${
                                editingReminder.repeatEvery === freq
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* If CUSTOM: M T W H F S U */}
                      {editingReminder.repeatEvery === 'CUSTOM' && (
                        <div>
                          <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1.5">
                            Select Custom Days (M T W H F S U)
                          </span>
                          <div className="grid grid-cols-7 gap-1.5">
                            {['M', 'T', 'W', 'H', 'F', 'S', 'U'].map((dayCode) => {
                              const selected = (editingReminder.customDays || []).includes(dayCode);
                              return (
                                <button
                                  key={dayCode}
                                  type="button"
                                  onClick={() => {
                                    const current = editingReminder.customDays || [];
                                    const nextDays = selected
                                      ? current.filter((d) => d !== dayCode)
                                      : [...current, dayCode];
                                    setEditingReminder({ ...editingReminder, customDays: nextDays });
                                  }}
                                  className={`py-2 rounded-xl font-black text-xs border transition ${
                                    selected
                                      ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow'
                                      : 'bg-slate-900 border-slate-800 text-slate-400'
                                  }`}
                                >
                                  {dayCode}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Repeating Until: 1 DAY / WEEK / MONTH / YEAR / INFINITE / CUSTOM */}
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                          Repeating Until
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {['1 DAY', '1 WEEK', '1 MONTH', '1 YEAR', 'INFINITE', 'CUSTOM'].map((untilOpt) => (
                            <button
                              key={untilOpt}
                              type="button"
                              onClick={() => setEditingReminder({ ...editingReminder, repeatUntil: untilOpt })}
                              className={`py-2 px-1 rounded-xl font-black text-[10px] border transition ${
                                editingReminder.repeatUntil === untilOpt
                                  ? 'bg-sky-400 text-slate-950 border-sky-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              {untilOpt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {editingReminder.repeatUntil === 'CUSTOM' && (
                        <div>
                          <label className="text-[10px] font-bold uppercase text-sky-400 block mb-1">
                            Select Custom End Date
                          </label>
                          <input
                            type="date"
                            value={editingReminder.repeatUntilCustomDate || getLocalDateKey()}
                            onChange={(e) =>
                              setEditingReminder({ ...editingReminder, repeatUntilCustomDate: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pre-Remind Me: [Every / Just Before] + 15m / 30m / 45m / 1h / 3h ... Every Day */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white">Pre-Remind Me</span>
                    <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-black">
                      <button
                        type="button"
                        onClick={() => setEditingReminder({ ...editingReminder, preRemindMode: 'every' })}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          editingReminder.preRemindMode === 'every'
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-slate-400'
                        }`}
                      >
                        [Every]
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingReminder({ ...editingReminder, preRemindMode: 'just_before' })}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          editingReminder.preRemindMode === 'just_before'
                            ? 'bg-amber-400 text-slate-950'
                            : 'text-slate-400'
                        }`}
                      >
                        [Just Before]
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      '15 mins',
                      '30 mins',
                      '45 mins',
                      '1 hour',
                      '3 hours',
                      '6 hours',
                      '12 hours',
                      'Every day'
                    ].map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setEditingReminder({ ...editingReminder, preRemindInterval: interval })}
                        className={`py-2 px-1 rounded-xl font-bold text-[10px] border transition ${
                          editingReminder.preRemindInterval === interval
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                >
                  Save Reminder
                </button>
              </form>
            )}

            {/* NOTE "WILL HAVE" DETAIL / EDITOR PAGE */}
            {rnoActiveView === 'noteForm' && editingNote && (
              <form
                onSubmit={handleSaveNote}
                className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <button
                    type="button"
                    onClick={() => setRnoActiveView('list')}
                    className="flex items-center space-x-1.5 text-slate-400 hover:text-white font-bold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to RNO</span>
                  </button>
                  <span className="text-[11px] font-black uppercase text-amber-400">Note Editor</span>
                  {notesList.some((n) => n.id === editingNote.id) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(editingNote.id)}
                      className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Notes Title */}
                <div>
                  <label className="font-black text-slate-300 uppercase text-[10px] block mb-1">Notes Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Form Cues for Heavy RDL & Squat"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold"
                  />
                </div>

                {/* Notes Body + STT & Voice Recording Controls */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-slate-300 uppercase text-[10px]">
                      Notes (Features STT & Voice Recordings)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleToggleSttDictation}
                        className={`px-2.5 py-1 rounded-xl font-black text-[10px] flex items-center gap-1 border transition ${
                          isSttListening
                            ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                            : 'bg-slate-950 border-slate-800 text-emerald-400 hover:border-emerald-500/40'
                        }`}
                      >
                        <Mic className="w-3 h-3" />
                        <span>{isSttListening ? 'Listening STT...' : 'Dictate (STT)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleVoiceRecording}
                        className={`px-2.5 py-1 rounded-xl font-black text-[10px] flex items-center gap-1 border transition ${
                          isVoiceRecording
                            ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                            : 'bg-slate-950 border-slate-800 text-amber-400 hover:border-amber-500/40'
                        }`}
                      >
                        {isVoiceRecording ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isVoiceRecording ? 'Stop Rec' : '+ Voice Rec'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={5}
                    placeholder="Type your note here or tap Dictate (STT) above..."
                    value={editingNote.body}
                    onChange={(e) => setEditingNote({ ...editingNote, body: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white font-medium leading-relaxed"
                  />

                  {/* Voice Recordings List */}
                  {Array.isArray(editingNote.voiceClips) && editingNote.voiceClips.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                      <span className="text-[10px] font-black uppercase text-amber-400 block">
                        Attached Voice Recordings ({editingNote.voiceClips.length})
                      </span>
                      {editingNote.voiceClips.map((vc, vIdx) => (
                        <div
                          key={vc.id || vIdx}
                          className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2"
                        >
                          <span className="font-bold text-slate-200 text-[11px]">🎤 {vc.label}</span>
                          <div className="flex items-center gap-2">
                            {vc.audioDataUrl ? (
                              <audio controls src={vc.audioDataUrl} className="h-7 w-36" />
                            ) : (
                              <button
                                type="button"
                                onClick={() => soundEngine.playBeep()}
                                className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-bold text-[10px]"
                              >
                                ▶ Play Memo
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingNote({
                                  ...editingNote,
                                  voiceClips: editingNote.voiceClips.filter((_, i) => i !== vIdx)
                                })
                              }
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lock Notes (6-Digit PIN - Cannot be reset if lost) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-rose-400" />
                      <span className="font-black text-white">Lock Note (6-Digit PIN)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingNote({ ...editingNote, isLocked: !editingNote.isLocked })}
                      className={`px-3 py-1 rounded-full font-black text-[11px] transition ${
                        editingNote.isLocked ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {editingNote.isLocked ? 'LOCKED' : 'UNLOCKED'}
                    </button>
                  </div>

                  {editingNote.isLocked && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-Digit PIN (e.g. 123456)"
                        value={editingNote.pinCode}
                        onChange={(e) =>
                          setEditingNote({ ...editingNote, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                        }
                        className="w-full bg-slate-900 border border-rose-500/40 rounded-xl px-3.5 py-2 text-center tracking-[0.4em] font-mono text-sm font-black text-white"
                      />
                      <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>Permanent Encryption Rule: This 6-digit PIN cannot be reset or recovered if lost.</span>
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  Save Notes
                </button>
              </form>
            )}

            {/* FLOATING BOTTOM-RIGHT '+' BUTTON FOR RNO TAB */}
            {rnoActiveView === 'list' && (
              <div className="fixed bottom-20 right-5 z-40 flex flex-col items-end space-y-2">
                {showRnoPlusPrompt && (
                  <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-2 shadow-2xl flex flex-col space-y-1.5 w-44 animate-in fade-in">
                    <span className="text-[10px] font-black uppercase text-slate-400 px-2 pt-1">Create New</span>
                    <button
                      type="button"
                      onClick={openNewReminderForm}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-black text-xs flex items-center justify-between transition"
                    >
                      <span>Reminders</span>
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={openNewNoteForm}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-amber-400 hover:text-slate-950 text-amber-400 font-black text-xs flex items-center justify-between transition"
                    >
                      <span>Notes</span>
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowRnoPlusPrompt(!showRnoPlusPrompt)}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition transform active:scale-95"
                >
                  <Plus className={`w-7 h-7 stroke-[3] transition-transform ${showRnoPlusPrompt ? 'rotate-45' : ''}`} />
                </button>
              </div>
            )}

            {/* 6-DIGIT PIN UNLOCK MODAL FOR LOCKED NOTES */}
            {pinUnlockTargetNote && (
              <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
                <form
                  onSubmit={handleVerifyNotePin}
                  className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-xs p-5 space-y-4 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      6-Digit PIN Required
                    </span>
                    <button
                      type="button"
                      onClick={() => setPinUnlockTargetNote(null)}
                      className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white truncate">{pinUnlockTargetNote.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enter your 6-digit PIN to unlock. Cannot be reset if lost.
                    </p>
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    value={pinUnlockInput}
                    onChange={(e) => setPinUnlockInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-center tracking-[0.5em] font-mono text-base font-black text-white"
                  />
                  {pinUnlockError && <p className="text-[11px] text-rose-400 font-bold">{pinUnlockError}</p>}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase"
                  >
                    Unlock Note
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            TAB 4: STUDY HUB (v6 - Course Progress Card + Timetable CSV + Full-Screen Study Engine)
        ==================================================== */}
        {bottomTab === 'study' && (
          <div className="space-y-6 pb-8">
            {/* CARD 1: Course Completion %, Avg Time, Exam Countdown & [Play / Start Studying] */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Card 1 • Study Hub Command
                  </span>
                  <h2 className="text-base font-black text-white mt-1.5">Course & Exam Readiness</h2>
                </div>

                {/* Prominent Play Button to Launch Full-Screen Blank Study Mode */}
                <button
                  type="button"
                  onClick={startFullScreenStudySession}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transform active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start Studying</span>
                </button>
              </div>

              {/* 3 Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Course Done</span>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {studyHubSummary.completionPct}%
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {studyHubSummary.completedChapters} / {studyHubSummary.totalChapters} Chapters
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Avg Time / Ch</span>
                  <div className="mt-1">
                    <span className="text-lg font-black text-sky-400 font-mono block">
                      {studyHubSummary.avgHoursFormatted}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Total: {totalStudyMinutesLogged}m logged
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Exam Countdown</span>
                  <div className="mt-1">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {studyHubSummary.diffDays}d
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Days Remaining</p>
                  </div>
                </div>
              </div>

              {/* Course Progress Bar & Exam Date Picker */}
              <div className="space-y-2 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-xs">
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${studyHubSummary.completionPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-bold">Target Exam Date:</span>
                  <input
                    type="date"
                    value={examTargetDate}
                    onChange={(e) => {
                      setExamTargetDate(e.target.value);
                      saveStudyDataToFirestore(studyChapters, e.target.value, totalStudyMinutesLogged);
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Protocol Preview Strip */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-[11px]">
                <div className="text-slate-300">
                  <b className="text-emerald-400">Weekday (3h):</b> 45m / 15m / 45m / 15m / 60m
                  <span className="mx-2 text-slate-600">|</span>
                  <b className="text-amber-400">Weekend (5h):</b> 45/15/45/15/45/30/45/15/30
                </div>
              </div>
            </div>

            {/* CARD 2: Chapter Timetable & CSV Importer */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Card 2 • Study Timetable
                  </span>
                  <h3 className="text-base font-black text-white mt-1">Chapters & Daily Targets</h3>
                </div>

                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-black">
                  <button
                    type="button"
                    onClick={() => setStudyFilterMode('today')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      studyFilterMode === 'today' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Today ({studyHubSummary.todaysChapters.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyFilterMode('all')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      studyFilterMode === 'all' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    All ({studyChapters.length})
                  </button>
                </div>
              </div>

              {/* Timetable Rows */}
              <div className="space-y-2">
                {(studyFilterMode === 'today' ? studyHubSummary.todaysChapters : studyChapters).length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-300">
                      No chapters scheduled specifically for today's date window.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStudyFilterMode('all')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-emerald-400 font-black text-xs"
                    >
                      View All {studyChapters.length} Chapters
                    </button>
                  </div>
                ) : (
                  (studyFilterMode === 'today' ? studyHubSummary.todaysChapters : studyChapters).map((ch) => (
                    <div
                      key={ch.id}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        ch.completed
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-black text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                          #{ch.serialNo}
                        </span>
                        <div className="min-w-0">
                          <h4
                            className={`text-xs sm:text-sm font-extrabold truncate ${
                              ch.completed ? 'line-through text-emerald-300' : 'text-white'
                            }`}
                          >
                            {ch.title}
                          </h4>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            📅 {ch.startDate} → {ch.endDate}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleChapterComplete(ch.id)}
                        className={`px-3 py-2 rounded-xl font-black text-xs shrink-0 flex items-center space-x-1.5 transition ${
                          ch.completed
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{ch.completed ? 'Completed' : 'Complete'}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Upload Timetable CSV Section */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-sky-400">
                    Upload Timetable .CSV Format
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Serial Number, Chapter Title, Start Date, End Date
                  </span>
                </div>
                {studyCsvError && (
                  <p className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl text-[11px]">
                    {studyCsvError}
                  </p>
                )}
                <label className="w-full py-3 rounded-xl border border-dashed border-sky-500/40 bg-sky-500/5 hover:bg-sky-500/10 text-sky-300 font-extrabold flex items-center justify-center gap-2 cursor-pointer transition">
                  <Upload className="w-4 h-4 text-sky-400" />
                  <span>Upload Timetable .CSV (S.No, Chapter, Start Date, End Date)</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleStudyTimetableCsvUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================
          FULL-SCREEN BLANK STUDY FOCUS ENGINE (WEEKDAY 3H / WEEKEND 5H)
      ==================================================== */}
      {isStudyModeActive && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 select-none overflow-y-auto">
          {/* Top Minimal Bar: Protocol Switcher & Exit */}
          <div className="max-w-lg w-full mx-auto flex items-center justify-between">
            <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-black">
              <button
                type="button"
                onClick={() => switchStudyProtocolPlan('weekday')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  studyPlanKey === 'weekday' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekday (3h)
              </button>
              <button
                type="button"
                onClick={() => switchStudyProtocolPlan('weekend')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  studyPlanKey === 'weekend' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekend (5h)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsStudyModeActive(false)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-bold"
            >
              Exit Study Mode
            </button>
          </div>

          {/* Center Blank-Canvas Countdown Focus Area */}
          <div className="max-w-lg w-full mx-auto my-auto py-8 text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/90">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-ping ${
                  currentStudyBlock.type === 'study' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-black uppercase tracking-widest text-slate-200">
                Block {studyBlockIndex + 1} of {activeStudyProtocol.blocks.length} • {currentStudyBlock.label}
              </span>
            </div>

            {/* Giant Monospace Clock */}
            <div
              className={`text-7xl sm:text-8xl font-black font-mono tracking-tight transition-colors ${
                studySecondsLeft <= 3
                  ? 'text-rose-400 scale-105'
                  : currentStudyBlock.type === 'study'
                  ? 'text-white'
                  : 'text-amber-300'
              }`}
            >
              {String(Math.floor(studySecondsLeft / 60)).padStart(2, '0')}:
              {String(studySecondsLeft % 60).padStart(2, '0')}
            </div>

            <p className="text-xs text-slate-400 max-w-xs mx-auto font-medium">
              {currentStudyBlock.type === 'study'
                ? '🔔 Chimes at 15:00 remaining and ticks at 3, 2, 1 seconds before your break.'
                : '☕ Recharge & hydrate. Ticks at 3, 2, 1 seconds before your next study block.'}
            </p>

            {/* Primary Controls & Quick Demo Test Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsStudyTimerPaused(!isStudyTimerPaused)}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/20"
              >
                {isStudyTimerPaused ? 'Resume Timer' : 'Pause Timer'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextIdx = (studyBlockIndex + 1) % activeStudyProtocol.blocks.length;
                  jumpToStudyBlock(nextIdx);
                }}
                className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-1.5"
              >
                <SkipForward className="w-4 h-4" />
                <span>Next Block</span>
              </button>

              {/* Quick Audio & Alert Verification Buttons */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.init();
                  setStudySecondsLeft(15 * 60 + 2);
                  setIsStudyTimerPaused(false);
                  triggerToast('Jumping to 15:02 left to test the 15-Minute Alert!');
                }}
                className="px-3 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-bold text-[11px]"
              >
                Test 15m Alert (15:02)
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.init();
                  setStudySecondsLeft(5);
                  setIsStudyTimerPaused(false);
                  triggerToast('Jumping to 00:05 to test 3-2-1 Tick & Transition!');
                }}
                className="px-3 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-bold text-[11px]"
              >
                Test 3-2-1 Tick (00:05)
              </button>
            </div>
          </div>

          {/* Bottom Interval Timeline Bar */}
          <div className="max-w-lg w-full mx-auto space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
              <span>{activeStudyProtocol.name} Sequence</span>
              <span>Tap any block to jump</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
              {activeStudyProtocol.blocks.map((blk, idx) => {
                const isCurrent = idx === studyBlockIndex;
                const isDone = idx < studyBlockIndex;
                return (
                  <button
                    key={blk.id}
                    type="button"
                    onClick={() => jumpToStudyBlock(idx)}
                    className={`p-2 rounded-xl border text-center transition ${
                      isCurrent
                        ? blk.type === 'study'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
                          : 'bg-amber-400 text-slate-950 border-amber-200 font-black'
                        : isDone
                        ? 'bg-slate-900/50 border-slate-800/60 text-slate-600 line-through'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[9px] uppercase block truncate">
                      {blk.type === 'study' ? 'Study' : 'Break'}
                    </span>
                    <span className="text-xs font-mono font-extrabold">{blk.durationMins}m</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          FLOATING PILL NAVIGATION DOCK (1. Fitness | 2. Macros | 3. RNO | 4. Study)
      ==================================================== */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-1.5 rounded-full shadow-2xl flex items-center space-x-1">
        <button
          onClick={() => setBottomTab('fitness')}
          className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-full text-xs font-black transition ${
            bottomTab === 'fitness'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>1. Fitness</span>
        </button>
        <button
          onClick={() => setBottomTab('macros')}
          className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-full text-xs font-black transition ${
            bottomTab === 'macros'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>2. Macros</span>
        </button>
        <button
          onClick={() => {
            setBottomTab('rno');
            setRnoActiveView('list');
          }}
          className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-full text-xs font-black transition ${
            bottomTab === 'rno'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>3. RNO</span>
        </button>
        <button
          onClick={() => setBottomTab('study')}
          className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-full text-xs font-black transition ${
            bottomTab === 'study'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>4. Study</span>
        </button>
      </nav>

      {/* ====================================================
          PROFILE & V3 COMPETITION ZEST LEADERBOARD MODAL
      ==================================================== */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl p-2 rounded-2xl bg-slate-950 border border-slate-800">
                  {profile.avatarEmoji}
                </span>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">@{profile.username}</h3>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    Fair Zest Score Today: {myLiveZestMemberStats.fairZestScore} pts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setProfileSectionTab('leaderboard')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  profileSectionTab === 'leaderboard'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Card 1 • Zest Leaderboard</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileSectionTab('settings')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  profileSectionTab === 'settings'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Identity & Biometrics</span>
              </button>
            </div>

            {profileSectionTab === 'leaderboard' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      Competition Zests (SW-XXXX)
                    </span>
                    {activeZestObj && (
                      <span className="text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        Active Code: {activeZestObj.code}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Zest Name (optional)"
                        value={newZestTitleInput}
                        onChange={(e) => setNewZestTitleInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreatePublicZest}
                        className="shrink-0 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                      >
                        + Create
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Enter Code (SW-XXXX)"
                        value={joinZestCodeInput}
                        onChange={(e) => setJoinZestCodeInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleJoinPublicZest}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </div>

                {!activeZestObj ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
                    <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs font-extrabold text-white">No Competition Zest Active Yet</p>
                    <p className="text-[11px] text-slate-400">
                      Create a new Zest above to get a shareable <b className="text-emerald-400">SW-XXXX</b> code, or
                      enter a friend's code to compete!
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-white">{activeZestObj.title}</h4>
                        <span className="text-[10px] text-slate-400">
                          {(activeZestObj.members || []).length} Athlete(s) • Code:{' '}
                          <b className="text-emerald-400 font-mono">{activeZestObj.code}</b>
                        </span>
                      </div>
                      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-black">
                        <button
                          type="button"
                          onClick={() => setZestTimeframe('today')}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            zestTimeframe === 'today' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          Today Live
                        </button>
                        <button
                          type="button"
                          onClick={() => setZestTimeframe('7day')}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            zestTimeframe === '7day' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
                          }`}
                        >
                          7-Day / All-Time
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {[
                        { id: 'fairScore', label: '⚡ Fair Zest Score' },
                        { id: 'kgs', label: '🏋️ Top Kgs' },
                        { id: 'kcal', label: '🔥 Top Kcal Burn' },
                        { id: 'discipline', label: '💧 Macro & Water Hit' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setZestSortMetric(tab.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border whitespace-nowrap transition ${
                            zestSortMetric === tab.id
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {(activeZestObj.members || []).length < 3 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-2 text-[11px]">
                        <div className="text-amber-200">
                          <b className="text-amber-400">
                            🔒 Track Records Locked ({(activeZestObj.members || []).length}/3 Joined):
                          </b>{' '}
                          Once 3 people join this Zest, everyone's full daily track records unlock!
                        </div>
                        <button
                          type="button"
                          onClick={handleAddDemoSquadMates}
                          className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2.5 py-1.5 rounded-lg text-[10px]"
                        >
                          + Simulate 2 Friends
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {[...(activeZestObj.members || [])]
                        .sort((a, b) => {
                          if (zestSortMetric === 'kgs') {
                            return zestTimeframe === 'today'
                              ? (b.todayVolumeKg || 0) - (a.todayVolumeKg || 0)
                              : (b.sevenDayVolumeKg || 0) - (a.sevenDayVolumeKg || 0);
                          }
                          if (zestSortMetric === 'kcal') {
                            return zestTimeframe === 'today'
                              ? (b.todayKcalBurn || 0) - (a.todayKcalBurn || 0)
                              : (b.sevenDayKcalBurn || 0) - (a.sevenDayKcalBurn || 0);
                          }
                          if (zestSortMetric === 'discipline') {
                            return (
                              (b.pureFoodMacroPct || 0) +
                              (b.waterPct || 0) -
                              ((a.pureFoodMacroPct || 0) + (a.waterPct || 0))
                            );
                          }
                          return zestTimeframe === 'today'
                            ? (b.fairZestScore || 0) - (a.fairZestScore || 0)
                            : (b.sevenDayZestScore || 0) - (a.sevenDayZestScore || 0);
                        })
                        .map((member, rankIdx) => {
                          const isUnlocked = (activeZestObj.members || []).length >= 3;
                          const isPeekOpen = peekMemberUid === member.uid;
                          const primaryBadge =
                            zestSortMetric === 'kgs'
                              ? `${(
                                  zestTimeframe === 'today' ? member.todayVolumeKg || 0 : member.sevenDayVolumeKg || 0
                                ).toLocaleString()} kg`
                              : zestSortMetric === 'kcal'
                              ? `${(
                                  zestTimeframe === 'today' ? member.todayKcalBurn || 0 : member.sevenDayKcalBurn || 0
                                ).toLocaleString()} kcal`
                              : zestSortMetric === 'discipline'
                              ? `M:${member.pureFoodMacroPct || 0}% • W:${member.waterPct || 0}%`
                              : `${
                                  zestTimeframe === 'today' ? member.fairZestScore || 0 : member.sevenDayZestScore || 0
                                } pts`;

                          return (
                            <div
                              key={member.uid || rankIdx}
                              className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <span
                                    className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                                      rankIdx === 0
                                        ? 'bg-amber-400 text-slate-950'
                                        : rankIdx === 1
                                        ? 'bg-slate-300 text-slate-950'
                                        : rankIdx === 2
                                        ? 'bg-amber-700 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {rankIdx + 1}
                                  </span>
                                  <span className="text-lg shrink-0">{member.avatarEmoji || '🦍'}</span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-extrabold text-white truncate">
                                      @{member.username}
                                      {member.uid === (user?.uid || 'local-user') && (
                                        <span className="ml-1.5 text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                                          YOU
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      Rel Vol:{' '}
                                      {Math.round((member.todayVolumeKg || 0) / Math.max(40, member.weight || 75))}× BW
                                      • RPE {member.todayAvgRpe || 7.5}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0">
                                  <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-black text-emerald-400">
                                    {primaryBadge}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBubbleTarget(
                                        selectedBubbleTarget?.uid === member.uid ? null : member
                                      );
                                      setAiGeneratedBubbleText('');
                                    }}
                                    className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!isUnlocked) {
                                        triggerToast('3 members required in this Zest to unlock Track Records!');
                                        return;
                                      }
                                      setPeekMemberUid(isPeekOpen ? null : member.uid);
                                    }}
                                    className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition ${
                                      isUnlocked
                                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25'
                                        : 'bg-slate-950 border-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {isUnlocked ? (isPeekOpen ? 'Hide' : 'Track Record') : '🔒 3 Req'}
                                  </button>
                                </div>
                              </div>

                              {isUnlocked && isPeekOpen && (
                                <div className="bg-slate-950 border border-sky-500/30 rounded-xl p-3 space-y-2 text-[11px]">
                                  <div className="flex items-center justify-between text-sky-400 font-bold border-b border-slate-800 pb-1">
                                    <span>@{member.username}'s Read-Only Track Record</span>
                                    <span className="font-mono">{member.fairZestScore || 0} Fair Pts</span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div className="bg-slate-900 p-2 rounded-lg">
                                      <span className="text-[9px] text-slate-400 block uppercase">Workout Volume</span>
                                      <b className="text-white font-mono">
                                        {(member.todayVolumeKg || 0).toLocaleString()} kg
                                      </b>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded-lg">
                                      <span className="text-[9px] text-slate-400 block uppercase">Active Burn</span>
                                      <b className="text-amber-400 font-mono">{member.todayKcalBurn || 0} kcal</b>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded-lg">
                                      <span className="text-[9px] text-slate-400 block uppercase">Pure Food Macros</span>
                                      <b className="text-emerald-400 font-mono">{member.pureFoodMacroPct || 0}% Hit</b>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded-lg">
                                      <span className="text-[9px] text-slate-400 block uppercase">Hydration</span>
                                      <b className="text-sky-400 font-mono">
                                        {member.waterMl || 0} ml ({member.waterPct || 0}%)
                                      </b>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                                    <span>
                                      PR: <b className="text-slate-200">{member.prDisplay || '—'}</b>
                                    </span>
                                    <span>
                                      PB: <b className="text-slate-200">{member.pbDisplay || '—'}</b>
                                    </span>
                                  </div>
                                </div>
                              )}

                              {selectedBubbleTarget?.uid === member.uid && (
                                <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3 space-y-2.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-emerald-400 text-[11px]">
                                      Send Zero-Chat Bubble to @{member.username}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={isGeneratingAiTaunt}
                                      onClick={() => handleGenerateAiBubble(member)}
                                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] flex items-center gap-1"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>
                                        {isGeneratingAiTaunt ? 'Generating...' : '✨ Generate AI Taunt / Hype'}
                                      </span>
                                    </button>
                                  </div>

                                  {aiGeneratedBubbleText && (
                                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-bold text-emerald-200">
                                        "{aiGeneratedBubbleText}"
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleSendZestBubble(member, aiGeneratedBubbleText)}
                                        className="shrink-0 bg-emerald-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[10px]"
                                      >
                                        Send AI
                                      </button>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                    {PRESET_HYPE_BUBBLES.map((preset, pIdx) => {
                                      const preview = preset.replace(/@username/g, `@${member.username}`);
                                      return (
                                        <button
                                          key={pIdx}
                                          type="button"
                                          onClick={() => handleSendZestBubble(member, preset)}
                                          className="text-left px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 font-semibold flex items-center justify-between"
                                        >
                                          <span className="truncate">{preview}</span>
                                          <span className="text-[10px] text-emerald-400 font-black ml-2 shrink-0">
                                            Send →
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {profileSectionTab === 'settings' && (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {profile.avatarEmoji}
                    </span>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">
                        Anonymous Zest Username
                      </label>
                      <div className="flex gap-1.5 mt-0.5">
                        <input
                          type="text"
                          value={profile.username}
                          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, username: generateRandomUsername() })}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-[10px] font-bold shrink-0"
                        >
                          Randomize
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      ⚠️ Privacy Rule: Do not use your real name as your username. Keep an anonymous handle so your Zest
                      leaderboard stays private.
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Select Avatar Emoji (Preset Only)
                    </span>
                    <div className="grid grid-cols-8 gap-1">
                      {AVATAR_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setProfile({ ...profile, avatarEmoji: em })}
                          className={`h-8 rounded-lg text-base flex items-center justify-center transition ${
                            profile.avatarEmoji === em
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-900 hover:bg-slate-800'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Current Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={profile.weight}
                        onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Goal Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={profile.goalWeight}
                        onChange={(e) => setProfile({ ...profile, goalWeight: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Height (cm)</label>
                      <input
                        type="number"
                        required
                        value={profile.height}
                        onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Age</label>
                      <input
                        type="number"
                        required
                        value={profile.age}
                        onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Primary Goal</label>
                      <select
                        value={profile.goalType}
                        onChange={(e) => setProfile({ ...profile, goalType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      >
                        <option value="fatloss">Fat Loss</option>
                        <option value="recomp">Body Recomposition</option>
                        <option value="muscle">Lean Muscle Gain</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Goal Deadline</label>
                      <select
                        value={profile.deadlineMonths}
                        onChange={(e) => setProfile({ ...profile, deadlineMonths: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      >
                        {[3, 6, 9, 12, 15, 18, 21, 24].map((m) => (
                          <option key={m} value={m}>
                            {m} Months
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase shadow-lg shadow-emerald-500/20"
                  >
                    Save Athlete Profile
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================
          ACTIVE WORKOUT LOGGER MODAL (Dynamic Island + Water + 30m Auto-Save)
      ==================================================== */}
      {isLoggerOpen && activeDraft && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col overflow-y-auto">
          <div className="max-w-lg w-full mx-auto p-4 space-y-4 flex-1">
            {/* Dynamic Island Rest Timer */}
            <div className="sticky top-2 z-20 bg-slate-900/95 border border-emerald-500/40 rounded-full px-4 py-2.5 shadow-2xl flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  saveDraftToFirestore({
                    ...activeDraft,
                    restEndTime: Math.max(Date.now(), (activeDraft.restEndTime || Date.now()) - 30000),
                    lastActiveTimestamp: Date.now()
                  })
                }
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-black text-slate-200"
              >
                -30s
              </button>
              <div className="flex items-center space-x-2">
                <Timer className={`w-4 h-4 ${restSecondsLeft > 0 ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
                <span className="font-mono text-sm font-black text-white">
                  {restSecondsLeft > 0 ? `Rest: ${restSecondsLeft}s` : 'Rest Timer Ready'}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  saveDraftToFirestore({
                    ...activeDraft,
                    restEndTime: Math.max(Date.now(), activeDraft.restEndTime || Date.now()) + 30000,
                    lastActiveTimestamp: Date.now()
                  })
                }
                className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-black text-emerald-300"
              >
                +30s
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">{activeDraft.sessionName}</h3>
                <p className="text-[11px] text-slate-400">Auto-saves in {pauseMinutesLeft}m if inactive</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    saveDraftToFirestore({
                      ...activeDraft,
                      isPaused: !activeDraft.isPaused,
                      pausedAt: !activeDraft.isPaused ? Date.now() : null,
                      lastActiveTimestamp: Date.now()
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold"
                >
                  {activeDraft.isPaused ? 'Resume' : 'Pause (30m)'}
                </button>
                <button
                  type="button"
                  onClick={() => finalizeAndSaveWorkout(activeDraft, false)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black"
                >
                  Finish
                </button>
              </div>
            </div>

            {/* Bidirectional Synced Water Bar inside Logger */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => updateDailyWaterTotal(activeDraft.dateKey, -100)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-black text-slate-300"
              >
                -100ml
              </button>
              <div className="flex items-center gap-1.5 text-xs font-black text-sky-400">
                <Droplets className="w-4 h-4" />
                <span>Water Today: {waterLogsByDate[activeDraft.dateKey] || 0} ml</span>
              </div>
              <button
                type="button"
                onClick={() => updateDailyWaterTotal(activeDraft.dateKey, 100)}
                className="px-3 py-1.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-black"
              >
                +100ml
              </button>
            </div>

            <div className="space-y-3">
              {activeDraft.exercises.map((ex, exIdx) => (
                <div key={ex.id || exIdx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">{ex.name}</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">Approx RPE:</span>
                      <input
                        type="number"
                        min="5"
                        max="10"
                        step="0.5"
                        value={ex.rpe}
                        onChange={(e) => {
                          const nextEx = [...activeDraft.exercises];
                          nextEx[exIdx] = { ...ex, rpe: Number(e.target.value) };
                          saveDraftToFirestore({ ...activeDraft, exercises: nextEx, lastActiveTimestamp: Date.now() });
                        }}
                        className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center font-bold text-amber-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {ex.sets.map((s, sIdx) => (
                      <div key={sIdx} className="grid grid-cols-10 gap-2 items-center text-xs">
                        <span className="col-span-2 text-slate-400 font-bold">Set #{sIdx + 1}</span>
                        <input
                          type="number"
                          value={s.weight}
                          onChange={(e) => {
                            const nextEx = [...activeDraft.exercises];
                            nextEx[exIdx].sets[sIdx].weight = Number(e.target.value);
                            saveDraftToFirestore({
                              ...activeDraft,
                              exercises: nextEx,
                              lastActiveTimestamp: Date.now()
                            });
                          }}
                          className="col-span-3 bg-slate-950 border border-slate-800 rounded-xl py-1.5 text-center font-bold text-white"
                          placeholder="kg"
                        />
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) => {
                            const nextEx = [...activeDraft.exercises];
                            nextEx[exIdx].sets[sIdx].reps = Number(e.target.value);
                            saveDraftToFirestore({
                              ...activeDraft,
                              exercises: nextEx,
                              lastActiveTimestamp: Date.now()
                            });
                          }}
                          className="col-span-3 bg-slate-950 border border-slate-800 rounded-xl py-1.5 text-center font-bold text-white"
                          placeholder="reps"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.init();
                            const nextEx = [...activeDraft.exercises];
                            const nextDone = !nextEx[exIdx].sets[sIdx].completed;
                            nextEx[exIdx].sets[sIdx].completed = nextDone;
                            saveDraftToFirestore({
                              ...activeDraft,
                              exercises: nextEx,
                              restEndTime: nextDone ? Date.now() + 60000 : activeDraft.restEndTime,
                              lastActiveTimestamp: Date.now()
                            });
                          }}
                          className={`col-span-2 py-1.5 rounded-xl font-black flex items-center justify-center ${
                            s.completed ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsLoggerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold"
            >
              Minimize Logger (Keeps Running in Background)
            </button>
          </div>
        </div>
      )}

      {/* ====================================================
          ROUTINE BUILDER MODAL (Create from Scratch or Upload CSV)
      ==================================================== */}
      {showRoutineChoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Workout Split Builder</h3>
              <button
                onClick={() => {
                  setShowRoutineChoiceModal(false);
                  setRoutineSubPage(null);
                  setCsvError('');
                }}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {!routineSubPage && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setRoutineSubPage('scratch')}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 text-left space-y-2"
                >
                  <Edit3 className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-extrabold text-white text-xs">[Create from Scratch]</h4>
                </button>
                <button
                  onClick={() => setRoutineSubPage('csv')}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl p-4 text-left space-y-2"
                >
                  <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                  <h4 className="font-extrabold text-white text-xs">[Upload .CSV Split]</h4>
                </button>
              </div>
            )}
            {routineSubPage === 'scratch' && (
              <div className="space-y-3 text-xs">
                <input
                  type="text"
                  value={scratchTitle}
                  onChange={(e) => setScratchTitle(e.target.value)}
                  placeholder="Workout Split Title (e.g., PPL, Bro Split)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
                {scratchBlocks.map((blk, bIdx) => (
                  <div key={blk.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <input
                      type="text"
                      value={blk.sessionName}
                      onChange={(e) => {
                        const next = [...scratchBlocks];
                        next[bIdx].sessionName = e.target.value;
                        setScratchBlocks(next);
                      }}
                      placeholder="Session Name (e.g., Push)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={blk.exercises.map((x) => x.name).join(', ')}
                      onChange={(e) => {
                        const next = [...scratchBlocks];
                        next[bIdx].exercises = e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((name) => ({
                            name,
                            primaryMuscle: inferMusclesFromText(name, blk.sessionName)[0] || 'Chest'
                          }));
                        setScratchBlocks(next);
                      }}
                      placeholder="Exercises comma-separated (Bench Press, Incline DB, Tricep Pushdown)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setScratchBlocks([
                      ...scratchBlocks,
                      {
                        id: 'block-' + Date.now(),
                        sessionName: 'New Session',
                        exercises: [{ name: 'Squat', primaryMuscle: 'Quads' }]
                      }
                    ])
                  }
                  className="w-full py-2 rounded-xl bg-slate-800 text-emerald-400 font-bold"
                >
                  + [Add New Block]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!scratchTitle.trim()) return;
                    const newSplit = { id: 'split-' + Date.now(), title: scratchTitle, sessions: scratchBlocks };
                    const next = [...workoutSplits, newSplit];
                    setWorkoutSplits(next);
                    setActiveSplitId(newSplit.id);
                    saveUserConfig(profile, next, newSplit.id, activeZestCode);
                    setShowRoutineChoiceModal(false);
                    setRoutineSubPage(null);
                    triggerToast('Split created & activated!');
                  }}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black"
                >
                  Save Workout Split
                </button>
              </div>
            )}
            {routineSubPage === 'csv' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Format each row as:{' '}
                  <b className="text-sky-400">Workout Split Title, Session Name, Exercise 1, Exercise 2...</b>
                </p>
                {csvError && <p className="text-rose-400 font-bold bg-rose-500/10 p-2 rounded-lg">{csvError}</p>}
                <label className="w-full py-5 rounded-2xl border-2 border-dashed border-sky-500/40 bg-sky-500/5 text-sky-300 font-extrabold flex flex-col items-center cursor-pointer">
                  <Upload className="w-5 h-5 mb-1" />
                  <span>[Upload .CSV]</span>
                  <input type="file" accept=".csv" onChange={handleWorkoutCsvUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}