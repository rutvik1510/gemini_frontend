import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080/events';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a POST request to create music concert', () => {
    const mockData = { name: 'Rock Fest' };
    service.createMusicConcert(mockData).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/music`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockData);
    req.flush({ success: true });
  });

  it('should send a POST request to create corporate conference', () => {
    const mockData = { name: 'Tech Conf' };
    service.createCorporateConference(mockData).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/corporate`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });

  it('should send a GET request to fetch my events', () => {
    service.getMyEvents().subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });
});
