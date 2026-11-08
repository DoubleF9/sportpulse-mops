import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { FixturesResponse } from '../models/fixture';

@Injectable({ providedIn: 'root' })
export class FixturesService {
  private readonly http = inject(HttpClient);

  getFixtures(date: string, timezone: string): Observable<FixturesResponse> {
    const params = new HttpParams().set('date', date).set('timezone', timezone);
    return this.http.get<FixturesResponse>('/api/fixtures', { params });
  }
}
