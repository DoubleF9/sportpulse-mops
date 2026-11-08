package com.sportpulse.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "cached_standings")
public class CachedStandings {

	@Id
	private String id;

	private String sport;
	private String leagueId;
	private String season;
	private String cacheKey;
	private Object data;

	@Indexed(expireAfter = "0s")
	private Instant expiresAt;

	public CachedStandings() {
	}

	public CachedStandings(String cacheKey, String sport, String leagueId, String season, Object data, Instant expiresAt) {
		this.cacheKey = cacheKey;
		this.sport = sport;
		this.leagueId = leagueId;
		this.season = season;
		this.data = data;
		this.expiresAt = expiresAt;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getSport() {
		return sport;
	}

	public void setSport(String sport) {
		this.sport = sport;
	}

	public String getLeagueId() {
		return leagueId;
	}

	public void setLeagueId(String leagueId) {
		this.leagueId = leagueId;
	}

	public String getSeason() {
		return season;
	}

	public void setSeason(String season) {
		this.season = season;
	}

	public String getCacheKey() {
		return cacheKey;
	}

	public void setCacheKey(String cacheKey) {
		this.cacheKey = cacheKey;
	}

	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public void setExpiresAt(Instant expiresAt) {
		this.expiresAt = expiresAt;
	}
}
