import { Component, inject, afterNextRender, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '../events/event.service';
import { MyEventsService } from './my-events.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-events.component.html',
})
export class MyEventsComponent {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly myEventsService = inject(MyEventsService);
  
  readonly snackbar = signal<string | null>(null);
  readonly events = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.refreshEvents();
  }

  viewDetails(eventId: number): void {
    this.router.navigate(['/event-details', eventId]);
  }

  payPremium(subscriptionId: number): void {
    this.myEventsService.payPremium(subscriptionId).subscribe({
      next: () => {
        this.snackbar.set('Premium payment successful.');
        this.refreshEvents();
        setTimeout(() => this.snackbar.set(null), 3000);
      },
      error: (err: any) => {
        this.snackbar.set(err?.error?.message ?? 'Failed to pay premium.');
        setTimeout(() => this.snackbar.set(null), 3000);
      }
    });
  }

  fileClaim(subscriptionId: number): void {
    // Navigate to the file claim component with the subscription ID
    this.router.navigate(['/file-claim', subscriptionId]);
  }

  refreshEvents(): void {
    this.isLoading.set(true);
    this.eventService.getMyEvents().pipe(
      catchError(err => {
        console.error('Failed to load events:', err);
        this.errorMessage.set('Failed to load events. Please try again.');
        this.isLoading.set(false);
        return of({ data: [] });
      })
    ).subscribe((res: any) => {
      const data = res.data ?? res ?? [];
      this.events.set(Array.isArray(data) ? data : []);
      this.isLoading.set(false);
    });
  }
}
