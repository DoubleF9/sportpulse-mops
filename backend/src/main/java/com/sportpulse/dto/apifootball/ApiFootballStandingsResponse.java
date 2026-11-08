package com.sportpulse.dto.apifootball;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ApiFootballStandingsResponse(
		int results,
		List<ApiFootballStandingWrapper> response
) {
	@JsonIgnoreProperties(ignoreUnknown = true)
	public record ApiFootballStandingWrapper(
			League league
	) {
		@JsonIgnoreProperties(ignoreUnknown = true)
		public record League(
				int id,
				String name,
				String country,
				String logo,
				String flag,
				int season,
				List<List<Standing>> standings
		) {
		}
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record Standing(
			int rank,
			Team team,
			int points,
			@JsonProperty("goalsDiff")
			int goalsDiff,
			String group,
			String form,
			String description,
			All all,
			Home home,
			Away away
	) {
		@JsonIgnoreProperties(ignoreUnknown = true)
		public record Team(
				int id,
				String name,
				String logo
		) {
		}

		@JsonIgnoreProperties(ignoreUnknown = true)
		public record All(
				int played,
				int win,
				int draw,
				int lose,
				Goals goals
		) {
			@JsonIgnoreProperties(ignoreUnknown = true)
			public record Goals(
					@JsonProperty("for")
					int forGoals,
					int against
			) {
			}
		}

		@JsonIgnoreProperties(ignoreUnknown = true)
		public record Home(
				int played,
				int win,
				int draw,
				int lose
		) {
		}

		@JsonIgnoreProperties(ignoreUnknown = true)
		public record Away(
				int played,
				int win,
				int draw,
				int lose
		) {
		}
	}
}
