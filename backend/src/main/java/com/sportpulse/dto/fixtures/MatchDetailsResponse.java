package com.sportpulse.dto.fixtures;

import java.time.Instant;

public record MatchDetailsResponse(String sport, FixturesResponse.Match match, String competition,
		String country, String round, String venue, String referee, Integer halftimeHome, Integer halftimeAway,
		Instant updatedAt, boolean stale) {

	public MatchDetailsResponse asStale() {
		return new MatchDetailsResponse(sport, match, competition, country, round, venue, referee,
				halftimeHome, halftimeAway, updatedAt, true);
	}
}
