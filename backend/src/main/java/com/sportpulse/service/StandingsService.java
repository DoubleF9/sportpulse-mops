package com.sportpulse.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportpulse.client.ApiSportsClient;
import com.sportpulse.dto.apifootball.ApiFootballStandingsResponse;
import com.sportpulse.dto.standings.StandingsResponse;
import com.sportpulse.model.CachedStandings;
import com.sportpulse.repository.CachedStandingsRepository;

@Service
public class StandingsService {

	private static final Logger log = LoggerFactory.getLogger(StandingsService.class);
	private final ApiSportsClient client;
	private final CachedStandingsRepository cacheRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public StandingsService(ApiSportsClient client, CachedStandingsRepository cacheRepository) {
		this.client = client;
		this.cacheRepository = cacheRepository;
	}

	public StandingsResponse getStandings(String sport, String leagueId, String season) {
		if (!sport.equals("football")) {
			throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Clasamentele pentru acest sport nu sunt disponibile încă.");
		}
		String key = "standings:" + sport + ":" + leagueId + ":" + season;
		CachedStandings cached = null;
		try {
			cached = cacheRepository.findById(key).orElse(null);
		} catch (Exception e) {
			log.warn("Standings cache could not be read");
		}
		if (cached != null && cached.expiresAt().isAfter(Instant.now())) return cached.data();

		StandingsResponse response;
		try {
			response = fetchFootballStandings(leagueId, season);
		} catch (Exception e) {
			if (cached != null) return cached.data().asStale();
			if (e instanceof ResponseStatusException error) throw error;
			log.warn("Standings request failed ({})", e.getClass().getSimpleName());
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Clasamentul nu este disponibil momentan. Încercați din nou mai târziu.");
		}
		try {
			cacheRepository.save(new CachedStandings(key, response, Instant.now().plus(6, ChronoUnit.HOURS)));
		} catch (Exception e) {
			log.warn("Standings cache could not be saved");
		}
		return response;
	}

	private StandingsResponse fetchFootballStandings(String leagueId, String season) throws Exception {
		var root = client.get("football", "/standings", Map.of("league", leagueId, "season", season));
		var body = objectMapper.treeToValue(root, ApiFootballStandingsResponse.class);
		List<StandingsResponse.StandingsTable> tables = new ArrayList<>();
		for (var wrapper : body.response()) {
			var league = wrapper.league();
			if (league == null || league.standings() == null) {
				throw new IllegalStateException("Incomplete standings response");
			}
			for (List<ApiFootballStandingsResponse.Standing> groupStandings : league.standings()) {
				var rows = groupStandings.stream().map(this::mapStanding).collect(Collectors.toList());
				String groupName = groupStandings.isEmpty() ? null : groupStandings.getFirst().group();
				tables.add(new StandingsResponse.StandingsTable(league.name(), league.country(), groupName, rows));
			}
		}
		return new StandingsResponse(tables, Instant.now(), false);
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
