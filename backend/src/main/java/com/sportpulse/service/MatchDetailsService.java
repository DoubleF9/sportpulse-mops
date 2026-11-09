package com.sportpulse.service;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.sportpulse.client.ApiSportsClient;
import com.sportpulse.dto.fixtures.FixturesResponse;
import com.sportpulse.dto.fixtures.MatchDetailsResponse;
import com.sportpulse.model.CachedMatchDetails;
import com.sportpulse.repository.CachedMatchDetailsRepository;

@Service
public class MatchDetailsService {

	private static final Logger log = LoggerFactory.getLogger(MatchDetailsService.class);
	private static final Set<String> LIVE_STATUSES = Set.of("1H", "HT", "2H", "ET", "BT", "P", "LIVE",
			"Q1", "Q2", "Q3", "Q4", "OT", "P1", "P2", "P3", "PT");
	private final ApiSportsClient client;
	private final CachedMatchDetailsRepository repository;

	public MatchDetailsService(ApiSportsClient client, CachedMatchDetailsRepository repository) {
		this.client = client;
		this.repository = repository;
	}

	public MatchDetailsResponse getMatch(String sport, long id) {
		String key = "match:" + sport + ":" + id;
		CachedMatchDetails cached = null;
		try {
			cached = repository.findById(key).orElse(null);
		} catch (Exception e) {
			log.warn("Match details cache could not be read");
		}
		if (cached != null && cached.expiresAt().isAfter(Instant.now())) return cached.data();

		MatchDetailsResponse response;
		try {
			var body = client.get(sport, sport.equals("football") ? "/fixtures" : "/games", Map.of("id", id));
			var matches = body.path("response");
			if (matches.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Meciul nu a fost găsit.");
			var match = matches.get(0);
			long returnedId = sport.equals("football") ? match.path("fixture").path("id").asLong() : match.path("id").asLong();
			if (returnedId != id) throw new IllegalStateException("Provider returned a different match");
			response = map(sport, id, match);
		} catch (Exception e) {
			if (e instanceof ResponseStatusException error && error.getStatusCode().value() == 404) throw error;
			if (cached != null) return cached.data().asStale();
			if (e instanceof ResponseStatusException error) throw error;
			log.warn("Match details request failed ({})", e.getClass().getSimpleName());
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Detaliile meciului nu sunt disponibile momentan. Încercați din nou mai târziu.");
		}
		try {
			long ttlSeconds = LIVE_STATUSES.contains(response.match().status()) ? 60 : 3600;
			repository.save(new CachedMatchDetails(key, response, Instant.now().plusSeconds(ttlSeconds)));
		} catch (Exception e) {
			log.warn("Match details cache could not be saved");
		}
		return response;
	}

	private MatchDetailsResponse map(String sport, long id, JsonNode data) {
		boolean football = sport.equals("football");
		var fixture = football ? data.path("fixture") : data;
		var home = data.path("teams").path("home");
		var away = data.path("teams").path("away");
		var league = data.path("league");
		var status = fixture.path("status");
		var scores = football ? data.path("goals") : data.path("scores");
		JsonNode homeScore = scores.path("home");
		JsonNode awayScore = scores.path("away");
		Integer halftimeHome = null;
		Integer halftimeAway = null;
		if (football) {
			halftimeHome = number(data.path("score").path("halftime").path("home"));
			halftimeAway = number(data.path("score").path("halftime").path("away"));
		} else if (sport.equals("basketball")) {
			halftimeHome = firstHalf(homeScore);
			halftimeAway = firstHalf(awayScore);
			homeScore = homeScore.path("total");
			awayScore = awayScore.path("total");
		}
		var timestamp = fixture.path("timestamp");
		String clock = text(status.path("timer"));
		if (clock == null) clock = text(fixture.path("timer"));
		var match = new FixturesResponse.Match(id, teamName(home), teamName(away), text(home.path("logo")),
				text(away.path("logo")), number(homeScore), number(awayScore),
				timestamp.isIntegralNumber() ? Instant.ofEpochSecond(timestamp.longValue()) : null,
				text(status.path("short")) == null ? "UNKNOWN" : text(status.path("short")),
				number(status.path("elapsed")), clock);
		var venue = fixture.path("venue");
		String venueName = venue.isObject() ? text(venue.path("name")) : text(venue);
		return new MatchDetailsResponse(sport, match, text(league.path("name")),
				football ? text(league.path("country")) : text(data.path("country").path("name")),
				football ? text(league.path("round")) : text(data.path("week")),
				venueName, text(fixture.path("referee")), halftimeHome, halftimeAway, Instant.now(), false);
	}

	private Integer firstHalf(JsonNode score) {
		Integer first = number(score.path("quarter_1"));
		Integer second = number(score.path("quarter_2"));
		return first == null || second == null ? null : first + second;
	}

	private Integer number(JsonNode value) {
		return value.isIntegralNumber() ? value.intValue() : null;
	}

	private String text(JsonNode value) {
		return value.isValueNode() && !value.isNull() && !value.asText().isBlank() ? value.asText() : null;
	}

	private String teamName(JsonNode team) {
		String name = text(team.path("name"));
		return name == null ? "—" : name;
	}
}
