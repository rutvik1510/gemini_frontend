import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MySubscriptionsService {
  private readonly http = inject(HttpClient);

  getMySubscriptions(): Observable<unknown> {
    return this.http.get('http://localhost:8080/subscriptions');
  }
}
