package com.sportpulse.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.sportpulse.dto.standings.StandingsResponse;

// A separate collection avoids legacy TTL indexes deleting the fallback data.
@Document(collection = "cached_standings_responses")
public record CachedStandings(@Id String id, StandingsResponse data, Instant expiresAt) {
}
