import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/events';

  createMusicConcert(eventData: any): Observable<unknown> {
    return this.http.post(`${this.base}/music`, eventData);
  }

  createCorporateConference(eventData: any): Observable<unknown> {
    return this.http.post(`${this.base}/corporate`, eventData);
  }

  getMyEvents(): Observable<unknown> {
    return this.http.get(`${this.base}`);
  }
}
