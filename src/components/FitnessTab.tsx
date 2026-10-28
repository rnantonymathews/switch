import React, { useState } from 'react';
import {
  Settings,
  Play,
  Flame,
  Calculator,
  RotateCcw,
  Trophy,
  Plus,
  TrendingUp,
  ChevronDown,
  Dumbbell
} from 'lucide-react';
import { CARDIO_TYPES, SPORTS_TYPES } from '../constants';
import type { Profile, WorkoutSplit, WorkoutSession } from '../types';

export interface FitnessTabProps {
  dailySummary: {
    totalKgs: number;
    formattedKgs: string;
    workoutKcal: number;
    cardioKcal: number;
    sportsKcal: number;
    totalKcal: number;
    prDisplay: string;
    pbDisplay: string;
    flatExercises: any[];
    dayCardio: any[];
    daySports: any[];
    combinedMuscles: Record<string, boolean>;
    burnPercent: number;
  };
  showCard1aBack: boolean;
  setShowCard1aBack: (v: boolean | ((prev: boolean) => boolean)) => void;
  activeSplit: WorkoutSplit | null | undefined;
  workoutSplits: WorkoutSplit[];
  setActiveSplitId: (id: string) => void;
  setShowRoutineChoiceModal: (v: boolean) => void;
  setRoutineSubPage: (v: any) => void;
  startSessionFromSplit: (sess: WorkoutSession) => void;
  selectedCardioId: string;
  setSelectedCardioId: (id: string) => void;
  cardioDurationMins: number;
  setCardioDurationMins: (m: number) => void;
  cardioDistanceKm: number;
  setCardioDistanceKm: (d: number) => void;
  cardioResistance: number;
  setCardioResistance: (r: number) => void;
  profile: Profile;
  handleLogCardio: () => Promise<void>;
  selectedSportId: string;
  setSelectedSportId: (id: string) => void;
  sportDurationMins: number;
  setSportDurationMins: (m: number) => void;
  sportRpe: number;
  setSportRpe: (rpe: number) => void;
  handleLogSports: () => Promise<void>;
  showMathInspector: boolean;
  setShowMathInspector: (v: boolean | ((prev: boolean) => boolean)) => void;
  biometricEngine: {
    bmr: number;
    sedTdee: number;
    deadlineDays: number;
    rfmBodyFatPct: number;
    wristFrameRatio: number;
    requiredDailyKcalDelta: number;
    totalActiveBurnAllDays: number;
    points: Array<{
      day: number;
      dateKey: string;
      actual: number;
      target: number;
      proj: number;
    }>;
  };
  selectedTrackerMetric: string;
  setSelectedTrackerMetric: (m: string) => void;
  trackerInput: { weight: string; chest: string; waist: string; belly: string; wrist: string };
  setTrackerInput: React.Dispatch<React.SetStateAction<{ weight: string; chest: string; waist: string; belly: string; wrist: string }>>;
  handleLogBodyMetrics: (e: React.FormEvent) => Promise<void>;
}

type ActiveCard = 'workout' | 'cardio' | 'sports' | 'biometrics' | null;

