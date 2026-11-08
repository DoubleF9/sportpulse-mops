import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Sport } from '../models/sport';

export interface StandingRow {
  position: number;
  team: string;
  mark: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: string[];
  zone?: string | null;
}

export interface StandingsTable {
  name: string;
  country: string;
  group?: string | null;
  rows: StandingRow[];
}

export interface StandingsResponse {
  standings: StandingsTable[];
}

@Injectable({ providedIn: 'root' })
export class StandingsService {
  private readonly http = inject(HttpClient);

  getStandings(sport: Sport, league?: string, season?: string): Observable<StandingsResponse> {
    let params = new HttpParams().set('sport', sport);
    if (league) {
      params = params.set('league', league);
    }
    if (season) {
      params = params.set('season', season);
    }
    return this.http.get<StandingsResponse>('/api/standings', { params });
  }
}
