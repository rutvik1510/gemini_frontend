import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private apiUrl = '/api/health';

  constructor(private http: HttpClient) { }

  getHealthStatus(): Observable<string> {
    return this.http.get(this.apiUrl, { responseType: 'text' });
  }
}
