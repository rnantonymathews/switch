import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
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
  User,
  Timer,
  Droplets,
  Check,
  X,
  Edit3,
  FileSpreadsheet,
  Upload,
  Activity,
  Utensils,
  UtensilsCrossed,
  Play,
  Settings,
  Bell,
  CheckSquare,
  CalendarClock,
  Volume2,
  Square,
  RotateCcw,
  SkipForward,
  Zap
} from 'lucide-react';

// Pure modules & data extracted in Phase 2 & 3
import type {
  Profile,
  WorkoutSet,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSplit,
  WorkoutDraft,
  WorkoutLog,
  CardioLog,
  SportsLog,
  BodyLog,
  FoodLog,
  BeverageLog,
  Note,
  Reminder,
  ZestMember,
  ZestGroup,
  ZestBubble,
  ActivityScheduleItem,
  CustomFood,
  ParsedFoodRow
} from './src/types';

import {
  AVATAR_EMOJIS,
  ANONYMOUS_ADJECTIVES,
  ANONYMOUS_NOUNS,
  PRESET_HYPE_BUBBLES,
  CARDIO_TYPES,
  SPORTS_TYPES,
  BEVERAGE_CATALOG,
  DAY_ALIASES
} from './src/constants';

import { OFFLINE_FOOD_DB } from './src/data/foodDb';
import { soundEngine } from './src/lib/sound';
import { getLocalDateKey, getLast14DaysChain, getTodayWeekdayName } from './src/lib/dates';
import { estimateMacrosLocally, parseFoodTextToRows } from './src/lib/foodMatch';
import { inferMusclesFromText } from './src/lib/muscles';
import { calculateFairZestScore, calculateBMR, buildSmartRepliesForBubble } from './src/lib/scoring';
import {
  parseClockToMinutes,
  formatMinutesToHHMM,
  parseTypeFormatToActivities,
  serializeActivitiesToTypeFormat,
  parseActivityCsvToActivities
} from './src/lib/schedule';
import { generateZestCode } from './src/lib/crypto';
import { db, auth, safeWrite, appId } from './src/lib/firebase';

// Tab Components extracted in Phase 3
import { FitnessTab } from './src/components/FitnessTab';
import { MacrosFoodTab } from './src/components/MacrosFoodTab';
import { RemindersNotesTab } from './src/components/RemindersNotesTab';
import { LeaderboardModal } from './src/components/LeaderboardModal';

declare const __initial_auth_token: string | undefined;

