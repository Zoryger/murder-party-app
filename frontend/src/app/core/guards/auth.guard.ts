import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // On retient la page demandée pour y revenir après la connexion
  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
