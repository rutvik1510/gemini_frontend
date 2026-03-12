import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerClaimsService {
  private readonly http = inject(HttpClient);

  getClaims(): Observable<any> {
    return this.http.get('http://localhost:8080/claims');
  }

  collectClaim(claimId: number): Observable<any> {
    return this.http.put(`http://localhost:8080/claims/${claimId}/collect`, {});
  }
}
