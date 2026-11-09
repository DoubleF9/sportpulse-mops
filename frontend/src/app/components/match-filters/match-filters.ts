import { Component, computed, input, output } from '@angular/core';

import { FixtureCompetition } from '../../models/fixture';

export interface MatchFiltersSelection {
  country: string;
  competitionIds: number[];
  liveOnly: boolean;
}

export function emptyMatchFilters(): MatchFiltersSelection {
  return { country: '', competitionIds: [], liveOnly: false };
}

@Component({
  selector: 'app-match-filters',
  templateUrl: './match-filters.html',
  styleUrl: './match-filters.scss',
})
export class MatchFilters {
  readonly competitions = input.required<FixtureCompetition[]>();
  readonly selection = input.required<MatchFiltersSelection>();
  readonly disabled = input(false);
  readonly selectionChange = output<MatchFiltersSelection>();

  protected readonly countries = computed(() =>
    [...new Set(this.competitions().map((competition) => competition.country))].sort((a, b) =>
      a.localeCompare(b, 'ro'),
    ),
  );
  protected readonly availableCompetitions = computed(() =>
    this.competitions()
      .filter(
        (competition) =>
          !this.selection().country || competition.country === this.selection().country,
      )
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ro')),
  );
  protected readonly active = computed(
    () =>
      !!this.selection().country ||
      this.selection().competitionIds.length > 0 ||
      this.selection().liveOnly,
  );

  protected selectCountry(event: Event): void {
    this.selectionChange.emit({
      ...this.selection(),
      country: (event.target as HTMLSelectElement).value,
      competitionIds: [],
    });
  }

  protected toggleCompetition(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = this.selection().competitionIds.filter((selected) => selected !== id);
    this.selectionChange.emit({
      ...this.selection(),
      competitionIds: checked ? [...ids, id] : ids,
    });
  }

  protected toggleLive(event: Event): void {
    this.selectionChange.emit({
      ...this.selection(),
      liveOnly: (event.target as HTMLInputElement).checked,
    });
  }

  protected reset(): void {
    this.selectionChange.emit(emptyMatchFilters());
  }
}
