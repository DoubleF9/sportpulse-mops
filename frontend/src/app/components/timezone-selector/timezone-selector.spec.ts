import { TestBed } from '@angular/core/testing';

import { TimezoneService } from '../../services/timezone.service';
import { TimezoneSelector } from './timezone-selector';

describe('Timezone selector', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('selects and restores a preference and can return to automatic', () => {
    localStorage.setItem('sportpulse.timezone', 'UTC');
    const fixture = TestBed.createComponent(TimezoneSelector);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('UTC');
    select.value = 'America/New_York';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(TestBed.inject(TimezoneService).timeZone()).toBe('America/New_York');
    expect(select.value).toBe('America/New_York');
    select.value = '';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(select.value).toBe('');
    expect(localStorage.getItem('sportpulse.timezone')).toBeNull();
  });
});
