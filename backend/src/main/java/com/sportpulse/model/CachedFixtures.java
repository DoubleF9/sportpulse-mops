package com.sportpulse.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.sportpulse.dto.fixtures.FixturesResponse;

// Expired entries are retained so an upstream outage can fall back to the last successful response.
@Document(collection = "cached_fixtures")
public record CachedFixtures(@Id String id, FixturesResponse data, Instant expiresAt) {
}
