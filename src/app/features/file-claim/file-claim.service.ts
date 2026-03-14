import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileClaimService {
  private readonly http = inject(HttpClient);

  getMySubscriptions(): Observable<any> {
    return this.http.get(`http://localhost:8080/subscriptions`);
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post('http://localhost:8080/api/files/upload', formData);
  }

  fileClaim(data: {
    subscriptionId: number;
    description: string;
    claimAmount: number;
    incidentDate: string;
    filedAt?: string;
    evidenceDocPath?: string;
  }): Observable<unknown> {
    return this.http.post('http://localhost:8080/claims', data);
  }
}
