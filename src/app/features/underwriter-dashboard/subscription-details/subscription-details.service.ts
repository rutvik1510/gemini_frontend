import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SubscriptionDetailsService {
  private readonly http = inject(HttpClient);

  getSubscriptionDetails(id: number): Observable<any> {
    return this.http.get(`http://localhost:8080/underwriter/subscriptions/${id}`);
  }

  approveSubscription(id: number, payload: any): Observable<any> {
    return this.http.put(`http://localhost:8080/underwriter/subscriptions/${id}/approve`, payload);
  }

  rejectSubscription(id: number, reason?: string): Observable<any> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.put(`http://localhost:8080/underwriter/subscriptions/${id}/reject`, {}, { params });
  }
}
