import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Navbar } from './components/navbar/navbar';
import { TimezoneSelector } from './components/timezone-selector/timezone-selector';

@Component({
  selector: 'app-root',
  imports: [Navbar, RouterOutlet, TimezoneSelector],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
