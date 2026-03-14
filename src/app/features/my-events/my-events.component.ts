import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '../events/event.service';
import { MyEventsService } from './my-events.service';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-events.component.html',
})
export class MyEventsComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly myEventsService = inject(MyEventsService);
  
  readonly events = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly snackbar = signal<string | null>(null);

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.eventService.getMyEvents().subscribe({
      next: (res: any) => {
        this.events.set(res.data ?? res ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load events.');
        this.isLoading.set(false);
      }
    });
  }

  viewDetails(eventId: number): void {
    this.router.navigate(['/event-details', eventId]);
  }

  payPremium(event: any): void {
    const id = event.subscriptionId;
    const amount = event.premiumAmount;
    if (!amount || amount <= 0) {
      console.warn('Premium amount not found in event object, trying to find in subscription.');
    }
    this.router.navigateByUrl(`/checkout?subscriptionId=${id}&amount=${amount || 0}`);
  }

  fileClaim(subscriptionId: number): void {
    this.router.navigate(['/file-claim', subscriptionId]);
  }

  private showSnackbar(msg: string): void {
    this.snackbar.set(msg);
    setTimeout(() => this.snackbar.set(null), 3000);
  }
}
