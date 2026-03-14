import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClaimsOfficerService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/claims-officer/claims';

  getClaims(): Observable<any> {
    return this.http.get(this.base);
  }

  getAssignedClaims(): Observable<any> {
    return this.http.get(`${this.base}/assigned`);
  }

  getClaimDetails(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  approveClaim(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.base}/${id}/approve`, payload);
  }

  rejectClaim(id: number): Observable<any> {
    return this.http.put(`${this.base}/${id}/reject`, {});
  }
}
