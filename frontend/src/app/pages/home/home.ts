import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { SPORTS } from '../../models/sport';
import type { Sport } from '../../models/sport';
import { HealthService } from '../../services/health.service';
import { SportSelectionService } from '../../services/sport-selection.service';

type DemoMatchStatus = 'live' | 'scheduled' | 'finished';

interface DemoMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeMark: string;
  awayMark: string;
  homeScore: number | null;
  awayScore: number | null;
  time: string;
  status: DemoMatchStatus;
}

interface DemoCompetition {
  name: string;
  country: string;
  round: string;
  matches: DemoMatch[];
}

const DEMO_COMPETITIONS: Record<Sport, DemoCompetition[]> = {
  football: [
    {
      name: 'Campionat demonstrativ',
      country: 'România',
      round: 'Etapa 12',
      matches: [
        {
          id: 'football-live',
          homeTeam: 'Clubul Nord',
          awayTeam: 'Clubul Sud',
          homeMark: 'N',
          awayMark: 'S',
          homeScore: 2,
          awayScore: 1,
          time: "67'",
          status: 'live',
        },
        {
          id: 'football-scheduled',
          homeTeam: 'Atletic Verde',
          awayTeam: 'Sportul Albastru',
          homeMark: 'V',
          awayMark: 'A',
          homeScore: null,
          awayScore: null,
          time: '18:30',
          status: 'scheduled',
        },
        {
          id: 'football-finished',
          homeTeam: 'Dunărea FC',
          awayTeam: 'Olimpic City',
          homeMark: 'D',
          awayMark: 'O',
          homeScore: 1,
          awayScore: 0,
          time: 'Final',
          status: 'finished',
        },
      ],
    },
  ],
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
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
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
  protected readonly minDate = dateToInputValue(new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 7));
  protected readonly maxDate = dateToInputValue(new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + 7));
  protected readonly dateInputValue = computed(() => dateToInputValue(this.selectedDate()));
  protected readonly selectedDateLabel = computed(() =>
    new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' }).format(this.selectedDate()),
  );
  protected readonly competitions = computed(() => DEMO_COMPETITIONS[this.selectedSport()]);
  protected readonly browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

  protected onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return;
    }

    const selected = new Date(year, month - 1, day);
    const offset = Math.round((selected.getTime() - this.today.getTime()) / 86_400_000);
    if (offset >= -7 && offset <= 7) {
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

  protected statusLabel(status: DemoMatchStatus): string {
    if (status === 'live') {
      return 'LIVE';
    }
    return status === 'finished' ? 'FINAL' : 'PROGRAMAT';
  }
}
