package com.sportpulse.client;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import java.io.IOException;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.sportpulse.config.ApiSportsConfig;
import com.sportpulse.service.ApiRequestUsageService;

class ApiSportsClientTests {

	private final ApiSportsConfig config = mock(ApiSportsConfig.class);
	private final ApiRequestUsageService usage = mock(ApiRequestUsageService.class);
	private MockRestServiceServer server;
	private ApiSportsClient client;

	@BeforeEach
	void setUp() {
		var rest = new RestTemplate();
		server = MockRestServiceServer.createServer(rest);
		client = new ApiSportsClient(rest, config, usage);
		when(config.getApiKey()).thenReturn("test-key");
		for (String sport : new String[] { "football", "basketball", "hockey" }) {
			when(config.getHost(sport)).thenReturn(sport + ".example.test");
		}
	}

	@ParameterizedTest
	@ValueSource(strings = { "football", "basketball", "hockey" })
	void countsEachOutgoingRequestForTheCorrectSport(String sport) throws Exception {
		server.expect(requestTo("https://" + sport + ".example.test/games?id=42"))
				.andExpect(header("x-apisports-key", "test-key"))
				.andRespond(withSuccess("{\"errors\":[],\"response\":[]}", MediaType.APPLICATION_JSON));
		client.get(sport, "/games", Map.of("id", 42));
		verify(usage).recordRequest(sport);
		verifyNoMoreInteractions(usage);
		server.verify();
	}

	@Test
	void countsQuotaErrorsReturnedWithHttp200() {
		server.expect(anything()).andRespond(withSuccess("{\"errors\":{\"requests\":\"quota\"},\"response\":[]}", MediaType.APPLICATION_JSON));
		var error = assertThrows(ResponseStatusException.class, () -> client.get("football", "/fixtures", Map.of()));
		assertTrue(error.getReason().contains("Limita de cereri"));
		verify(usage).recordRequest("football");
	}

	@Test
	void countsHttp429AndReturnsTheSameSafeQuotaMessage() {
		server.expect(anything()).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).body("private provider text"));
		var error = assertThrows(ResponseStatusException.class, () -> client.get("hockey", "/games", Map.of()));
		assertEquals(502, error.getStatusCode().value());
		assertTrue(error.getReason().contains("Limita de cereri"));
		assertFalse(error.getReason().contains("private provider text"));
		verify(usage).recordRequest("hockey");
	}

	@Test
	void countsNetworkAttemptsThatFail() {
		server.expect(anything()).andRespond(withException(new IOException("offline")));
		assertThrows(Exception.class, () -> client.get("basketball", "/games", Map.of()));
		verify(usage).recordRequest("basketball");
	}

	@Test
	void missingCredentialsDoNotCountAsAnOutgoingRequest() {
		when(config.getApiKey()).thenReturn("");
		assertThrows(IllegalStateException.class, () -> client.get("football", "/fixtures", Map.of()));
		verifyNoInteractions(usage);
		server.verify();
	}
}