function generateRandomUsername(): string {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const noun = ANONYMOUS_NOUNS[Math.floor(Math.random() * ANONYMOUS_NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}${noun}${num}`;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [bottomTab, setBottomTab] = useState<'fitness' | 'macros' | 'rno'>('fitness');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSectionTab, setProfileSectionTab] = useState<'leaderboard' | 'settings'>('leaderboard');
  const [showRoutineChoiceModal, setShowRoutineChoiceModal] = useState(false);
  const [routineSubPage, setRoutineSubPage] = useState<'scratch' | 'csv' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCard1aBack, setShowCard1aBack] = useState(false);
  const [showMathInspector, setShowMathInspector] = useState(false);

  const [currentDateKey, setCurrentDateKey] = useState(getLocalDateKey());
  const dateChain = useMemo(() => getLast14DaysChain(), [currentDateKey]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey());

  // Date rollover listener for app left open past midnight
  useEffect(() => {
    const handleMidnightCheck = () => {
      const today = getLocalDateKey();
      if (today !== currentDateKey) {
        setCurrentDateKey(today);
        setSelectedDate(today);
      }
    };
    document.addEventListener('visibilitychange', handleMidnightCheck);
    const midnightInterval = setInterval(handleMidnightCheck, 30000);
    return () => {
      document.removeEventListener('visibilitychange', handleMidnightCheck);
      clearInterval(midnightInterval);
    };
  }, [currentDateKey]);

  // Sync state & My Foods
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [showFirstLaunchModal, setShowFirstLaunchModal] = useState(false);
  const [checkedInitialProfile, setCheckedInitialProfile] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const appSafeWrite = async <T,>(label: string, promiseFn: () => Promise<T>): Promise<T> => {
    return safeWrite(label, promiseFn, setSyncStatus, triggerToast);
  };

  // User Profile & Identity State
  const [profile, setProfile] = useState<Profile>({
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
  const [workoutSplits, setWorkoutSplits] = useState<WorkoutSplit[]>([
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
            { name: 'Tricep Rope Pushdown', primaryMuscle: 'Triceps' }
          ]
        },
        {
          id: 'sess-pull',
          sessionName: 'Pull',
          exercises: [
            { name: 'Lat Pulldown (Cable)', primaryMuscle: 'Back' },
            { name: 'Barbell Row', primaryMuscle: 'Back' },
            { name: 'Barbell Bicep Curl', primaryMuscle: 'Biceps' }
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
  const [activeDraft, setActiveDraft] = useState<WorkoutDraft | null>(null);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [pauseMinutesLeft, setPauseMinutesLeft] = useState(30);

  // Logs Collections
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [cardioLogs, setCardioLogs] = useState<CardioLog[]>([]);
  const [sportsLogs, setSportsLogs] = useState<SportsLog[]>([]);
  const [bodyLogs, setBodyLogs] = useState<BodyLog[]>([
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
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [beverageLogs, setBeverageLogs] = useState<BeverageLog[]>([]);
  const [waterLogsByDate, setWaterLogsByDate] = useState<Record<string, number>>({});

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
  const [selectedTrackerMetric, setSelectedTrackerMetric] = useState('weight');
  const [trackerInput, setTrackerInput] = useState({ weight: '', chest: '', waist: '', belly: '', wrist: '' });

  // Tab 2 (Macros) State
  const [foodInputMode, setFoodInputMode] = useState<'manual' | 'csv'>('manual');
  const [manualRawText, setManualRawText] = useState('chicken curry - 200g, chapatti - 2 pieces, eggs whole - 2 pieces');
  const [manualParsedRows, setManualParsedRows] = useState<ParsedFoodRow[]>(() =>
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

  // Tab 3 Reminders & Notes State
  const [remindersList, setRemindersList] = useState<Reminder[]>([
    {
      id: 'rem-1',
      title: 'Take Creatine (5g) & Electrolytes',
      date: getLocalDateKey(),
      time: '08:30',
      isRepeating: true,
      repeatEvery: '1 DAY',
      customDays: ['M', 'T', 'W', 'H', 'F', 'S', 'U'],
      waterMl: 250,
      supplements: 'Creatine 5g, Electrolytes',
      category: 'hydration'
    }
  ]);
  const [notesList, setNotesList] = useState<Note[]>([
    {
      id: 'note-1',
      title: 'Hypertrophy Cues: Shoulder Width & Arch',
      body: 'Keep retracted scapula throughout bench press. Pull barbell down to lower sternum.',
      voiceClips: [],
      isLocked: false
    }
  ]);

  // Tab Leaderboard & Competition Zest State (Phase 2.2 Subcollections)
  const [activeZestCode, setActiveZestCode] = useState('');
  const [activeZestMeta, setActiveZestMeta] = useState<{ code: string; title: string; createdBy?: string; createdAt?: number } | null>(null);
  const [zestMembers, setZestMembers] = useState<ZestMember[]>([]);
  const [newZestTitleInput, setNewZestTitleInput] = useState('');
  const [joinZestCodeInput, setJoinZestCodeInput] = useState('');
  const [incomingBubblesQueue, setIncomingBubblesQueue] = useState<ZestBubble[]>([]);
  const [dismissedBubbleIds, setDismissedBubbleIds] = useState<string[]>([]);

  // Header Activity Pill State
  const [activitySchedule, setActivitySchedule] = useState<ActivityScheduleItem[]>([]);
  const [activityTypeText, setActivityTypeText] = useState('');
  const [showActivityPillModal, setShowActivityPillModal] = useState(false);
  const [activityModalTab, setActivityModalTab] = useState<'timeline' | 'edit' | 'csv'>('timeline');
  const [activityCsvError, setActivityCsvError] = useState('');
  const [nowClockMs, setNowClockMs] = useState(Date.now());
  const [notifiedActivityIds, setNotifiedActivityIds] = useState<string[]>([]);


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

  // Firebase Auth initialization
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

  // Sync user profile & data from Firestore
  useEffect(() => {
    if (!user || !db) return;

    const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
    const unsubConfig = onSnapshot(
      configDocRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata?.hasPendingWrites) {
          setSyncStatus('offline');
        } else {
          setSyncStatus('saved');
        }
        if (snap.exists()) {
          const data = snap.data();
          if (data.profile) {
            setProfile(data.profile);
            setCheckedInitialProfile(true);
          } else if (!checkedInitialProfile) {
            setShowFirstLaunchModal(true);
            setCheckedInitialProfile(true);
          }
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
        } else if (!checkedInitialProfile) {
          setShowFirstLaunchModal(true);
          setCheckedInitialProfile(true);
        }
      },
      (err) => console.warn('Config listener warning:', err)
    );

    const draftDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'drafts', 'activeWorkout');
    const unsubDraft = onSnapshot(
      draftDocRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.exists() && snap.data().draft) {
          setActiveDraft(snap.data().draft);
        }
      },
      (err) => console.warn('Draft listener warning:', err)
    );

    const createColListener = (name: string, setter: (items: any[]) => void, sortAsc = false) =>
      onSnapshot(
        collection(db, 'artifacts', appId, 'users', user.uid, name),
        { includeMetadataChanges: true },
        (snap) => {
          if (snap.metadata?.hasPendingWrites) setSyncStatus('offline');
          const items: any[] = [];
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

    const unsubCustomFoods = onSnapshot(
      collection(db, 'artifacts', appId, 'users', user.uid, 'customFoods'),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata?.hasPendingWrites) setSyncStatus('offline');
        const cfList: CustomFood[] = [];
        snap.forEach((d) => cfList.push({ id: d.id, ...d.data() } as CustomFood));
        setCustomFoods(cfList);
      },
      (err) => console.warn('Custom foods listener warning:', err)
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
      unsubCustomFoods();
    };
  }, [user]);

  // Phase 2.2 Leaderboard Subcollections Listener (Scoped strictly to activeZestCode)
  useEffect(() => {
    if (!db || !activeZestCode) return;

    // 1. Listen to competitionZests/{activeZestCode} metadata
    const zestDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', activeZestCode);
    const unsubMeta = onSnapshot(
      zestDocRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setActiveZestMeta({
            code: activeZestCode,
            title: d.title || 'Squad Zest',
            createdBy: d.createdBy,
            createdAt: d.createdAt
          });
        }
      },
      (err) => console.warn('Zest meta warning:', err)
    );

    // 2. Listen to competitionZests/{activeZestCode}/members subcollection
    const membersColRef = collection(db, 'artifacts', appId, 'public', 'data', 'competitionZests', activeZestCode, 'members');
    const unsubMembers = onSnapshot(
      membersColRef,
      (snap) => {
        const mList: ZestMember[] = [];
        snap.forEach((d) => mList.push({ uid: d.id, ...d.data() } as ZestMember));
        setZestMembers(mList);
      },
      (err) => console.warn('Zest members warning:', err)
    );

    // 3. Listen to competitionZests/{activeZestCode}/bubbles subcollection
    const bubblesColRef = collection(db, 'artifacts', appId, 'public', 'data', 'competitionZests', activeZestCode, 'bubbles');
    const unsubBubbles = onSnapshot(
      bubblesColRef,
      (snap) => {
        const bList: ZestBubble[] = [];
        snap.forEach((d) => bList.push({ id: d.id, ...d.data() } as ZestBubble));
        bList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setIncomingBubblesQueue(bList);
      },
      (err) => console.warn('Zest bubbles warning:', err)
    );

    return () => {
      unsubMeta();
      unsubMembers();
      unsubBubbles();
    };
  }, [activeZestCode]);

  // Auto-Save Draft Workout with 30-min Inactive Auto-Save Engine
  const saveDraftToFirestore = async (draftObj: WorkoutDraft | null) => {
    setActiveDraft(draftObj);
    if (!user || !db) return;
    try {
      const draftDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'drafts', 'activeWorkout');
      if (draftObj) {
        await appSafeWrite('workout draft', () => setDoc(draftDocRef, { draft: draftObj }));
      } else {
        await appSafeWrite('clear draft', () => deleteDoc(draftDocRef));
      }
    } catch (e) {
      console.warn('Draft save error:', e);
    }
  };

  const saveUserConfig = async (
    p = profile,
    splits = workoutSplits,
    splitId = activeSplitId,
    zestCode = activeZestCode
  ) => {
    if (!user || !db) return;
    try {
      const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
      await appSafeWrite('user config', () =>
        setDoc(
          configDocRef,
          {
            profile: p,
            workoutSplits: splits,
            activeSplitId: splitId,
            activeZestCode: zestCode,
            updatedAt: Date.now()
          },
          { merge: true }
        )
      );
    } catch (e) {
      console.warn('Config write error:', e);
    }
  };

  // Rest Timer & 30-Min Inactivity Auto-Finalize Interval
  useEffect(() => {
    if (!activeDraft) return;

    const interval = setInterval(() => {
      const now = Date.now();

      // Check rest timer countdown
      if (activeDraft.restEndTime && activeDraft.restEndTime > now) {
        const sec = Math.ceil((activeDraft.restEndTime - now) / 1000);
        setRestSecondsLeft(sec);
      } else {
        if (restSecondsLeft > 0) {
          soundEngine.playTing4x();
          triggerToast('⏰ Rest period over! Next set ready.');
        }
        setRestSecondsLeft(0);
      }

      // Check 30-min auto-save if paused or inactive
      const lastActive = activeDraft.lastActiveTimestamp || activeDraft.startedAt || now;
      const inactiveMinutes = (now - lastActive) / 60000;
      const remainingMinutes = Math.max(0, Math.ceil(30 - inactiveMinutes));
      setPauseMinutesLeft(remainingMinutes);

      if (inactiveMinutes >= 30) {
        triggerToast('⚠️ Workout auto-saved and finalized after 30 minutes of inactivity.');
        finalizeAndSaveWorkout(activeDraft, true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeDraft, restSecondsLeft]);

  // Real-time Clock Ticker for Activity Pill (every 1s)
  useEffect(() => {
    const timer = setInterval(() => setNowClockMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Notifications for Activity Pill schedule transitions
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const todayName = getTodayWeekdayName(now);
      const currentMins = now.getHours() * 60 + now.getMinutes();

      activitySchedule.forEach((act) => {
        const d = (act.day || '').toLowerCase();
        const isToday = d === todayName.toLowerCase() || d === 'daily' || d === 'everyday';
        if (!isToday) return;

        if (currentMins === act.startMins && !notifiedActivityIds.includes(`${act.id}-start`)) {
          setNotifiedActivityIds((prev) => [...prev, `${act.id}-start`]);
          soundEngine.playTing4x();
          triggerToast(`🔔 Activity Starting Now: "${act.name}"!`);
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('SWITCH Schedule Pill', {
                body: `Starting now: ${act.name} (${formatMinutesToHHMM(act.startMins)} - ${formatMinutesToHHMM(act.endMins)})`
              });
            } catch (e) {}
          }
        }
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [activitySchedule, notifiedActivityIds]);

  // Computed Today's Activity Pill Status
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


  // Summaries & Mathematical Engines
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
    const flatExercises: any[] = [];
    const combinedMuscles: Record<string, boolean> = {};

    dayWorkouts.forEach((w) => {
      if (w.musclesWorked) {
        Object.keys(w.musclesWorked).forEach((m) => {
          combinedMuscles[m] = true;
        });
      }
      (w.exercises || []).forEach((ex: any) => {
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

    const bmr = calculateBMR(w0, heightCm, age);
    const sedTdee = Math.round(bmr * 1.25);

    const latestBody = bodyLogs[bodyLogs.length - 1] || { weight: w0, waist: 84, belly: 86, chest: 100, wrist: 17 };
    const rfmBodyFatPct = Number((64 - 20 * (heightCm / Math.max(55, Number(latestBody.waist) || 84))).toFixed(1));
    const wristFrameRatio = Number((heightCm / Math.max(12, Number(latestBody.wrist) || 17)).toFixed(2));

    const dailyWeightSlopeKg = (wGoal - w0) / deadlineDays;
    const requiredDailyKcalDelta = Math.round(dailyWeightSlopeKg * 7700);

    const couplingMap: Record<string, number> = {
      weight: 1.0,
      waist: 0.88,
      belly: 0.95,
      chest: 0.5,
      wrist: 0.06
    };
    const alpha = couplingMap[selectedTrackerMetric] || 1.0;
    const startMetricVal = Number(bodyLogs[0]?.[selectedTrackerMetric as keyof BodyLog]) || Number(latestBody[selectedTrackerMetric as keyof BodyLog]) || w0;

    const t0 = bodyLogs[0]?.timestamp || profile.createdAt || Date.now();
    let cumulativeNetEnergyKcal = 0;

    const points = bodyLogs.map((log, idx) => {
      const elapsedDays = Math.max(0, Math.round(((log.timestamp || Date.now()) - t0) / 86400000)) || idx;
      const actualVal = Number(log[selectedTrackerMetric as keyof BodyLog]) || startMetricVal;
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
    const microsScorePct =
      (dayFoods.length === 0 && dayBevs.length === 0) || (fiberG === 0 && sodiumMg === 0 && sugarG === 0)
        ? 0
        : Math.min(100, Math.round((fiberG / 30) * 50 + (sugarG <= 50 ? 25 : 10) + (sodiumMg > 0 && sodiumMg <= 2300 ? 25 : 10)));

    const waterTargetMl = Math.min(4000, Math.max(2500, Math.round(bw * 38 + dailySummary.totalKcal * 0.6)));
    const currentWaterMl = Number(waterLogsByDate[selectedDate]) || 0;
    const waterPercent = Math.min(100, Math.round((currentWaterMl / waterTargetMl) * 100));

    const mealGroups: Record<string, any[]> = {};
    mealCsvPlan.forEach((dish) => {
      const m = dish.meal || 'Meals';
      if (!mealGroups[m]) mealGroups[m] = [];
      mealGroups[m].push(dish);
    });

    const consumedDishCounts: Record<string, number> = {};
    dayFoods.forEach((f) => {
      const key = (f.dishName || f.name || '').toLowerCase();
      consumedDishCounts[key] = (consumedDishCounts[key] || 0) + 1;
    });

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
      pureFoodMacroPct,
      mealGroups,
      consumedDishCounts,
      pureFoodProteinG
    };
  }, [foodLogs, beverageLogs, selectedDate, profile, biometricEngine.sedTdee, dailySummary.totalKcal, waterLogsByDate, mealCsvPlan]);

  // Live Zest Member Stats (Phase 2.2: strictly private weight & age omitted)
  const myLiveZestMemberStats = useMemo<ZestMember>(() => {
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
      sevenDayZestScore:
        scoreBreakdown.totalScore + Math.min(350, Math.round(sevenDayVolumeKg / 250 + sevenDayKcalBurn / 80)),
      scoreBreakdown
    };
  }, [user, profile, workoutLogs, cardioLogs, sportsLogs, dailyMacroSummary, dailySummary, dateChain]);

  // Phase 2.2: Throttled sync of user stats to subcollection competitionZests/{code}/members/{uid} (max once per 5s)
  const lastMemberSyncRef = useRef<number>(0);
  useEffect(() => {
    if (!user || !db || !activeZestCode) return;
    const now = Date.now();
    if (now - lastMemberSyncRef.current < 5000) return;
    lastMemberSyncRef.current = now;

    const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', activeZestCode, 'members', user.uid);
    // Write safe stats: strictly omitting weight and age
    const safeStats = {
      uid: user.uid,
      username: profile.username || 'IronWolf',
      avatarEmoji: profile.avatarEmoji || '🦍',
      todayVolumeKg: myLiveZestMemberStats.todayVolumeKg,
      todayAvgRpe: myLiveZestMemberStats.todayAvgRpe,
      todayKcalBurn: myLiveZestMemberStats.todayKcalBurn,
      fairZestScore: myLiveZestMemberStats.fairZestScore,
      sevenDayVolumeKg: myLiveZestMemberStats.sevenDayVolumeKg,
      sevenDayKcalBurn: myLiveZestMemberStats.sevenDayKcalBurn,
      sevenDayZestScore: myLiveZestMemberStats.sevenDayZestScore,
      pureFoodMacroPct: myLiveZestMemberStats.pureFoodMacroPct,
      waterPct: myLiveZestMemberStats.waterPct,
      waterMl: myLiveZestMemberStats.waterMl,
      prDisplay: myLiveZestMemberStats.prDisplay,
      pbDisplay: myLiveZestMemberStats.pbDisplay,
      updatedAt: now
    };
    setDoc(memberDocRef, safeStats, { merge: true }).catch(() => {});
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

  const activeZestObj = useMemo<ZestGroup | null>(() => {
    if (!activeZestCode) return null;
    return {
      code: activeZestCode,
      title: activeZestMeta?.title || `${profile.username}'s Squad Zest`,
      createdBy: activeZestMeta?.createdBy || user?.uid || 'local-user',
      createdAt: activeZestMeta?.createdAt || Date.now(),
      members: zestMembers
    };
  }, [activeZestCode, activeZestMeta, zestMembers, profile.username, user]);

  // Event Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
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

  const startSessionFromSplit = (sessionObj: WorkoutSession) => {
    if (!isProfileComplete) {
      setShowProfileModal(true);
      setProfileSectionTab('settings');
      return;
    }
    const todayKey = getLocalDateKey();
    const currentWater = Number(waterLogsByDate[todayKey]) || 0;
    const draft: WorkoutDraft = {
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
      exercises: (sessionObj.exercises || []).map((ex: any, idx: number) => ({
        id: `ex-${Date.now()}-${idx}`,
        name: typeof ex === 'string' ? ex : ex.name,
        primaryMuscle:
          typeof ex === 'string'
            ? inferMusclesFromText(ex, sessionObj.sessionName)[0]
            : ex.primaryMuscle || 'Other',
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
    const entry: CardioLog = {
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
        await appSafeWrite('cardio log', () =>
          addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'cardioLogs'), entry)
        );
      } catch (e) {
        console.warn('Cardio log error:', e);
      }
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
    const intensityFactor = 0.75 + (sportRpe / 10) * 0.5;
    const kcalBurned = Math.round(sType.baseMet * intensityFactor * bw * (sportDurationMins / 60));
    const entry: SportsLog = {
      id: `slog-${Date.now()}`,
      dateKey: selectedDate,
      timestamp: Date.now(),
      sportId: sType.id,
      name: sType.name,
      durationMins: sportDurationMins,
      rpe: sportRpe,
      kcalBurned
    };
    setSportsLogs((prev) => [entry, ...prev]);
    if (user && db) {
      try {
        await appSafeWrite('sports log', () =>
          addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sportsLogs'), entry)
        );
      } catch (e) {
        console.warn('Sports log error:', e);
      }
    }
    triggerToast(`Logged ${sType.name} (${kcalBurned} kcal)!`);
  };

  const handleLogBodyMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerInput.weight && !trackerInput.waist && !trackerInput.belly && !trackerInput.chest) {
      triggerToast('Enter at least one metric to log!');
      return;
    }
    const prev = bodyLogs[bodyLogs.length - 1] || {};
    const newEntry: BodyLog = {
      id: `body-${Date.now()}`,
      dateKey: selectedDate,
      timestamp: Date.now(),
      weight: Number(trackerInput.weight) || Number(prev.weight) || Number(profile.weight) || 75,
      chest: Number(trackerInput.chest) || Number(prev.chest) || 100,
      waist: Number(trackerInput.waist) || Number(prev.waist) || 84,
      belly: Number(trackerInput.belly) || Number(prev.belly) || 86,
      wrist: Number(trackerInput.wrist) || Number(prev.wrist) || 17
    };
    setBodyLogs((logs) => [...logs, newEntry]);
    if (trackerInput.weight) {
      setProfile((p) => ({ ...p, weight: Number(trackerInput.weight) }));
    }
    setTrackerInput({ weight: '', chest: '', waist: '', belly: '', wrist: '' });
    if (user && db) {
      try {
        await appSafeWrite('body log', () =>
          addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'bodyLogs'), newEntry)
        );
      } catch (err) {
        console.warn('Body log error:', err);
      }
    }
    triggerToast('Logged new body metrics!');
  };

  const updateDailyWaterTotal = async (dateKey: string, delta: number) => {
    const current = Number(waterLogsByDate[dateKey]) || 0;
    const nextTotal = Math.max(0, current + delta);
    const updatedMap = { ...waterLogsByDate, [dateKey]: nextTotal };
    setWaterLogsByDate(updatedMap);

    if (activeDraft && activeDraft.dateKey === dateKey) {
      saveDraftToFirestore({ ...activeDraft, waterMl: nextTotal, lastActiveTimestamp: Date.now() });
    }

    if (user && db) {
      try {
        const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
        await appSafeWrite('water log', () =>
          setDoc(configDocRef, { waterLogsByDate: updatedMap }, { merge: true })
        );
      } catch (e) {
        console.warn('Water sync error:', e);
      }
    }
  };

  const handleLogManualFoods = async () => {
    if (manualParsedRows.length === 0) return;
    setIsLoggingFood(true);
    const newEntries: FoodLog[] = [];

    for (const row of manualParsedRows) {
      let macros = estimateMacrosLocally(row.name, row.qty, row.unit, customFoods);

      if (!macros) {
        const kcal = Number(row.customKcal) || 0;
        const protein = Number(row.customProtein) || 0;
        const carbs = Number(row.customCarbs) || 0;
        const fats = Number(row.customFats) || 0;
        const fiber = Number(row.customFiber) || 0;
        const sugar = Number(row.customSugar) || 0;
        const sodium = Math.round(Number(row.customSodium) || 0);

        macros = {
          kcal,
          protein,
          carbs,
          fats,
          fiber,
          sugar,
          sodium,
          source: 'User Entry'
        };

        if (row.saveToMyFoods && user && db) {
          const qty = Number(row.qty) || 1;
          const ratio = (row.unit === 'pieces' ? (Number(row.customPieceWeight) || 50) * qty : qty) / 100;
          const per100g = {
            kcal: Math.round(macros.kcal / ratio),
            protein: Number((macros.protein / ratio).toFixed(1)),
            carbs: Number((macros.carbs / ratio).toFixed(1)),
            fats: Number((macros.fats / ratio).toFixed(1)),
            fiber: Number((macros.fiber / ratio).toFixed(1)),
            sugar: Number((macros.sugar / ratio).toFixed(1)),
            sodium: Math.round(macros.sodium / ratio)
          };
          const cfDoc: CustomFood = {
            id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: row.name.toLowerCase().trim(),
            keywords: [row.name.toLowerCase().trim()],
            per100g,
            pieceWeightG: row.unit === 'pieces' ? Number(row.customPieceWeight) || 50 : undefined,
            source: 'My Foods',
            createdAt: Date.now()
          };
          try {
            await appSafeWrite('custom food', () =>
              setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'customFoods', cfDoc.id), cfDoc)
            );
          } catch (e) {
            console.error('Failed to save to My Foods:', e);
          }
        }
      }

      const entry: FoodLog = {
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
          await appSafeWrite('food log', () =>
            addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'foodLogs'), entry)
          );
        } catch (e) {
          console.warn('Food log error:', e);
        }
      }
    }

    setFoodLogs((prev) => [...prev, ...newEntries]);
    setIsLoggingFood(false);
    triggerToast(`Logged ${newEntries.length} food item(s) to Macro Summary!`);
  };

  const handleMealCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMealCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result;
      if (typeof content !== 'string' || !content.trim()) return;
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parsedDishes: any[] = [];
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
        try {
          const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
          await appSafeWrite('meal plan', () =>
            setDoc(configDocRef, { mealCsvPlan: parsedDishes }, { merge: true })
          );
        } catch (e) {
          console.warn('Meal plan write error:', e);
        }
      }
      triggerToast(`Uploaded ${parsedDishes.length} dishes to Meal Plan!`);
    };
    reader.readAsText(file);
  };

  const handleQuickLogCsvDish = async (dish: any) => {
    const entry: FoodLog = {
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
        await appSafeWrite('food log', () =>
          addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'foodLogs'), entry)
        );
      } catch (e) {
        console.warn('Food log error:', e);
      }
    }
    triggerToast(`Logged "${dish.dishName}" (+${dish.protein}g Protein)!`);
  };

  const handleAddBeverageLayer = async () => {
    const bev = BEVERAGE_CATALOG.find((b) => b.id === selectedBeverageId) || BEVERAGE_CATALOG[0];
    const ml = Math.max(10, Number(beverageMlInput) || bev.defaultMl);
    const kcal = Math.round((bev.kcalPer100ml * ml) / 100);
    const sugar = Number(((bev.sugarPer100ml * ml) / 100).toFixed(1));
    const entry: BeverageLog = {
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
        await appSafeWrite('beverage log', () =>
          addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'beverageLogs'), entry)
        );
      } catch (e) {
        console.warn('Beverage log error:', e);
      }
    }
    triggerToast(`Poured ${ml}ml ${bev.name} (${kcal} kcal)!`);
  };

  const handleDeleteBeverage = async (bevId: string) => {
    setBeverageLogs((prev) => prev.filter((b) => b.id !== bevId));
    if (user && db) {
      try {
        await appSafeWrite('delete beverage', () =>
          deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'beverageLogs', bevId))
        );
      } catch (e) {
        console.warn('Delete beverage error:', e);
      }
    }
    triggerToast('Beverage removed');
  };

  const syncGroceryItems = async (nextItems: string[]) => {
    setGroceryItems(nextItems);
    setGroceryRawText(nextItems.join(', '));
    if (user && db) {
      try {
        const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
        await appSafeWrite('grocery list', () =>
          setDoc(configDocRef, { groceryItems: nextItems }, { merge: true })
        );
      } catch (e) {
        console.warn('Grocery list error:', e);
      }
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

  // Phase 2.2 Leaderboard Handlers
  const handleCreatePublicZest = async () => {
    const code = generateZestCode();
    const title = newZestTitleInput.trim() || `${profile.username}'s Squad Zest`;
    const newZestData = {
      code,
      title,
      createdBy: user?.uid || 'local-user',
      createdAt: Date.now()
    };
    setActiveZestCode(code);
    setActiveZestMeta(newZestData);
    setNewZestTitleInput('');
    if (user && db) {
      try {
        const zestDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', code);
        await appSafeWrite('competition zest', () => setDoc(zestDocRef, newZestData));
        const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', code, 'members', user.uid);
        const safeStats = {
          uid: user.uid,
          username: profile.username || 'IronWolf',
          avatarEmoji: profile.avatarEmoji || '🦍',
          todayVolumeKg: myLiveZestMemberStats.todayVolumeKg,
          todayAvgRpe: myLiveZestMemberStats.todayAvgRpe,
          todayKcalBurn: myLiveZestMemberStats.todayKcalBurn,
          fairZestScore: myLiveZestMemberStats.fairZestScore,
          sevenDayVolumeKg: myLiveZestMemberStats.sevenDayVolumeKg,
          sevenDayKcalBurn: myLiveZestMemberStats.sevenDayKcalBurn,
          sevenDayZestScore: myLiveZestMemberStats.sevenDayZestScore,
          pureFoodMacroPct: myLiveZestMemberStats.pureFoodMacroPct,
          waterPct: myLiveZestMemberStats.waterPct,
          waterMl: myLiveZestMemberStats.waterMl,
          prDisplay: myLiveZestMemberStats.prDisplay,
          pbDisplay: myLiveZestMemberStats.pbDisplay,
          updatedAt: Date.now()
        };
        await appSafeWrite('member doc', () => setDoc(memberDocRef, safeStats));
        await saveUserConfig(profile, workoutSplits, activeSplitId, code);
      } catch (e) {
        console.warn('Create zest error:', e);
      }
    }
    triggerToast(`Created Competition Zest "${title}" (Code: ${code})!`);
  };

  const handleJoinPublicZest = async () => {
    const code = joinZestCodeInput.trim().toUpperCase();
    if (!code) return;
    setActiveZestCode(code);
    setJoinZestCodeInput('');
    if (user && db) {
      try {
        const memberDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', code, 'members', user.uid);
        const safeStats = {
          uid: user.uid,
          username: profile.username || 'IronWolf',
          avatarEmoji: profile.avatarEmoji || '🦍',
          todayVolumeKg: myLiveZestMemberStats.todayVolumeKg,
          todayAvgRpe: myLiveZestMemberStats.todayAvgRpe,
          todayKcalBurn: myLiveZestMemberStats.todayKcalBurn,
          fairZestScore: myLiveZestMemberStats.fairZestScore,
          sevenDayVolumeKg: myLiveZestMemberStats.sevenDayVolumeKg,
          sevenDayKcalBurn: myLiveZestMemberStats.sevenDayKcalBurn,
          sevenDayZestScore: myLiveZestMemberStats.sevenDayZestScore,
          pureFoodMacroPct: myLiveZestMemberStats.pureFoodMacroPct,
          waterPct: myLiveZestMemberStats.waterPct,
          waterMl: myLiveZestMemberStats.waterMl,
          prDisplay: myLiveZestMemberStats.prDisplay,
          pbDisplay: myLiveZestMemberStats.pbDisplay,
          updatedAt: Date.now()
        };
        await appSafeWrite('join zest', () => setDoc(memberDocRef, safeStats, { merge: true }));
        await saveUserConfig(profile, workoutSplits, activeSplitId, code);
      } catch (e) {
        console.warn('Join zest error:', e);
      }
    }
    triggerToast(`Joined Squad Zest (${code})!`);
  };

  const handleAddDemoSquadMates = async () => {
    if (!activeZestCode) return;
    const demoMates: ZestMember[] = [
      {
        uid: 'demo-mate-1',
        username: 'ShadowWolf99',
        avatarEmoji: '🐺',
        todayVolumeKg: 7850,
        todayAvgRpe: 8.5,
        todayKcalBurn: 620,
        fairZestScore: 840,
        sevenDayVolumeKg: 42000,
        sevenDayKcalBurn: 3800,
        sevenDayZestScore: 980,
        pureFoodMacroPct: 92,
        waterPct: 88,
        waterMl: 3100,
        prDisplay: 'Barbell Squat (140kg)',
        pbDisplay: 'Bench Press (100kg × 8)',
        updatedAt: Date.now()
      },
      {
        uid: 'demo-mate-2',
        username: 'TitanViper7',
        avatarEmoji: '⚡',
        todayVolumeKg: 6200,
        todayAvgRpe: 7.8,
        todayKcalBurn: 540,
        fairZestScore: 780,
        sevenDayVolumeKg: 36000,
        sevenDayKcalBurn: 3200,
        sevenDayZestScore: 910,
        pureFoodMacroPct: 85,
        waterPct: 95,
        waterMl: 3500,
        prDisplay: 'Deadlift (170kg)',
        pbDisplay: 'Overhead Press (60kg × 6)',
        updatedAt: Date.now()
      }
    ];
    setZestMembers((prev) => [...prev.filter((m) => !m.uid.startsWith('demo-')), ...demoMates]);
    if (user && db) {
      try {
        for (const mate of demoMates) {
          const mRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', activeZestCode, 'members', mate.uid);
          await setDoc(mRef, mate);
        }
      } catch (e) {
        console.warn('Demo mates write error:', e);
      }
    }
    triggerToast('Simulated 2 friends in your Squad! Track records unlocked.');
  };

  const handleSendZestBubble = async (targetMember: ZestMember, presetText: string) => {
    if (!activeZestCode) return;
    const bubbleId = `bubble-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const bubble: ZestBubble = {
      id: bubbleId,
      fromUid: user?.uid || 'local-user',
      fromUsername: profile.username,
      fromAvatarEmoji: profile.avatarEmoji,
      toUid: targetMember.uid,
      toUsername: targetMember.username,
      message: presetText.replace(/@username/g, `@${targetMember.username}`),
      timestamp: Date.now()
    };
    setIncomingBubblesQueue((prev) => [bubble, ...prev]);
    if (user && db) {
      try {
        const bRef = doc(db, 'artifacts', appId, 'public', 'data', 'competitionZests', activeZestCode, 'bubbles', bubbleId);
        await appSafeWrite('send bubble', () => setDoc(bRef, bubble));
      } catch (e) {
        console.warn('Send bubble error:', e);
      }
    }
    triggerToast(`Sent bubble to @${targetMember.username}!`);
  };

  const finalizeAndSaveWorkout = async (draft: WorkoutDraft, isAutoFinalize = false) => {
    const totalVolumeKg = draft.exercises.reduce((exAcc, ex) => {
      const exVol = ex.sets.reduce((sAcc, s) => {
        return s.completed ? sAcc + (Number(s.weight) || 0) * (Number(s.reps) || 0) : sAcc;
      }, 0);
      return exAcc + exVol;
    }, 0);

    const completedSetsCount = draft.exercises.reduce((acc, ex) => {
      return acc + ex.sets.filter((s) => s.completed).length;
    }, 0);

    const avgRpe =
      draft.exercises.length > 0
        ? Number((draft.exercises.reduce((acc, ex) => acc + (Number(ex.rpe) || 7.5), 0) / draft.exercises.length).toFixed(1))
        : 7.5;

    const musclesWorked: Record<string, boolean> = {};
    const exercisesSummary: any[] = [];

    draft.exercises.forEach((ex) => {
      const compSets = ex.sets.filter((s) => s.completed);
      if (compSets.length > 0) {
        musclesWorked[ex.primaryMuscle || 'Other'] = true;
        let bestWeight = 0;
        let bestReps = 0;
        compSets.forEach((s) => {
          if (Number(s.weight) > bestWeight) {
            bestWeight = Number(s.weight);
            bestReps = Number(s.reps);
          }
        });
        exercisesSummary.push({
          name: ex.name,
          setsCount: compSets.length,
          bestWeight,
          bestReps,
          bestSetLabel: `${bestWeight}kg × ${bestReps}`
        });
      }
    });

    const bw = Number(profile.weight) || 75;
    const kcalBurned = Math.round((totalVolumeKg * 0.05) + (completedSetsCount * 12) + (bw * 1.5));

    const workoutEntry: WorkoutLog = {
      id: `wlog-${Date.now()}`,
      dateKey: draft.dateKey,
      timestamp: Date.now(),
      sessionName: draft.sessionName,
      splitTitle: draft.splitTitle,
      totalVolumeKg,
      kcalBurned,
      avgRpe,
      exercises: exercisesSummary,
      musclesWorked
    };

    setWorkoutLogs((prev) => [workoutEntry, ...prev]);
    setIsLoggerOpen(false);
    saveDraftToFirestore(null);

    if (user && db) {
      try {
        await appSafeWrite('workout log', () =>
          addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'workoutLogs'), workoutEntry)
        );
      } catch (err) {
        console.warn('Finalize save error:', err);
      }
    }

    soundEngine.playTing4x();
    triggerToast(
      isAutoFinalize
        ? `Auto-saved workout! Total Volume: ${totalVolumeKg.toLocaleString()} kg (+${kcalBurned} kcal)`
        : `Workout logged! Total Volume: ${totalVolumeKg.toLocaleString()} kg (+${kcalBurned} kcal)`
    );
  };

  const handleWorkoutCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content !== 'string') return;
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setCsvError('CSV must contain at least 2 rows (Split title, session rows).');
        return;
      }
      try {
        const splitTitle = lines[0].split(',')[0].trim() || 'Custom Split';
        const sessions: WorkoutSession[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim()).filter(Boolean);
          if (parts.length < 2) continue;
          const sessionName = parts[0];
          const exerciseNames = parts.slice(1);
          sessions.push({
            id: `sess-${Date.now()}-${i}`,
            sessionName,
            exercises: exerciseNames.map((name) => ({
              name,
              primaryMuscle: inferMusclesFromText(name, sessionName)[0] || 'Other'
            }))
          });
        }
        if (sessions.length === 0) {
          setCsvError('No valid sessions parsed.');
          return;
        }
        const newSplit: WorkoutSplit = { id: `split-${Date.now()}`, title: splitTitle, sessions };
        setWorkoutSplits((prev) => [...prev, newSplit]);
        setActiveSplitId(newSplit.id);
        saveUserConfig(profile, [...workoutSplits, newSplit], newSplit.id, activeZestCode);
        setShowRoutineChoiceModal(false);
        setRoutineSubPage(null);
        triggerToast(`Imported "${splitTitle}" with ${sessions.length} sessions!`);
      } catch (err: any) {
        setCsvError(err.message || 'Error parsing CSV');
      }
    };
    reader.readAsText(file);
  };

  // Activity Schedule Save Helpers
  const handleSaveActivitySchedule = async (newSchedule: ActivityScheduleItem[]) => {
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

  const handleActivityCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setActivityModalTab('edit');
      triggerToast(`Imported ${parsed.length} activities from .CSV! Editable in Type format.`);
    };
    reader.readAsText(file);
  };

  // Incoming Bubbles for current user
  const activeIncomingBubbles = useMemo(() => {
    if (!user) return [];
    return incomingBubblesQueue.filter(
      (b) => b.toUid === user.uid && !dismissedBubbleIds.includes(b.id)
    );
  }, [incomingBubblesQueue, user, dismissedBubbleIds]);

  const handleDismissBubble = async (bubbleId: string) => {
    const next = [...dismissedBubbleIds, bubbleId];
    setDismissedBubbleIds(next);
    if (user && db) {
      try {
        const configDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'userConfig');
        await setDoc(configDocRef, { dismissedBubbleIds: next }, { merge: true });
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased pb-36 selection:bg-[#D4FB45] selection:text-black">
      {/* Toast Notification Container (Dynamic Island Drop Capsule) */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1C1C1E]/95 border border-white/10 text-[#30D158] px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-2xl text-xs font-bold tracking-wide flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-[#30D158] animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Incoming Zero-Chat Bubbles Notification Toast */}
      {activeIncomingBubbles.length > 0 && (
        <div className="fixed top-16 inset-x-0 z-40 flex flex-col items-center px-4 space-y-2 pointer-events-auto">
          {activeIncomingBubbles.slice(0, 2).map((b) => (
            <div
              key={b.id}
              className="bg-[#1C1C1E]/95 border border-[#FF9F0A]/40 rounded-3xl p-4 shadow-2xl max-w-sm w-full space-y-2 backdrop-blur-2xl animate-in bounce-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#D4FB45]/15 text-[#D4FB45] flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white">@{b.fromUsername}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDismissBubble(b.id)}
                  className="text-[#8E8E93] hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-bold text-[#FF9F0A]">"{b.message}"</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {buildSmartRepliesForBubble(b.message).map((rep, rIdx) => (
                  <button
                    key={rIdx}
                    type="button"
                    onClick={() => {
                      handleDismissBubble(b.id);
                      handleSendZestBubble(
                        { uid: b.fromUid, username: b.fromUsername, avatarEmoji: b.fromAvatarEmoji },
                        rep
                      );
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#2C2C2E] border border-white/5 text-[10px] font-bold text-[#8E8E93] hover:text-white hover:border-[#30D158]/40 transition ios-press"
                  >
                    {rep}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* iOS 18 GLASSMORPHIC APP HEADER */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-2xl border-b border-white/5 px-5 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Brand Logo on Left */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-tight text-white font-display flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#D4FB45] fill-[#D4FB45]" />
              <span>SWITCH</span>
            </span>
          </div>

          {/* Right: Activity Pill & Settings */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setShowActivityPillModal(true)}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#141417] hover:bg-[#1F1F24] border border-white/10 text-xs font-semibold text-white shadow-lg ios-press transition"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4FB45] animate-pulse shrink-0" />
              <span className="max-w-[110px] truncate">
                {todayActivityStatus.currentAct ? todayActivityStatus.currentAct.name : 'Schedule'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="w-9 h-9 rounded-full bg-[#141417] border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition ios-press shadow-md"
              title="Settings & Profile"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        {bottomTab === 'fitness' && (
          <FitnessTab
            dailySummary={dailySummary}
            showCard1aBack={showCard1aBack}
            setShowCard1aBack={setShowCard1aBack}
            activeSplit={activeSplit}
            workoutSplits={workoutSplits}
            setActiveSplitId={setActiveSplitId}
            setShowRoutineChoiceModal={setShowRoutineChoiceModal}
            setRoutineSubPage={setRoutineSubPage}
            startSessionFromSplit={startSessionFromSplit}
            selectedCardioId={selectedCardioId}
            setSelectedCardioId={setSelectedCardioId}
            cardioDurationMins={cardioDurationMins}
            setCardioDurationMins={setCardioDurationMins}
            cardioDistanceKm={cardioDistanceKm}
            setCardioDistanceKm={setCardioDistanceKm}
            cardioResistance={cardioResistance}
            setCardioResistance={setCardioResistance}
            profile={profile}
            handleLogCardio={handleLogCardio}
            selectedSportId={selectedSportId}
            setSelectedSportId={setSelectedSportId}
            sportDurationMins={sportDurationMins}
            setSportDurationMins={setSportDurationMins}
            sportRpe={sportRpe}
            setSportRpe={setSportRpe}
            handleLogSports={handleLogSports}
            showMathInspector={showMathInspector}
            setShowMathInspector={setShowMathInspector}
            biometricEngine={biometricEngine}
            selectedTrackerMetric={selectedTrackerMetric}
            setSelectedTrackerMetric={setSelectedTrackerMetric}
            trackerInput={trackerInput}
            setTrackerInput={setTrackerInput}
            handleLogBodyMetrics={handleLogBodyMetrics}
          />
        )}

        {bottomTab === 'macros' && (
          <MacrosFoodTab
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dateChain={dateChain}
            dailyMacroSummary={dailyMacroSummary}
            foodInputMode={foodInputMode}
            setFoodInputMode={setFoodInputMode}
            manualRawText={manualRawText}
            setManualRawText={setManualRawText}
            manualParsedRows={manualParsedRows}
            setManualParsedRows={setManualParsedRows}
            isLoggingFood={isLoggingFood}
            customFoods={customFoods}
            handleLogManualFoods={handleLogManualFoods}
            expandedMealCategory={expandedMealCategory}
            setExpandedMealCategory={setExpandedMealCategory}
            handleQuickLogCsvDish={handleQuickLogCsvDish}
            mealCsvError={mealCsvError}
            handleMealCsvUpload={handleMealCsvUpload}
            updateDailyWaterTotal={updateDailyWaterTotal}
            selectedBeverageId={selectedBeverageId}
            setSelectedBeverageId={setSelectedBeverageId}
            beverageMlInput={beverageMlInput}
            setBeverageMlInput={setBeverageMlInput}
            handleAddBeverageLayer={handleAddBeverageLayer}
            handleDeleteBeverage={handleDeleteBeverage}
            groceryRawText={groceryRawText}
            setGroceryRawText={setGroceryRawText}
            groceryItems={groceryItems}
            setGroceryItems={setGroceryItems}
            syncGroceryItems={syncGroceryItems}
            handleCopyGroceryCommaList={handleCopyGroceryCommaList}
          />
        )}

        {bottomTab === 'rno' && (
          <RemindersNotesTab
            remindersList={remindersList}
            notesList={notesList}
            setNotesList={setNotesList}
            setRemindersList={setRemindersList}
            triggerToast={triggerToast}
            safeWrite={appSafeWrite}
            user={user}
            db={db}
            appId={appId}
          />
        )}

      </main>

      {/* FLOATING GLASS DOCK (No Words, No Spot, Smooth Faded Capsule) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 floating-dock rounded-full px-6 py-2.5 flex items-center space-x-7 sm:space-x-8">
        {/* Fitness: Activity */}
        <button
          type="button"
          onClick={() => setBottomTab('fitness')}
          className={`relative p-2.5 rounded-full transition ios-press ${
            bottomTab === 'fitness'
              ? 'text-[#D4FB45] bg-[#D4FB45]/15'
              : 'text-white/60 hover:text-white'
          }`}
          title="Fitness"
        >
          <Activity className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Macros: UtensilsCrossed */}
        <button
          type="button"
          onClick={() => setBottomTab('macros')}
          className={`relative p-2.5 rounded-full transition ios-press ${
            bottomTab === 'macros'
              ? 'text-[#D4FB45] bg-[#D4FB45]/15'
              : 'text-white/60 hover:text-white'
          }`}
          title="Nutrition & Macros"
        >
          <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Activities (Reminders & Notes): CheckSquare */}
        <button
          type="button"
          onClick={() => setBottomTab('rno')}
          className={`relative p-2.5 rounded-full transition ios-press ${
            bottomTab === 'rno'
              ? 'text-[#D4FB45] bg-[#D4FB45]/15'
              : 'text-white/60 hover:text-white'
          }`}
          title="Activities (Reminders & Notes)"
        >
          <CheckSquare className="w-5 h-5 stroke-[2.2]" />
        </button>
      </nav>

      {/* ACTIVE WORKOUT LOGGER MODAL (Dynamic Island + Rest Pill + Inset Grouped) */}
      {isLoggerOpen && activeDraft && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col overflow-y-auto animate-in fade-in">
          <div className="max-w-lg w-full mx-auto p-4 space-y-4 flex-1">
            {/* Top Dynamic Island Rest Timer Capsule */}
            <div className="sticky top-3 z-20 bg-[#1C1C1E]/95 border border-white/10 rounded-full px-4 py-2.5 shadow-2xl flex items-center justify-between backdrop-blur-2xl">
              <button
                type="button"
                onClick={() =>
                  saveDraftToFirestore({
                    ...activeDraft,
                    restEndTime: Math.max(Date.now(), (activeDraft.restEndTime || Date.now()) - 30000),
                    lastActiveTimestamp: Date.now()
                  })
                }
                className="px-3 py-1 rounded-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-xs font-bold text-white ios-press"
              >
                -30s
              </button>
              <div className="flex items-center space-x-2">
                <Timer className={`w-4 h-4 ${restSecondsLeft > 0 ? 'text-[#FF9F0A] animate-spin' : 'text-[#30D158]'}`} />
                <span className="font-mono text-sm font-black text-white">
                  {restSecondsLeft > 0 ? `Rest: ${restSecondsLeft}s` : 'Timer Ready'}
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
                className="px-3 py-1 rounded-full bg-[#30D158]/20 hover:bg-[#30D158]/30 text-xs font-bold text-[#30D158] ios-press"
              >
                +30s
              </button>
            </div>

            {/* Session Info Card */}
            <div className="bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 shadow-2xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">{activeDraft.sessionName}</h3>
                <p className="text-[11px] text-[#8E8E93]">Auto-saves in {pauseMinutesLeft}m if inactive</p>
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
                  className="px-3 py-2 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 text-[#FF9F0A] text-xs font-bold ios-press"
                >
                  {activeDraft.isPaused ? 'Resume' : 'Pause (30m)'}
                </button>
                <button
                  type="button"
                  onClick={() => finalizeAndSaveWorkout(activeDraft, false)}
                  className="px-4 py-2 rounded-xl bg-[#30D158] text-black text-xs font-black ios-press shadow-md shadow-[#30D158]/20"
                >
                  Finish
                </button>
              </div>
            </div>

            {/* Quick Water Row */}
            <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl p-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => updateDailyWaterTotal(activeDraft.dateKey, -100)}
                className="px-3 py-1.5 rounded-xl bg-[#2C2C2E] text-xs font-bold text-[#8E8E93] hover:text-white ios-press"
              >
                -100ml
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#32ADE6]">
                <Droplets className="w-4 h-4" />
                <span>Water: {waterLogsByDate[activeDraft.dateKey] || 0} ml</span>
              </div>
              <button
                type="button"
                onClick={() => updateDailyWaterTotal(activeDraft.dateKey, 100)}
                className="px-3 py-1.5 rounded-xl bg-[#32ADE6] text-black text-xs font-bold ios-press shadow-md shadow-[#32ADE6]/20"
              >
                +100ml
              </button>
            </div>

            {/* Exercises List */}
            <div className="space-y-3">
              {activeDraft.exercises.map((ex, exIdx) => (
                <div key={ex.id || exIdx} className="bg-[#1C1C1E] border border-white/5 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{ex.name}</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#8E8E93]">RPE:</span>
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
                        className="w-14 bg-[#2C2C2E] border border-white/10 rounded-xl px-2 py-1 text-center font-bold text-[#FF9F0A]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ex.sets.map((s, sIdx) => (
                      <div key={sIdx} className="grid grid-cols-10 gap-2 items-center text-xs">
                        <span className="col-span-2 text-[#8E8E93] font-bold">Set #{sIdx + 1}</span>
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
                          className="col-span-3 bg-[#2C2C2E] border border-white/5 rounded-xl py-2 text-center font-bold text-white focus:outline-none focus:border-[#30D158]"
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
                          className="col-span-3 bg-[#2C2C2E] border border-white/5 rounded-xl py-2 text-center font-bold text-white focus:outline-none focus:border-[#30D158]"
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
                          className={`col-span-2 py-2 rounded-xl font-black flex items-center justify-center transition ios-press ${
                            s.completed ? 'bg-[#30D158] text-black shadow-md shadow-[#30D158]/20' : 'bg-[#2C2C2E] text-[#8E8E93]'
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
              className="w-full py-3 rounded-2xl bg-[#1C1C1E] border border-white/10 text-[#8E8E93] hover:text-white text-xs font-bold transition ios-press"
            >
              Minimize Workout (Runs in Background)
            </button>
          </div>
        </div>
      )}

      {/* ROUTINE BUILDER MODAL (iOS Bottom Sheet) */}
      {showRoutineChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ios-sheet-animate">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto shrink-0 mb-1" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">Workout Split Builder</h3>
              <button
                onClick={() => {
                  setShowRoutineChoiceModal(false);
                  setRoutineSubPage(null);
                  setCsvError('');
                }}
                className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center transition ios-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {!routineSubPage && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setRoutineSubPage('scratch')}
                  className="bg-[#2C2C2E]/60 hover:bg-[#2C2C2E] border border-white/5 rounded-2xl p-4 text-left space-y-2 transition ios-press"
                >
                  <Edit3 className="w-5 h-5 text-[#30D158]" />
                  <h4 className="font-bold text-white text-xs">Create from Scratch</h4>
                </button>
                <button
                  onClick={() => setRoutineSubPage('csv')}
                  className="bg-[#2C2C2E]/60 hover:bg-[#2C2C2E] border border-white/5 rounded-2xl p-4 text-left space-y-2 transition ios-press"
                >
                  <FileSpreadsheet className="w-5 h-5 text-[#32ADE6]" />
                  <h4 className="font-bold text-white text-xs">Upload .CSV Split</h4>
                </button>
              </div>
            )}
            {routineSubPage === 'scratch' && (
              <div className="space-y-3 text-xs">
                <input
                  type="text"
                  value={scratchTitle}
                  onChange={(e) => setScratchTitle(e.target.value)}
                  placeholder="Split Title (e.g., Push Pull Legs)"
                  className="w-full bg-[#2C2C2E] border border-white/5 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-[#30D158]"
                />
                {scratchBlocks.map((blk, bIdx) => (
                  <div key={blk.id} className="bg-[#2C2C2E]/60 border border-white/5 rounded-2xl p-3.5 space-y-2">
                    <input
                      type="text"
                      value={blk.sessionName}
                      onChange={(e) => {
                        const next = [...scratchBlocks];
                        next[bIdx].sessionName = e.target.value;
                        setScratchBlocks(next);
                      }}
                      placeholder="Session Name (e.g., Push)"
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-white font-bold"
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
                            primaryMuscle: inferMusclesFromText(name, blk.sessionName)[0] || 'Other'
                          }));
                        setScratchBlocks(next);
                      }}
                      placeholder="Exercises comma-separated (Bench Press, Incline DB, Tricep Pushdown)"
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2 text-white/80"
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
                  className="w-full py-2.5 rounded-xl bg-[#2C2C2E] text-[#30D158] font-bold ios-press transition"
                >
                  + Add New Block
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!scratchTitle.trim()) return;
                    const newSplit: WorkoutSplit = { id: 'split-' + Date.now(), title: scratchTitle, sessions: scratchBlocks };
                    const next = [...workoutSplits, newSplit];
                    setWorkoutSplits(next);
                    setActiveSplitId(newSplit.id);
                    saveUserConfig(profile, next, newSplit.id, activeZestCode);
                    setShowRoutineChoiceModal(false);
                    setRoutineSubPage(null);
                    triggerToast('Split created & activated!');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#30D158] hover:bg-[#30D158]/90 text-black font-black uppercase tracking-wider ios-press transition"
                >
                  Save Workout Split
                </button>
              </div>
            )}
            {routineSubPage === 'csv' && (
              <div className="space-y-3 text-xs">
                <p className="text-[#8E8E93]">
                  Format each row as: <b className="text-[#32ADE6]">Split Title, Session Name, Ex 1, Ex 2...</b>
                </p>
                {csvError && <p className="text-[#FF453A] font-bold bg-[#FF453A]/10 p-2 rounded-xl">{csvError}</p>}
                <label className="w-full py-6 rounded-2xl border border-dashed border-[#32ADE6]/40 bg-[#32ADE6]/5 hover:bg-[#32ADE6]/10 text-[#32ADE6] font-bold flex flex-col items-center cursor-pointer ios-press transition">
                  <Upload className="w-5 h-5 mb-1" />
                  <span>Upload .CSV Split</span>
                  <input type="file" accept=".csv" onChange={handleWorkoutCsvUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVITY PILL MODAL (iOS Bottom Sheet) */}
      {showActivityPillModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#1C1C1E] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ios-sheet-animate">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto shrink-0 mb-1" />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarClock className="w-5 h-5 text-[#30D158]" />
                <h3 className="text-base font-black text-white">Daily Schedule & Activity Pill</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityPillModal(false)}
                className="w-8 h-8 rounded-full bg-[#2C2C2E] text-[#8E8E93] hover:text-white flex items-center justify-center transition ios-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-[#2C2C2E] p-1 rounded-2xl border border-white/5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActivityModalTab('timeline')}
                className={`py-2 rounded-xl transition ${
                  activityModalTab === 'timeline' ? 'bg-[#3A3A3C] text-white shadow-md' : 'text-[#8E8E93]'
                }`}
              >
                Timeline
              </button>
              <button
                type="button"
                onClick={() => setActivityModalTab('edit')}
                className={`py-2 rounded-xl transition ${
                  activityModalTab === 'edit' ? 'bg-[#3A3A3C] text-white shadow-md' : 'text-[#8E8E93]'
                }`}
              >
                Type Format
              </button>
              <button
                type="button"
                onClick={() => setActivityModalTab('csv')}
                className={`py-2 rounded-xl transition ${
                  activityModalTab === 'csv' ? 'bg-[#3A3A3C] text-white shadow-md' : 'text-[#8E8E93]'
                }`}
              >
                CSV Upload
              </button>
            </div>

            {activityModalTab === 'timeline' && (
              <div className="space-y-3">
                <div className="bg-[#2C2C2E]/60 border border-white/5 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <span className="text-[#8E8E93]">Current Time: <b className="text-white font-mono">{todayActivityStatus.currentTimeStr}</b></span>
                  <span className="text-[#30D158] font-bold">{todayActivityStatus.completedCount} / {todayActivityStatus.todaysList.length} Done</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {todayActivityStatus.todaysList.length === 0 ? (
                    <p className="text-xs text-[#8E8E93] py-6 text-center font-medium">
                      No schedule set for today. Switch to "Type Format" or "CSV Upload" to add your timetable.
                    </p>
                  ) : (
                    todayActivityStatus.todaysList.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                          item.status === 'current'
                            ? 'bg-[#30D158]/15 border-[#30D158]/50 text-white'
                            : item.status === 'completed'
                            ? 'bg-[#2C2C2E]/30 border-white/5 text-[#8E8E93]'
                            : 'bg-[#2C2C2E]/60 border-white/5 text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            item.status === 'current' ? 'bg-[#30D158] animate-ping' : item.status === 'completed' ? 'bg-slate-700' : 'bg-slate-400'
                          }`} />
                          <span className="font-bold">{item.name}</span>
                        </div>
                        <span className="font-mono text-[11px] opacity-80">
                          {formatMinutesToHHMM(item.startMins)} - {formatMinutesToHHMM(item.endMins)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activityModalTab === 'edit' && (
              <div className="space-y-3 text-xs">
                <label className="text-[#8E8E93] block font-bold">
                  Edit or Paste Activities:
                </label>
                <textarea
                  rows={8}
                  value={activityTypeText}
                  onChange={(e) => setActivityTypeText(e.target.value)}
                  placeholder="[Monday]&#10;Deep Work - 09:00 : 12:00&#10;Gym Workout - 17:30 : 19:00&#10;&#10;[Daily]&#10;Lunch & Walk - 13:00 : 14:00"
                  className="w-full bg-[#2C2C2E] border border-white/5 rounded-2xl p-4 text-white font-mono text-xs focus:outline-none focus:border-[#30D158]"
                />
                <button
                  type="button"
                  onClick={handleSaveTypedActivities}
                  className="w-full py-3.5 rounded-2xl bg-[#30D158] hover:bg-[#30D158]/90 text-black font-black text-xs uppercase tracking-wider ios-press transition"
                >
                  Save Schedule to Pill
                </button>
              </div>
            )}

            {activityModalTab === 'csv' && (
              <div className="space-y-3 text-xs">
                <p className="text-[#8E8E93]">
                  Upload CSV formatted as: <b className="text-[#32ADE6]">Day, Activity Name, Start Time, End Time</b>
                </p>
                {activityCsvError && <p className="text-[#FF453A] font-bold bg-[#FF453A]/10 p-2 rounded-xl">{activityCsvError}</p>}
                <label className="w-full py-6 rounded-2xl border border-dashed border-[#32ADE6]/40 bg-[#32ADE6]/5 hover:bg-[#32ADE6]/10 text-[#32ADE6] font-bold flex flex-col items-center cursor-pointer ios-press transition">
                  <Upload className="w-5 h-5 mb-1" />
                  <span>Upload Timetable .CSV</span>
                  <input type="file" accept=".csv" onChange={handleActivityCsvUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      )}


      {/* FIRST LAUNCH ONBOARDING SETUP MODAL */}
      {showFirstLaunchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Welcome to SWITCH</h3>
            <p className="text-xs text-[#8E8E93]">Set up your athlete biometrics to calibrate your targets.</p>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#8E8E93] block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={profile.weight}
                    onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) || 0 })}
                    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#30D158]"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-[#8E8E93] block mb-1">Goal Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={profile.goalWeight}
                    onChange={(e) => setProfile({ ...profile, goalWeight: Number(e.target.value) || 0 })}
                    className="w-full bg-[#2C2C2E] border border-white/5 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-[#30D158]"
                  />
                </div>
              </div>
              <button
                type="submit"
                onClick={() => setShowFirstLaunchModal(false)}
                className="w-full py-3.5 rounded-2xl bg-[#30D158] text-black font-black text-xs uppercase tracking-wider ios-press transition"
              >
                Save & Launch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LEADERBOARD & PROFILE MODAL (Phase 2.2 & 2.5) */}
      <LeaderboardModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile}
        setProfile={setProfile}
        myLiveZestMemberStats={myLiveZestMemberStats}
        activeZestObj={activeZestObj}
        activeZestCode={activeZestCode}
        setActiveZestCode={setActiveZestCode}
        newZestTitleInput={newZestTitleInput}
        setNewZestTitleInput={setNewZestTitleInput}
        joinZestCodeInput={joinZestCodeInput}
        setJoinZestCodeInput={setJoinZestCodeInput}
        handleCreatePublicZest={handleCreatePublicZest}
        handleJoinPublicZest={handleJoinPublicZest}
        handleAddDemoSquadMates={handleAddDemoSquadMates}
        handleSendZestBubble={handleSendZestBubble}
        handleSaveProfile={handleSaveProfile}
        user={user}
        triggerToast={triggerToast}
        db={db}
      />
    </div>
  );
}