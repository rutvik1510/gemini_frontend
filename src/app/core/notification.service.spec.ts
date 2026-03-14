import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService, Notification } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080/notifications';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load notifications and update signals', () => {
    const mockNotifications: Notification[] = [
      { id: 1, message: 'Test 1', type: 'INFO', isRead: false, createdAt: '' },
      { id: 2, message: 'Test 2', type: 'ALERT', isRead: true, createdAt: '' }
    ];

    service.loadNotifications();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockNotifications });

    expect(service.notifications().length).toBe(2);
    expect(service.unreadCount()).toBe(1); // Only one is unread
  });

  it('should load unread count', () => {
    service.loadUnreadCount();

    const req = httpMock.expectOne(`${baseUrl}/unread-count`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: 5 });

    expect(service.unreadCount()).toBe(5);
  });

  it('should mark a notification as read and update signals', () => {
    // Initial state
    const initialData: Notification[] = [
      { id: 1, message: 'Msg 1', type: 'INFO', isRead: false, createdAt: '' }
    ];
    service.notifications.set(initialData);
    service.unreadCount.set(1);

    service.markAsRead(1).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1/read`);
    expect(req.request.method).toBe('PUT');
    req.flush({});

    expect(service.notifications()[0].isRead).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });

  it('should mark all notifications as read', () => {
    service.notifications.set([
      { id: 1, message: 'Msg 1', type: 'INFO', isRead: false, createdAt: '' },
      { id: 2, message: 'Msg 2', type: 'ALERT', isRead: false, createdAt: '' }
    ]);
    service.unreadCount.set(2);

    service.markAllAsRead().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/read-all`);
    expect(req.request.method).toBe('PUT');
    req.flush({});

    expect(service.notifications().every(n => n.isRead)).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });
});
