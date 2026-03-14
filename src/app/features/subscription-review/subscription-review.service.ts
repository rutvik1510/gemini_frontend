import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SubscriptionReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/underwriter/subscriptions';

  getDetails(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  approve(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/approve`, {});
  }

  reject(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.base}/${id}/reject`, { reason });
  }
}