export const FitnessTab: React.FC<FitnessTabProps> = ({
  dailySummary,
  showCard1aBack,
  setShowCard1aBack,
  activeSplit,
  workoutSplits,
  setActiveSplitId,
  setShowRoutineChoiceModal,
  setRoutineSubPage,
  startSessionFromSplit,
  selectedCardioId,
  setSelectedCardioId,
  cardioDurationMins,
  setCardioDurationMins,
  cardioDistanceKm,
  setCardioDistanceKm,
  cardioResistance,
  setCardioResistance,
  profile,
  handleLogCardio,
  selectedSportId,
  setSelectedSportId,
  sportDurationMins,
  setSportDurationMins,
  sportRpe,
  setSportRpe,
  handleLogSports,
  showMathInspector,
  setShowMathInspector,
  biometricEngine,
  selectedTrackerMetric,
  setSelectedTrackerMetric,
  trackerInput,
  setTrackerInput,
  handleLogBodyMetrics
}) => {
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  // Exclusive accordion: only one card can be open at a time; Activity Summary stays open permanently
  const [expandedCard, setExpandedCard] = useState<ActiveCard>('workout');

  const toggleCard = (card: 'workout' | 'cardio' | 'sports' | 'biometrics') => {
    setExpandedCard((prev) => (prev === card ? null : card));
  };

  const isWorkoutExpanded = expandedCard === 'workout';
  const isCardioExpanded = expandedCard === 'cardio';
  const isSportsExpanded = expandedCard === 'sports';
  const isBiometricsExpanded = expandedCard === 'biometrics';

  const sessions = activeSplit?.sessions || [];
  const effectiveSessionIndex = selectedSessionIndex < sessions.length ? selectedSessionIndex : 0;
  const currentSession = sessions[effectiveSessionIndex] || null;

  // Muscle SVG styling helper with high contrast and neon luminescence
  const getMuscleStyle = (muscleName: string) => {
    const active = Boolean(dailySummary.combinedMuscles[muscleName]);
    return {
      fill: active ? '#D4FB45' : '#2A2A34',
      stroke: active ? '#D4FB45' : '#454556',
      strokeWidth: active ? 1.5 : 1,
      filter: active ? 'url(#limeGlow)' : undefined,
      transition: 'all 0.3s ease'
    };
  };

  return (
    <div className="space-y-4 pb-6">
      {/* CARD 1a: Activity Summary Card (Stays Active and Open All The Time) */}
      <div className="ios-card p-4 shadow-apple-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4FB45] animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Activity Summary
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowCard1aBack(!showCard1aBack)}
            className="ios-press px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#D4FB45]/40 text-xs font-semibold text-white/80 hover:text-white transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#D4FB45]" />
            <span>{showCard1aBack ? 'Metrics' : 'Muscle Map'}</span>
          </button>
        </div>

        {!showCard1aBack ? (
          <>
            {/* 3-Column Compact Metric Bar (Perfect Horizontal & Vertical Alignment) */}
            {(() => {
              const prParts = (() => {
                const str = dailySummary.prDisplay || '0 kg';
                const match = str.match(/^(.+?)\s*\(([0-9.]+)\s*kg\)$/i);
                if (match) {
                  return {
                    value: match[2],
                    unit: 'kg',
                    label: match[1].trim()
                  };
                }
                const matchSimple = str.match(/^([0-9.]+)\s*(kg)?$/i);
                if (matchSimple) {
                  return {
                    value: matchSimple[1],
                    unit: 'kg',
                    label: 'Personal Record'
                  };
                }
                return {
                  value: str.replace(' kg', '').trim() || '0',
                  unit: 'kg',
                  label: 'Personal Record'
                };
              })();

              return (
                <div className="grid grid-cols-3 divide-x divide-white/10 ios-subcard p-3">
                  {/* Col 1: Total Volume */}
                  <div className="pr-2.5 sm:pr-3 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block truncate leading-none">
                      Volume
                    </span>
                    <div className="flex items-baseline gap-1 my-1.5">
                      <span className="text-xl sm:text-2xl font-black text-white tracking-tight tabular-nums leading-none">
                        {dailySummary.formattedKgs}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 leading-none">kg</span>
                    </div>
                    <span className="text-[10px] text-white/40 truncate block leading-none">
                      Total Lifted
                    </span>
                  </div>

                  {/* Col 2: Active Energy */}
                  <div className="px-2.5 sm:px-3 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block truncate leading-none">
                      Active Burn
                    </span>
                    <div className="flex items-baseline gap-1 my-1.5">
                      <span className="text-xl sm:text-2xl font-black text-[#D4FB45] tracking-tight tabular-nums leading-none">
                        {dailySummary.totalKcal}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 leading-none">kcal</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono truncate block leading-none">
                      W:{dailySummary.workoutKcal} C:{dailySummary.cardioKcal} S:{dailySummary.sportsKcal}
                    </span>
                  </div>

                  {/* Col 3: Records */}
                  <div className="pl-2.5 sm:pl-3 flex flex-col justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block truncate leading-none">
                      Best PR
                    </span>
                    <div className="flex items-baseline gap-1 my-1.5">
                      <span className="text-xl sm:text-2xl font-black text-[#30D158] tracking-tight tabular-nums leading-none">
                        {prParts.value}
                      </span>
                      <span className="text-[10px] font-bold text-white/40 leading-none">{prParts.unit}</span>
                    </div>
                    <span className="text-[10px] text-[#30D158]/80 truncate block leading-none" title={prParts.label}>
                      {prParts.label}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Subtle Logged Breakdown Badges */}
            {(dailySummary.flatExercises.length > 0 || dailySummary.dayCardio.length > 0 || dailySummary.daySports.length > 0) && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {dailySummary.flatExercises.length > 0 && (
                  <span className="text-[10px] font-medium bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 px-2 py-0.5 rounded-md">
                    {dailySummary.flatExercises.length} Exercises Done
                  </span>
                )}
                {dailySummary.dayCardio.length > 0 && (
                  <span className="text-[10px] font-medium bg-[#D4FB45]/10 text-[#D4FB45] border border-[#D4FB45]/20 px-2 py-0.5 rounded-md">
                    {dailySummary.cardioKcal} kcal Cardio
                  </span>
                )}
                {dailySummary.daySports.length > 0 && (
                  <span className="text-[10px] font-medium bg-[#32ADE6]/10 text-[#32ADE6] border border-[#32ADE6]/20 px-2 py-0.5 rounded-md">
                    {dailySummary.sportsKcal} kcal Sports
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          /* Back of Card 1a: Apple Anatomical Vector Muscle Map (High-Contrast & Neon Luminescence) */
          <div className="space-y-3.5 pt-1">
            {/* Active Burn Goal with Progress Bar */}
            <div className="ios-subcard p-3 space-y-2 bg-[#1A1A20] border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 font-semibold">Daily Active Burn Goal</span>
                <span className="font-bold text-[#D4FB45] font-mono">{dailySummary.burnPercent}% Completed</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#30D158] to-[#D4FB45] rounded-full transition-all duration-500 shadow-sm shadow-[#D4FB45]/50"
                  style={{ width: `${Math.min(100, Math.max(0, dailySummary.burnPercent))}%` }}
                />
              </div>
            </div>

            {/* Anatomical Figures Grid */}
            <div className="grid grid-cols-2 gap-3 ios-subcard p-4 bg-[#141418] border border-white/10">
              {/* Anterior (Front) Silhouette */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2.5">
                  Anterior (Front)
                </span>
                <svg viewBox="0 0 130 215" className="w-28 h-44 sm:w-32 sm:h-48 drop-shadow-md">
                  <defs>
                    <filter id="limeGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#D4FB45" floodOpacity="0.8" />
                    </filter>
                  </defs>

                  {/* Head & Neck */}
                  <circle cx="65" cy="18" r="10" fill="#2E2E38" stroke="#484858" strokeWidth="1" />
                  <rect x="62" y="27" width="6" height="8" rx="2" fill="#2E2E38" stroke="#484858" strokeWidth="1" />

                  {/* Hands */}
                  <circle cx="30" cy="100" r="3.5" fill="#2E2E38" stroke="#484858" strokeWidth="1" />
                  <circle cx="100" cy="100" r="3.5" fill="#2E2E38" stroke="#484858" strokeWidth="1" />

                  {/* Feet */}
                  <ellipse cx="48" cy="198" rx="5.5" ry="3.5" fill="#2E2E38" stroke="#484858" strokeWidth="1" />
                  <ellipse cx="82" cy="198" rx="5.5" ry="3.5" fill="#2E2E38" stroke="#484858" strokeWidth="1" />

                  {/* Forearms */}
                  <path d="M34 72 C30 79 29 88 31 96 C34 96 36 92 38 86 C39 80 37 74 34 72 Z" fill="#2A2A34" stroke="#454556" strokeWidth="1" />
                  <path d="M96 72 C100 79 101 88 99 96 C96 96 94 92 92 86 C91 80 93 74 96 72 Z" fill="#2A2A34" stroke="#454556" strokeWidth="1" />

                  {/* Shoulders (Deltoids) */}
                  <path
                    d="M49 35 C42 36 36 42 36 49 C36 54 39 58 43 59 C46 54 48 45 51 37 Z"
                    {...getMuscleStyle('Shoulders')}
                  />
                  <path
                    d="M81 35 C88 36 94 42 94 49 C94 54 91 58 87 59 C84 54 82 45 79 37 Z"
                    {...getMuscleStyle('Shoulders')}
                  />

                  {/* Chest (Pectorals) */}
                  <path
                    d="M51 36 L63 36 C63 45 62 55 50 56 C45 52 46 42 51 36 Z"
                    {...getMuscleStyle('Chest')}
                  />
                  <path
                    d="M79 36 L67 36 C67 45 68 55 80 56 C85 52 84 42 79 36 Z"
                    {...getMuscleStyle('Chest')}
                  />

                  {/* Biceps */}
                  <path
                    d="M36 50 C32 55 32 64 34 71 C37 71 40 67 41 61 C42 56 40 51 36 50 Z"
                    {...getMuscleStyle('Biceps')}
                  />
                  <path
                    d="M94 50 C98 55 98 64 96 71 C93 71 90 67 89 61 C88 56 90 51 94 50 Z"
                    {...getMuscleStyle('Biceps')}
                  />

                  {/* Core / Abdominals */}
                  <path
                    d="M50 58 L80 58 C79 70 77 82 75 90 L55 90 C53 82 51 70 50 58 Z"
                    {...getMuscleStyle('Core')}
                  />
                  {/* Subtle 6-pack abdominal segmentation */}
                  <line x1="65" y1="59" x2="65" y2="89" stroke="#16161C" strokeWidth="1.5" />
                  <line x1="53" y1="68" x2="77" y2="68" stroke="#16161C" strokeWidth="1.2" />
                  <line x1="54" y1="78" x2="76" y2="78" stroke="#16161C" strokeWidth="1.2" />

                  {/* Quads (Thighs) */}
                  <path
                    d="M48 92 C54 92 62 92 63 96 C63 108 61 127 59 140 C54 142 49 142 45 139 C44 126 45 107 48 92 Z"
                    {...getMuscleStyle('Quads')}
                  />
                  <path
                    d="M82 92 C76 92 68 92 67 96 C67 108 69 127 71 140 C76 142 81 142 85 139 C86 126 85 107 82 92 Z"
                    {...getMuscleStyle('Quads')}
                  />

                  {/* Calves (Front Lower Legs) */}
                  <path
                    d="M46 145 C50 145 57 145 57 150 C56 164 54 182 53 193 C50 193 47 193 45 191 C43 178 42 161 46 145 Z"
                    fill="#2A2A34"
                    stroke="#454556"
                    strokeWidth="1"
                  />
                  <path
                    d="M84 145 C80 145 73 145 73 150 C74 164 76 182 77 193 C80 193 83 193 85 191 C87 178 88 161 84 145 Z"
                    fill="#2A2A34"
                    stroke="#454556"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              {/* Posterior (Back) Silhouette */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2.5">
                  Posterior (Back)
                </span>
                <svg viewBox="0 0 130 215" className="w-28 h-44 sm:w-32 sm:h-48 drop-shadow-md">
                  {/* Head & Neck */}
                  <circle cx="65" cy="18" r="10" fill="#2E2E38" stroke="#484858" strokeWidth="1" />
                  <rect x="62" y="27" width="6" height="8" rx="2" fill="#2E2E38" stroke="#484858" strokeWidth="1" />

                  {/* Hands */}
                  <circle cx="30" cy="100" r="3.5" fill="#2E2E38" stroke="#484858" strokeWidth="1" />
                  <circle cx="100" cy="100" r="3.5" fill="#2E2E38" stroke="#484858" strokeWidth="1" />

                  {/* Feet */}
                  <ellipse cx="48" cy="198" rx="5.5" ry="3.5" fill="#2E2E38" stroke="#484858" strokeWidth="1" />
                  <ellipse cx="82" cy="198" rx="5.5" ry="3.5" fill="#2E2E38" stroke="#484858" strokeWidth="1" />

                  {/* Forearms */}
                  <path d="M34 72 C30 79 29 88 31 96 C34 96 36 92 38 86 C39 80 37 74 34 72 Z" fill="#2A2A34" stroke="#454556" strokeWidth="1" />
                  <path d="M96 72 C100 79 101 88 99 96 C96 96 94 92 92 86 C91 80 93 74 96 72 Z" fill="#2A2A34" stroke="#454556" strokeWidth="1" />

                  {/* Shoulders (Rear Delts) */}
                  <path
                    d="M49 35 C42 36 36 42 36 49 C36 54 39 58 43 59 C46 54 48 45 51 37 Z"
                    {...getMuscleStyle('Shoulders')}
                  />
                  <path
                    d="M81 35 C88 36 94 42 94 49 C94 54 91 58 87 59 C84 54 82 45 79 37 Z"
                    {...getMuscleStyle('Shoulders')}
                  />

                  {/* Back (Traps & Lats) */}
                  <path
                    d="M50 36 L65 33 L80 36 C86 46 83 60 79 72 L65 84 L51 72 C47 60 44 46 50 36 Z"
                    {...getMuscleStyle('Back')}
                  />

                  {/* Triceps */}
                  <path
                    d="M36 50 C32 55 32 64 34 71 C37 71 40 67 41 61 C42 56 40 51 36 50 Z"
                    {...getMuscleStyle('Triceps')}
                  />
                  <path
                    d="M94 50 C98 55 98 64 96 71 C93 71 90 67 89 61 C88 56 90 51 94 50 Z"
                    {...getMuscleStyle('Triceps')}
                  />

                  {/* Glutes */}
                  <path
                    d="M48 86 C56 85 63 87 64 92 C64 100 61 108 51 110 C45 108 44 98 48 86 Z"
                    {...getMuscleStyle('Glutes')}
                  />
                  <path
                    d="M82 86 C74 85 67 87 66 92 C66 100 69 108 79 110 C85 108 86 98 82 86 Z"
                    {...getMuscleStyle('Glutes')}
                  />

                  {/* Hamstrings */}
                  <path
                    d="M47 112 C53 112 61 112 61 116 C61 128 59 139 57 145 C52 146 48 146 44 144 C43 135 44 123 47 112 Z"
                    {...getMuscleStyle('Hamstrings')}
                  />
                  <path
                    d="M83 112 C77 112 69 112 69 116 C69 128 71 139 73 145 C78 146 82 146 86 144 C87 135 86 123 83 112 Z"
                    {...getMuscleStyle('Hamstrings')}
                  />

                  {/* Calves (Back / Gastrocnemius) */}
                  <path
                    d="M45 149 C50 149 57 149 57 154 C56 168 54 186 53 194 C50 194 47 194 45 192 C42 179 41 162 45 149 Z"
                    fill="#2A2A34"
                    stroke="#454556"
                    strokeWidth="1"
                  />
                  <path
                    d="M85 149 C80 149 73 149 73 154 C74 168 76 186 77 194 C80 194 83 194 85 192 C88 179 89 162 85 149 Z"
                    fill="#2A2A34"
                    stroke="#454556"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </div>

            {/* Muscle Group Badges */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Core'].map((m) => {
                const active = Boolean(dailySummary.combinedMuscles[m]);
                return (
                  <span
                    key={m}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      active
                        ? 'bg-[#D4FB45] text-black font-bold shadow-md shadow-[#D4FB45]/20'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {m}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CARD 1b: Workout Routine Accordion (Collapsible, opens one at a time) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => toggleCard('workout')}
            className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#D4FB45]/10 border border-[#D4FB45]/20 flex items-center justify-center shrink-0">
              <Dumbbell className="w-4 h-4 text-[#D4FB45]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Workout Routine
              </h2>
              <span className="text-[11px] text-white/50 block truncate">
                {activeSplit
                  ? `${activeSplit.title} • ${currentSession ? currentSession.sessionName : 'Ready'}`
                  : 'No Routine Selected'}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowRoutineChoiceModal(true);
                setRoutineSubPage(null);
              }}
              className="ios-press px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-[#D4FB45]/40 text-white/70 hover:text-white transition flex items-center space-x-1 text-[11px] font-semibold cursor-pointer"
              title="Customize Split"
            >
              <Settings className="w-3 h-3" />
              <span className="hidden sm:inline">Customize</span>
            </button>

            <button
              type="button"
              onClick={() => toggleCard('workout')}
              className="p-1 text-white/50 hover:text-white transition cursor-pointer"
              aria-label={isWorkoutExpanded ? 'Collapse Workout' : 'Expand Workout'}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isWorkoutExpanded ? 'rotate-180 text-[#D4FB45]' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {isWorkoutExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3.5 animate-in fade-in">
            {!activeSplit ? (
              <button
                type="button"
                onClick={() => {
                  setShowRoutineChoiceModal(true);
                  setRoutineSubPage(null);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#D4FB45] text-black font-bold text-xs uppercase tracking-wide ios-press shadow-md shadow-[#D4FB45]/20 cursor-pointer"
              >
                Create Workout Routine
              </button>
            ) : (
              <>
                {/* Splits Switcher (if more than 1 split available) */}
                {workoutSplits.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {workoutSplits.map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setActiveSplitId(sp.id)}
                        className={`ios-press px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                          activeSplit.id === sp.id
                            ? 'bg-white/20 text-white font-bold border border-white/20'
                            : 'bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        {sp.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* 1-Tap Session Selector Pills (e.g. [ Push ] [ Pull ] [ Legs ]) */}
                {sessions.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {sessions.map((sess, idx) => (
                      <button
                        key={sess.id || idx}
                        type="button"
                        onClick={() => setSelectedSessionIndex(idx)}
                        className={`ios-press px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                          effectiveSessionIndex === idx
                            ? 'bg-[#D4FB45] text-black shadow-md shadow-[#D4FB45]/20'
                            : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {sess.sessionName}
                      </button>
                    ))}
                  </div>
                )}

                {/* Hero Session Card */}
                {currentSession && (
                  <div className="ios-subcard p-4 space-y-3.5 border border-white/10 bg-gradient-to-b from-[#1C1C1E] to-[#141417]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4FB45]">
                          Today's Session
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                          {currentSession.sessionName}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-white/60 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                        {(currentSession.exercises || []).length} Exercises
                      </span>
                    </div>

                    {/* Exercise Preview Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {(currentSession.exercises || []).map((e: any, i: number) => {
                        const name = typeof e === 'string' ? e : e.name;
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs text-white/90"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FB45]" />
                            <span>{name}</span>
                          </span>
                        );
                      })}
                    </div>

                    {/* Full-width Tactile Action Button */}
                    <button
                      type="button"
                      onClick={() => startSessionFromSplit(currentSession)}
                      className="w-full btn-primary-green py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#D4FB45]/20 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-black stroke-black" />
                      <span>Start {currentSession.sessionName}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* CARD 1c: Collapsible Cardio Accordion (Collapsible, opens one at a time) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        <button
          type="button"
          onClick={() => toggleCard('cardio')}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#D4FB45]/10 border border-[#D4FB45]/20 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-[#D4FB45]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Cardio Training
              </h2>
              <span className="text-[11px] text-white/50 block truncate">
                {dailySummary.dayCardio.length > 0
                  ? `${dailySummary.cardioKcal} kcal logged today (${dailySummary.dayCardio.length} session${dailySummary.dayCardio.length > 1 ? 's' : ''})`
                  : `${cardioDurationMins}m • ${cardioDistanceKm.toFixed(2)}km ready to log`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-white/40 group-hover:text-white/70 transition">
              {isCardioExpanded ? 'Collapse' : 'Log'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                isCardioExpanded ? 'rotate-180 text-[#D4FB45]' : ''
              }`}
            />
          </div>
        </button>

        {isCardioExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CARDIO_TYPES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCardioId(c.id)}
                  className={`ios-press px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                    selectedCardioId === c.id
                      ? 'bg-[#D4FB45] text-black font-bold shadow-md shadow-[#D4FB45]/20'
                      : 'bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="space-y-4 ios-subcard p-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1.5">
                  <span className="text-white/60">Duration</span>
                  <span className="text-white font-mono font-bold">
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
                  className="w-full accent-[#D4FB45] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1.5">
                  <span className="text-white/60">Distance</span>
                  <span className="text-white font-mono font-bold">{cardioDistanceKm.toFixed(2)} km</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="25"
                  step="0.25"
                  value={cardioDistanceKm}
                  onChange={(e) => setCardioDistanceKm(Number(e.target.value))}
                  className="w-full accent-[#D4FB45] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1.5">
                  <span className="text-white/60">Incline / Resistance</span>
                  <span className="text-white font-mono font-bold">
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
                  className="w-full accent-[#D4FB45] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between ios-subcard px-4 py-3 gap-3">
              <div className="min-w-0">
                <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">
                  Calculated Burn
                </span>
                <span className="font-bold text-[#D4FB45] text-sm sm:text-base font-mono whitespace-nowrap">
                  {Math.round(
                    (CARDIO_TYPES.find((c) => c.id === selectedCardioId)?.baseMet || 5) *
                      (1 + cardioResistance * 0.03) *
                      (Number(profile.weight) || 75) *
                      (cardioDurationMins / 60)
                  )}{' '}
                  kcal
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogCardio}
                className="btn-primary-green px-4 py-2.5 text-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Log Cardio</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CARD 1d: Collapsible Sports Accordion (Collapsible, opens one at a time) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        <button
          type="button"
          onClick={() => toggleCard('sports')}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#D4FB45]/10 border border-[#D4FB45]/20 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-[#D4FB45]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Sports & Athletic Load
              </h2>
              <span className="text-[11px] text-white/50 block truncate">
                {dailySummary.daySports.length > 0
                  ? `${dailySummary.sportsKcal} kcal logged today (${dailySummary.daySports.length} match${dailySummary.daySports.length > 1 ? 'es' : ''})`
                  : `${sportDurationMins}m • RPE ${sportRpe} ready to log`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-white/40 group-hover:text-white/70 transition">
              {isSportsExpanded ? 'Collapse' : 'Log'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                isSportsExpanded ? 'rotate-180 text-[#D4FB45]' : ''
              }`}
            />
          </div>
        </button>

        {isSportsExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {SPORTS_TYPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSportId(s.id)}
                  className={`ios-press px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                    selectedSportId === s.id
                      ? 'bg-[#D4FB45] text-black font-bold shadow-md shadow-[#D4FB45]/20'
                      : 'bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <div className="space-y-4 ios-subcard p-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1.5">
                  <span className="text-white/60">Match / Session Duration</span>
                  <span className="text-white font-mono font-bold">{sportDurationMins} mins</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="180"
                  step="5"
                  value={sportDurationMins}
                  onChange={(e) => setSportDurationMins(Number(e.target.value))}
                  className="w-full accent-[#D4FB45] cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between font-semibold mb-1.5">
                  <span className="text-white/60">Perceived Exertion (RPE)</span>
                  <span className="text-white font-mono font-bold">RPE {sportRpe} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={sportRpe}
                  onChange={(e) => setSportRpe(Number(e.target.value))}
                  className="w-full accent-[#D4FB45] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between ios-subcard px-4 py-3 gap-3">
              <div className="min-w-0">
                <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">
                  Training Load
                </span>
                <span className="font-bold text-[#D4FB45] text-sm sm:text-base font-mono whitespace-nowrap">
                  {Math.round(sportDurationMins * sportRpe)} AU •{' '}
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
                type="button"
                onClick={handleLogSports}
                className="btn-primary-green px-4 py-2.5 text-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Log Sport</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CARD 1e: Collapsible Body Metrics & Trajectory Accordion (Collapsible, opens one at a time) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        <button
          type="button"
          onClick={() => toggleCard('biometrics')}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#D4FB45]/10 border border-[#D4FB45]/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-[#D4FB45]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Body Metrics & Trajectory
              </h2>
              <span className="text-[11px] text-white/50 block truncate">
                {profile.weight ? `${profile.weight} kg` : '76.0 kg'} • Target: {profile.goalWeight || 70} kg
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase font-bold text-white/40 group-hover:text-white/70 transition">
              {isBiometricsExpanded ? 'Collapse' : 'Details'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                isBiometricsExpanded ? 'rotate-180 text-[#D4FB45]' : ''
              }`}
            />
          </div>
        </button>

        {isBiometricsExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                Trajectory & Logging
              </span>
              <button
                type="button"
                onClick={() => setShowMathInspector(!showMathInspector)}
                className="ios-press px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-[#D4FB45]/40 text-[#D4FB45] text-xs font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{showMathInspector ? 'Hide Math' : 'Inspect Math'}</span>
              </button>
            </div>

            {showMathInspector && (
              <div className="ios-subcard p-4 text-xs space-y-2 border border-white/10">
                <p className="font-bold text-[#D4FB45] uppercase text-[10px] tracking-wider">
                  Mifflin-St Jeor & Wishnofsky Model (7,700 kcal/kg):
                </p>
                <div className="grid grid-cols-2 gap-2 text-white/70">
                  <div>
                    BMR: <span className="text-white font-mono font-bold">{biometricEngine.bmr} kcal/d</span>
                  </div>
                  <div>
                    Base TDEE: <span className="text-white font-mono font-bold">{biometricEngine.sedTdee} kcal/d</span>
                  </div>
                  <div>
                    RFM Body Fat: <span className="text-[#30D158] font-mono font-bold">{biometricEngine.rfmBodyFatPct}%</span>
                  </div>
                  <div>
                    Frame Ratio: <span className="text-[#D4FB45] font-mono font-bold">{biometricEngine.wristFrameRatio}</span>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 pt-1">
                  Goal Horizon: {biometricEngine.deadlineDays} days • Required Slope:{' '}
                  <span className="text-white font-semibold">{biometricEngine.requiredDailyKcalDelta} kcal/day</span>
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
                  type="button"
                  onClick={() => setSelectedTrackerMetric(m.id)}
                  className={`ios-press px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                    selectedTrackerMetric === m.id
                      ? 'bg-[#D4FB45] text-black font-bold shadow-sm'
                      : 'bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* 3-Line Apple Health Area Chart */}
            <div className="ios-subcard p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-semibold">
                <span className="text-[#30D158] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#30D158]" /> Actual Logged
                </span>
                <span className="text-white/40 flex items-center gap-1">
                  <span className="w-2 h-0.5 bg-white/40" /> Target Goal
                </span>
                <span className="text-[#D4FB45] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D4FB45]" /> Energy Projection
                </span>
              </div>

              {(() => {
                const pts = biometricEngine.points;
                const allVals = pts.flatMap((p) => [p.actual, p.target, p.proj]);
                const minV = Math.min(...allVals) - 1.5;
                const maxV = Math.max(...allVals) + 1.5;
                const span = Math.max(1, maxV - minV);
                const toX = (i: number) => 24 + (i / Math.max(1, pts.length - 1)) * 270;
                const toY = (v: number) => 110 - ((v - minV) / span) * 90;

                const actualPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.actual)}`).join(' ');
                const targetPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.target)}`).join(' ');
                const projPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p.proj)}`).join(' ');

                return (
                  <svg viewBox="0 0 315 125" className="w-full h-36">
                    <path d={targetPath} fill="none" stroke="#636366" strokeWidth="1.75" strokeDasharray="4 4" />
                    <path d={projPath} fill="none" stroke="#D4FB45" strokeWidth="2" strokeOpacity="0.8" />
                    <path d={actualPath} fill="none" stroke="#30D158" strokeWidth="2.5" />
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle cx={toX(i)} cy={toY(p.actual)} r="3.5" fill="#30D158" />
                        <circle cx={toX(i)} cy={toY(p.proj)} r="2.5" fill="#D4FB45" />
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>

            {/* Log New Biometrics Row */}
            <form onSubmit={handleLogBodyMetrics} className="grid grid-cols-5 gap-1.5 text-xs">
              <input
                type="number"
                step="0.1"
                placeholder="Kg"
                value={trackerInput.weight}
                onChange={(e) => setTrackerInput({ ...trackerInput, weight: e.target.value })}
                className="ios-subcard px-2 py-2.5 text-center text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[#D4FB45]"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Chest"
                value={trackerInput.chest}
                onChange={(e) => setTrackerInput({ ...trackerInput, chest: e.target.value })}
                className="ios-subcard px-2 py-2.5 text-center text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[#D4FB45]"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Waist"
                value={trackerInput.waist}
                onChange={(e) => setTrackerInput({ ...trackerInput, waist: e.target.value })}
                className="ios-subcard px-2 py-2.5 text-center text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[#D4FB45]"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Belly"
                value={trackerInput.belly}
                onChange={(e) => setTrackerInput({ ...trackerInput, belly: e.target.value })}
                className="ios-subcard px-2 py-2.5 text-center text-white font-bold placeholder:text-white/30 focus:outline-none focus:border-[#D4FB45]"
              />
              <button
                type="submit"
                className="btn-primary-green text-xs font-bold rounded-xl py-2 cursor-pointer"
              >
                + Log
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
