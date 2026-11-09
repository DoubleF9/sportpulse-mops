import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';

import { routes } from '../../app.routes';
import { MatchDetailsResponse } from '../../models/fixture';
import { SportSelectionService } from '../../services/sport-selection.service';
import { TimezoneService } from '../../services/timezone.service';
import { MatchDetails } from './match-details';

describe('Match details', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatchDetails],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes, withComponentInputBinding()),
        { provide: SportSelectionService, useValue: { selectSport: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function create(sport = 'football', id = '42'): ComponentFixture<MatchDetails> {
    const fixture = TestBed.createComponent(MatchDetails);
    fixture.componentRef.setInput('sport', sport);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }

  function response(): MatchDetailsResponse {
    return {
      sport: 'football',
      match: {
        id: 42,
        homeTeam: 'Home FC',
        awayTeam: 'Away FC',
        homeLogo: null,
        awayLogo: null,
        homeScore: 0,
        awayScore: 1,
        kickoff: '2026-11-09T18:30:00Z',
        status: 'FT',
        elapsed: 90,
      },
      competition: 'Liga I',
      country: 'România',
      round: 'Etapa 16',
      venue: 'Arena',
      referee: 'Referee',
      halftimeHome: 0,
      halftimeAway: 0,
      updatedAt: '2026-11-09T20:00:00Z',
      stale: false,
    };
  }

  it('renders real details, including zero scores and halftime values', () => {
    const fixture = create();
    expect(fixture.nativeElement.textContent).toContain('Se încarcă');
    http.expectOne('/api/matches/football/42').flush(response());
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Home FC');
    expect(element.textContent).toContain('Arena');
    expect(element.textContent).toContain('Referee');
    expect(element.querySelector('.score')!.textContent!.replace(/\s/g, '')).toBe('0–1');
    expect(element.querySelector('.match-info')!.textContent).toContain('0 – 0');
    expect(element.querySelector<HTMLAnchorElement>('.back-link')!.getAttribute('href')).toBe('/');
  });

  it('uses placeholders for missing information and marks stale details', () => {
    const fixture = create();
    const data = response();
    data.venue = data.referee = data.round = data.country = null;
    data.match.kickoff = null;
    data.match.homeScore = data.match.awayScore = null;
    data.halftimeHome = data.halftimeAway = null;
    data.stale = true;
    http.expectOne('/api/matches/football/42').flush(data);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ultimele date salvate');
    const values = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.match-info dd')];
    expect(
      values.filter((value) => value.textContent!.trim() === '—').length,
    ).toBeGreaterThanOrEqual(4);
    expect(fixture.nativeElement.textContent).not.toContain('Invalid Date');
    expect(fixture.nativeElement.querySelector('.score').textContent.replace(/\s/g, '')).toBe(
      '—–—',
    );
  });

  it('uses sport-specific live clocks and does not invent a hockey halftime score', () => {
    const fixture = create('hockey');
    const data = response();
    data.sport = 'hockey';
    data.match.status = 'P3';
    data.match.clock = '08:14';
    data.match.elapsed = null;
    http.expectOne('/api/matches/hockey/42').flush(data);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('R3 08:14');
    expect(fixture.nativeElement.textContent).not.toContain('Scor la pauză');
    expect(TestBed.inject(SportSelectionService).selectSport).toHaveBeenCalledWith('hockey');
  });

  it('updates kickoff date and time without fetching the same match again', () => {
    const fixture = create();
    const data = response();
    data.match.kickoff = '2026-07-01T21:00:00Z';
    http.expectOne('/api/matches/football/42').flush(data);
    const timezone = TestBed.inject(TimezoneService);
    timezone.selectTimezone('UTC');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('01.07.2026 21:00');
    timezone.selectTimezone('Europe/Bucharest');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('02.07.2026 00:00');
    expect(fixture.nativeElement.textContent).toContain('Europe/Bucharest');
    timezone.selectTimezone('');
    http.expectNone((request) => request.url.startsWith('/api/matches/'));
  });

  it('handles not-found responses and retries successfully', () => {
    const fixture = create();
    http.expectOne('/api/matches/football/42').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Meciul nu a fost găsit.');
    fixture.nativeElement.querySelector('button').click();
    TestBed.tick();
    http.expectOne('/api/matches/football/42').flush(response());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Home FC');
  });

  it('shows a provider restriction message', () => {
    const fixture = create();
    http
      .expectOne('/api/matches/football/42')
      .flush(
        { detail: 'Planul API-Sports nu permite accesul.' },
        { status: 502, statusText: 'Bad Gateway' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Planul API-Sports',
    );
  });

  it.each([
    ['unknown', '42'],
    ['football', 'abc'],
    ['hockey', '0'],
  ])('rejects invalid route %s/%s without an API request', (sport, id) => {
    const fixture = create(sport, id);
    expect(fixture.nativeElement.textContent).toContain('identificator de meci invalid');
    http.expectNone((request) => request.url.startsWith('/api/matches/'));
  });

  it('cancels the previous request when navigating to a different match', () => {
    const fixture = create();
    const pending = http.expectOne('/api/matches/football/42');
    fixture.componentRef.setInput('id', '43');
    TestBed.tick();
    expect(pending.cancelled).toBe(true);
    http
      .expectOne('/api/matches/football/43')
      .flush({ ...response(), match: { ...response().match, id: 43 } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Home FC');
  });

  it('supports direct sport-specific links and redirects legacy football links', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/matches/hockey/42', MatchDetails);
    http.expectOne('/api/matches/hockey/42').flush({ ...response(), sport: 'hockey' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Home FC');
    await harness.navigateByUrl('/matches/42', MatchDetails);
    http.expectOne('/api/matches/football/42').flush(response());
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/matches/football/42');
  });
});
