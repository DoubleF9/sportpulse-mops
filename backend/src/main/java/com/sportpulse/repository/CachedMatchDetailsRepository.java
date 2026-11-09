package com.sportpulse.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.sportpulse.model.CachedMatchDetails;

public interface CachedMatchDetailsRepository extends MongoRepository<CachedMatchDetails, String> {
}
