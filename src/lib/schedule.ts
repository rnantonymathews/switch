import { DAY_ALIASES } from '../constants';
import { getTodayWeekdayName } from './dates';

export interface ActivityItem {
  id: string;
  day: string;
  activity: string;
  fromTime: string;
  toTime: string;
  startMins: number;
  endMins: number;
}

export function parseClockToMinutes(rawStr = ''): number | null {
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

export function formatMinutesToHHMM(totalMins = 0): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(totalMins)));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function parseTypeFormatToActivities(text = ''): ActivityItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let currentDay = getTodayWeekdayName();
  const parsed: ActivityItem[] = [];

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

export function serializeActivitiesToTypeFormat(activities: ActivityItem[] = []): string {
  if (!activities || activities.length === 0) return '';
  const byDay: Record<string, ActivityItem[]> = {};
  activities.forEach((a) => {
    const d = a.day || 'Daily';
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(a);
  });

  const blocks: string[] = [];
  Object.keys(byDay).forEach((dayName) => {
    blocks.push(`[${dayName}]`);
    byDay[dayName].forEach((act) => {
      blocks.push(`[${act.activity} - ${act.fromTime} : ${act.toTime}]`);
    });
    blocks.push('');
  });

  return blocks.join('\n').trim();
}

export function parseActivityCsvToActivities(rawCsv = ''): ActivityItem[] {
  const chunks = rawCsv
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const parsed: ActivityItem[] = [];

  chunks.forEach((chunk, idx) => {
    const parts = chunk.split(',').map((p) => p.trim());
    if (parts.length >= 4) {
      const rawDay = parts[0];
      const day = DAY_ALIASES[rawDay.toLowerCase()] || rawDay || getTodayWeekdayName();
      const activity = parts[1];
      const startMins = parseClockToMinutes(parts[2]);
      const endMins = parseClockToMinutes(parts[3]);

      if (activity && startMins !== null && endMins !== null && endMins > startMins) {
        parsed.push({
          id: `csv-${idx}-${startMins}`,
          day,
          activity,
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
