import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * RoleGuard — protects routes based on JWT roles.
 */
export const roleGuard: CanActivateFn = (route) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // Use signal value directly
    if (!auth.isLoggedIn()) {
        console.warn('RoleGuard: User not logged in, redirecting to login.');
        return router.createUrlTree(['/login']);
    }

    const requiredRole: string | undefined = route.data?.['role'];
    if (!requiredRole) return true;

    if (auth.hasRole(requiredRole)) {
        return true;
    }

    console.warn(`RoleGuard: Access denied for role ${requiredRole}, redirecting to unauthorized.`);
    return router.createUrlTree(['/unauthorized']);
};
