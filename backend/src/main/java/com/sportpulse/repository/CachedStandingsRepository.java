package com.sportpulse.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.sportpulse.model.CachedStandings;

public interface CachedStandingsRepository extends MongoRepository<CachedStandings, String> {
}
