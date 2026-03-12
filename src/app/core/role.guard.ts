import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * RoleGuard — protects routes based on JWT roles.

 */
export const roleGuard: CanActivateFn = (route) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Not logged in at all
    if (!auth.isLoggedIn()) {
        return router.createUrlTree(['/login']);
    }

    // Read required role from route data (e.g. data: { role: 'ADMIN' })
    const requiredRole: string | undefined = route.data?.['role'];

    // No role required — just needs to be authenticated
    if (!requiredRole) return true;

    if (auth.hasRole(requiredRole)) {
        return true;
    }

    // Logged in but wrong role
    return router.createUrlTree(['/unauthorized']);
};
