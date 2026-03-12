import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnderwriterDashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/underwriter/subscriptions';

  getAllSubscriptions(): Observable<any> {
    return this.http.get(this.base);
  }

  approveSubscription(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/approve`, {});
  }

  rejectSubscription(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/reject`, {});
  }
}
