package com.sportpulse.dto.apisports;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ApiSportsGamesResponse(JsonNode errors, List<Game> response) {

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Game(long id, long timestamp, String stage, String week, String timer,
			Status status, Country country, League league, Teams teams, JsonNode scores) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Status(@JsonProperty("short") String code, String timer) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Country(String name) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record League(int id, String name, String logo) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Teams(Team home, Team away) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Team(String name, String logo) {
	}
}
