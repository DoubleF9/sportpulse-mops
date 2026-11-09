import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { HealthService } from '../../services/health.service';
import { SportSelectionService } from '../../services/sport-selection.service';
import { StandingsResponse } from '../../services/standings.service';
import { TimezoneService } from '../../services/timezone.service';
import { Standings } from './standings';

describe('Standings cache and error presentation', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Standings],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HealthService, useValue: { getHealth: () => of({ status: 'UP' }) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  const response = (stale = false): StandingsResponse => ({
    standings: [
      {
        name: 'Liga I',
        country: 'Romania',
        rows: [
          {
            position: 1,
            team: 'FCSB',
            mark: 'FCS',
            played: 30,
            won: 19,
            drawn: 7,
            lost: 4,
            goalsFor: 53,
            goalsAgainst: 28,
            goalDiff: 25,
            points: 64,
            form: ['W'],
          },
        ],
      },
    ],
    updatedAt: '2026-11-09T12:00:00Z',
    stale,
  });

  function create() {
    const fixture = TestBed.createComponent(Standings);
    fixture.detectChanges();
    return fixture;
  }

  it('shows real standings and their update date without demo labels', () => {
    const fixture = create();
    expect(fixture.nativeElement.textContent).toContain('Se încarcă');
    http.expectOne('/api/standings?sport=football').flush(response());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('FCSB');
    expect(fixture.nativeElement.textContent).toContain('Actualizat la 09.11.2026');
    expect(fixture.nativeElement.textContent).toContain('Sezonul 2023');
    expect(fixture.nativeElement.textContent).not.toContain('DEMO');
    expect(fixture.nativeElement.textContent).not.toContain('Previzualizare');
  });

  it('renders separate groups that share the same league name', () => {
    const fixture = create();
    const data = response();
    data.standings = ['Regular Season', 'Championship Round', 'Relegation Round'].map((group) => ({
      ...data.standings[0],
      group,
    }));
    http.expectOne('/api/standings?sport=football').flush(data);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.standings-section').length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Championship Round');
    expect(fixture.nativeElement.textContent).toContain('Relegation Round');
  });

  it('keeps stale rows visible and identifies the saved data', () => {
    const fixture = create();
    http.expectOne('/api/standings?sport=football').flush(response(true));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ultimele date salvate');
    expect(fixture.nativeElement.textContent).toContain('FCSB');
    expect(fixture.nativeElement.textContent).toContain('Actualizat la 09.11.2026');
  });

  it('converts the update timestamp without refetching standings', () => {
    const fixture = create();
    http.expectOne('/api/standings?sport=football').flush(response());
    const timezone = TestBed.inject(TimezoneService);
    timezone.selectTimezone('UTC');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('09.11.2026 12:00');
    timezone.selectTimezone('Asia/Tokyo');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('09.11.2026 21:00');
    http.expectNone((request) => request.url === '/api/standings');
  });

  it('shows quota errors distinctly from an empty competition and retries', () => {
    const fixture = create();
    http
      .expectOne('/api/standings?sport=football')
      .flush(
        { detail: 'Limita de cereri API-Sports a fost atinsă.' },
        { status: 502, statusText: 'Bad Gateway' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain(
      'Limita de cereri',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Nu există date');
    fixture.nativeElement.querySelector('.data-notice button').click();
    TestBed.tick();
    http.expectOne('/api/standings?sport=football').flush(response());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('FCSB');
  });

  it('shows an empty state only for a successful empty response', () => {
    const fixture = create();
    http.expectOne('/api/standings?sport=football').flush({ ...response(), standings: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nu există date de clasament');
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeNull();
  });

  it('cancels old requests and clears the previous sport data', () => {
    const fixture = create();
    const pending = http.expectOne('/api/standings?sport=football');
    TestBed.inject(SportSelectionService).selectSport('hockey');
    TestBed.tick();
    expect(pending.cancelled).toBe(true);
    http
      .expectOne('/api/standings?sport=hockey')
      .flush(
        { detail: 'Clasamentele pentru acest sport nu sunt disponibile încă.' },
        { status: 501, statusText: 'Not Implemented' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('nu sunt disponibile încă');
    expect(fixture.nativeElement.textContent).not.toContain('Sezonul 2023');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });
});
