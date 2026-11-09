package com.sportpulse.client;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportpulse.config.ApiSportsConfig;

@Component
public class ApiSportsClient {

	private static final Pattern PLAN_DATE_RANGE = Pattern.compile("try from (\\d{4}-\\d{2}-\\d{2}) to (\\d{4}-\\d{2}-\\d{2})");
	private final RestTemplate restTemplate;
	private final ApiSportsConfig config;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public ApiSportsClient(RestTemplate restTemplate, ApiSportsConfig config) {
		this.restTemplate = restTemplate;
		this.config = config;
	}

	public JsonNode get(String sport, String path, Map<String, ?> parameters) throws Exception {
		if (config.getApiKey() == null || config.getApiKey().isBlank()) {
			throw new IllegalStateException("API-Sports key is missing");
		}
		var builder = UriComponentsBuilder.newInstance().scheme("https").host(config.getHost(sport)).path(path);
		parameters.forEach(builder::queryParam);
		HttpHeaders headers = new HttpHeaders();
		headers.set("x-apisports-key", config.getApiKey());
		headers.set("Accept", "application/json");
		String raw = restTemplate.exchange(builder.build().encode().toUri(), HttpMethod.GET,
				new HttpEntity<Void>(headers), String.class).getBody();
		if (raw == null) throw new IllegalStateException("Empty provider response");
		var root = objectMapper.readTree(raw);
		validate(root);
		return root;
	}

	private void validate(JsonNode body) {
		if (body == null) throw new IllegalStateException("Empty provider response");
		var errors = body.path("errors");
		if (errors.has("plan")) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, planRestriction(errors.path("plan").asText()));
		}
		if (errors.has("requests")) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Limita de cereri API-Sports a fost atinsă. Încercați din nou mai târziu.");
		}
		if (!errors.isEmpty() || !body.path("response").isArray()) {
			throw new IllegalStateException("Provider returned an error");
		}
	}

	private String planRestriction(String providerMessage) {
		String message = "Planul API-Sports nu permite accesul la data selectată.";
		var range = PLAN_DATE_RANGE.matcher(providerMessage);
		if (range.find()) {
			try {
				var format = DateTimeFormatter.ofPattern("dd.MM.uuuu");
				return message + " Date disponibile: " + LocalDate.parse(range.group(1)).format(format)
						+ " – " + LocalDate.parse(range.group(2)).format(format) + ".";
			} catch (DateTimeParseException e) {
				// Only return validated dates, never arbitrary provider text.
			}
		}
		return message;
	}
}
