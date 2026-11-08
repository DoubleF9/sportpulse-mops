package com.sportpulse.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.sportpulse.model.CachedStandings;

public interface CachedStandingsRepository extends MongoRepository<CachedStandings, String> {
	Optional<CachedStandings> findByCacheKey(String cacheKey);
}
