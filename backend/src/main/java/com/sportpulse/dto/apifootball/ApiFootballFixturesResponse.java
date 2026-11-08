package com.sportpulse.dto.apifootball;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ApiFootballFixturesResponse(JsonNode errors, List<Match> response) {

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Match(Fixture fixture, League league, Teams teams, Goals goals) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Fixture(long id, long timestamp, Status status) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Status(@JsonProperty("short") String code, Integer elapsed) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record League(int id, String name, String country, String logo, String round) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Teams(Team home, Team away) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Team(String name, String logo) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Goals(Integer home, Integer away) {
	}
}
