import { describe, it, expect } from 'vitest';
import {
  parseClockToMinutes,
  formatMinutesToHHMM,
  parseTypeFormatToActivities,
  serializeActivitiesToTypeFormat
} from '../src/lib/schedule';

describe('parseClockToMinutes', () => {
  it('correctly parses 6pm, 18:00, 1800 to 1080 minutes', () => {
    expect(parseClockToMinutes('6pm')).toBe(1080);
    expect(parseClockToMinutes('18:00')).toBe(1080);
    expect(parseClockToMinutes('1800')).toBe(1080);
  });

  it('correctly parses 12am to 0 minutes', () => {
    expect(parseClockToMinutes('12am')).toBe(0);
    expect(parseClockToMinutes('00:00')).toBe(0);
  });

  it('correctly parses 12pm to 720 minutes', () => {
    expect(parseClockToMinutes('12pm')).toBe(720);
    expect(parseClockToMinutes('12:00')).toBe(720);
  });

  it('returns null for invalid inputs', () => {
    expect(parseClockToMinutes('invalid')).toBeNull();
    expect(parseClockToMinutes('')).toBeNull();
  });
});

describe('Activity format serialization round-trip', () => {
  it('round-trip serialize and parse returns identical activity structure', () => {
    const rawText = `[Monday]
[Deep Work Block - 09:00 : 10:30]
[Gym Session - 17:30 : 19:00]`;

    const parsed = parseTypeFormatToActivities(rawText);
    expect(parsed.length).toBe(2);
    expect(parsed[0].activity).toBe('Deep Work Block');
    expect(parsed[0].fromTime).toBe('09:00');
    expect(parsed[0].toTime).toBe('10:30');
    expect(parsed[1].activity).toBe('Gym Session');
    expect(parsed[1].fromTime).toBe('17:30');
    expect(parsed[1].toTime).toBe('19:00');

    const serialized = serializeActivitiesToTypeFormat(parsed);
    expect(serialized).toContain('[Monday]');
    expect(serialized).toContain('[Deep Work Block - 09:00 : 10:30]');
    expect(serialized).toContain('[Gym Session - 17:30 : 19:00]');

    const reparsed = parseTypeFormatToActivities(serialized);
    expect(reparsed.length).toBe(parsed.length);
    expect(reparsed[0].activity).toBe(parsed[0].activity);
    expect(reparsed[0].startMins).toBe(parsed[0].startMins);
    expect(reparsed[1].endMins).toBe(parsed[1].endMins);
  });
});
