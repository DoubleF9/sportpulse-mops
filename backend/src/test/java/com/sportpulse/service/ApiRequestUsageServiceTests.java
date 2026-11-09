package com.sportpulse.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import com.sportpulse.model.ApiRequestUsage;

class ApiRequestUsageServiceTests {

	private final MongoTemplate mongo = mock(MongoTemplate.class);

	@ParameterizedTest
	@ValueSource(strings = { "football", "basketball", "hockey" })
	void atomicallyIncrementsOnePersistentDocumentPerSportAndUtcDay(String sport) {
		var now = Instant.parse("2026-11-09T23:59:59Z");
		new ApiRequestUsageService(mongo, Clock.fixed(now, ZoneOffset.UTC)).recordRequest(sport);
		var query = ArgumentCaptor.forClass(Query.class);
		var update = ArgumentCaptor.forClass(Update.class);
		verify(mongo).upsert(query.capture(), update.capture(), eq(ApiRequestUsage.class));
		assertEquals("2026-11-09:" + sport, query.getValue().getQueryObject().getString("_id"));
		var changes = update.getValue().getUpdateObject();
		assertEquals(1L, changes.get("$inc", org.bson.Document.class).get("requests"));
		assertEquals(sport, changes.get("$setOnInsert", org.bson.Document.class).getString("sport"));
		assertEquals("2026-11-09", changes.get("$setOnInsert", org.bson.Document.class).getString("date"));
		assertEquals(now, changes.get("$set", org.bson.Document.class).get("lastRequestedAt"));
		verifyNoMoreInteractions(mongo);
	}

	@Test
	void midnightStartsANewDocumentWithoutResettingThePreviousDay() {
		for (String time : new String[] { "2026-11-09T23:59:59Z", "2026-11-10T00:00:00Z" }) {
			new ApiRequestUsageService(mongo, Clock.fixed(Instant.parse(time), ZoneOffset.UTC)).recordRequest("football");
		}
		var query = ArgumentCaptor.forClass(Query.class);
		verify(mongo, times(2)).upsert(query.capture(), any(Update.class), eq(ApiRequestUsage.class));
		assertEquals("2026-11-09:football", query.getAllValues().get(0).getQueryObject().getString("_id"));
		assertEquals("2026-11-10:football", query.getAllValues().get(1).getQueryObject().getString("_id"));
	}

	@Test
	void anAccountingFailureDoesNotBlockTheProviderRequest() {
		when(mongo.upsert(any(Query.class), any(Update.class), eq(ApiRequestUsage.class))).thenThrow(new IllegalStateException());
		assertDoesNotThrow(() -> new ApiRequestUsageService(mongo).recordRequest("football"));
	}
}
