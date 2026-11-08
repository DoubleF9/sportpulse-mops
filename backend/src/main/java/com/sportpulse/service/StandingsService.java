package com.sportpulse.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportpulse.config.ApiSportsConfig;
import com.sportpulse.dto.apifootball.ApiFootballStandingsResponse;
import com.sportpulse.dto.standings.StandingsResponse;
import com.sportpulse.model.CachedStandings;
import com.sportpulse.repository.CachedStandingsRepository;

@Service
public class StandingsService {

	private final RestTemplate restTemplate;
	private final ApiSportsConfig apiSportsConfig;
	private final CachedStandingsRepository cacheRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public StandingsService(RestTemplate restTemplate, ApiSportsConfig apiSportsConfig,
			CachedStandingsRepository cacheRepository) {
		this.restTemplate = restTemplate;
		this.apiSportsConfig = apiSportsConfig;
		this.cacheRepository = cacheRepository;
	}

	public StandingsResponse getStandings(String sport, String leagueId, String season) {
		String cacheKey = String.format("standings:%s:%s:%s", sport, leagueId, season);
		try {
			var cached = cacheRepository.findByCacheKey(cacheKey);
			if (cached.isPresent() && cached.get().getExpiresAt() != null
					&& cached.get().getExpiresAt().isAfter(Instant.now())) {
				Object data = cached.get().getData();
				if (data instanceof StandingsResponse standingsResponse) {
					return standingsResponse;
				}
			}
		} catch (Exception e) {
			// If cache fails, continue to fetch
		}

		StandingsResponse response = fetchFromApi(sport, leagueId, season);
		try {
			cacheRepository.save(new CachedStandings(cacheKey, sport, leagueId, season, response,
					Instant.now().plus(6, ChronoUnit.HOURS)));
		} catch (Exception e) {
			// Ignore cache save failures
		}
		return response;
	}

	private StandingsResponse fetchFromApi(String sport, String leagueId, String season) {
		if ("football".equalsIgnoreCase(sport)) {
			return fetchFootballStandings(leagueId, season);
		}
		return new StandingsResponse(List.of());
	}

	private StandingsResponse fetchFootballStandings(String leagueId, String season) {
		String url = String.format("https://%s/standings?league=%s&season=%s", apiSportsConfig.getFootballHost(),
				leagueId, season);

		HttpHeaders headers = new HttpHeaders();
		String apiKey = apiSportsConfig.getApiKey();
		if (apiKey != null && !apiKey.isBlank()) {
			headers.set("x-apisports-key", apiKey);
		}
		headers.set("Accept", "application/json");

		HttpEntity<Void> entity = new HttpEntity<>(headers);
		try {
			ResponseEntity<String> rawResponse = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
			if (rawResponse.getBody() == null) {
				return new StandingsResponse(List.of());
			}
			ApiFootballStandingsResponse body = objectMapper.readValue(rawResponse.getBody(), ApiFootballStandingsResponse.class);
			if (body == null || body.response() == null || body.response().isEmpty()) {
				return new StandingsResponse(List.of());
			}

			List<StandingsResponse.StandingsTable> tables = new ArrayList<>();
			for (var wrapper : body.response()) {
				var league = wrapper.league();
				if (league == null || league.standings() == null) {
					continue;
				}
				for (List<ApiFootballStandingsResponse.Standing> groupStandings : league.standings()) {
					List<StandingsResponse.StandingRow> rows = groupStandings.stream()
							.map(this::mapStanding)
							.collect(Collectors.toList());
					String groupName = groupStandings.isEmpty() ? null : groupStandings.get(0).group();
					tables.add(new StandingsResponse.StandingsTable(league.name(), league.country(), groupName,
							rows));
				}
			}
			return new StandingsResponse(tables);
		} catch (Exception e) {
			return new StandingsResponse(List.of());
		}
	}

	private StandingsResponse.StandingRow mapStanding(ApiFootballStandingsResponse.Standing standing) {
		String teamName = standing.team() != null ? standing.team().name() : "";
		String mark = teamName.length() >= 3 ? teamName.substring(0, 3).toUpperCase() : teamName.toUpperCase();
		int played = standing.all() != null ? standing.all().played() : 0;
		int won = standing.all() != null ? standing.all().win() : 0;
		int drawn = standing.all() != null ? standing.all().draw() : 0;
		int lost = standing.all() != null ? standing.all().lose() : 0;
		int goalsFor = standing.all() != null && standing.all().goals() != null ? standing.all().goals().forGoals() : 0;
		int goalsAgainst = standing.all() != null && standing.all().goals() != null ? standing.all().goals().against() : 0;
		int goalDiff = standing.goalsDiff();
		int points = standing.points();
		List<String> form = parseForm(standing.form());
		String zone = mapZone(standing.description());
		return new StandingsResponse.StandingRow(standing.rank(), teamName, mark, played, won, drawn, lost, goalsFor,
				goalsAgainst, goalDiff, points, form, zone);
	}

	private List<String> parseForm(String form) {
		if (form == null || form.isBlank()) {
			return List.of();
		}
		List<String> result = new ArrayList<>();
		for (char c : form.toCharArray()) {
			if (c == 'W' || c == 'w') {
				result.add("W");
			} else if (c == 'D' || c == 'd') {
				result.add("D");
			} else if (c == 'L' || c == 'l') {
				result.add("L");
			}
			if (result.size() >= 5) {
				break;
			}
		}
		return result;
	}

	private String mapZone(String description) {
		if (description == null) {
			return null;
		}
		String desc = description.toLowerCase();
		if (desc.contains("champions") || desc.contains("promotion") || desc.contains("1st")) {
			return "champions";
		}
		if (desc.contains("europa") || desc.contains("conference") || desc.contains("uefa")) {
			return "europa";
		}
		if (desc.contains("relegat") || desc.contains("play-out") || desc.contains("down")) {
			return "relegation";
		}
		return null;
	}
}
