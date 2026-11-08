import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';

import { SPORTS } from '../../models/sport';
import { HealthService } from '../../services/health.service';
import { SportSelectionService } from '../../services/sport-selection.service';
import { StandingsService } from '../../services/standings.service';

@Component({
  selector: 'app-standings',
  templateUrl: './standings.html',
  styleUrl: './standings.scss',
})
export class Standings {
  private readonly sportSelection = inject(SportSelectionService);
  private readonly standingsService = inject(StandingsService);
  protected readonly selectedSport = this.sportSelection.selectedSport;
  protected readonly selectedSportLabel = computed(
    () => SPORTS.find((sport) => sport.id === this.selectedSport())?.label ?? 'Fotbal',
  );

  protected readonly standingsData = toSignal(
    toObservable(this.selectedSport).pipe(
      switchMap((sport) => this.standingsService.getStandings(sport).pipe(catchError(() => of({ standings: [] })))),
      map((res) => res.standings),
    ),
    { initialValue: [] },
  );

  protected readonly backendStatus = toSignal(
    inject(HealthService)
      .getHealth()
      .pipe(
        map((health) => health.status),
        catchError(() => of('indisponibil')),
      ),
    { initialValue: 'se verifică...' },
  );
}
