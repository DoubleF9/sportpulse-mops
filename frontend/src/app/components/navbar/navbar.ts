import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SPORTS } from '../../models/sport';
import { SportSelectionService } from '../../services/sport-selection.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly sportSelection = inject(SportSelectionService);
  protected readonly sports = SPORTS;
  protected readonly selectedSport = this.sportSelection.selectedSport;

  protected selectSport(sport: (typeof SPORTS)[number]['id']): void {
    this.sportSelection.selectSport(sport);
  }
}
