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

import com.sportpulse.service.MatchDetailsService;

@WebMvcTest(MatchDetailsController.class)
class MatchDetailsControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private MatchDetailsService service;

	@Test
	void routesTheIdAndSportToTheService() throws Exception {
		mockMvc.perform(get("/api/matches/hockey/42")).andExpect(status().isOk());
		verify(service).getMatch("hockey", 42);
	}

	@Test
	void rejectsInvalidIdsAndSportsWithoutCallingTheProvider() throws Exception {
		for (String path : new String[] { "/api/matches/unknown/42", "/api/matches/football/0", "/api/matches/hockey/-1", "/api/matches/football/abc" }) {
			mockMvc.perform(get(path)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(service);
	}

	@Test
	void exposesTheNotFoundReason() throws Exception {
		when(service.getMatch("football", 42)).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Meciul nu a fost găsit."));
		mockMvc.perform(get("/api/matches/football/42")).andExpect(status().isNotFound())
				.andExpect(jsonPath("$.detail").value("Meciul nu a fost găsit."));
	}
}
