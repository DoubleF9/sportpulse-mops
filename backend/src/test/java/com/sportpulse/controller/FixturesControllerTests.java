package com.sportpulse.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.sportpulse.dto.fixtures.FixturesResponse;
import com.sportpulse.service.FixturesService;

@WebMvcTest(FixturesController.class)
class FixturesControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private FixturesService service;

	@Test
	void forwardsDateAndTimezoneAndSerializesMetadata() throws Exception {
		when(service.getFixtures("football", LocalDate.of(2026, 11, 9), ZoneId.of("Europe/Bucharest")))
				.thenReturn(new FixturesResponse(List.of(), Instant.parse("2026-11-08T22:00:00Z"), false));
		mockMvc.perform(get("/api/fixtures").param("date", "2026-11-09").param("timezone", "Europe/Bucharest"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.competitions").isEmpty())
				.andExpect(jsonPath("$.updatedAt").value("2026-11-08T22:00:00Z"))
				.andExpect(jsonPath("$.stale").value(false));
	}

	@Test
	void returnsAnActionableProviderError() throws Exception {
		when(service.getFixtures("football", LocalDate.of(2026, 11, 9), ZoneId.of("UTC")))
				.thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Planul API-Sports nu permite accesul la data selectată."));
		mockMvc.perform(get("/api/fixtures").param("date", "2026-11-09"))
				.andExpect(status().isBadGateway())
				.andExpect(jsonPath("$.detail").value("Planul API-Sports nu permite accesul la data selectată."));
	}

	@Test
	void rejectsInvalidDateOrTimezoneBeforeCallingProvider() throws Exception {
		mockMvc.perform(get("/api/fixtures").param("date", "2026-11-09").param("sport", "invalid"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/fixtures").param("date", "invalid")).andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/fixtures").param("date", "2026-11-09").param("timezone", "invalid"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/fixtures")).andExpect(status().isBadRequest());
		verifyNoInteractions(service);
	}

	@Test
	void forwardsTheSelectedSport() throws Exception {
		when(service.getFixtures("hockey", LocalDate.of(2026, 11, 9), ZoneId.of("UTC")))
				.thenReturn(new FixturesResponse(List.of(), Instant.now(), false));
		mockMvc.perform(get("/api/fixtures").param("date", "2026-11-09").param("sport", "hockey"))
				.andExpect(status().isOk());
		verify(service).getFixtures("hockey", LocalDate.of(2026, 11, 9), ZoneId.of("UTC"));
	}
}
