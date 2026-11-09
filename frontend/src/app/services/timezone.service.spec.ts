import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TimezoneService } from './timezone.service';

describe('TimezoneService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('defaults to the detected timezone with no manual preference', () => {
    const service = TestBed.inject(TimezoneService);
    expect(service.timeZone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    expect(service.selectedValue()).toBe('');
    expect(service.options()).toContain('UTC');
    expect(service.options()).toContain(service.detectedTimeZone);
  });

  it('restores a valid preference and formats times in it', () => {
    localStorage.setItem('sportpulse.timezone', 'Asia/Kathmandu');
    const service = TestBed.inject(TimezoneService);
    expect(service.timeZone()).toBe('Asia/Kathmandu');
    expect(service.options()).toContain('Asia/Kathmandu');
    expect(service.formatDateTime('2026-11-09T21:00:00Z')).toBe('10.11.2026 02:45');
  });

  it('persists manual selection and removes it when returning to automatic', () => {
    const service = TestBed.inject(TimezoneService);
    service.selectTimezone('America/New_York');
    expect(service.timeZone()).toBe('America/New_York');
    expect(localStorage.getItem('sportpulse.timezone')).toBe('America/New_York');
    service.selectTimezone('');
    expect(localStorage.getItem('sportpulse.timezone')).toBeNull();
    expect(service.selectedValue()).toBe('');
    expect(service.timeZone()).toBe(service.detectedTimeZone);
  });

  it('ignores invalid saved and incoming timezones', () => {
    localStorage.setItem('sportpulse.timezone', 'Invalid/Zone');
    const service = TestBed.inject(TimezoneService);
    expect(service.timeZone()).toBe(service.detectedTimeZone);
    service.selectTimezone('UTC');
    service.selectTimezone('Invalid/Zone');
    expect(service.timeZone()).toBe('UTC');
    expect(localStorage.getItem('sportpulse.timezone')).toBe('UTC');
  });

  it('keeps working when storage is blocked and reports that saving failed', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException();
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException();
    });
    const service = TestBed.inject(TimezoneService);
    expect(service.timeZone()).toBe(service.detectedTimeZone);
    expect(() => service.selectTimezone('UTC')).not.toThrow();
    expect(service.timeZone()).toBe('UTC');
    expect(service.storageUnavailable()).toBe(true);
  });

  it('offers a usable fallback list when timezone enumeration is unavailable', () => {
    vi.spyOn(Intl, 'supportedValuesOf').mockImplementation(() => {
      throw new TypeError();
    });
    const service = TestBed.inject(TimezoneService);
    expect(service.options()).toContain('Europe/Bucharest');
    expect(service.options()).toContain('Asia/Kathmandu');
  });

  it('updates today when midnight passes in the selected timezone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-09T23:59:30Z'));
    const service = TestBed.inject(TimezoneService);
    service.selectTimezone('UTC');
    expect(service.today()).toBe('2026-11-09');
    vi.advanceTimersByTime(60_000);
    expect(service.today()).toBe('2026-11-10');
  });
});
