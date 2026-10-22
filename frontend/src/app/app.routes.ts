import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  {
    path: 'auth/login',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'game/create',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/create-game/create-game').then((m) => m.CreateGame),
  },
  {
    path: 'game/:id/lobby',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/game-lobby/game-lobby').then((m) => m.GameLobby),
  },
  {
    path: 'game/:id/play',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/game/player-dashboard/player-dashboard').then((m) => m.PlayerDashboard),
  },
  {
    path: 'game/:id/messages',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/messaging/messaging').then((m) => m.Messaging),
  },
  {
    path: 'game/:id/powers',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/powers/powers').then((m) => m.Powers),
  },
  {
    path: 'game/:id/clues',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/clue-board/clue-board').then((m) => m.ClueBoard),
  },
  {
    path: 'game/:id/wallet',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/wallet/wallet/wallet').then((m) => m.Wallet),
  },
  {
    path: 'game/:id/gm',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/game/gm-console/gm-console/gm-console').then((m) => m.GmConsole),
  },
  {
    path: 'game/:id/gm/finale',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/gm-finale/gm-finale').then((m) => m.GmFinale),
  },
  {
    path: 'game/:id/final',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/final-form/final-form').then((m) => m.FinalFormPage),
  },
  {
    path: 'game/:id/results',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/game/results/results').then((m) => m.Results),
  },
  {
    path: 'qr/:slug',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/qr/qr-clue/qr-clue').then((m) => m.QrClue),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
