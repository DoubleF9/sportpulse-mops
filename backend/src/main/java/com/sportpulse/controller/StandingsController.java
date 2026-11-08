package com.sportpulse.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sportpulse.dto.standings.StandingsResponse;
import com.sportpulse.service.StandingsService;

@RestController
@RequestMapping("/api/standings")
public class StandingsController {

	private final StandingsService standingsService;

	public StandingsController(StandingsService standingsService) {
		this.standingsService = standingsService;
	}

	@GetMapping
	public StandingsResponse getStandings(
			@RequestParam(defaultValue = "football") String sport,
			@RequestParam(required = false) String league,
			@RequestParam(required = false) String season) {
		String leagueId = league != null ? league : getDefaultLeague(sport);
		String seasonYear = season != null ? season : getDefaultSeason(sport);
		return standingsService.getStandings(sport, leagueId, seasonYear);
	}

	private String getDefaultLeague(String sport) {
		if ("football".equalsIgnoreCase(sport)) {
			// Romania Liga 1
			return "283";
		} else if ("basketball".equalsIgnoreCase(sport)) {
			return "116";
		} else if ("hockey".equalsIgnoreCase(sport)) {
			return "110";
		}
		return "283";
	}

	private String getDefaultSeason(String sport) {
		if ("football".equalsIgnoreCase(sport)) {
			return "2023";
		} else if ("basketball".equalsIgnoreCase(sport)) {
			return "2023";
		} else if ("hockey".equalsIgnoreCase(sport)) {
			return "2023";
		}
		return "2023";
	}
}
