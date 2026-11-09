package com.sportpulse.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "api_request_usage")
public record ApiRequestUsage(@Id String id, String sport, String date, long requests, Instant lastRequestedAt) {
}
