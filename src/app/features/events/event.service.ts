import { inject, Injectable } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/events';

  // Using httpResource for a more Signal-native way of fetching data
  readonly myEventsResource = httpResource<any>(() => `${this.base}`);

  createMusicConcert(eventData: any): Observable<unknown> {
    return this.http.post(`${this.base}/music`, eventData);
  }

  createCorporateConference(eventData: any): Observable<unknown> {
    return this.http.post(`${this.base}/corporate`, eventData);
  }

  getMyEvents(): Observable<any> {
    return this.http.get(`${this.base}`);
  }
}
