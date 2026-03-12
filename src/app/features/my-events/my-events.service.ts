import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MyEventsService {
  private readonly http = inject(HttpClient);

  payPremium(subscriptionId: number): Observable<any> {
    return this.http.post(`http://localhost:8080/subscriptions/${subscriptionId}/pay-premium`, {}, { responseType: 'text' as 'json' });
  }

  fileClaim(data: { subscriptionId: number; description: string; claimAmount: number; incidentDate: string }): Observable<any> {
    return this.http.post('http://localhost:8080/claims', data);
  }
}
