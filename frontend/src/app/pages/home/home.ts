import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { SPORTS } from '../../models/sport';
import { FixturesResponse } from '../../models/fixture';
import { isLiveMatch, MatchStatus, presentFixture } from '../../models/match-presentation';
import {
  emptyMatchFilters,
  MatchFilters,
  MatchFiltersSelection,
} from '../../components/match-filters/match-filters';
import { FixturesService } from '../../services/fixtures.service';
import { HealthService } from '../../services/health.service';
import { SportSelectionService } from '../../services/sport-selection.service';

interface ScheduleState {
  loading: boolean;
  error: string | null;
  data: FixturesResponse | null;
}

interface ScheduleMatch {
  id: string | number;
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeTeam: string;
  awayTeam: string;
  homeMark: string;
  awayMark: string;
  homeScore: number | null;
  awayScore: number | null;
  time: string;
  status: MatchStatus;
}

interface ScheduleCompetition {
  id?: number;
  logo?: string | null;
  name: string;
  country: string;
  round: string | null;
  matches: ScheduleMatch[];
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateToInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-home',
  imports: [DatePipe, MatchFilters, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly filterState = signal<MatchFiltersSelection>(emptyMatchFilters());
  protected readonly filters = this.filterState.asReadonly();
  private filterSport = '';
  private readonly reload = signal(0);
  private readonly fixturesService = inject(FixturesService);
  private readonly sportSelection = inject(SportSelectionService);
  private readonly today = startOfDay(new Date());
  private readonly selectedDateState = signal(this.today);
  protected readonly selectedDate = this.selectedDateState.asReadonly();
  protected readonly selectedSport = this.sportSelection.selectedSport;
  protected readonly selectedSportLabel = computed(
    () => SPORTS.find((sport) => sport.id === this.selectedSport())?.label ?? 'Fotbal',
  );
  protected readonly selectedDayOffset = computed(() =>
    Math.round((this.selectedDate().getTime() - this.today.getTime()) / 86_400_000),
  );
  protected readonly dateOptions = [-3, -2, -1, 0, 1, 2, 3];
  protected readonly minDate = dateToInputValue(
    new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 7),
  );
  protected readonly maxDate = dateToInputValue(
    new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + 7),
  );
  protected readonly dateInputValue = computed(() => dateToInputValue(this.selectedDate()));
  protected readonly selectedDateLabel = computed(() =>
    new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      this.selectedDate(),
    ),
  );
  protected readonly browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private readonly request = computed(() => ({
    sport: this.selectedSport(),
    date: this.dateInputValue(),
    attempt: this.reload(),
  }));
  protected readonly schedule = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ sport, date }) =>
        this.fixturesService.getFixtures(date, this.browserTimeZone, sport).pipe(
          map((data): ScheduleState => ({ loading: false, error: null, data })),
          startWith<ScheduleState>({ loading: true, error: null, data: null }),
          catchError((error: HttpErrorResponse) =>
            of<ScheduleState>({
              loading: false,
              error:
                typeof error.error?.detail === 'string'
                  ? error.error.detail
                  : 'Programul meciurilor nu este disponibil momentan. Încercați din nou mai târziu.',
              data: null,
            }),
          ),
        ),
      ),
    ),
    { initialValue: { loading: true, error: null, data: null } as ScheduleState },
  );
  protected readonly allCompetitions = computed(() =>
    (this.schedule().data?.competitions ?? [])
      .filter((competition) => competition.matches.length > 0)
      .map((competition) => ({ ...competition, country: competition.country || 'Internațional' })),
  );
  protected readonly competitions = computed<ScheduleCompetition[]>(() => {
    const filters = this.filters();
    return this.allCompetitions()
      .filter((competition) => !filters.country || competition.country === filters.country)
      .filter(
        (competition) =>
          filters.competitionIds.length === 0 || filters.competitionIds.includes(competition.id),
      )
      .map((competition) => ({
        ...competition,
        matches: competition.matches
          .filter((match) => !filters.liveOnly || isLiveMatch(match.status, this.selectedSport()))
          .map((match) => presentFixture(match, this.selectedSport(), this.browserTimeZone)),
      }))
      .filter((competition) => competition.matches.length > 0);
  });
  protected readonly totalMatches = computed(() =>
    this.allCompetitions().reduce((total, competition) => total + competition.matches.length, 0),
  );
  protected readonly visibleMatches = computed(() =>
    this.competitions().reduce((total, competition) => total + competition.matches.length, 0),
  );

  constructor() {
    effect(() => {
      const sport = this.selectedSport();
      const schedule = this.schedule();
      const competitions = this.allCompetitions();
      untracked(() => {
        if (this.filterSport !== sport) {
          this.filterSport = sport;
          this.filterState.set(emptyMatchFilters());
        }
        if (schedule.loading || schedule.error || !schedule.data) return;
        const previous = this.filterState();
        const country = competitions.some((competition) => competition.country === previous.country)
          ? previous.country
          : '';
        const validIds = new Set(
          competitions
            .filter((competition) => !country || competition.country === country)
            .map((competition) => competition.id),
        );
        const competitionIds =
          country === previous.country
            ? previous.competitionIds.filter((id) => validIds.has(id))
            : [];
        if (
          country !== previous.country ||
          competitionIds.length !== previous.competitionIds.length
        ) {
          this.filterState.set({ ...previous, country, competitionIds });
        }
      });
    });
  }

  protected updateFilters(selection: MatchFiltersSelection): void {
    this.filterState.set(selection);
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

  protected chooseDay(offset: number): void {
    const date = new Date(this.today);
    date.setDate(date.getDate() + offset);
    this.selectedDateState.set(date);
  }

  protected retry(): void {
    this.reload.update((attempt) => attempt + 1);
  }

  protected openCalendar(input: HTMLInputElement): void {
    input.focus();
    try {
      input.showPicker?.();
    } catch {
      // Keep the visible date input focused when the native picker cannot be opened.
    }
  }

  protected hideBrokenImage(event: Event): void {
    (event.target as HTMLImageElement).hidden = true;
  }

  protected onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const [year, month, day] = value.split('-').map(Number);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !year || !month || !day) {
      return;
    }

    const selected = new Date(year, month - 1, day);
    const offset = Math.round((selected.getTime() - this.today.getTime()) / 86_400_000);
    if (dateToInputValue(selected) === value && offset >= -7 && offset <= 7) {
      this.selectedDateState.set(selected);
    }
  }

  protected dayLabel(offset: number): string {
    if (offset === 0) {
      return 'Azi';
    }
    if (offset === -1) {
      return 'Ieri';
    }
    if (offset === 1) {
      return 'Mâine';
    }

    const date = new Date(this.today);
    date.setDate(date.getDate() + offset);
    return new Intl.DateTimeFormat('ro-RO', { weekday: 'short', day: 'numeric' }).format(date);
  }

  protected statusLabel(status: MatchStatus): string {
    if (status === 'live') {
      return 'LIVE';
    }
    return {
      scheduled: 'PROGRAMAT',
      finished: 'FINAL',
      postponed: 'AMÂNAT',
      cancelled: 'ANULAT',
      interrupted: 'ÎNTRERUPT',
      unknown: 'NECUNOSCUT',
    }[status];
  }
}
