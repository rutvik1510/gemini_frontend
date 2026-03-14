import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RegisterService } from './register.service';

describe('RegisterService', () => {
  let service: RegisterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegisterService]
    });
    service = TestBed.inject(RegisterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post registration data to the register endpoint', () => {
    const payload = {
      name: 'Test User',
      email: 'user@example.com',
      phone: '9999999999',
      password: 'secret'
    };
    const response = {
      message: 'Registration successful',
      status: 'OK'
    };

    service.register(payload).subscribe(res => {
      expect(res).toEqual(response);
    });

    const req = httpMock.expectOne('http://localhost:8080/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(response);
  });
});
