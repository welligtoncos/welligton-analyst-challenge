import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // REQ Frontend: interceptor envia token JWT em todas as chamadas da API.
  const authReq = req.clone({
    setHeaders: auth.getAuthorizationHeader(),
  });

  return next(authReq).pipe(
    catchError((err: unknown) => {
      // REQ: tratamento adequado para token inválido/expirado no frontend.
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
        void router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
