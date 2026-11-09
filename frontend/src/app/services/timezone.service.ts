import { isPlatformBrowser } from '@angular/common';
import { computed, DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { calendarDateInZone, formatZonedDateTime } from '../models/zoned-date';

const STORAGE_KEY = 'sportpulse.timezone';
const FALLBACK_ZONES = [
  'UTC',
  'Europe/Bucharest',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'America/St_Johns',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Asia/Riyadh',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Honolulu',
  'Pacific/Kiritimati',
];

function validTimezone(value: string): boolean {
  try {
    if (!value) return false;
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function detectedTimezone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return validTimezone(zone) ? zone : 'UTC';
  } catch {
    return 'UTC';
  }
}

function availableTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return FALLBACK_ZONES.filter(validTimezone);
  }
}

@Injectable({ providedIn: 'root' })
export class TimezoneService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly detectedTimeZone = detectedTimezone();
  private readonly preference = signal<string | null>(this.readStoredPreference());
  readonly selectedValue = computed(() => this.preference() ?? '');
  readonly timeZone = computed(() => this.preference() ?? this.detectedTimeZone);
  private readonly now = signal(new Date());
  readonly today = computed(() => calendarDateInZone(this.now(), this.timeZone()));
  private readonly supportedZones = availableTimezones();
  readonly options = computed(() =>
    [...new Set(['UTC', this.detectedTimeZone, this.timeZone(), ...this.supportedZones])].sort(),
  );
  private readonly persistenceFailed = signal(false);
  readonly storageUnavailable = this.persistenceFailed.asReadonly();

  constructor() {
    if (this.isBrowser) {
      const timer = setInterval(() => this.now.set(new Date()), 60_000);
      inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }
  }

  selectTimezone(value: string): void {
    if (value && !validTimezone(value)) return;
    this.now.set(new Date());
    this.preference.set(value || null);
    this.persistenceFailed.set(false);
    if (!this.isBrowser) return;
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      this.persistenceFailed.set(true);
    }
  }

  formatDateTime(value: string | null | undefined): string {
    return formatZonedDateTime(value, this.timeZone());
  }

  private readStoredPreference(): string | null {
    if (!this.isBrowser) return null;
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value && validTimezone(value) ? value : null;
    } catch {
      return null;
    }
  }
}
