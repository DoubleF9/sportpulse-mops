import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';

import { SportSelectionService } from './sport-selection.service';

describe('SportSelectionService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should default to football', () => {
    const service = TestBed.inject(SportSelectionService);

    expect(service.selectedSport()).toBe('football');
  });

  it('should update and persist the selected sport', () => {
    const service = TestBed.inject(SportSelectionService);

    service.selectSport('basketball');

    expect(service.selectedSport()).toBe('basketball');
    expect(localStorage.getItem('sportpulse.selectedSport')).toBe('basketball');
  });

  it('should restore a valid stored sport', () => {
    localStorage.setItem('sportpulse.selectedSport', 'hockey');

    const service = TestBed.inject(SportSelectionService);

    expect(service.selectedSport()).toBe('hockey');
  });

  it('should ignore an unsupported stored sport', () => {
    localStorage.setItem('sportpulse.selectedSport', 'tennis');

    const service = TestBed.inject(SportSelectionService);

    expect(service.selectedSport()).toBe('football');
  });
});

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }
}
