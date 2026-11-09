import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { FixturesResponse } from '../../models/fixture';
import { Sport } from '../../models/sport';
import { SportSelectionService } from '../../services/sport-selection.service';
import { Home } from './home';

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
