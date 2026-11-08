export interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string;
  status: string;
  elapsed: number | null;
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
