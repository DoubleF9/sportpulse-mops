package com.sportpulse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class ApiSportsConfig {

	@Value("${apisports.key:}")
	private String apiKey;

	@Value("${apisports.football.host:v3.football.api-sports.io}")
	private String footballHost;

	@Value("${apisports.basketball.host:v1.basketball.api-sports.io}")
	private String basketballHost;

	@Value("${apisports.hockey.host:v1.hockey.api-sports.io}")
	private String hockeyHost;

	@Bean
	public RestTemplate restTemplate() {
		var factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(5000);
		factory.setReadTimeout(10000);
		return new RestTemplate(factory);
	}

	public String getApiKey() {
		return apiKey;
	}

	public String getFootballHost() {
		return footballHost;
	}

	public String getHost(String sport) {
		return switch (sport) {
			case "football" -> footballHost;
			case "basketball" -> basketballHost;
			case "hockey" -> hockeyHost;
			default -> throw new IllegalArgumentException("Unsupported sport");
		};
	}
}
