import { Component, inject, afterNextRender, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '../events/event.service';
import { CustomerClaimsService } from '../customer-claims/customer-claims.service';
import { forkJoin, of, catchError } from 'rxjs';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-events.component.html',
})
export class MyEventsComponent {
  private readonly eventService = inject(EventService);
  private readonly claimsService = inject(CustomerClaimsService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly events = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly claimedEventIds = signal<Set<number>>(new Set());

  constructor() {
    afterNextRender(() => {
      const events$ = this.eventService.getMyEvents().pipe(
        catchError(err => {
          console.error('Failed to load events:', err);
          this.errorMessage.set('Failed to load events. Please try again.');
          return of({ data: [] });
        })
      );

      const claims$ = this.claimsService.getClaims().pipe(
        catchError(err => {
          console.warn('Failed to load claims (non-critical):', err);
          return of({ data: [] });
        })
      );

      forkJoin({
        eventsRes: events$,
        claimsRes: claims$,
      }).subscribe(({ eventsRes, claimsRes }) => {
        const eventsList: any[] = (eventsRes as any).data ?? eventsRes ?? [];
        this.events.set(eventsList);

        const claimsList: any[] = (claimsRes as any).data ?? claimsRes ?? [];
        const claimedIds = new Set<number>();
        
        // 1. Add from local storage
        if (isPlatformBrowser(this.platformId)) {
          const storedClaimed: number[] = JSON.parse(localStorage.getItem('claimedEvents') ?? '[]');
          storedClaimed.forEach(id => claimedIds.add(id));
        }

        // 2. Add from backend claims
        if (Array.isArray(claimsList) && claimsList.length > 0) {
          claimsList.forEach((c: any) => {
            const matchedEvent = eventsList.find((e: any) => 
              (e.eventName || '').toLowerCase() === (c.eventName || '').toLowerCase()
            );
            if (matchedEvent && matchedEvent.eventId) {
              claimedIds.add(Number(matchedEvent.eventId));
            }
          });
          
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('claimedEvents', JSON.stringify([...claimedIds]));
          }
        }

        this.claimedEventIds.set(claimedIds);
        this.isLoading.set(false);
      });
    });
  }

  viewDetails(eventId: number): void {
    this.router.navigate(['/event-details', eventId]);
  }

  hasClaim(eventId: any): boolean {
    return this.claimedEventIds().has(Number(eventId));
  }
}
