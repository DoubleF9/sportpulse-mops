import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { MatchDetailsResponse } from '../../models/fixture';
import { matchStatusLabel, presentFixture } from '../../models/match-presentation';
import { Sport, SPORTS } from '../../models/sport';
import { FixturesService } from '../../services/fixtures.service';
import { SportSelectionService } from '../../services/sport-selection.service';
import { TimezoneService } from '../../services/timezone.service';

interface DetailsState {
  loading: boolean;
  error: string | null;
  data: MatchDetailsResponse | null;
}

function validSport(value: string): value is Sport {
  return SPORTS.some((sport) => sport.id === value);
}

@Component({
  selector: 'app-match-details',
  imports: [RouterLink],
  templateUrl: './match-details.html',
  styleUrl: './match-details.scss',
})
export class MatchDetails {
  readonly id = input.required<string>();
  readonly sport = input<string>('football');
  private readonly service = inject(FixturesService);
  private readonly sportSelection = inject(SportSelectionService);
  private readonly reload = signal(0);
  protected readonly timezone = inject(TimezoneService);
  private readonly request = computed(() => ({
    sport: this.sport(),
    id: this.id(),
    attempt: this.reload(),
  }));
  protected readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ sport, id }) => {
        const number = Number(id);
        if (
          !validSport(sport) ||
          !/^\d+$/.test(id) ||
          !Number.isSafeInteger(number) ||
          number <= 0
        ) {
          return of<DetailsState>({
            loading: false,
            error: 'Sport sau identificator de meci invalid.',
            data: null,
          });
        }
        return this.service.getMatch(sport, number).pipe(
          map((data): DetailsState => ({ loading: false, error: null, data })),
          startWith<DetailsState>({ loading: true, error: null, data: null }),
          catchError((error: HttpErrorResponse) =>
            of<DetailsState>({
              loading: false,
              data: null,
              error:
                error.status === 404
                  ? 'Meciul nu a fost găsit.'
                  : typeof error.error?.detail === 'string'
                    ? error.error.detail
                    : 'Detaliile meciului nu sunt disponibile momentan. Încercați din nou mai târziu.',
            }),
          ),
        );
      }),
    ),
    { initialValue: { loading: true, error: null, data: null } as DetailsState },
  );
  protected readonly match = computed(() => {
    const data = this.state().data;
    return data ? presentFixture(data.match, data.sport, this.timezone.timeZone()) : null;
  });
  protected readonly sportLabel = computed(
    () => SPORTS.find((sport) => sport.id === this.sport())?.label ?? 'Sport',
  );
  protected readonly statusLabel = computed(() => {
    const match = this.match();
    return match ? matchStatusLabel(match.status) : '';
  });

  constructor() {
    effect(() => {
      const sport = this.sport();
      if (validSport(sport)) untracked(() => this.sportSelection.selectSport(sport));
    });
  }

  protected retry(): void {
    this.reload.update((attempt) => attempt + 1);
  }

  protected hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }
}
