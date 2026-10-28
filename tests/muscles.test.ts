import { describe, it, expect } from 'vitest';
import { inferMusclesFromText } from '../src/lib/muscles';

describe('inferMusclesFromText', () => {
  it('correctly maps "Lat Pulldown (Cable)" to Back (does not trigger Core from "Cable")', () => {
    const muscles = inferMusclesFromText('Lat Pulldown (Cable)', 'Pull Day');
    expect(muscles).toContain('Back');
    expect(muscles).not.toContain('Core');
  });

  it('correctly maps "Tricep Rope Pushdown" to Triceps', () => {
    const muscles = inferMusclesFromText('Tricep Rope Pushdown', 'Push Day');
    expect(muscles).toContain('Triceps');
    expect(muscles).not.toContain('Biceps');
  });

  it('correctly maps "Barbell Bicep Curl" to Biceps', () => {
    const muscles = inferMusclesFromText('Barbell Bicep Curl', 'Pull Day');
    expect(muscles).toContain('Biceps');
  });

  it('maps "Barbell Squat" to Quads as primary (not Glutes unless explicit)', () => {
    const muscles = inferMusclesFromText('Barbell Squat', 'Leg Day');
    expect(muscles).toContain('Quads');
    expect(muscles).not.toContain('Glutes');
  });

  it('maps "Barbell Hip Thrust" to Glutes', () => {
    const muscles = inferMusclesFromText('Barbell Hip Thrust', 'Leg Day');
    expect(muscles).toContain('Glutes');
  });

  it('returns ["Other"] for unknown exercises instead of defaulting to Chest', () => {
    const muscles = inferMusclesFromText('Cosmic Levitation 9000', 'Mystic Workout');
    expect(muscles).toEqual(['Other']);
  });
});
