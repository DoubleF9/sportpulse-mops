import { Fixture } from './fixture';
import { Sport } from './sport';

export type MatchStatus =
  'live' | 'scheduled' | 'finished' | 'postponed' | 'cancelled' | 'interrupted' | 'unknown';

const LIVE_STATUSES: Record<Sport, readonly string[]> = {
  football: ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'],
  basketball: ['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'BT', 'HT'],
  hockey: ['P1', 'P2', 'P3', 'OT', 'PT', 'BT'],
};

export function isLiveMatch(status: string, sport: Sport): boolean {
  return LIVE_STATUSES[sport].includes(status);
}

export function matchStatus(status: string, sport: Sport): MatchStatus {
  if (isLiveMatch(status, sport)) return 'live';
  if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'AOT', 'AP', 'AW'].includes(status)) return 'finished';
  if (['NS', 'TBD'].includes(status)) return 'scheduled';
  if (['PST', 'POST'].includes(status)) return 'postponed';
  if (['CANC', 'ABD'].includes(status)) return 'cancelled';
  if (['SUSP', 'INT', 'INTR'].includes(status)) return 'interrupted';
  return 'unknown';
}

export function presentFixture(match: Fixture, sport: Sport, timezone: string) {
  const status = matchStatus(match.status, sport);
  let time = new Intl.DateTimeFormat('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(match.kickoff));
  if (match.status === 'TBD') time = 'Ora neconfirmată';
  else if (['HT', 'BT'].includes(match.status)) time = 'Pauză';
  else if (status === 'live') {
    if (sport === 'football') time = match.elapsed === null ? 'LIVE' : `${match.elapsed}'`;
    else {
      const phases: Record<string, string> = {
        Q1: 'S1',
        Q2: 'S2',
        Q3: 'S3',
        Q4: 'S4',
        P1: 'R1',
        P2: 'R2',
        P3: 'R3',
        OT: 'Prelungiri',
        PT: 'Penaltiuri',
      };
      time = [phases[match.status] ?? 'LIVE', match.clock].filter(Boolean).join(' ');
    }
  }
  return {
    ...match,
    time,
    status,
    homeMark: match.homeTeam.slice(0, 3).toUpperCase(),
    awayMark: match.awayTeam.slice(0, 3).toUpperCase(),
  };
}
