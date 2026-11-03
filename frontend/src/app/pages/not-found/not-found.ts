import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <h1>Pagină negăsită</h1>
    <a routerLink="/">Înapoi la meciuri</a>
  `,
})
export class NotFound {}
