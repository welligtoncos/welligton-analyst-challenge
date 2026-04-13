import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  // REQ Frontend: tela de login.
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  // REQ Frontend: rota protegida para área de produtos.
  {
    path: 'portal',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/portal/portal.component').then((m) => m.PortalComponent),
  },
  { path: 'inicio', pathMatch: 'full', redirectTo: 'portal' },
  { path: '**', redirectTo: 'login' },
];
