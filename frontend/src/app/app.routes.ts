import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'SportPulse',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'matches/:id',
    title: 'Meci | SportPulse',
    loadComponent: () => import('./pages/match-details/match-details').then((m) => m.MatchDetails),
  },
  {
    path: 'standings',
    title: 'Clasamente | SportPulse',
    loadComponent: () => import('./pages/standings/standings').then((m) => m.Standings),
  },
  {
    path: 'favorites',
    title: 'Favorite | SportPulse',
    loadComponent: () => import('./pages/favorites/favorites').then((m) => m.Favorites),
  },
  {
    path: 'login',
    title: 'Autentificare | SportPulse',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: '**',
    title: 'Pagină negăsită | SportPulse',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
