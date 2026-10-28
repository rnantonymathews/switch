import { describe, it, expect } from 'vitest';
import { calculateFairZestScore, calculateBMR } from '../src/lib/scoring';

describe('calculateFairZestScore', () => {
  it('returns 0 for zero inputs', () => {
    const score = calculateFairZestScore({});
    expect(score.totalScore).toBe(0);
    expect(score.strengthPts).toBe(0);
    expect(score.burnPts).toBe(0);
    expect(score.macroPts).toBe(0);
    expect(score.waterPts).toBe(0);
  });

  it('never exceeds 100 even with extreme maxed inputs', () => {
    const score = calculateFairZestScore({
      weight: 75,
      todayVolumeKg: 500000,
      todayAvgRpe: 10,
      todayKcalBurn: 50000,
      pureFoodMacroPct: 100,
      waterPct: 150
    });
    expect(score.totalScore).toBeLessThanOrEqual(100);
    expect(score.totalScore).toBe(100);
    expect(score.strengthPts).toBeLessThanOrEqual(45);
    expect(score.burnPts).toBeLessThanOrEqual(25);
    expect(score.macroPts).toBeLessThanOrEqual(15);
    expect(score.waterPts).toBeLessThanOrEqual(15);
  });
});

describe('Mifflin-St Jeor BMR formula', () => {
  it('calculates accurate BMR for a known male example', () => {
    // Male: 80 kg, 180 cm, 30 years
    // 10 * 80 + 6.25 * 180 - 5 * 30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const bmr = calculateBMR(80, 180, 30, 'male');
    expect(bmr).toBe(1780);
  });

  it('calculates accurate BMR for a known female example', () => {
    // Female: 60 kg, 165 cm, 25 years
    // 10 * 60 + 6.25 * 165 - 5 * 25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    const bmr = calculateBMR(60, 165, 25, 'female');
    expect(bmr).toBe(1345);
  });
});
