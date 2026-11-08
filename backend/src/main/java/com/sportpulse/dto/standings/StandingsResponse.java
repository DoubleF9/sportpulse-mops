package com.sportpulse.dto.standings;

import java.util.List;

public record StandingsResponse(
		List<StandingsTable> standings
) {
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
