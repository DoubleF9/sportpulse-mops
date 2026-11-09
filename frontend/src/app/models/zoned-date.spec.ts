import {
  calendarDateInZone,
  calendarDayOffset,
  formatZonedDateTime,
  shiftCalendarDate,
} from './zoned-date';

describe('calendar dates in the selected timezone', () => {
  it('moves a 21:00 UTC match to the next calendar day in UTC+3', () => {
    const kickoff = '2026-07-01T21:00:00Z';
    expect(calendarDateInZone(new Date(kickoff), 'Europe/Bucharest')).toBe('2026-07-02');
    expect(formatZonedDateTime(kickoff, 'Europe/Bucharest')).toBe('02.07.2026 00:00');
    expect(formatZonedDateTime(kickoff, 'America/New_York')).toBe('01.07.2026 17:00');
  });

  it('uses the offset on the match date across both daylight saving transitions', () => {
    expect(formatZonedDateTime('2026-03-29T00:30:00Z', 'Europe/Bucharest')).toBe(
      '29.03.2026 02:30',
    );
    expect(formatZonedDateTime('2026-03-29T01:30:00Z', 'Europe/Bucharest')).toBe(
      '29.03.2026 04:30',
    );
    expect(formatZonedDateTime('2026-10-25T00:30:00Z', 'Europe/Bucharest')).toBe(
      '25.10.2026 03:30',
    );
    expect(formatZonedDateTime('2026-10-25T01:30:00Z', 'Europe/Bucharest')).toBe(
      '25.10.2026 03:30',
    );
  });

  it('navigates calendar days across DST, month and year boundaries without elapsed-hour arithmetic', () => {
    expect(shiftCalendarDate('2026-03-29', 1)).toBe('2026-03-30');
    expect(calendarDayOffset('2026-03-30', '2026-03-29')).toBe(1);
    expect(shiftCalendarDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftCalendarDate('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('formats fractional-hour zones and missing timestamps', () => {
    expect(formatZonedDateTime('2026-11-09T21:00:00Z', 'Asia/Kathmandu')).toBe('10.11.2026 02:45');
    expect(formatZonedDateTime(null, 'UTC')).toBe('—');
    expect(formatZonedDateTime('invalid', 'UTC')).toBe('—');
  });
});
