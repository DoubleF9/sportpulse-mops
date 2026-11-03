import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

import { HealthService } from '../../services/health.service';

@Component({
  selector: 'app-home',
  template: `
    <h1>Meciuri</h1>
    <p>Programul meciurilor va fi afișat aici.</p>
    <p>Backend: {{ backendStatus() }}</p>
  `,
})
export class Home {
  protected readonly backendStatus = toSignal(
    inject(HealthService)
      .getHealth()
      .pipe(
        map((health) => health.status),
        catchError(() => of('indisponibil')),
      ),
    { initialValue: 'se verifică...' },
  );
}
