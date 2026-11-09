package com.sportpulse.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.sportpulse.service.StandingsService;

@WebMvcTest(StandingsController.class)
class StandingsControllerTests {

	@Autowired private MockMvc mvc;
	@MockitoBean private StandingsService service;

	@Test
	void preservesExistingDefaultLeagueAndSeason() throws Exception {
		mvc.perform(get("/api/standings")).andExpect(status().isOk());
		verify(service).getStandings("football", "283", "2023");
	}

	@Test
	void invalidParametersDoNotReachTheProvider() throws Exception {
		for (String query : new String[] { "sport=unknown", "league=abc", "league=0", "season=abc" }) {
			mvc.perform(get("/api/standings?" + query)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(service);
	}

	@Test
	void providerErrorsHaveADisplayableProblemDetail() throws Exception {
		when(service.getStandings("football", "283", "2023"))
				.thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Quota reached"));
		mvc.perform(get("/api/standings")).andExpect(status().isBadGateway())
				.andExpect(jsonPath("$.detail").value("Quota reached"));
	}
}
