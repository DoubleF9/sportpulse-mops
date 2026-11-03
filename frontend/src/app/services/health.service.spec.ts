import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Health } from '../models/health';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('should request the backend health endpoint', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    let result: Health | undefined;

    TestBed.inject(HealthService)
      .getHealth()
      .subscribe((health) => (result = health));
    http.expectOne('/api/health').flush({ status: 'UP' });

    expect(result).toEqual({ status: 'UP' });
    http.verify();
  });
});
