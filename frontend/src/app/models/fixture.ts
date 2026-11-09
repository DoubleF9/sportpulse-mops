import { Sport } from './sport';

export interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string | null;
  status: string;
  elapsed: number | null;
  clock?: string | null;
}

export interface FixtureCompetition {
  id: number;
  name: string;
  country: string;
  logo: string | null;
  round: string | null;
  matches: Fixture[];
}

export interface FixturesResponse {
  competitions: FixtureCompetition[];
  updatedAt: string;
  stale: boolean;
}

export interface MatchDetailsResponse {
  sport: Sport;
  match: Fixture;
  competition: string | null;
  country: string | null;
  round: string | null;
  venue: string | null;
  referee: string | null;
  halftimeHome: number | null;
  halftimeAway: number | null;
  updatedAt: string;
  stale: boolean;
}
