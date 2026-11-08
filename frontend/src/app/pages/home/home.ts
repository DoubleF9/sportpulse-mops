import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { SPORTS } from '../../models/sport';
import type { Sport } from '../../models/sport';
import { Fixture, FixturesResponse } from '../../models/fixture';
import { FixturesService } from '../../services/fixtures.service';
import { HealthService } from '../../services/health.service';
import { SportSelectionService } from '../../services/sport-selection.service';

type ScheduleMatchStatus =
  'live' | 'scheduled' | 'finished' | 'postponed' | 'cancelled' | 'interrupted' | 'unknown';

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
  status: ScheduleMatchStatus;
}

interface ScheduleCompetition {
  id?: number;
  logo?: string | null;
  name: string;
  country: string;
  round: string | null;
  matches: ScheduleMatch[];
}

const DEMO_COMPETITIONS: Record<Sport, ScheduleCompetition[]> = {
  football: [],
  basketball: [
    {
      name: 'Liga demonstrativă',
      country: 'România',
      round: 'Etapa 8',
      matches: [
        {
          id: 'basketball-live',
          homeTeam: 'Baschet Nord',
          awayTeam: 'Baschet Sud',
          homeMark: 'N',
          awayMark: 'S',
          homeScore: 78,
          awayScore: 74,
          time: 'Q4 04:32',
          status: 'live',
        },
        {
          id: 'basketball-scheduled',
          homeTeam: 'Atletic Verde',
          awayTeam: 'Sportul Albastru',
          homeMark: 'V',
          awayMark: 'A',
          homeScore: null,
          awayScore: null,
          time: '20:00',
          status: 'scheduled',
        },
        {
          id: 'basketball-finished',
          homeTeam: 'Dunărea BC',
          awayTeam: 'Olimpic City',
          homeMark: 'D',
          awayMark: 'O',
          homeScore: 91,
          awayScore: 86,
          time: 'Final',
          status: 'finished',
        },
      ],
    },
  ],
  hockey: [
    {
      name: 'Liga demonstrativă',
      country: 'România',
      round: 'Etapa 5',
      matches: [
        {
          id: 'hockey-live',
          homeTeam: 'Lupii Nordului',
          awayTeam: 'Vulturii Sudului',
          homeMark: 'L',
          awayMark: 'V',
          homeScore: 3,
          awayScore: 2,
          time: '2P 08:14',
          status: 'live',
        },
        {
          id: 'hockey-scheduled',
          homeTeam: 'Atletic Verde',
          awayTeam: 'Sportul Albastru',
          homeMark: 'V',
          awayMark: 'A',
          homeScore: null,
          awayScore: null,
          time: '19:30',
          status: 'scheduled',
        },
        {
          id: 'hockey-finished',
          homeTeam: 'Dunărea HC',
          awayTeam: 'Olimpic City',
          homeMark: 'D',
          awayMark: 'O',
          homeScore: 4,
          awayScore: 2,
          time: 'Final',
          status: 'finished',
        },
      ],
    },
  ],
};

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
  imports: [DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
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
  protected readonly isFootball = computed(() => this.selectedSport() === 'football');
  private readonly request = computed(() => ({
    sport: this.selectedSport(),
    date: this.dateInputValue(),
    attempt: this.reload(),
  }));
  protected readonly schedule = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ sport, date }) =>
        sport === 'football'
          ? this.fixturesService.getFixtures(date, this.browserTimeZone).pipe(
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
            )
          : of<ScheduleState>({ loading: false, error: null, data: null }),
      ),
    ),
    { initialValue: { loading: true, error: null, data: null } as ScheduleState },
  );
  protected readonly competitions = computed<ScheduleCompetition[]>(() => {
    if (!this.isFootball()) {
      return DEMO_COMPETITIONS[this.selectedSport()];
    }
    return (this.schedule().data?.competitions ?? []).map((competition) => ({
      ...competition,
      matches: competition.matches.map((match) => this.mapFixture(match)),
    }));
  });

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

  private mapFixture(match: Fixture): ScheduleMatch {
    const live = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(match.status);
    let status: ScheduleMatchStatus = 'unknown';
    if (live) status = 'live';
    else if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(match.status)) status = 'finished';
    else if (['NS', 'TBD'].includes(match.status)) status = 'scheduled';
    else if (match.status === 'PST') status = 'postponed';
    else if (['CANC', 'ABD'].includes(match.status)) status = 'cancelled';
    else if (['SUSP', 'INT'].includes(match.status)) status = 'interrupted';

    const time =
      match.status === 'HT'
        ? 'Pauză'
        : live
          ? match.elapsed === null
            ? 'LIVE'
            : `${match.elapsed}'`
          : match.status === 'TBD'
            ? 'Ora neconfirmată'
            : new Intl.DateTimeFormat('ro-RO', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: this.browserTimeZone,
              }).format(new Date(match.kickoff));
    return {
      ...match,
      time,
      status,
      homeMark: match.homeTeam.slice(0, 3).toUpperCase(),
      awayMark: match.awayTeam.slice(0, 3).toUpperCase(),
    };
  }

  protected statusLabel(status: ScheduleMatchStatus): string {
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
