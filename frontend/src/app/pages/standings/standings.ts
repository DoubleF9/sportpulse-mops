import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { SPORTS } from '../../models/sport';
import { HealthService } from '../../services/health.service';
import { SportSelectionService } from '../../services/sport-selection.service';
import { TimezoneService } from '../../services/timezone.service';
import { StandingsResponse, StandingsService } from '../../services/standings.service';

interface StandingsState {
  loading: boolean;
  error: string | null;
  data: StandingsResponse | null;
}

@Component({
  selector: 'app-standings',
  templateUrl: './standings.html',
  styleUrl: './standings.scss',
})
export class Standings {
  protected readonly timezone = inject(TimezoneService);
  private readonly sportSelection = inject(SportSelectionService);
  private readonly standingsService = inject(StandingsService);
  private readonly reload = signal(0);
  protected readonly selectedSport = this.sportSelection.selectedSport;
  protected readonly selectedSportLabel = computed(
    () => SPORTS.find((sport) => sport.id === this.selectedSport())?.label ?? 'Fotbal',
  );

  private readonly request = computed(() => ({
    sport: this.selectedSport(),
    attempt: this.reload(),
  }));
  protected readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ sport }) =>
        this.standingsService.getStandings(sport).pipe(
          map((data): StandingsState => ({ loading: false, error: null, data })),
          startWith<StandingsState>({ loading: true, error: null, data: null }),
          catchError((error: HttpErrorResponse) =>
            of<StandingsState>({
              loading: false,
              data: null,
              error:
                typeof error.error?.detail === 'string'
                  ? error.error.detail
                  : 'Clasamentul nu este disponibil momentan. Încercați din nou mai târziu.',
            }),
          ),
        ),
      ),
    ),
    { initialValue: { loading: true, error: null, data: null } as StandingsState },
  );
  protected readonly standingsData = computed(() => this.state().data?.standings ?? []);

  protected retry(): void {
    this.reload.update((attempt) => attempt + 1);
  }

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
