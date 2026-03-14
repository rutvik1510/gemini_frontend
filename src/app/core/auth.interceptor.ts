import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(clonedReq).pipe(
    catchError((err) => {
      if (err.status === 401 || err.status === 403) {
        // If unauthorized or forbidden, force logout
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
