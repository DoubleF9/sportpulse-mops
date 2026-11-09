import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

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
  private readonly router = inject(Router);
  protected readonly sports = SPORTS;
  protected readonly selectedSport = this.sportSelection.selectedSport;

  protected selectSport(sport: (typeof SPORTS)[number]['id']): void {
    this.sportSelection.selectSport(sport);
    if (this.router.url.startsWith('/matches/')) {
      void this.router.navigate(['/']);
    }
  }
}
