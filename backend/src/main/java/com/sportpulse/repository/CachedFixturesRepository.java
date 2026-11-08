package com.sportpulse.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.sportpulse.model.CachedFixtures;

public interface CachedFixturesRepository extends MongoRepository<CachedFixtures, String> {
}
