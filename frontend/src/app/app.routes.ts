import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'auth/login',    loadComponent: () => import('./pages/auth/login/login').then(m => m.Login) },
  { path: 'auth/register', loadComponent: () => import('./pages/auth/register/register').then(m => m.Register) },
  {
    path: 'game/create', canActivate: [authGuard],
    loadComponent: () => import('./pages/game/create-game/create-game').then(m => m.CreateGame),
  },
  {
    path: 'game/:id/lobby', canActivate: [authGuard],
    loadComponent: () => import('./pages/game/game-lobby/game-lobby').then(m => m.GameLobby),
  },
  {
    path: 'game/:id/play', canActivate: [authGuard],
    loadComponent: () => import('./pages/game/player-dashboard/player-dashboard').then(m => m.PlayerDashboard),
  },
  {
  path: 'game/:id/messages', canActivate: [authGuard],
  loadComponent: () => import('./pages/game/messaging/messaging').then(m => m.Messaging),
},
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound) },
];