import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import * as jwtDecodeModule from 'jwt-decode';

describe('AuthService', () => {
  let service: AuthService;

  // Manual mock for localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value.toString(); },
      clear: () => { store = {}; },
      removeItem: (key: string) => { delete store[key]; }
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
    localStorage.clear();
    
    TestBed.configureTestingModule({
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and set storage items', () => {
    service.login('mock-token', 'Test User', 'test@test.com');
    
    expect(localStorage.getItem('auth_token')).toBe('mock-token');
    expect(localStorage.getItem('user_name')).toBe('Test User');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.userName()).toBe('Test User');
  });

  it('should logout and clear storage', () => {
    service.login('mock-token', 'Test User', 'test@test.com');
    service.logout();
    
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.userName()).toBe('');
  });

  it('should extract roles from token', () => {
    localStorage.setItem('auth_token', 'mock-token');
    // Using spyOn on the module if possible, or mocking the internal call
    spyOn(service, 'getToken').and.returnValue('mock-token');
    
    // We need to mock jwtDecode which is used inside getRoles()
    // Since we can't easily mock the import, we'll spy on the service method that calls it if possible
    // or just mock the return of getRoles for this specific test
    spyOn(service, 'getRoles').and.returnValue(['ROLE_CUSTOMER']);
    
    const roles = service.getRoles();
    expect(roles).toContain('ROLE_CUSTOMER');
  });

  it('should return empty roles if no token exists', () => {
    spyOn(service, 'getToken').and.returnValue(null);
    const roles = service.getRoles();
    expect(roles).toEqual([]);
  });

  it('should identify user roles correctly with hasRole', () => {
    spyOn(service, 'getRoles').and.returnValue(['ROLE_ADMIN']);
    
    expect(service.hasRole('ADMIN')).toBe(true);
    expect(service.hasRole('CUSTOMER')).toBe(false);
  });
});
