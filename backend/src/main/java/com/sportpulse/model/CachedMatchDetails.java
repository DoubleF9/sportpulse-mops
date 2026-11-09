package com.sportpulse.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.sportpulse.dto.fixtures.MatchDetailsResponse;

@Document(collection = "cached_match_details")
public record CachedMatchDetails(@Id String id, MatchDetailsResponse data, Instant expiresAt) {
}
