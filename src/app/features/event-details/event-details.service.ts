import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventDetailsService {
  private readonly http = inject(HttpClient);

  getEventById(eventId: number): Observable<unknown> {
    return this.http.get(`http://localhost:8080/events/${eventId}`);
  }

  getPoliciesByDomain(domain: string): Observable<unknown> {
    return this.http.get(`http://localhost:8080/policies/domain/${domain}`);
  }

  getMySubscriptions(): Observable<unknown> {
    return this.http.get('http://localhost:8080/subscriptions');
  }

  createSubscription(eventId: number, policyId: number): Observable<unknown> {
    return this.http.post('http://localhost:8080/subscriptions', { eventId, policyId });
  }

  getClaims(): Observable<unknown> {
    return this.http.get('http://localhost:8080/claims/customer');
  }
}
