package com.sportpulse.dto.standings;

import java.util.List;
import java.time.Instant;

public record StandingsResponse(
		List<StandingsTable> standings,
		Instant updatedAt,
		boolean stale
) {
	public StandingsResponse asStale() {
		return new StandingsResponse(standings, updatedAt, true);
	}
	public record StandingsTable(
			String name,
			String country,
			String group,
			List<StandingRow> rows
	) {
	}

	public record StandingRow(
			int position,
			String team,
			String mark,
			int played,
			int won,
			int drawn,
			int lost,
			int goalsFor,
			int goalsAgainst,
			int goalDiff,
			int points,
			List<String> form,
			String zone
	) {
	}
}
