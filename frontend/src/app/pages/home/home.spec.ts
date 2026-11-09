import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';

import { FixturesResponse } from '../../models/fixture';
import { Sport } from '../../models/sport';
import { SportSelectionService } from '../../services/sport-selection.service';
import { Home } from './home';
import { of } from 'rxjs';
import { HealthService } from '../../services/health.service';
import { TimezoneService } from '../../services/timezone.service';

describe('Home schedule', () => {
  let fixture: ComponentFixture<Home>;
  let http: HttpTestingController;
  let sport: ReturnType<typeof signal<Sport>>;

  beforeEach(() => {
    sport = signal<Sport>('football');
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SportSelectionService, useValue: { selectedSport: sport } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    http.expectOne('/api/health').flush({ status: 'UP' });
  });

  afterEach(() => http.verify());

  function scheduleRequest() {
    return http.expectOne((request) => request.url === '/api/fixtures');
  }

  function body(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function chooseDay(index: number) {
    body().querySelectorAll<HTMLButtonElement>('.date-btn')[index].click();
    TestBed.tick();
  }

  function response(): FixturesResponse {
    return {
      updatedAt: '2026-11-09T09:00:00Z',
      stale: false,
      competitions: [
        {
          id: 283,
          name: 'Liga I',
          country: 'România',
          logo: null,
          round: 'Etapa 16',
          matches: [
            {
              id: 1,
              homeTeam: 'Home FC',
              awayTeam: 'Away FC',
              homeLogo: null,
              awayLogo: null,
              homeScore: null,
              awayScore: null,
              kickoff: '2026-11-09T18:30:00Z',
              status: 'NS',
              elapsed: null,
            },
          ],
        },
      ],
    };
  }

  function filterResponse(): FixturesResponse {
    const base = response().competitions[0];
    const match = base.matches[0];
    return {
      ...response(),
      competitions: [
        {
          ...base,
          matches: [match, { ...match, id: 2, homeTeam: 'Live FC', status: '1H', elapsed: 12 }],
        },
        {
          ...base,
          id: 284,
          name: 'Cupa',
          matches: [{ ...match, id: 3, homeTeam: 'Cup FC', status: 'FT' }],
        },
        {
          ...base,
          id: 140,
          name: 'La Liga',
          country: 'Spania',
          matches: [{ ...match, id: 4, homeTeam: 'Spain FC', status: '1H', elapsed: 20 }],
        },
        { ...base, id: 0, name: 'Empty', country: 'No games', matches: [] },
      ],
    };
  }

  function selectCountry(value: string) {
    const select = body().querySelector<HTMLSelectElement>('#match-country')!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('filters by country and multiple competitions without making new HTTP requests', () => {
    scheduleRequest().flush(filterResponse());
    fixture.detectChanges();
    expect(body().querySelector('#match-country')).not.toBeNull();
    expect(body().querySelector('#match-country')!.textContent).not.toContain('No games');
    selectCountry('România');
    expect(body().textContent).not.toContain('Spain FC');
    body().querySelector<HTMLInputElement>('#competition-283')!.click();
    fixture.detectChanges();
    expect(body().textContent).not.toContain('Cup FC');
    body().querySelector<HTMLInputElement>('#competition-284')!.click();
    fixture.detectChanges();
    expect(body().querySelectorAll('.match-row').length).toBe(3);
    selectCountry('Spania');
    expect(body().querySelectorAll('.match-row').length).toBe(1);
    expect(body().textContent).toContain('Spain FC');
    http.expectNone((request) => request.url === '/api/fixtures');
  });

  it('combines Live with league selection and resets all filters', () => {
    scheduleRequest().flush(filterResponse());
    fixture.detectChanges();
    selectCountry('România');
    body().querySelector<HTMLInputElement>('#competition-283')!.click();
    fixture.detectChanges();
    body().querySelector<HTMLInputElement>('#live-only')!.click();
    fixture.detectChanges();
    expect(body().querySelectorAll('.match-row').length).toBe(1);
    expect(body().textContent).toContain('Live FC');
    expect(body().textContent).not.toContain('Home FC');
    body().querySelector<HTMLButtonElement>('.reset-filters')!.click();
    fixture.detectChanges();
    expect(body().querySelectorAll('.match-row').length).toBe(4);
    expect(body().querySelector<HTMLInputElement>('#live-only')!.checked).toBe(false);
    http.expectNone((request) => request.url === '/api/fixtures');
  });

  it('keeps valid filters on a new day and clears selections absent from its schedule', () => {
    scheduleRequest().flush(filterResponse());
    fixture.detectChanges();
    selectCountry('România');
    body().querySelector<HTMLInputElement>('#competition-283')!.click();
    fixture.detectChanges();
    chooseDay(2);
    scheduleRequest().flush(filterResponse());
    TestBed.tick();
    expect(body().querySelector<HTMLSelectElement>('#match-country')!.value).toBe('România');
    expect(body().querySelector<HTMLInputElement>('#competition-283')!.checked).toBe(true);
    chooseDay(4);
    scheduleRequest().flush({ ...response(), competitions: [filterResponse().competitions[2]] });
    TestBed.tick();
    expect(body().querySelector<HTMLSelectElement>('#match-country')!.value).toBe('');
    expect(body().textContent).toContain('Spain FC');
  });

  it('distinguishes no matching live games from an empty day and resets sport-specific filters', () => {
    scheduleRequest().flush(filterResponse());
    fixture.detectChanges();
    selectCountry('România');
    body().querySelector<HTMLInputElement>('#competition-284')!.click();
    fixture.detectChanges();
    body().querySelector<HTMLInputElement>('#live-only')!.click();
    fixture.detectChanges();
    expect(body().textContent).toContain('Niciun meci nu corespunde filtrelor selectate.');
    expect(body().textContent).not.toContain('Nu există meciuri pentru această zi.');
    sport.set('hockey');
    TestBed.tick();
    const hockey = filterResponse();
    hockey.competitions[0].matches[1].status = 'P2';
    scheduleRequest().flush(hockey);
    TestBed.tick();
    expect(body().querySelector<HTMLSelectElement>('#match-country')!.value).toBe('');
    expect(body().querySelector<HTMLInputElement>('#live-only')!.checked).toBe(false);
    expect(body().querySelectorAll('.match-row').length).toBe(4);
    body().querySelector<HTMLInputElement>('#live-only')!.click();
    fixture.detectChanges();
    expect(body().querySelectorAll('.match-row').length).toBe(1);
    expect(body().textContent).toContain('Live FC');
    http.expectNone((request) => request.url === '/api/fixtures');
  });

  it('requests today in the browser timezone and renders real fixtures without the demo label', () => {
    const request = scheduleRequest();
    const calendar = body().querySelector<HTMLInputElement>('input[type=date]')!;
    expect(request.request.params.get('date')).toBe(calendar.value);
    expect(request.request.params.get('timezone')).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    expect(body().textContent).toContain('Se încarcă');
    request.flush(response());
    fixture.detectChanges();
    expect(body().textContent).toContain('Home FC');
    expect(body().textContent).toContain('Liga I');
    expect(body().querySelector('.demo-tag')).toBeNull();
    expect(body().querySelectorAll('.match-result span')[0].textContent).toBe('–');
    expect(body().querySelector<HTMLAnchorElement>('a.match-row')?.getAttribute('href')).toBe(
      '/matches/football/1',
    );
  });

  it('loads the selected date and cancels a superseded request', () => {
    const original = scheduleRequest();
    chooseDay(4); // Tomorrow
    expect(original.cancelled).toBe(true);
    const tomorrow = scheduleRequest();
    expect(tomorrow.request.params.get('date')).toBe(
      body().querySelector<HTMLInputElement>('input[type=date]')!.value,
    );
    expect(tomorrow.request.params.get('date')).not.toBe(original.request.params.get('date'));
    tomorrow.flush({ ...response(), competitions: [] });
    fixture.detectChanges();
    expect(body().textContent).toContain('Nu există meciuri pentru această zi.');
    expect(body().querySelector('.match-row')).toBeNull();
  });

  it('shows an error and retries the same date successfully', () => {
    const failed = scheduleRequest();
    failed.flush({}, { status: 502, statusText: 'Bad Gateway' });
    fixture.detectChanges();
    expect(body().querySelector('[role=alert]')).not.toBeNull();
    body().querySelector<HTMLButtonElement>('.retry-btn')!.click();
    TestBed.tick();
    const retried = scheduleRequest();
    expect(retried.request.params.get('date')).toBe(failed.request.params.get('date'));
    retried.flush(response());
    fixture.detectChanges();
    expect(body().querySelector('[role=alert]')).toBeNull();
    expect(body().textContent).toContain('Home FC');
  });

  it.each(['basketball', 'hockey'] as const)(
    'loads real %s matches and keeps date navigation working',
    (selected) => {
      const pending = scheduleRequest();
      sport.set(selected);
      TestBed.tick();
      expect(pending.cancelled).toBe(true);
      const loaded = scheduleRequest();
      expect(loaded.request.params.get('sport')).toBe(selected);
      loaded.flush(response());
      fixture.detectChanges();
      expect(body().textContent).toContain('Home FC');
      expect(body().textContent).not.toContain('Previzualizare');
      chooseDay(4);
      const tomorrow = scheduleRequest();
      expect(tomorrow.request.params.get('sport')).toBe(selected);
      expect(tomorrow.request.params.get('date')).not.toBe(loaded.request.params.get('date'));
      tomorrow.flush({ ...response(), competitions: [] });
    },
  );

  it('explains when the provider plan does not allow the selected date', () => {
    scheduleRequest().flush(
      { detail: 'Planul API-Sports nu permite accesul la data selectată.' },
      { status: 502, statusText: 'Bad Gateway' },
    );
    fixture.detectChanges();
    expect(body().querySelector('[role=alert]')?.textContent).toContain('Planul API-Sports');
    expect(body().textContent).not.toContain('Nu există meciuri pentru această zi.');
  });

  it('uses the date picker within its supported interval and ignores out-of-range dates', () => {
    scheduleRequest().flush(response());
    const calendar = body().querySelector<HTMLInputElement>('input[type=date]')!;
    calendar.value = calendar.max;
    calendar.dispatchEvent(new Event('change'));
    TestBed.tick();
    const selected = scheduleRequest();
    expect(selected.request.params.get('date')).toBe(calendar.max);
    selected.flush(response());
    const outside = new Date(`${calendar.max}T12:00:00`);
    outside.setDate(outside.getDate() + 1);
    calendar.value = `${outside.getFullYear()}-${String(outside.getMonth() + 1).padStart(2, '0')}-${String(outside.getDate()).padStart(2, '0')}`;
    calendar.dispatchEvent(new Event('change'));
    TestBed.tick();
    http.expectNone((request) => request.url === '/api/fixtures');
  });

  it('opens the date picker from the Calendar button and keeps a visible keyboard fallback', () => {
    scheduleRequest().flush(response());
    const calendar = body().querySelector<HTMLInputElement>('input[type=date]')!;
    const showPicker = vi.fn();
    Object.defineProperty(calendar, 'showPicker', { configurable: true, value: showPicker });
    const button = body().querySelector<HTMLButtonElement>('button.calendar-btn');
    expect(button).not.toBeNull();
    button!.click();
    expect(showPicker).toHaveBeenCalledOnce();
    expect(calendar.classList.contains('calendar-input')).toBe(true);
    Object.defineProperty(calendar, 'showPicker', {
      configurable: true,
      value: () => {
        throw new DOMException();
      },
    });
    button!.click();
    expect(document.activeElement).toBe(calendar);
  });

  it('distinguishes postponed, halftime and cancelled matches and displays stale-data warnings', () => {
    const data = response();
    const match = data.competitions[0].matches[0];
    data.stale = true;
    data.competitions[0].matches = ['PST', 'HT', 'CANC'].map((status, index) => ({
      ...match,
      id: index,
      status,
      elapsed: status === 'HT' ? 45 : null,
    }));
    scheduleRequest().flush(data);
    fixture.detectChanges();
    expect(body().textContent).toContain('AMÂNAT');
    expect(body().textContent).toContain('Pauză');
    expect(body().textContent).toContain('ANULAT');
    expect(body().textContent).toContain('ultimele date salvate');
  });
});

describe('Home calendar in the preferred timezone', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-07-01T21:30:00Z'));
    localStorage.clear();
    localStorage.setItem('sportpulse.timezone', 'UTC');
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: HealthService, useValue: { getHealth: () => of({ status: 'UP' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.useRealTimers();
  });

  function create() {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture;
  }

  function request() {
    return http.expectOne((request) => request.url === '/api/fixtures');
  }

  it.each(['football', 'basketball', 'hockey'] as const)(
    'requests the new local day and timezone for %s and cancels the previous request',
    (sport) => {
      localStorage.setItem('sportpulse.selectedSport', sport);
      const fixture = create();
      const pending = request();
      expect(pending.request.params.get('date')).toBe('2026-07-01');
      expect(pending.request.params.get('timezone')).toBe('UTC');
      TestBed.inject(TimezoneService).selectTimezone('Europe/Bucharest');
      TestBed.tick();
      expect(pending.cancelled).toBe(true);
      const selected = request();
      expect(selected.request.params.get('date')).toBe('2026-07-02');
      expect(selected.request.params.get('timezone')).toBe('Europe/Bucharest');
      expect(selected.request.params.get('sport')).toBe(sport);
      selected.flush({
        competitions: [
          {
            id: 1,
            name: 'League',
            country: 'World',
            round: null,
            logo: null,
            matches: [
              {
                id: 1,
                homeTeam: 'Home',
                awayTeam: 'Away',
                homeLogo: null,
                awayLogo: null,
                homeScore: null,
                awayScore: null,
                kickoff: '2026-07-01T21:00:00Z',
                status: 'NS',
                elapsed: null,
              },
            ],
          },
        ],
        updatedAt: '2026-07-01T21:00:00Z',
        stale: false,
      });
      fixture.detectChanges();
      const calendar = fixture.nativeElement.querySelector('input[type=date]') as HTMLInputElement;
      expect(calendar.value).toBe('2026-07-02');
      expect(calendar.min).toBe('2026-06-25');
      expect(calendar.max).toBe('2026-07-09');
      expect(fixture.nativeElement.querySelector('.match-time').textContent).toContain('00:00');
      expect(fixture.nativeElement.textContent).toContain('Europe/Bucharest');
    },
  );

  it('preserves an explicitly selected calendar day when the timezone changes', () => {
    const fixture = create();
    request().flush({ competitions: [], updatedAt: '2026-07-01T21:00:00Z', stale: false });
    const calendar = fixture.nativeElement.querySelector('input[type=date]') as HTMLInputElement;
    calendar.value = '2026-07-03';
    calendar.dispatchEvent(new Event('change'));
    TestBed.tick();
    request().flush({ competitions: [], updatedAt: '2026-07-01T21:00:00Z', stale: false });
    TestBed.inject(TimezoneService).selectTimezone('Pacific/Honolulu');
    TestBed.tick();
    const selected = request();
    expect(selected.request.params.get('date')).toBe('2026-07-03');
    expect(selected.request.params.get('timezone')).toBe('Pacific/Honolulu');
    selected.flush({ competitions: [], updatedAt: '2026-07-01T21:00:00Z', stale: false });
    fixture.detectChanges();
    expect(calendar.value).toBe('2026-07-03');
  });

  it('navigates the full seven-day window across a daylight-saving transition', () => {
    vi.setSystemTime(new Date('2026-03-28T22:30:00Z'));
    localStorage.setItem('sportpulse.timezone', 'Europe/Bucharest');
    const fixture = create();
    const initial = request();
    expect(initial.request.params.get('date')).toBe('2026-03-29');
    initial.flush({ competitions: [], updatedAt: '2026-03-28T22:00:00Z', stale: false });
    const calendar = fixture.nativeElement.querySelector('input[type=date]') as HTMLInputElement;
    expect(calendar.min).toBe('2026-03-22');
    expect(calendar.max).toBe('2026-04-05');
    calendar.value = calendar.max;
    calendar.dispatchEvent(new Event('change'));
    TestBed.tick();
    const lastDay = request();
    expect(lastDay.request.params.get('date')).toBe('2026-04-05');
    lastDay.flush({ competitions: [], updatedAt: '2026-03-28T22:00:00Z', stale: false });
  });

  it('advances the today schedule once when local midnight passes', () => {
    vi.setSystemTime(new Date('2026-11-09T23:59:30Z'));
    create();
    request().flush({ competitions: [], updatedAt: '2026-11-09T23:00:00Z', stale: false });
    vi.advanceTimersByTime(60_000);
    TestBed.tick();
    const tomorrow = request();
    expect(tomorrow.request.params.get('date')).toBe('2026-11-10');
    tomorrow.flush({ competitions: [], updatedAt: '2026-11-10T00:00:00Z', stale: false });
    vi.advanceTimersByTime(60_000);
    TestBed.tick();
    http.expectNone((request) => request.url === '/api/fixtures');
  });
});
