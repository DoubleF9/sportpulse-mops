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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportpulse.config.ApiSportsConfig;
import com.sportpulse.dto.apifootball.ApiFootballFixturesResponse;
import com.sportpulse.dto.fixtures.FixturesResponse;
import com.sportpulse.model.CachedFixtures;
import com.sportpulse.repository.CachedFixturesRepository;

@Service
public class FixturesService {

	private static final Logger log = LoggerFactory.getLogger(FixturesService.class);
	private final RestTemplate restTemplate;
	private final ApiSportsConfig apiSportsConfig;
	private final CachedFixturesRepository cacheRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public FixturesService(RestTemplate restTemplate, ApiSportsConfig apiSportsConfig,
			CachedFixturesRepository cacheRepository) {
		this.restTemplate = restTemplate;
		this.apiSportsConfig = apiSportsConfig;
		this.cacheRepository = cacheRepository;
	}

	public FixturesResponse getFixtures(LocalDate date, ZoneId timezone) {
		String cacheKey = "fixtures:football:" + date + ":" + timezone.getId();
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
			response = fetchFixtures(date, timezone);
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

	private FixturesResponse fetchFixtures(LocalDate date, ZoneId timezone) throws Exception {
		if (apiSportsConfig.getApiKey() == null || apiSportsConfig.getApiKey().isBlank()) {
			throw new IllegalStateException("API-Sports key is missing");
		}
		var uri = UriComponentsBuilder.newInstance().scheme("https").host(apiSportsConfig.getFootballHost())
				.path("/fixtures").queryParam("date", date).queryParam("timezone", timezone.getId())
				.build().encode().toUri();
		HttpHeaders headers = new HttpHeaders();
		headers.set("x-apisports-key", apiSportsConfig.getApiKey());
		headers.set("Accept", "application/json");
		String raw = restTemplate.exchange(uri, HttpMethod.GET, new HttpEntity<Void>(headers), String.class).getBody();
		if (raw == null) {
			throw new IllegalStateException("Empty provider response");
		}
		var body = objectMapper.readValue(raw, ApiFootballFixturesResponse.class);
		// API-Sports can return HTTP 200 with quota/plan errors. Never cache those as an empty schedule.
		if (body.errors() != null && body.errors().has("plan")) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Planul API-Sports nu permite accesul la data selectată.");
		}
		if (body.errors() != null && body.errors().has("requests")) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Limita de cereri API-Sports a fost atinsă. Încercați din nou mai târziu.");
		}
		if ((body.errors() != null && !body.errors().isEmpty()) || body.response() == null) {
			throw new IllegalStateException("Provider returned an error");
		}
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
				Instant.ofEpochSecond(fixture.timestamp()), fixture.status().code(), fixture.status().elapsed());
	}
}
