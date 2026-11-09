package com.sportpulse.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportpulse.client.ApiSportsClient;
import com.sportpulse.dto.apifootball.ApiFootballFixturesResponse;
import com.sportpulse.dto.apisports.ApiSportsGamesResponse;
import com.sportpulse.dto.fixtures.FixturesResponse;
import com.sportpulse.model.CachedFixtures;
import com.sportpulse.repository.CachedFixturesRepository;

@Service
public class FixturesService {

	private static final Logger log = LoggerFactory.getLogger(FixturesService.class);
	private final ApiSportsClient client;
	private final CachedFixturesRepository cacheRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public FixturesService(ApiSportsClient client, CachedFixturesRepository cacheRepository) {
		this.client = client;
		this.cacheRepository = cacheRepository;
	}

	public FixturesResponse getFixtures(String sport, LocalDate date, ZoneId timezone) {
		String cacheKey = "fixtures:" + sport + ":" + date + ":" + timezone.getId();
		CachedFixtures cached = null;
		try {
			cached = cacheRepository.findById(cacheKey).orElse(null);
		} catch (Exception e) {
			log.warn("Fixture cache could not be read");
		}
		if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
			return cached.data();
		}

		FixturesResponse response;
		try {
			response = fetchFixtures(sport, date, timezone);
		} catch (Exception e) {
			log.warn("Fixture provider request failed ({})", e.getClass().getSimpleName());
			if (cached != null) {
				return new FixturesResponse(cached.data().competitions(), cached.data().updatedAt(), true);
			}
			if (e instanceof ResponseStatusException providerError) {
				throw providerError;
			}
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Programul meciurilor nu este disponibil momentan. Încercați din nou mai târziu.");
		}
		try {
			cacheRepository.save(new CachedFixtures(cacheKey, response, Instant.now().plus(1, ChronoUnit.HOURS)));
		} catch (Exception e) {
			log.warn("Fixture cache could not be saved");
		}
		return response;
	}

	private FixturesResponse fetchFixtures(String sport, LocalDate date, ZoneId timezone) throws Exception {
		Map<String, Object> parameters = new LinkedHashMap<>();
		parameters.put("date", date);
		parameters.put("timezone", timezone.getId());
		var root = client.get(sport, sport.equals("football") ? "/fixtures" : "/games", parameters);
		if (!sport.equals("football")) {
			return mapGames(objectMapper.treeToValue(root, ApiSportsGamesResponse.class), sport);
		}
		var body = objectMapper.treeToValue(root, ApiFootballFixturesResponse.class);
		return mapFootball(body);
	}

	private FixturesResponse mapFootball(ApiFootballFixturesResponse body) {
		Map<Integer, List<ApiFootballFixturesResponse.Match>> leagues = new LinkedHashMap<>();
		body.response().stream().sorted(Comparator.comparingLong(match -> match.fixture().timestamp()))
				.forEach(match -> leagues.computeIfAbsent(match.league().id(), key -> new ArrayList<>()).add(match));
		List<FixturesResponse.Competition> competitions = new ArrayList<>();
		for (var matches : leagues.values()) {
			var league = matches.getFirst().league();
			var rows = matches.stream().map(this::mapMatch).toList();
			competitions.add(new FixturesResponse.Competition(league.id(), league.name(), league.country(),
					league.logo(), league.round(), rows));
		}
		return new FixturesResponse(competitions, Instant.now(), false);
	}

	private FixturesResponse.Match mapMatch(ApiFootballFixturesResponse.Match match) {
		var fixture = match.fixture();
		var home = match.teams().home();
		var away = match.teams().away();
		return new FixturesResponse.Match(fixture.id(), home.name(), away.name(), home.logo(), away.logo(),
				match.goals() == null ? null : match.goals().home(), match.goals() == null ? null : match.goals().away(),
				Instant.ofEpochSecond(fixture.timestamp()), fixture.status().code(), fixture.status().elapsed(), null);
	}

	private FixturesResponse mapGames(ApiSportsGamesResponse body, String sport) {
		Map<Integer, List<ApiSportsGamesResponse.Game>> leagues = new LinkedHashMap<>();
		body.response().stream().sorted(Comparator.comparingLong(ApiSportsGamesResponse.Game::timestamp))
				.forEach(game -> leagues.computeIfAbsent(game.league().id(), key -> new ArrayList<>()).add(game));
		List<FixturesResponse.Competition> competitions = new ArrayList<>();
		for (var games : leagues.values()) {
			var first = games.getFirst();
			var league = first.league();
			var matches = games.stream().map(game -> mapGame(game, sport)).toList();
			competitions.add(new FixturesResponse.Competition(league.id(), league.name(),
					first.country() == null ? null : first.country().name(), league.logo(),
					first.week() == null ? first.stage() : first.week(), matches));
		}
		return new FixturesResponse(competitions, Instant.now(), false);
	}

	private FixturesResponse.Match mapGame(ApiSportsGamesResponse.Game game, String sport) {
		var home = game.teams().home();
		var away = game.teams().away();
		var scores = game.scores();
		return new FixturesResponse.Match(game.id(), home.name(), away.name(), home.logo(), away.logo(),
				score(scores, "home", sport), score(scores, "away", sport), Instant.ofEpochSecond(game.timestamp()),
				game.status().code(), null, game.status().timer() == null ? game.timer() : game.status().timer());
	}

	private Integer score(JsonNode scores, String side, String sport) {
		if (scores == null) return null;
		var value = scores.path(side);
		if (sport.equals("basketball")) value = value.path("total");
		return value.isIntegralNumber() ? value.intValue() : null;
	}
}
