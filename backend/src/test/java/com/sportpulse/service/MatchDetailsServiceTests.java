package com.sportpulse.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportpulse.client.ApiSportsClient;
import com.sportpulse.dto.fixtures.FixturesResponse;
import com.sportpulse.dto.fixtures.MatchDetailsResponse;
import com.sportpulse.model.CachedMatchDetails;
import com.sportpulse.repository.CachedMatchDetailsRepository;

class MatchDetailsServiceTests {

	private final ApiSportsClient client = mock(ApiSportsClient.class);
	private final CachedMatchDetailsRepository repository = mock(CachedMatchDetailsRepository.class);
	private final ObjectMapper mapper = new ObjectMapper();
	private MatchDetailsService service;

	@BeforeEach
	void setUp() {
		service = new MatchDetailsService(client, repository);
	}

	@Test
	void mapsFootballDetailsIncludingZeroHalftimeAndCachesThem() throws Exception {
		when(client.get("football", "/fixtures", Map.of("id", 42L))).thenReturn(mapper.readTree(football()));
		var data = service.getMatch("football", 42);
		assertEquals("Home", data.match().homeTeam());
		assertEquals(2, data.match().homeScore());
		assertEquals(0, data.halftimeHome());
		assertEquals(0, data.halftimeAway());
		assertEquals("Arena", data.venue());
		assertEquals("Referee", data.referee());
		assertEquals("Round 1", data.round());
		verify(repository).save(argThat(entry -> entry.id().equals("match:football:42") && entry.data().equals(data)));
	}

	@ParameterizedTest
	@ValueSource(strings = { "basketball", "hockey" })
	void mapsBasketballAndHockeyScoreFormatsAndMissingVenue(String sport) throws Exception {
		String scores = sport.equals("basketball")
				? "{\"home\":{\"quarter_1\":20,\"quarter_2\":18,\"total\":81},\"away\":{\"quarter_1\":19,\"quarter_2\":22,\"total\":79}}"
				: "{\"home\":3,\"away\":2}";
		var body = mapper.readTree("""
				{"response":[{"id":42,"timestamp":1794175200,"status":{"short":"FT"},
				 "league":{"name":"League"},"country":{"name":"USA"},"teams":{"home":{"name":"Home"},"away":{"name":"Away"}},
				 "scores":%s,"venue":null}]}
				""".formatted(scores));
		when(client.get(sport, "/games", Map.of("id", 42L))).thenReturn(body);
		var data = service.getMatch(sport, 42);
		assertEquals(sport.equals("basketball") ? 81 : 3, data.match().homeScore());
		assertEquals("USA", data.country());
		assertNull(data.venue());
		assertNull(data.referee());
		if (sport.equals("basketball")) {
			assertEquals(38, data.halftimeHome());
			assertEquals(41, data.halftimeAway());
		} else assertNull(data.halftimeHome());
	}

	@Test
	void preservesMissingInformationInsteadOfInventingScoresOrKickoff() throws Exception {
		when(client.get("football", "/fixtures", Map.of("id", 42L)))
				.thenReturn(mapper.readTree("{\"response\":[{\"fixture\":{\"id\":42}}]}"));
		var data = service.getMatch("football", 42);
		assertNull(data.match().kickoff());
		assertNull(data.match().homeScore());
		assertNull(data.halftimeHome());
		assertEquals("—", data.match().homeTeam());
		assertEquals("UNKNOWN", data.match().status());
	}

	@ParameterizedTest
	@ValueSource(strings = { "football", "basketball", "hockey" })
	void readsOnlyTheRequestedSportsCacheWithoutCallingTheProvider(String sport) throws Exception {
		var data = cachedData(sport);
		String key = "match:" + sport + ":42";
		when(repository.findById(key)).thenReturn(Optional.of(new CachedMatchDetails(key, data, Instant.now().plusSeconds(60))));
		assertSame(data, service.getMatch(sport, 42));
		verifyNoInteractions(client);
	}

	@Test
	void fallsBackToExpiredDataOnAnOutageAndPreservesItsTimestamp() throws Exception {
		var data = cachedData("football");
		when(repository.findById("match:football:42")).thenReturn(Optional.of(new CachedMatchDetails("match:football:42", data, Instant.now().minusSeconds(1))));
		when(client.get(anyString(), anyString(), anyMap())).thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "quota"));
		var result = service.getMatch("football", 42);
		assertTrue(result.stale());
		assertEquals(data.updatedAt(), result.updatedAt());
		verify(repository, never()).save(any());
	}

	@Test
	void aDefinitiveNotFoundDoesNotServeAnOldCachedMatch() throws Exception {
		when(repository.findById("match:football:42")).thenReturn(Optional.of(new CachedMatchDetails("match:football:42", cachedData("football"), Instant.now().minusSeconds(1))));
		when(client.get(anyString(), anyString(), anyMap())).thenReturn(mapper.readTree("{\"response\":[]}"));
		assertEquals(404, assertThrows(ResponseStatusException.class, () -> service.getMatch("football", 42)).getStatusCode().value());
		verify(repository, never()).save(any());
	}

	@Test
	void rejectsAnUnexpectedMatchIdAndDoesNotCacheIt() throws Exception {
		when(client.get(anyString(), anyString(), anyMap())).thenReturn(mapper.readTree(football().replace("\"id\":42", "\"id\":43")));
		assertEquals(502, assertThrows(ResponseStatusException.class, () -> service.getMatch("football", 42)).getStatusCode().value());
		verify(repository, never()).save(any());
	}

	@Test
	void returnsFreshProviderDataDuringCacheFailure() throws Exception {
		when(repository.findById(anyString())).thenThrow(new IllegalStateException());
		when(repository.save(any())).thenThrow(new IllegalStateException());
		when(client.get(anyString(), anyString(), anyMap())).thenReturn(mapper.readTree(football()));
		assertEquals("Home", service.getMatch("football", 42).match().homeTeam());
	}

	@Test
	void liveDetailsHaveAShorterCacheLifetime() throws Exception {
		when(client.get(anyString(), anyString(), anyMap())).thenReturn(mapper.readTree(football().replace("\"FT\"", "\"1H\"")));
		service.getMatch("football", 42);
		verify(repository).save(argThat(entry -> entry.expiresAt().isAfter(Instant.now().plusSeconds(50))
				&& entry.expiresAt().isBefore(Instant.now().plusSeconds(65))));
	}

	private MatchDetailsResponse cachedData(String sport) {
		var match = new FixturesResponse.Match(42, "Home", "Away", null, null, 0, 0, Instant.now(), "FT", 90, null);
		return new MatchDetailsResponse(sport, match, "League", null, null, null, null, null, null, Instant.now().minusSeconds(7200), false);
	}

	private String football() {
		return """
				{"response":[{"fixture":{"id":42,"timestamp":1794175200,"referee":"Referee","venue":{"name":"Arena"},"status":{"short":"FT","elapsed":90}},
				 "league":{"name":"League","country":"Romania","round":"Round 1"},
				 "teams":{"home":{"name":"Home","logo":"home.png"},"away":{"name":"Away","logo":"away.png"}},
				 "goals":{"home":2,"away":1},"score":{"halftime":{"home":0,"away":0}}}]}
				""";
	}
}
