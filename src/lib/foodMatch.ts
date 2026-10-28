import { OFFLINE_FOOD_DB } from '../data/foodDb';
import { FoodNutrition, CustomFood, ParsedFoodRow } from '../types';

export function parseFoodTextToRows(rawString = ''): ParsedFoodRow[] {
  if (!rawString.trim()) return [];
  return rawString
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((chunk, idx) => {
      // Split on the LAST ' - ' (space-dash-space) only
      const lastDash = chunk.lastIndexOf(' - ');
      const name = lastDash !== -1 ? chunk.slice(0, lastDash).trim() : chunk.trim();
      const qtyRaw = lastDash !== -1 ? chunk.slice(lastDash + 3).trim() : '100g';
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

export function estimateMacrosLocally(
  name = '',
  qty: number | string = 100,
  unit = 'g',
  customFoods: CustomFood[] = []
): FoodNutrition | null {
  const lower = name.toLowerCase().trim();
  if (!lower) return null;

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 1. Check My Foods FIRST with whole-word matching
  let matchedCustom: CustomFood | null = null;
  let maxCustomLen = 0;
  if (Array.isArray(customFoods)) {
    for (const cf of customFoods) {
      const kws = Array.isArray(cf.keywords) && cf.keywords.length > 0 ? cf.keywords : [cf.name];
      for (const kw of kws) {
        if (!kw) continue;
        const re = new RegExp(`\\b${escapeRegex(kw.toLowerCase().trim())}\\b`, 'i');
        if (re.test(lower)) {
          if (kw.length > maxCustomLen) {
            maxCustomLen = kw.length;
            matchedCustom = cf;
          }
        }
      }
    }
  }

  // 2. Built-in database with whole-word and longest-keyword-wins matching
  const match = matchedCustom || (() => {
    let best = null;
    let maxLen = 0;
    for (const item of OFFLINE_FOOD_DB) {
      for (const kw of item.keywords) {
        const re = new RegExp(`\\b${escapeRegex(kw.toLowerCase().trim())}\\b`, 'i');
        if (re.test(lower)) {
          if (kw.length > maxLen) {
            maxLen = kw.length;
            best = item;
          }
        }
      }
    }
    return best;
  })();

  if (match) {
    const base = match.per100g;
    if (!base) return null;

    if (unit === 'pieces') {
      if (match.pieceWeightG) {
        const grams = Number(qty) * match.pieceWeightG;
        const ratio = grams / 100;
        return {
          kcal: Math.round(base.kcal * ratio),
          protein: Number((base.protein * ratio).toFixed(1)),
          carbs: Number((base.carbs * ratio).toFixed(1)),
          fats: Number((base.fats * ratio).toFixed(1)),
          fiber: Number(((base.fiber || 0) * ratio).toFixed(1)),
          sugar: Number(((base.sugar || 0) * ratio).toFixed(1)),
          sodium: Math.round((base.sodium || 0) * ratio),
          source: match.source || 'Built-in DB'
        };
      } else {
        // per-100g food entered as pieces without pieceWeightG: do NOT guess 55g
        return null;
      }
    }

    const grams = Number(qty) || 100;
    const ratio = grams / 100;
    return {
      kcal: Math.round(base.kcal * ratio),
      protein: Number((base.protein * ratio).toFixed(1)),
      carbs: Number((base.carbs * ratio).toFixed(1)),
      fats: Number((base.fats * ratio).toFixed(1)),
      fiber: Number(((base.fiber || 0) * ratio).toFixed(1)),
      sugar: Number(((base.sugar || 0) * ratio).toFixed(1)),
      sodium: Math.round((base.sodium || 0) * ratio),
      source: match.source || 'Built-in DB'
    };
  }
  return null;
}
