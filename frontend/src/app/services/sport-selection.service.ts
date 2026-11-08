import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { Sport, SPORTS } from '../models/sport';

const STORAGE_KEY = 'sportpulse.selectedSport';

function isSport(value: string | null): value is Sport {
  return SPORTS.some((sport) => sport.id === value);
}

@Injectable({ providedIn: 'root' })
export class SportSelectionService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly selectedSport = signal<Sport>(this.readStoredSport());

  selectSport(sport: Sport): void {
    this.selectedSport.set(sport);
    if (this.isBrowser && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, sport);
    }
  }

  private readStoredSport(): Sport {
    if (this.isBrowser && typeof localStorage !== 'undefined') {
      const storedSport = localStorage.getItem(STORAGE_KEY);
      if (isSport(storedSport)) {
        return storedSport;
      }
    }

    return 'football';
  }
}
