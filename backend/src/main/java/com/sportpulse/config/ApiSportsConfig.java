package com.sportpulse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class ApiSportsConfig {

	@Value("${apisports.key:}")
	private String apiKey;

	@Value("${apisports.football.host:v3.football.api-sports.io}")
	private String footballHost;

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

	public String getApiKey() {
		return apiKey;
	}

	public String getFootballHost() {
		return footballHost;
	}
}
