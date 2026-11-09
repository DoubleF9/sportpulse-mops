import { Fixture } from './fixture';
import { isLiveMatch, presentFixture } from './match-presentation';

const fixture: Fixture = {
  id: 1,
  homeTeam: 'Home',
  awayTeam: 'Away',
  homeLogo: null,
  awayLogo: null,
  homeScore: null,
  awayScore: null,
  kickoff: '2026-11-08T22:30:00Z',
  status: 'NS',
  elapsed: null,
};

describe('sport-specific match presentation', () => {
  it('renders basketball quarters and hockey periods using their clocks', () => {
    expect(
      presentFixture({ ...fixture, status: 'Q4', clock: '04:32' }, 'basketball', 'UTC').time,
    ).toBe('S4 04:32');
    expect(presentFixture({ ...fixture, status: 'P3', clock: '08:14' }, 'hockey', 'UTC').time).toBe(
      'R3 08:14',
    );
    expect(isLiveMatch('Q4', 'football')).toBe(false);
  });

  it('handles overtime, postponed and interrupted games', () => {
    expect(presentFixture({ ...fixture, status: 'AOT' }, 'basketball', 'UTC').status).toBe(
      'finished',
    );
    expect(presentFixture({ ...fixture, status: 'POST' }, 'hockey', 'UTC').status).toBe(
      'postponed',
    );
    expect(presentFixture({ ...fixture, status: 'INTR' }, 'hockey', 'UTC').status).toBe(
      'interrupted',
    );
    expect(presentFixture({ ...fixture, status: 'AW' }, 'hockey', 'UTC').status).toBe('finished');
  });

  it('renders local kickoff times across midnight and daylight saving changes', () => {
    expect(presentFixture(fixture, 'football', 'Europe/Bucharest').time).toBe('00:30');
    expect(
      presentFixture(
        { ...fixture, kickoff: '2026-07-01T21:00:00Z' },
        'football',
        'Europe/Bucharest',
      ).time,
    ).toBe('00:00');
  });
});
