import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClaimsOfficerService } from './claims-officer.service';

describe('ClaimsOfficerService', () => {
  let service: ClaimsOfficerService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080/claims-officer/claims';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClaimsOfficerService]
    });
    service = TestBed.inject(ClaimsOfficerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all claims', () => {
    const response = [{ claimId: 1 }];

    service.getClaims().subscribe(res => {
      expect(res).toEqual(response);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('should use the same endpoint for getAllClaims', () => {
    service.getAllClaims().subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should fetch assigned claims', () => {
    service.getAssignedClaims().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/assigned`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should fetch claim details by id', () => {
    service.getClaimDetails(7).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ claimId: 7 });
  });

  it('should approve a claim with the provided payload', () => {
    const payload = { approvedAmount: 5000 };

    service.approveClaim(7, payload).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/7/approve`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true });
  });

  it('should reject a claim with a reason payload', () => {
    service.rejectClaim(7, 'Insufficient documents').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/7/reject`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ reason: 'Insufficient documents' });
    req.flush({ success: true });
  });
});
