// Date Manipulation and Chain Helpers for SWITCH

export function getLocalDateKey(dateObj: Date = new Date()): string {
  const yr = dateObj.getFullYear();
  const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
  const da = String(dateObj.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
}

export interface DayChainItem {
  key: string;
  dayName: string;
  dayNum: number;
}

export function getLast14DaysChain(baseDate: Date = new Date()): DayChainItem[] {
  const chain: DayChainItem[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    chain.push({
      key: getLocalDateKey(d),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate()
    });
  }
  return chain;
}

export function getTodayWeekdayName(dateObj: Date = new Date()): string {
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
}
