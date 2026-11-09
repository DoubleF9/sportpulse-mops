package com.sportpulse.service;

import java.time.Clock;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.sportpulse.model.ApiRequestUsage;

@Service
public class ApiRequestUsageService {

	private static final Logger log = LoggerFactory.getLogger(ApiRequestUsageService.class);
	private final MongoTemplate mongo;
	private final Clock clock;

	@Autowired
	public ApiRequestUsageService(MongoTemplate mongo) {
		this(mongo, Clock.systemUTC());
	}

	ApiRequestUsageService(MongoTemplate mongo, Clock clock) {
		this.mongo = mongo;
		this.clock = clock;
	}

	public void recordRequest(String sport) {
		String date = LocalDate.now(clock).toString();
		var query = Query.query(Criteria.where("_id").is(date + ":" + sport));
		var update = new Update().inc("requests", 1L)
				.setOnInsert("sport", sport).setOnInsert("date", date)
				.set("lastRequestedAt", clock.instant());
		try {
			// Atomic increment on a unique daily ID; cache reads never reach this method.
			mongo.upsert(query, update, ApiRequestUsage.class);
		} catch (Exception e) {
			// Accounting must not hide a successful provider response during a database outage.
			log.warn("API request count could not be recorded for {} ({})", sport, e.getClass().getSimpleName());
		}
	}
}
