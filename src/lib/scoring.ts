// Scoring, Biometrics & Smart Reply Engine for SWITCH

export interface ZestScoreBreakdown {
  totalScore: number;
  strengthPts: number;
  burnPts: number;
  macroPts: number;
  waterPts: number;
}

export function calculateFairZestScore(stats: {
  weight?: number;
  todayVolumeKg?: number;
  todayAvgRpe?: number;
  todayKcalBurn?: number;
  pureFoodMacroPct?: number;
  waterPct?: number;
} = {}): ZestScoreBreakdown {
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

  const rawTotal = strengthPts + burnPts + macroPts + waterPts;
  const totalScore = Math.min(100, Math.max(0, rawTotal));

  return {
    totalScore,
    strengthPts,
    burnPts,
    macroPts,
    waterPts
  };
}

// Mifflin-St Jeor Formula
// Male: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
// Female: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: 'male' | 'female' = 'male'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

export function buildSmartRepliesForBubble(senderHandle: string, messageText = ''): string[] {
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
