import React, { useState, useRef } from 'react';
import {
  Upload,
  Copy,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  X
} from 'lucide-react';
import { BEVERAGE_CATALOG } from '../constants';
import { parseFoodTextToRows } from '../lib/foodMatch';
import type { CustomFood, ParsedFoodRow } from '../types';

export interface MacrosFoodTabProps {
  selectedDate: string;
  setSelectedDate: (dateKey: string) => void;
  dateChain: Array<{ key: string; dayName: string; dayNum: number }>;
  dailyMacroSummary: {
    dayFoods: any[];
    dayBevs: any[];
    foodKcal: number;
    bevKcal: number;
    consumedKcal: number;
    requiredKcal: number;
    kcalDiff: number;
    proteinG: number;
    proteinTargetG: number;
    proteinPct: number;
    carbsG: number;
    carbsTargetG: number;
    carbsPct: number;
    fatsG: number;
    fatsTargetG: number;
    fatsPct: number;
    fiberG: number;
    sugarG: number;
    sodiumMg: number;
    microsScorePct: number;
    waterTargetMl: number;
    currentWaterMl: number;
    waterPercent: number;
    pureFoodMacroPct: number;
    mealGroups: Record<string, any[]>;
    consumedDishCounts: Record<string, number>;
  };
  foodInputMode: 'manual' | 'csv';
  setFoodInputMode: (mode: 'manual' | 'csv') => void;
  manualRawText: string;
  setManualRawText: (text: string) => void;
  manualParsedRows: ParsedFoodRow[];
  setManualParsedRows: (rows: ParsedFoodRow[]) => void;
  isLoggingFood: boolean;
  customFoods: CustomFood[];
  handleLogManualFoods: () => Promise<void>;
  expandedMealCategory: string;
  setExpandedMealCategory: (cat: string) => void;
  handleQuickLogCsvDish: (dish: any) => Promise<void>;
  mealCsvError: string;
  handleMealCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateDailyWaterTotal: (dateKey: string, delta: number) => Promise<void>;
  selectedBeverageId: string;
  setSelectedBeverageId: (id: string) => void;
  beverageMlInput: number;
  setBeverageMlInput: (ml: number) => void;
  handleAddBeverageLayer: () => Promise<void>;
  handleDeleteBeverage?: (bevId: string) => Promise<void> | void;
  groceryRawText: string;
  setGroceryRawText: (text: string) => void;
  groceryItems: string[];
  setGroceryItems: (items: string[]) => void;
  syncGroceryItems: (items: string[]) => Promise<void>;
  handleCopyGroceryCommaList: () => void;
}

export interface MacroHistoryEvent {
  id: string;
  timestamp: number;
  timeFormatted: string;
  type: 'grocery' | 'nav' | 'log';
  title: string;
}

type ActiveMacroCard = 'food' | 'water' | 'beverages' | 'grocery' | 'history' | null;

