package com.sportpulse.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportpulse.client.ApiSportsClient;
import com.sportpulse.dto.standings.StandingsResponse;
import com.sportpulse.model.CachedStandings;
import com.sportpulse.repository.CachedStandingsRepository;

class StandingsServiceTests {

	private static final String KEY = "standings:football:283:2023";
	private final ApiSportsClient client = mock(ApiSportsClient.class);
	private final CachedStandingsRepository repository = mock(CachedStandingsRepository.class);
	private final StandingsService service = new StandingsService(client, repository);
	private final ObjectMapper mapper = new ObjectMapper();
	private final StandingsResponse saved = new StandingsResponse(List.of(), Instant.parse("2026-11-08T12:00:00Z"), false);

	@Test
	void freshCacheDoesNotCallOrCountAnApiRequest() {
		when(repository.findById(KEY)).thenReturn(Optional.of(new CachedStandings(KEY, saved, Instant.now().plusSeconds(60))));
		assertSame(saved, service.getStandings("football", "283", "2023"));
		verifyNoInteractions(client);
	}

	@Test
	void quotaFailureReturnsLastGoodDataWithItsOriginalTimestamp() throws Exception {
		when(repository.findById(KEY)).thenReturn(Optional.of(new CachedStandings(KEY, saved, Instant.now().minusSeconds(1))));
		when(client.get(anyString(), anyString(), anyMap())).thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "quota"));
		var response = service.getStandings("football", "283", "2023");
		assertTrue(response.stale());
		assertEquals(saved.updatedAt(), response.updatedAt());
		verify(repository, never()).save(any());
	}

	@Test
	void noCachedDataProducesAnErrorInsteadOfCachingAnEmptyTable() throws Exception {
		when(client.get(anyString(), anyString(), anyMap())).thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "quota"));
		assertEquals(502, assertThrows(ResponseStatusException.class, () -> service.getStandings("football", "283", "2023")).getStatusCode().value());
		verify(repository, never()).save(any());
	}

	@Test
	void mapsValidDataAndCachesItForSixHours() throws Exception {
		when(client.get("football", "/standings", Map.of("league", "283", "season", "2023"))).thenReturn(mapper.readTree("""
			{"response":[{"league":{"name":"Liga I","country":"Romania","standings":[[
			{"rank":1,"team":{"name":"FCSB"},"points":64,"goalsDiff":25,"group":"Regular Season","form":"WWDWL",
			 "all":{"played":30,"win":19,"draw":7,"lose":4,"goals":{"for":53,"against":28}}}
			]]}}]}
			"""));
		var response = service.getStandings("football", "283", "2023");
		var row = response.standings().getFirst().rows().getFirst();
		assertEquals("FCSB", row.team());
		assertEquals(64, row.points());
		assertEquals(53, row.goalsFor());
		assertFalse(response.stale());
		verify(repository).save(argThat(entry -> entry.id().equals(KEY) && entry.data().equals(response)
				&& entry.expiresAt().isAfter(Instant.now().plusSeconds(21590))
				&& entry.expiresAt().isBefore(Instant.now().plusSeconds(21610))));
	}

	@Test
	void aValidEmptyProviderResponseCanBeCached() throws Exception {
		when(client.get(anyString(), anyString(), anyMap())).thenReturn(mapper.readTree("{\"response\":[]}"));
		assertTrue(service.getStandings("football", "283", "2023").standings().isEmpty());
		verify(repository).save(any());
	}

	@Test
	void incompleteProviderDataDoesNotReplaceTheCache() throws Exception {
		when(repository.findById(KEY)).thenReturn(Optional.of(new CachedStandings(KEY, saved, Instant.now().minusSeconds(1))));
		when(client.get(anyString(), anyString(), anyMap())).thenReturn(mapper.readTree("{\"response\":[{\"league\":null}]}"));
		assertTrue(service.getStandings("football", "283", "2023").stale());
		verify(repository, never()).save(any());
	}

	@Test
	void cacheOutagesDoNotHideValidProviderData() throws Exception {
		when(repository.findById(anyString())).thenThrow(new IllegalStateException());
		when(repository.save(any())).thenThrow(new IllegalStateException());
		when(client.get(anyString(), anyString(), anyMap())).thenReturn(mapper.readTree("{\"response\":[]}"));
		assertFalse(service.getStandings("football", "283", "2023").stale());
	}

	@ParameterizedTest
	@ValueSource(strings = { "basketball", "hockey" })
	void unsupportedStandingsAreExplicitAndDoNotCallTheApi(String sport) {
		assertEquals(501, assertThrows(ResponseStatusException.class, () -> service.getStandings(sport, "116", "2023")).getStatusCode().value());
		verifyNoInteractions(client, repository);
	}
}
