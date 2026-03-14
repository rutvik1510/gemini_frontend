import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoginService]
    });
    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send login credentials to the login endpoint', () => {
    const response = {
      data: {
        token: 'jwt-token',
        name: 'Test User',
        email: 'user@example.com',
        role: 'CUSTOMER'
      },
      message: 'Login successful',
      status: 'OK',
      timestamp: '2026-03-14T00:00:00Z'
    };

    service.login('user@example.com', 'secret').subscribe(res => {
      expect(res).toEqual(response);
    });

    const req = httpMock.expectOne('http://localhost:8080/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'user@example.com',
      password: 'secret'
    });
    req.flush(response);
  });
});
