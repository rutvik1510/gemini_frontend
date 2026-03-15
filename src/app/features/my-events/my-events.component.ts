import { Component, inject, signal, computed } from '@angular/core';
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
export class MyEventsComponent {
  private readonly eventService = inject(EventService);
  private readonly router = inject(Router);
  private readonly myEventsService = inject(MyEventsService);
  
  // Use the resource from EventService
  readonly eventsResource = this.eventService.myEventsResource;
  
  // Computed signals derived from the resource
  readonly events = computed(() => {
    const res = this.eventsResource.value();
    return res?.data ?? res ?? [];
  });
  
  readonly isLoading = this.eventsResource.isLoading;
  readonly errorMessage = computed(() => this.eventsResource.error() ? 'Failed to load events.' : null);
  
  readonly snackbar = signal<string | null>(null);

  viewDetails(eventId: number): void {
    this.router.navigate(['/event-details', eventId]);
  }

  payPremium(event: any): void {
    const id = event.subscriptionId;
    const amount = event.premiumAmount;
    this.router.navigateByUrl(`/checkout?subscriptionId=${id}&amount=${amount || 0}`);
  }

  fileClaim(subscriptionId: number): void {
    this.router.navigate(['/file-claim', subscriptionId]);
  }

  private showSnackbar(msg: string): void {
    this.snackbar.set(msg);
    setTimeout(() => this.snackbar.set(null), 3000);
  }

  // Helper to trigger reload if needed
  reload(): void {
    this.eventsResource.reload();
  }
}
