package com.sportpulse.dto.fixtures;

import java.time.Instant;
import java.util.List;

public record FixturesResponse(List<Competition> competitions, Instant updatedAt, boolean stale) {

	public record Competition(int id, String name, String country, String logo, String round, List<Match> matches) {
	}

	public record Match(long id, String homeTeam, String awayTeam, String homeLogo, String awayLogo,
			Integer homeScore, Integer awayScore, Instant kickoff, String status, Integer elapsed, String clock) {
	}
}
