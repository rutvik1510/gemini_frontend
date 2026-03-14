import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/notifications';

  readonly unreadCount = signal<number>(0);
  readonly notifications = signal<Notification[]>([]);

  loadNotifications(): void {
    this.http.get<any>(this.base).subscribe(res => {
      const data = res.data ?? res ?? [];
      this.notifications.set(data);
      this.updateUnreadCount();
    });
  }

  loadUnreadCount(): void {
    this.http.get<any>(`${this.base}/unread-count`).subscribe(res => {
      this.unreadCount.set(res.data ?? 0);
    });
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list => 
          list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this.updateUnreadCount();
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.base}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      })
    );
  }

  private updateUnreadCount(): void {
    const count = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(count);
  }
}
