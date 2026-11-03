import { Component, input } from '@angular/core';

@Component({
  selector: 'app-match-details',
  template: `<h1>Meciul {{ id() }}</h1>`,
})
export class MatchDetails {
  readonly id = input.required<string>();
}
