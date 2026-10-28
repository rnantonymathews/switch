import { describe, it, expect } from 'vitest';
import { estimateMacrosLocally, parseFoodTextToRows } from '../src/lib/foodMatch';

describe('estimateMacrosLocally', () => {
  it('correctly matches "egg white" to ~17 kcal per piece (not 72 kcal whole egg)', () => {
    const res = estimateMacrosLocally('egg white', 1, 'pieces');
    expect(res).not.toBeNull();
    // 52 kcal / 100g with pieceWeightG 33 = ~17.16 -> 17 kcal
    expect(res!.kcal).toBe(17);
    expect(res!.protein).toBeCloseTo(3.6, 1);
  });

  it('does not match "eggplant" to egg', () => {
    const res = estimateMacrosLocally('eggplant', 100, 'g');
    expect(res).toBeNull();
  });

  it('does not match "dalia" to dal', () => {
    const res = estimateMacrosLocally('dalia', 100, 'g');
    expect(res).toBeNull();
  });

  it('does not match "coconut milk" to dairy milk', () => {
    const res = estimateMacrosLocally('coconut milk', 100, 'ml');
    expect(res).not.toBeNull();
    // coconut milk is ~230 kcal/100g, whereas cow milk is ~58 kcal
    expect(res!.kcal).toBe(230);
  });

  it('calculates 2 rotis to ~208 kcal', () => {
    // 260 kcal / 100g * 40g * 2 = 208 kcal
    const res = estimateMacrosLocally('roti', 2, 'pieces');
    expect(res).not.toBeNull();
    expect(res!.kcal).toBe(208);
  });

  it('returns null for unknown foods', () => {
    const res = estimateMacrosLocally('martian space burger', 100, 'g');
    expect(res).toBeNull();
  });

  it('prioritizes My Foods (customFoods) over built-in DB', () => {
    const customFoods = [
      {
        id: 'cf-1',
        name: 'super roti',
        keywords: ['roti'],
        per100g: { kcal: 500, protein: 30, carbs: 40, fats: 10, source: 'Custom' },
        pieceWeightG: 50,
        source: 'My Foods'
      }
    ];
    const res = estimateMacrosLocally('roti', 1, 'pieces', customFoods);
    expect(res).not.toBeNull();
    expect(res!.source).toBe('My Foods');
    expect(res!.kcal).toBe(250);
  });
});

describe('parseFoodTextToRows', () => {
  it('splits on the last space-dash-space only for hyphenated names', () => {
    const rows = parseFoodTextToRows('Cross-trainer shake - 200ml, Chicken curry - 150g');
    expect(rows.length).toBe(2);
    expect(rows[0].name).toBe('Cross-trainer shake');
    expect(rows[0].qty).toBe(200);
    expect(rows[0].unit).toBe('ml');
    expect(rows[1].name).toBe('Chicken curry');
    expect(rows[1].qty).toBe(150);
  });
});
