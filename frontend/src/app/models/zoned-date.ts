export function calendarDateInZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// A calendar date is a day, not an instant at midnight in the computer's timezone.
export function shiftCalendarDate(date: string, offset: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function calendarDayOffset(date: string, reference: string): number {
  return (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${reference}T00:00:00Z`)) / 86_400_000;
}

export function calendarDateLabel(date: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('ro-RO', { ...options, timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

export function formatZonedDateTime(value: string | null | undefined, timeZone: string): string {
  if (!value) return '—';
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('ro-RO', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return `${part('day')}.${part('month')}.${part('year')} ${part('hour')}:${part('minute')}`;
}
