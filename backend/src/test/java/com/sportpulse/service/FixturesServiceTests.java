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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
		when(config.getHost("football")).thenReturn("v3.football.api-sports.io");
		when(config.getApiKey()).thenReturn("test-key");
	}

	@Test
	void sportsWithTheSameDateUseDifferentCaches() {
		FixturesResponse response = new FixturesResponse(List.of(), Instant.now(), false);
		for (String sport : List.of("football", "basketball", "hockey")) {
			String key = "fixtures:" + sport + ":2026-11-09:Europe/Bucharest";
			when(repository.findById(key)).thenReturn(Optional.of(new CachedFixtures(key, response, Instant.now().plusSeconds(60))));
			assertSame(response, service.getFixtures(sport, DATE, ZONE));
		}
		server.verify();
	}

	@ParameterizedTest
	@ValueSource(strings = { "basketball", "hockey" })
	void mapsOtherSportsScoresClocksAndGroups(String sport) {
		when(config.getHost(sport)).thenReturn("v1." + sport + ".api-sports.io");
		String scores = sport.equals("basketball") ? "{\"home\":{\"total\":81},\"away\":{\"total\":null}}"
				: "{\"home\":3,\"away\":null}";
		String status = sport.equals("basketball") ? "Q4" : "P3";
		String body = """
				{"errors":[],"response":[{"id":42,"timestamp":1794247200,
				 "league":{"id":12,"name":"League","logo":"league.png"},"country":{"name":"USA"},
				 "status":{"short":"%s","timer":"04:32"},"teams":{"home":{"name":"Home","logo":null},
				 "away":{"name":"Away","logo":null}},"scores":%s}]}
				""".formatted(status, scores);
		if (sport.equals("hockey")) {
			body = body.replace("\"timer\":\"04:32\"", "\"timer\":null")
					.replace("\"id\":42", "\"id\":42,\"timer\":\"04:32\"");
		}
		server.expect(requestTo("https://v1." + sport + ".api-sports.io/games?date=2026-11-09&timezone=Europe/Bucharest"))
				.andExpect(header("x-apisports-key", "test-key")).andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
		var response = service.getFixtures(sport, DATE, ZONE);
		var competition = response.competitions().getFirst();
		assertEquals("USA", competition.country());
		var match = competition.matches().getFirst();
		assertEquals(sport.equals("basketball") ? 81 : 3, match.homeScore());
		assertNull(match.awayScore());
		assertEquals(status, match.status());
		assertEquals("04:32", match.clock());
		verify(repository).save(argThat(entry -> entry.id().startsWith("fixtures:" + sport + ":")));
		server.verify();
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

		FixturesResponse response = service.getFixtures("football", DATE, ZONE);

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
		assertSame(cached, service.getFixtures("football", DATE, ZONE));
		verify(repository, never()).save(any());
		server.verify();
	}

	@Test
	void fallsBackToExpiredDataWhenProviderReturnsQuotaErrorWithHttp200() {
		FixturesResponse cached = new FixturesResponse(List.of(), Instant.now().minusSeconds(7200), false);
		when(repository.findById(KEY)).thenReturn(Optional.of(new CachedFixtures(KEY, cached, Instant.now().minusSeconds(60))));
		expectResponse("{\"errors\":{\"requests\":\"Daily limit reached\"},\"response\":[]}");
		FixturesResponse response = service.getFixtures("football", DATE, ZONE);
		assertTrue(response.stale());
		assertEquals(cached.updatedAt(), response.updatedAt());
		verify(repository, never()).save(any());
	}

	@Test
	void includesTheProvidersAllowedDateRangeWithoutExposingArbitraryText() {
		expectResponse("{\"errors\":{\"plan\":\"Free plans do not have access to this date, try from 2026-11-08 to 2026-11-10.\"},\"response\":[]}");
		var error = assertThrows(ResponseStatusException.class, () -> service.getFixtures("football", DATE, ZONE));
		assertEquals("Planul API-Sports nu permite accesul la data selectată. Date disponibile: 08.11.2026 – 10.11.2026.", error.getReason());
		verify(repository, never()).save(any());
	}

	@Test
	void reportsProviderFailureInsteadOfCachingAnEmptySchedule() {
		expectResponse("{\"errors\":{\"plan\":\"Unavailable season\"},\"response\":[]}");
		var error = assertThrows(ResponseStatusException.class, () -> service.getFixtures("football", DATE, ZONE));
		assertEquals(502, error.getStatusCode().value());
		assertEquals("Planul API-Sports nu permite accesul la data selectată.", error.getReason());
		verify(repository, never()).save(any());
	}

	@Test
	void validEmptyDayIsCachedAndCacheOutageDoesNotHideProviderData() {
		when(repository.findById(KEY)).thenThrow(new IllegalStateException("cache unavailable"));
		when(repository.save(any())).thenThrow(new IllegalStateException("cache unavailable"));
		expectResponse("{\"errors\":[],\"response\":[]}");
		assertTrue(service.getFixtures("football", DATE, ZONE).competitions().isEmpty());
		verify(repository).save(any());
	}

	@Test
	void dateAndTimezoneHaveSeparateCacheEntries() {
		FixturesResponse response = new FixturesResponse(List.of(), Instant.now(), false);
		String key = "fixtures:football:2026-11-10:UTC";
		when(repository.findById(key)).thenReturn(Optional.of(new CachedFixtures(key, response, Instant.now().plusSeconds(60))));
		assertSame(response, service.getFixtures("football", DATE.plusDays(1), ZoneId.of("UTC")));
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
