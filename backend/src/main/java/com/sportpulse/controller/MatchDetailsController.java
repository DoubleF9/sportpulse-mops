package com.sportpulse.controller;

import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sportpulse.dto.fixtures.MatchDetailsResponse;
import com.sportpulse.service.MatchDetailsService;

@RestController
@RequestMapping("/api/matches")
public class MatchDetailsController {

	private final MatchDetailsService service;

	public MatchDetailsController(MatchDetailsService service) {
		this.service = service;
	}

	@GetMapping("/{sport}/{id}")
	public MatchDetailsResponse getMatch(@PathVariable String sport, @PathVariable long id) {
		if (!Set.of("football", "basketball", "hockey").contains(sport) || id <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sport sau identificator de meci invalid.");
		}
		return service.getMatch(sport, id);
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ProblemDetail handleError(ResponseStatusException exception) {
		return ProblemDetail.forStatusAndDetail(exception.getStatusCode(), exception.getReason());
	}
}
