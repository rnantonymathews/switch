// Global Constants, Catalogs, and Lists for SWITCH Fitness Application

export const AVATAR_EMOJIS = ['🦍', '⚡', '🔥', '🦈', '🦁', '🤖', '🥷', '🦖', '🏋️', '🥊', '🦅', '🐺', '🦊', '🐉', '👑', '🚀'];
export const ANONYMOUS_ADJECTIVES = ['Iron', 'Volt', 'Alpha', 'Titan', 'Apex', 'Shadow', 'Storm', 'Beast'];
export const ANONYMOUS_NOUNS = ['Wolf', 'Ninja', 'Grip', 'Lifter', 'Puma', 'Viper', 'Tank', 'Savage'];

export const PRESET_HYPE_BUBBLES = [
  'Lezzz gooo @username!! 🔥',
  'Look at @username burning kcals like a furnace!! 🚒',
  '@username woke up and chose violence in the gym today 🦍',
  'Someone check on @username, lifting heavy-heavy today! 🏋️‍♂️',
  '@username where you at?! The Zest leaderboard is waiting 👀',
  'Respect the grind @username! Consistency king/queen 👑',
  'Catch me if you can @username 🏃‍♂️💨',
  'Hydration check @username! Drink your water 💧'
];

export const CARDIO_TYPES = [
  { id: 'treadmill_walk', name: 'Treadmill Incline Walk', baseMet: 4.8, stepsPerMin: 105 },
  { id: 'outdoor_run', name: 'Outdoor Running', baseMet: 9.2, stepsPerMin: 162 },
  { id: 'stair_climber', name: 'Steps Cardio Machine', baseMet: 8.8, stepsPerMin: 95 },
  { id: 'stationary_bike', name: 'Stationary Cycling', baseMet: 6.8, stepsPerMin: 0 },
  { id: 'rowing', name: 'Rowing Ergometer', baseMet: 7.5, stepsPerMin: 0 },
  { id: 'elliptical', name: 'Cross Trainer / Elliptical', baseMet: 5.5, stepsPerMin: 120 }
];

export const SPORTS_TYPES = [
  { id: 'badminton', name: 'Badminton', baseMet: 6.5 },
  { id: 'football', name: 'Football / Soccer', baseMet: 8.5 },
  { id: 'basketball', name: 'Basketball', baseMet: 8.0 },
  { id: 'cricket', name: 'Cricket', baseMet: 5.2 },
  { id: 'pickleball', name: 'Pickleball / Tennis', baseMet: 6.8 },
  { id: 'swimming', name: 'Swimming Laps', baseMet: 8.2 },
  { id: 'boxing', name: 'Boxing / MMA Sparring', baseMet: 9.5 }
];

export const BEVERAGE_CATALOG = [
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

// Weekday (3 Hours = 180m) & Weekend (5 Hours = 300m) Study Protocols
export const STUDY_PROTOCOLS = {
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

export const DAY_ALIASES: Record<string, string> = {
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
