package com.sportpulse.controller;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sportpulse.dto.fixtures.FixturesResponse;
import com.sportpulse.service.FixturesService;

@RestController
@RequestMapping("/api/fixtures")
public class FixturesController {

	private final FixturesService fixturesService;

	public FixturesController(FixturesService fixturesService) {
		this.fixturesService = fixturesService;
	}

	@GetMapping
	public FixturesResponse getFixtures(
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
			@RequestParam(defaultValue = "UTC") String timezone) {
		ZoneId zone;
		try {
			zone = ZoneId.of(timezone);
		} catch (DateTimeException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fus orar invalid.");
		}
		return fixturesService.getFixtures(date, zone);
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ProblemDetail handleUnavailableFixtures(ResponseStatusException exception) {
		return ProblemDetail.forStatusAndDetail(exception.getStatusCode(), exception.getReason());
	}
}
