package com.sportpulse.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.sportpulse.config.ApiSportsConfig;
import com.sportpulse.dto.fixtures.FixturesResponse;
import com.sportpulse.model.CachedFixtures;
import com.sportpulse.repository.CachedFixturesRepository;

class FixturesServiceTests {

	private static final LocalDate DATE = LocalDate.of(2026, 11, 9);
	private static final ZoneId ZONE = ZoneId.of("Europe/Bucharest");
	private static final String KEY = "fixtures:football:2026-11-09:Europe/Bucharest";
	private final CachedFixturesRepository repository = mock(CachedFixturesRepository.class);
	private final ApiSportsConfig config = mock(ApiSportsConfig.class);
	private MockRestServiceServer server;
	private FixturesService service;

	@BeforeEach
	void setUp() {
		RestTemplate restTemplate = new RestTemplate();
		server = MockRestServiceServer.createServer(restTemplate);
		service = new FixturesService(restTemplate, config, repository);
		when(config.getFootballHost()).thenReturn("v3.football.api-sports.io");
		when(config.getApiKey()).thenReturn("test-key");
	}

	@Test
	void groupsAndSortsFixturesAndPreservesUnknownScores() {
		expectResponse("""
				{"errors":[],"response":[
				  %s,
				  %s,
				  %s
				]}
				""".formatted(match(2, 283, 1794250800, "null"), match(3, 39, 1794254400, "2"),
						match(1, 283, 1794247200, "0")));

		FixturesResponse response = service.getFixtures(DATE, ZONE);

		assertEquals(2, response.competitions().size());
		assertEquals(List.of(1L, 2L), response.competitions().getFirst().matches().stream()
				.map(FixturesResponse.Match::id).toList());
		assertNull(response.competitions().getFirst().matches().get(1).homeScore());
		assertEquals(Instant.ofEpochSecond(1794247200), response.competitions().getFirst().matches().getFirst().kickoff());
		assertFalse(response.stale());
		verify(repository).save(argThat(entry -> entry.id().equals(KEY) && entry.data().equals(response)
				&& entry.expiresAt().isAfter(Instant.now())));
		server.verify();
	}

	@Test
	void usesFreshCacheWithoutCallingProvider() {
		FixturesResponse cached = new FixturesResponse(List.of(), Instant.now(), false);
		when(repository.findById(KEY)).thenReturn(Optional.of(new CachedFixtures(KEY, cached, Instant.now().plusSeconds(60))));
		assertSame(cached, service.getFixtures(DATE, ZONE));
		verify(repository, never()).save(any());
		server.verify();
	}

	@Test
	void fallsBackToExpiredDataWhenProviderReturnsQuotaErrorWithHttp200() {
		FixturesResponse cached = new FixturesResponse(List.of(), Instant.now().minusSeconds(7200), false);
		when(repository.findById(KEY)).thenReturn(Optional.of(new CachedFixtures(KEY, cached, Instant.now().minusSeconds(60))));
		expectResponse("{\"errors\":{\"requests\":\"Daily limit reached\"},\"response\":[]}");
		FixturesResponse response = service.getFixtures(DATE, ZONE);
		assertTrue(response.stale());
		assertEquals(cached.updatedAt(), response.updatedAt());
		verify(repository, never()).save(any());
	}

	@Test
	void reportsProviderFailureInsteadOfCachingAnEmptySchedule() {
		expectResponse("{\"errors\":{\"plan\":\"Unavailable season\"},\"response\":[]}");
		var error = assertThrows(ResponseStatusException.class, () -> service.getFixtures(DATE, ZONE));
		assertEquals(502, error.getStatusCode().value());
		assertEquals("Planul API-Sports nu permite accesul la data selectată.", error.getReason());
		verify(repository, never()).save(any());
	}

	@Test
	void validEmptyDayIsCachedAndCacheOutageDoesNotHideProviderData() {
		when(repository.findById(KEY)).thenThrow(new IllegalStateException("cache unavailable"));
		when(repository.save(any())).thenThrow(new IllegalStateException("cache unavailable"));
		expectResponse("{\"errors\":[],\"response\":[]}");
		assertTrue(service.getFixtures(DATE, ZONE).competitions().isEmpty());
		verify(repository).save(any());
	}

	@Test
	void dateAndTimezoneHaveSeparateCacheEntries() {
		FixturesResponse response = new FixturesResponse(List.of(), Instant.now(), false);
		String key = "fixtures:football:2026-11-10:UTC";
		when(repository.findById(key)).thenReturn(Optional.of(new CachedFixtures(key, response, Instant.now().plusSeconds(60))));
		assertSame(response, service.getFixtures(DATE.plusDays(1), ZoneId.of("UTC")));
		verify(repository).findById(key);
		server.verify();
	}

	private void expectResponse(String body) {
		server.expect(requestTo("https://v3.football.api-sports.io/fixtures?date=2026-11-09&timezone=Europe/Bucharest"))
				.andExpect(header("x-apisports-key", "test-key"))
				.andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
	}

	private String match(int id, int league, long timestamp, String score) {
		return """
				{"fixture":{"id":%d,"timestamp":%d,"status":{"short":"NS","elapsed":null}},
				 "league":{"id":%d,"name":"League","country":"Country","logo":"league.png","round":"Round 1"},
				 "teams":{"home":{"name":"Home","logo":"home.png"},"away":{"name":"Away","logo":"away.png"}},
				 "goals":{"home":%s,"away":null}}
				""".formatted(id, timestamp, league, score);
	}
}
