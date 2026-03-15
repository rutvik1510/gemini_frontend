import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MySubscriptionsService } from './my-subscriptions.service';

describe('MySubscriptionsService', () => {
  let service: MySubscriptionsService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080/subscriptions';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MySubscriptionsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(MySubscriptionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch the current user subscriptions', () => {
    const response = [{ subscriptionId: 1 }];

    service.getMySubscriptions().subscribe(res => {
      expect(res).toEqual(response);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('should post a premium payment request and expect text response', () => {
    service.payPremium(42).subscribe(res => {
      expect(res).toBe('Payment successful');
    });

    const req = httpMock.expectOne(`${baseUrl}/42/pay-premium`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.responseType).toBe('text');
    req.flush('Payment successful');
  });
});