export const MacrosFoodTab: React.FC<MacrosFoodTabProps> = ({
  selectedDate,
  setSelectedDate,
  dateChain,
  dailyMacroSummary,
  manualRawText,
  setManualRawText,
  setManualParsedRows,
  isLoggingFood,
  handleLogManualFoods,
  handleMealCsvUpload,
  updateDailyWaterTotal,
  selectedBeverageId,
  setSelectedBeverageId,
  beverageMlInput,
  setBeverageMlInput,
  handleAddBeverageLayer,
  handleDeleteBeverage,
  groceryItems,
  syncGroceryItems
}) => {
  // Nutrient carousel slide
  const [nutrientSlide, setNutrientSlide] = useState<'macros' | 'micros'>('macros');

  // Grocery state
  const [checkedGroceryIndices, setCheckedGroceryIndices] = useState<number[]>([]);
  const [copiedGrocery, setCopiedGrocery] = useState(false);
  const [isAddingGroceryItem, setIsAddingGroceryItem] = useState(false);
  const [newGroceryItemText, setNewGroceryItemText] = useState('');
  const newGroceryInputRef = useRef<HTMLInputElement>(null);

  // Activity History State
  const [macroHistory, setMacroHistory] = useState<MacroHistoryEvent[]>(() => {
    try {
      const saved = localStorage.getItem('switch_macro_tab_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const recordHistory = (type: 'grocery' | 'nav' | 'log', title: string) => {
    const event: MacroHistoryEvent = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      title
    };
    setMacroHistory((prev) => {
      const updated = [event, ...prev].slice(0, 50);
      try {
        localStorage.setItem('switch_macro_tab_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setMacroHistory([]);
    try {
      localStorage.removeItem('switch_macro_tab_history');
    } catch {}
  };

  // Exclusive Accordion: Only one lower card open at a time; Summary Card stays open permanently
  const [expandedCard, setExpandedCard] = useState<ActiveMacroCard>('food');

  const toggleCard = (card: 'food' | 'water' | 'beverages' | 'grocery' | 'history') => {
    setExpandedCard((prev) => (prev === card ? null : card));
  };

  const isFoodExpanded = expandedCard === 'food';
  const isWaterExpanded = expandedCard === 'water';
  const isBeveragesExpanded = expandedCard === 'beverages';
  const isGroceryExpanded = expandedCard === 'grocery';
  const isHistoryExpanded = expandedCard === 'history';

  // Count food items by commas
  const foodItemCount = manualRawText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean).length;

  // Grocery Handlers
  const toggleGroceryChecked = (idx: number) => {
    const item = groceryItems[idx];
    const willBeChecked = !checkedGroceryIndices.includes(idx);
    setCheckedGroceryIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
    recordHistory('grocery', `${willBeChecked ? 'Checked' : 'Unchecked'} "${item}"`);
  };

  const handleDeleteGroceryItem = (idx: number) => {
    const item = groceryItems[idx];
    const updated = groceryItems.filter((_, i) => i !== idx);
    syncGroceryItems(updated);
    setCheckedGroceryIndices((prev) =>
      prev.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i))
    );
    recordHistory('grocery', `Removed "${item}" from grocery list`);
  };

  const handleSaveNewGroceryItem = () => {
    const text = newGroceryItemText.trim();
    if (!text) {
      setIsAddingGroceryItem(false);
      return;
    }
    const updated = [...groceryItems, text];
    syncGroceryItems(updated);
    setNewGroceryItemText('');
    setIsAddingGroceryItem(false);
    recordHistory('grocery', `Added "${text}" to grocery list`);
  };

  const handleCopyGroceryList = () => {
    if (groceryItems.length === 0) return;
    const textToCopy = groceryItems.join(', ');

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
    } else {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    setCopiedGrocery(true);
    setTimeout(() => setCopiedGrocery(false), 2000);
    recordHistory('grocery', `Copied grocery list (${groceryItems.length} items)`);
  };

  // Water Increment Handler
  const handleWaterDelta = async (delta: number) => {
    await updateDailyWaterTotal(selectedDate, delta);
    const newTotal = Math.max(0, dailyMacroSummary.currentWaterMl + delta);
    recordHistory('log', `${delta > 0 ? 'Added +' : 'Subtracted -'}${Math.abs(delta)} ml water (Total: ${newTotal} ml)`);
  };

  // Beverage Add Handler
  const handleAddDrink = async () => {
    const bev = BEVERAGE_CATALOG.find((b) => b.id === selectedBeverageId) || BEVERAGE_CATALOG[0];
    const ml = Math.max(10, Number(beverageMlInput) || bev.defaultMl);
    await handleAddBeverageLayer();
    recordHistory('log', `Poured ${ml} ml ${bev.name}`);
  };

  // Beverage Remove Handler
  const handleRemoveDrink = async (bevId: string, bevName: string) => {
    if (handleDeleteBeverage) {
      await handleDeleteBeverage(bevId);
      recordHistory('log', `Removed drink "${bevName}" from tank`);
    }
  };

  // Food Log Handler
  const handleLogFood = async () => {
    const count = foodItemCount;
    await handleLogManualFoods();
    recordHistory('log', `Logged ${count} food item${count === 1 ? '' : 's'}`);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* CARD 1: Nutrition Summary Card (Stays Active and Open All The Time) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4FB45] animate-pulse shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Nutrition & Daily Fuel
            </h2>
          </div>
          <span className="text-[11px] font-mono font-semibold text-white/50">
            {dailyMacroSummary.consumedKcal} / {dailyMacroSummary.requiredKcal} kcal
          </span>
        </div>

        {/* Date Chain Segmented Selector */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
          {dateChain.map((d) => {
            const active = d.key === selectedDate;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setSelectedDate(d.key);
                  recordHistory('nav', `Selected ${d.dayName} ${d.dayNum}`);
                }}
                className={`flex flex-col items-center justify-center min-w-[50px] py-2 px-2.5 rounded-2xl text-xs transition shrink-0 ios-press cursor-pointer ${
                  active
                    ? 'bg-[#D4FB45] text-black font-extrabold shadow-md shadow-[#D4FB45]/20'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-[9px] uppercase font-bold opacity-80">{d.dayName}</span>
                <span className="text-sm font-black mt-0.5 tabular-nums">{d.dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Balanced Metric Bar: Calories (Expanded Left) & Hydration (Moved Right) */}
        <div className="grid grid-cols-2 divide-x divide-white/10 ios-subcard p-3.5 sm:p-4">
          {/* Col 1: Calories (Expanded across left side) */}
          <div className="pr-3.5 sm:pr-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block truncate leading-none">
              Calories
            </span>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums leading-none">
                {dailyMacroSummary.consumedKcal}
              </span>
              <span className="text-[11px] font-bold text-white/40 leading-none">kcal</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#D4FB45] truncate block leading-none font-bold">
                {dailyMacroSummary.kcalDiff >= 0
                  ? `${dailyMacroSummary.kcalDiff} kcal left`
                  : `${Math.abs(dailyMacroSummary.kcalDiff)} kcal over`}
              </span>
              <span className="text-[10px] text-white/40 truncate block leading-none">
                Target: {dailyMacroSummary.requiredKcal} kcal
              </span>
            </div>
          </div>

          {/* Col 2: Hydration (Moved to the right side where Food Hit was) */}
          <div className="pl-3.5 sm:pl-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block truncate leading-none">
              Hydration
            </span>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-2xl sm:text-3xl font-black text-[#38BDF8] tracking-tight tabular-nums leading-none">
                {dailyMacroSummary.currentWaterMl}
              </span>
              <span className="text-[11px] font-bold text-white/40 leading-none">ml</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-[#38BDF8] truncate block leading-none font-semibold">
                {dailyMacroSummary.waterPercent}% of {dailyMacroSummary.waterTargetMl}ml
              </span>
              <span className="text-[10px] text-white/40 truncate block leading-none">
                {dailyMacroSummary.dayBevs.length} Drinks ({dailyMacroSummary.bevKcal} kcal)
              </span>
            </div>
          </div>
        </div>

        {/* Nutrients Swipeable Carousel (Macros & Micros) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Nutrients
            </span>
            {/* Slide Pill Switcher */}
            <div className="flex items-center gap-1 bg-[#1A1A1E] p-0.5 rounded-lg border border-white/10 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => {
                  if (nutrientSlide !== 'macros') {
                    setNutrientSlide('macros');
                    recordHistory('nav', 'Swiped to Macronutrients (Protein, Carbs, Fats)');
                  }
                }}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  nutrientSlide === 'macros'
                    ? 'bg-[#3A3A3C] text-white shadow-xs'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Macros
              </button>
              <button
                type="button"
                onClick={() => {
                  if (nutrientSlide !== 'micros') {
                    setNutrientSlide('micros');
                    recordHistory('nav', 'Swiped to Micronutrients (Fiber, Sugar, Sodium)');
                  }
                }}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  nutrientSlide === 'micros'
                    ? 'bg-[#3A3A3C] text-white shadow-xs'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                Micros
              </button>
            </div>
          </div>

          {/* Swipe / Slide Display */}
          <div className="ios-subcard p-3.5">
            {nutrientSlide === 'macros' ? (
              <div className="grid grid-cols-3 gap-2.5 animate-in fade-in">
                {[
                  {
                    label: 'Protein',
                    val: `${dailyMacroSummary.proteinG}g`,
                    sub: `${dailyMacroSummary.proteinTargetG}g`,
                    pct: dailyMacroSummary.proteinG === 0 ? 0 : dailyMacroSummary.proteinPct,
                    color: '#30D158'
                  },
                  {
                    label: 'Carbs',
                    val: `${dailyMacroSummary.carbsG}g`,
                    sub: `${dailyMacroSummary.carbsTargetG}g`,
                    pct: dailyMacroSummary.carbsG === 0 ? 0 : dailyMacroSummary.carbsPct,
                    color: '#32ADE6'
                  },
                  {
                    label: 'Fats',
                    val: `${dailyMacroSummary.fatsG}g`,
                    sub: `${dailyMacroSummary.fatsTargetG}g`,
                    pct: dailyMacroSummary.fatsG === 0 ? 0 : dailyMacroSummary.fatsPct,
                    color: '#FF9F0A'
                  }
                ].map((dial, idx) => {
                  const radius = 24;
                  const circum = 2 * Math.PI * radius;
                  const safePct = Math.max(0, Math.min(100, dial.pct));
                  const dashOffset = circum - (safePct / 100) * circum;
                  return (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r={radius} stroke="#2C2C2E" strokeWidth="5" fill="none" />
                          {safePct > 0 && (
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
                          )}
                        </svg>
                        <span className="absolute text-[11px] font-bold text-white font-mono tabular-nums">
                          {dial.val}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-white mt-1.5">{dial.label}</span>
                      <span className="text-[10px] text-white/50 font-medium truncate max-w-full">
                        / {dial.sub}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 animate-in fade-in">
                {[
                  {
                    label: 'Fiber',
                    val: `${dailyMacroSummary.fiberG}g`,
                    targetText: '30g goal',
                    pct: dailyMacroSummary.fiberG === 0 ? 0 : Math.min(100, Math.round((dailyMacroSummary.fiberG / 30) * 100)),
                    color: '#D4FB45'
                  },
                  {
                    label: 'Sugar',
                    val: `${dailyMacroSummary.sugarG}g`,
                    targetText: '50g limit',
                    pct: dailyMacroSummary.sugarG === 0 ? 0 : Math.min(100, Math.round((dailyMacroSummary.sugarG / 50) * 100)),
                    color: '#FB7185'
                  },
                  {
                    label: 'Sodium',
                    val: `${dailyMacroSummary.sodiumMg}mg`,
                    targetText: '2,300mg limit',
                    pct: dailyMacroSummary.sodiumMg === 0 ? 0 : Math.min(100, Math.round((dailyMacroSummary.sodiumMg / 2300) * 100)),
                    color: '#38BDF8'
                  }
                ].map((micro, idx) => {
                  const radius = 22;
                  const circum = 2 * Math.PI * radius;
                  const safePct = Math.max(0, Math.min(100, micro.pct));
                  const dashOffset = circum - (safePct / 100) * circum;
                  return (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r={radius} stroke="#2C2C2E" strokeWidth="4.5" fill="none" />
                          {safePct > 0 && (
                            <circle
                              cx="28"
                              cy="28"
                              r={radius}
                              stroke={micro.color}
                              strokeWidth="4.5"
                              strokeDasharray={circum}
                              strokeDashoffset={dashOffset}
                              strokeLinecap="round"
                              fill="none"
                            />
                          )}
                        </svg>
                        <span className="absolute text-[10px] font-bold text-white font-mono tabular-nums">
                          {micro.val}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-white mt-1.5">{micro.label}</span>
                      <span className="text-[9px] text-white/50 font-medium truncate max-w-full">
                        / {micro.targetText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARD 2: Meal Logger (Clean & Uncrumbled, No Icon, No Subtitle) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        <button
          type="button"
          onClick={() => toggleCard('food')}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Meal Logger
          </h2>
          <div className="flex items-center shrink-0">
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                isFoodExpanded ? 'rotate-180 text-[#D4FB45]' : ''
              }`}
            />
          </div>
        </button>

        {isFoodExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
            <div className="space-y-3 text-xs">
              <textarea
                rows={3}
                value={manualRawText}
                onChange={(e) => {
                  setManualRawText(e.target.value);
                  setManualParsedRows(parseFoodTextToRows(e.target.value));
                }}
                placeholder="Enter items separated by comma (e.g. chicken curry - 200g, chapatti - 2 pieces, eggs whole - 2 pieces)..."
                className="w-full ios-subcard p-3.5 text-white placeholder-white/35 font-medium text-xs focus:outline-none focus:border-[#D4FB45] leading-relaxed resize-y"
              />

              <button
                type="button"
                disabled={foodItemCount === 0 || isLoggingFood}
                onClick={handleLogFood}
                className="w-full btn-primary-green py-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-md shadow-[#D4FB45]/15"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isLoggingFood
                    ? 'Logging Nutrition...'
                    : `+ Log ${foodItemCount > 0 ? foodItemCount : ''} Food Item${foodItemCount === 1 ? '' : 's'}`}
                </span>
              </button>

              <label className="text-[11px] text-white/40 hover:text-white/70 flex items-center justify-center gap-1.5 pt-1 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Meal Plan (.CSV)</span>
                <input type="file" accept=".csv" onChange={handleMealCsvUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* CARD 3: Hydration Tracker (No Icon, No Subtitle, Refined Buttons) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        <button
          type="button"
          onClick={() => toggleCard('water')}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Hydration Tracker
          </h2>
          <div className="flex items-center shrink-0">
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                isWaterExpanded ? 'rotate-180 text-[#38BDF8]' : ''
              }`}
            />
          </div>
        </button>

        {isWaterExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
            {/* Animated Water Waves Tank */}
            <div className="relative h-44 rounded-2xl bg-[#080B11] border border-white/10 overflow-hidden shadow-inner flex flex-col justify-end">
              {/* Dynamic Water Liquid Body with Sinusoidal Wave Ribbons */}
              <div
                className="relative w-full transition-all duration-700 ease-out z-10"
                style={{ height: `${Math.max(14, Math.min(100, dailyMacroSummary.waterPercent))}%` }}
              >
                {/* SVG Sinusoidal Wave Crests */}
                <div className="absolute -top-6 inset-x-0 h-7 pointer-events-none overflow-hidden">
                  <svg
                    className="absolute w-[200%] h-7 animate-wave-back opacity-40 -left-full fill-[#0284C7]"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                  >
                    <path d="M0,0 C150,90 350,-60 500,30 C650,120 850,-30 1000,40 C1100,80 1150,20 1200,30 L1200,120 L0,120 Z" />
                  </svg>
                  <svg
                    className="absolute w-[200%] h-7 animate-wave-front opacity-80 left-0 fill-[#38BDF8]"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                  >
                    <path d="M0,30 C150,-20 300,80 450,20 C600,-40 750,70 900,10 C1050,-50 1150,50 1200,20 L1200,120 L0,120 Z" />
                  </svg>
                </div>

                {/* Water Body Gradient */}
                <div className="w-full h-full bg-gradient-to-t from-[#0284C7]/90 via-[#38BDF8]/80 to-[#38BDF8]/70 backdrop-blur-xs" />
              </div>

              {/* Top-Left: Volume Drank Readout */}
              <div className="absolute top-3.5 left-4 z-20 text-left pointer-events-none drop-shadow-md">
                <p className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight leading-none">
                  {dailyMacroSummary.currentWaterMl}{' '}
                  <span className="text-xs sm:text-sm font-bold text-[#38BDF8]">
                    out of {dailyMacroSummary.waterTargetMl} ml drank
                  </span>
                </p>
              </div>

              {/* Bottom Corners: -100 and +100 Buttons Positioned Down */}
              <div className="absolute bottom-3.5 inset-x-4 z-20 flex items-center justify-between pointer-events-auto">
                <button
                  type="button"
                  onClick={() => handleWaterDelta(-100)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#141417]/90 hover:bg-[#1F1F24] active:scale-95 border border-white/20 backdrop-blur-md text-white flex flex-col items-center justify-center transition shrink-0 cursor-pointer shadow-lg"
                  title="Subtract 100ml"
                >
                  <span className="text-xs sm:text-sm font-black font-mono tracking-tight leading-none">-100</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-white/50 leading-none mt-0.5">ml</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleWaterDelta(100)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#D4FB45] hover:brightness-110 active:scale-95 text-black flex flex-col items-center justify-center transition shrink-0 cursor-pointer shadow-lg shadow-[#D4FB45]/25"
                  title="Add 100ml"
                >
                  <span className="text-xs sm:text-sm font-black font-mono tracking-tight leading-none">+100</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-black/60 leading-none mt-0.5">ml</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CARD 4: Other Beverages (Dynamic Liquid Wave Tank with Layer Disappearance on Overflow) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        {(() => {
          const TANK_CAPACITY = 1000;
          // Calculate visible layers from newest backwards; older base layers roll off when full
          const visibleBevLayers: Array<{ id: string; name: string; ml: number; color: string; heightPct: number }> = [];
          let cumulativeMl = 0;

          for (let i = dailyMacroSummary.dayBevs.length - 1; i >= 0; i--) {
            const b = dailyMacroSummary.dayBevs[i];
            const ml = b.ml || 0;
            if (cumulativeMl + ml <= TANK_CAPACITY) {
              visibleBevLayers.unshift({
                id: b.id,
                name: b.name,
                ml,
                color: b.color || '#38BDF8',
                heightPct: (ml / TANK_CAPACITY) * 100
              });
              cumulativeMl += ml;
            } else {
              const roomLeft = TANK_CAPACITY - cumulativeMl;
              if (roomLeft > 25) {
                visibleBevLayers.unshift({
                  id: b.id,
                  name: b.name,
                  ml: roomLeft,
                  color: b.color || '#38BDF8',
                  heightPct: (roomLeft / TANK_CAPACITY) * 100
                });
                cumulativeMl = TANK_CAPACITY;
              }
              break; // Older base layer rolls off/disappears
            }
          }

          const totalTankFillPct = Math.min(100, Math.max(0, (cumulativeMl / TANK_CAPACITY) * 100));
          const topLayerColor = visibleBevLayers.length > 0 ? visibleBevLayers[visibleBevLayers.length - 1].color : '#38BDF8';

          return (
            <>
              <button
                type="button"
                onClick={() => toggleCard('beverages')}
                className="w-full flex items-center justify-between text-left group cursor-pointer"
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Other Beverages
                </h2>
                <div className="flex items-center shrink-0">
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                      isBeveragesExpanded ? 'rotate-180 text-[#38BDF8]' : ''
                    }`}
                  />
                </div>
              </button>

              {isBeveragesExpanded && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
                  {/* Beverage Catalog Selector Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {BEVERAGE_CATALOG.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBeverageId(b.id);
                          setBeverageMlInput(b.defaultMl);
                        }}
                        className={`ios-press px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                          selectedBeverageId === b.id
                            ? 'bg-[#38BDF8] text-black font-bold shadow-sm'
                            : 'bg-white/5 border border-white/10 text-white/75 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>

                  {/* Volume Input & Compact '+' Button */}
                  <div className="flex gap-2 text-xs">
                    <div className="flex items-center bg-[#141417] border border-white/10 rounded-xl px-3.5 py-2.5 flex-1">
                      <span className="text-white/70 font-semibold mr-2 whitespace-nowrap">Volume:</span>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        value={beverageMlInput}
                        onChange={(e) => setBeverageMlInput(Number(e.target.value))}
                        className="w-full bg-transparent text-white font-bold font-mono focus:outline-none"
                      />
                      <span className="text-white/60 font-mono ml-1">ml</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDrink}
                      className="btn-primary-green w-11 h-11 rounded-xl text-black font-bold flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-[#D4FB45]/15"
                      title="Pour beverage into tank"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Dynamic Layered Liquid Wave Tank */}
                  <div className="relative h-64 sm:h-72 rounded-2xl bg-[#080B11] border border-white/10 overflow-hidden shadow-inner flex flex-col justify-end">
                    {/* Glass Cylinder Highlights & Reflections */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/[0.07] via-transparent to-white/[0.04] pointer-events-none z-30" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none z-30" />

                    {/* Laboratory Glass Graduated Gauge */}
                    <div className="absolute right-3 top-3.5 bottom-3.5 flex flex-col justify-between items-end text-[9px] font-mono font-bold text-white/35 pointer-events-none select-none z-30">
                      <div className="flex items-center gap-1.5">
                        <span>1000ml</span>
                        <div className="w-2.5 h-[1.5px] bg-white/30" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>750ml</span>
                        <div className="w-2 h-[1px] bg-white/20" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>500ml</span>
                        <div className="w-2.5 h-[1.5px] bg-white/30" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>250ml</span>
                        <div className="w-2 h-[1px] bg-white/20" />
                      </div>
                    </div>

                    {/* Top-Left: Total Volume in Tank HUD Badge */}
                    {cumulativeMl > 0 && (
                      <div className="absolute top-3 left-3.5 z-30 pointer-events-none drop-shadow-md">
                        <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4FB45] animate-pulse" />
                          <p className="text-xs font-black text-white font-mono tracking-tight leading-none">
                            {cumulativeMl}{' '}
                            <span className="text-[10px] font-semibold text-white/60">
                              / 1000 ml
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {visibleBevLayers.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <span className="text-xs font-semibold text-white/40">Liquid Tank Empty</span>
                        <span className="text-[10px] text-white/25 mt-0.5">Select a beverage above and tap + to pour</span>
                      </div>
                    ) : (
                      /* Liquid Body with Dynamic Height */
                      <div
                        className="relative w-full transition-all duration-700 ease-out z-10 flex flex-col justify-end overflow-visible"
                        style={{ height: `${Math.max(20, totalTankFillPct)}%` }}
                      >
                        {/* Ambient Liquid Effervescence Particles */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                          <div className="absolute left-[20%] bottom-3 w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                          <div className="absolute left-[50%] bottom-8 w-1 h-1 rounded-full bg-white/25 animate-ping" style={{ animationDuration: '3.5s' }} />
                          <div className="absolute left-[75%] bottom-4 w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '2.5s' }} />
                        </div>

                        {/* Stacked Liquid Layers with Fluid Waves at Every Boundary */}
                        <div className="w-full h-full flex flex-col overflow-visible">
                          {[...visibleBevLayers].reverse().map((layer, idx) => (
                            <div
                              key={layer.id}
                              className="w-full relative flex items-center justify-center transition-all group/layer px-3 py-0.5"
                              style={{
                                flexGrow: layer.ml,
                                minHeight: '32px',
                                background: `linear-gradient(180deg, ${layer.color}EE 0%, ${layer.color}D9 50%, ${layer.color}B3 100%)`,
                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -1px 3px rgba(0,0,0,0.3)',
                                zIndex: 10 + idx
                              }}
                            >
                              {/* Undulating Sinusoidal Wave Crest at top boundary */}
                              <div className="absolute -top-3 inset-x-0 h-4 pointer-events-none overflow-hidden">
                                {/* Back Wave */}
                                <svg
                                  className="absolute w-[200%] h-4 animate-wave-back opacity-50 -left-full"
                                  style={{ fill: layer.color }}
                                  viewBox="0 0 1200 120"
                                  preserveAspectRatio="none"
                                >
                                  <path d="M0,40 C150,0 300,80 450,20 C525,50 575,10 600,40 C750,0 900,80 1050,20 C1125,50 1175,10 1200,40 L1200,120 L0,120 Z" />
                                </svg>
                                {/* Front Wave with Illuminated Crest */}
                                <svg
                                  className="absolute w-[200%] h-4 animate-wave-front opacity-90 left-0"
                                  style={{ fill: layer.color }}
                                  viewBox="0 0 1200 120"
                                  preserveAspectRatio="none"
                                >
                                  <path d="M0,25 C150,-15 300,65 450,15 C525,45 575,0 600,25 C750,-15 900,65 1050,15 C1125,45 1175,0 1200,25 L1200,120 L0,120 Z" />
                                  <path
                                    d="M0,25 C150,-15 300,65 450,15 C525,45 575,0 600,25 C750,-15 900,65 1050,15 C1125,45 1175,0 1200,25"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.4)"
                                    strokeWidth="4"
                                  />
                                </svg>
                              </div>

                              {/* Floating Frosted Glass Capsule Badge */}
                              <div className="relative z-10 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg transition-transform hover:scale-[1.02]">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 shadow-xs ring-1 ring-white/30"
                                  style={{ backgroundColor: layer.color }}
                                />
                                <span className="text-[11px] font-bold text-white tracking-tight truncate max-w-[130px] sm:max-w-[180px]">
                                  {layer.name}
                                </span>
                                <span className="text-[10px] font-mono font-black text-[#D4FB45] shrink-0">
                                  {layer.ml} ml
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDrink(layer.id, layer.name);
                                  }}
                                  className="text-white/40 hover:text-red-400 p-0.5 rounded cursor-pointer transition shrink-0 ml-0.5"
                                  title={`Remove ${layer.name}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* CARD 5: Grocery List (No Icon, No Subtitle, Inline Add Item & Copy Flow) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        <button
          type="button"
          onClick={() => toggleCard('grocery')}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Grocery List
          </h2>
          <div className="flex items-center shrink-0">
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                isGroceryExpanded ? 'rotate-180 text-[#D4FB45]' : ''
              }`}
            />
          </div>
        </button>

        {isGroceryExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in">
            {/* Header: Green 'Grocery Checklist' + 'Add Item' + 'Copy' */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4FB45]">
                Grocery Checklist
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGroceryItem(true);
                    setTimeout(() => newGroceryInputRef.current?.focus(), 50);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#D4FB45] text-black font-bold text-xs flex items-center gap-1 cursor-pointer hover:brightness-105 transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Item</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyGroceryList}
                  disabled={groceryItems.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                  title="Copy comma-separated list"
                >
                  {copiedGrocery ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#30D158] stroke-[2.5]" />
                      <span className="text-[#30D158] font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#D4FB45]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inline New Item Input Block */}
            {isAddingGroceryItem && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1A1A1E] border border-[#D4FB45]/50 animate-in fade-in">
                <input
                  ref={newGroceryInputRef}
                  type="text"
                  value={newGroceryItemText}
                  onChange={(e) => setNewGroceryItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNewGroceryItem();
                    if (e.key === 'Escape') {
                      setIsAddingGroceryItem(false);
                      setNewGroceryItemText('');
                    }
                  }}
                  placeholder="Type item name and press Enter (e.g. chapati)..."
                  className="flex-1 bg-transparent text-white font-semibold text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveNewGroceryItem}
                  className="px-2.5 py-1 rounded-lg bg-[#D4FB45] text-black font-bold text-xs cursor-pointer hover:brightness-105 transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGroceryItem(false);
                    setNewGroceryItemText('');
                  }}
                  className="p-1 text-white/40 hover:text-white cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Checklist Blocks */}
            {groceryItems.length === 0 && !isAddingGroceryItem ? (
              <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-white/40">No items yet • Tap "+ Add Item" above</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto no-scrollbar pr-0.5">
                {groceryItems.map((item, idx) => {
                  const isChecked = checkedGroceryIndices.includes(idx);
                  return (
                    <div
                      key={`${item}-${idx}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        isChecked
                          ? 'bg-black/30 border-white/5 text-white/40'
                          : 'bg-[#141417] border-white/10 text-white hover:border-white/20'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroceryChecked(idx)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                            isChecked
                              ? 'bg-[#D4FB45] border-[#D4FB45] text-black'
                              : 'border-white/20 hover:border-[#D4FB45]'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs font-semibold truncate ${
                            isChecked ? 'line-through text-white/40' : 'text-white'
                          }`}
                        >
                          {item}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroceryItem(idx)}
                        className="p-1 rounded-md text-white/30 hover:text-red-400 transition ml-2 cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CARD 6: Activity History Card (Color-Coded: Green = Grocery, Blue = Nutrients, Grey = Logging) */}
      <div className="ios-card p-4 sm:p-5 shadow-apple-card transition-all">
        <button
          type="button"
          onClick={() => toggleCard('history')}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            History
          </h2>
          <div className="flex items-center shrink-0">
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
                isHistoryExpanded ? 'rotate-180 text-white' : ''
              }`}
            />
          </div>
        </button>

        {isHistoryExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3 animate-in fade-in">
            {macroHistory.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-white/40">No activity recorded yet today</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
                {macroHistory.map((item) => {
                  const tagStyles =
                    item.type === 'grocery'
                      ? 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30'
                      : item.type === 'nav'
                      ? 'bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/30'
                      : 'bg-white/10 text-white/70 border-white/15';

                  const categoryLabel =
                    item.type === 'grocery' ? 'Grocery' : item.type === 'nav' ? 'Nutrients' : 'Activity';

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#141417] border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${tagStyles}`}>
                          {categoryLabel}
                        </span>
                        <span className="text-white/80 font-medium truncate text-xs">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40 shrink-0">
                        {item.timeFormatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {macroHistory.length > 0 && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[10px] text-white/40 hover:text-white/70 transition cursor-pointer"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
