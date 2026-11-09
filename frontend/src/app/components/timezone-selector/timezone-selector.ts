import { Component, inject } from '@angular/core';

import { TimezoneService } from '../../services/timezone.service';

@Component({
  selector: 'app-timezone-selector',
  templateUrl: './timezone-selector.html',
  styleUrl: './timezone-selector.scss',
})
export class TimezoneSelector {
  protected readonly timezone = inject(TimezoneService);

  protected changeTimezone(event: Event): void {
    this.timezone.selectTimezone((event.target as HTMLSelectElement).value);
  }
}
