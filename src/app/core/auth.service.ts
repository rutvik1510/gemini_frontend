import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

/** Shape of decoded JWT claims from the Spring Boot backend */
interface JwtPayload {
  sub?: string;

  role?: string;
  
  roles?: string[];
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _isLoggedIn = signal(this.hasToken());

  // ── Token storage ──────────────────────────────────────────────────

  login(token: string, name: string, email: string): void {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_email', email);
    }
    this._isLoggedIn.set(true);
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this._isLoggedIn();
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_email');
    }
    this._isLoggedIn.set(false);
  }

  getUserName(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('user_name');
  }

  // ── JWT decoding

  
  getDecodedToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

 
  getRoles(): string[] {
    const payload = this.getDecodedToken();
    if (!payload) return [];

    const raw: string[] = [];

    if (payload.role) {
      raw.push(payload.role);
    }

    if (Array.isArray(payload.roles)) {
      raw.push(...payload.roles);
    }

    // Normalise: strip "ROLE_" prefix and uppercase
    return raw.map(r => r.replace(/^ROLE_/i, '').toUpperCase());
  }

  /**
   * Check whether the current user has a specific role.
   *
   * Case-insensitive; strips "ROLE_" prefix automatically.
   *
   * @example
   *   authService.hasRole('ADMIN')
   *   authService.hasRole('ROLE_ADMIN') // also works
   */
  hasRole(role: string): boolean {
    const normalised = role.replace(/^ROLE_/i, '').toUpperCase();
    return this.getRoles().includes(normalised);
  }

  /**
   * Return the subject (email) from the JWT.
   */
  getEmail(): string | null {
    return this.getDecodedToken()?.sub ?? null;
  }



  private hasToken(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
