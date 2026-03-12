import { Component, inject, afterNextRender, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventDetailsService } from './event-details.service';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-details.component.html',
})
export class EventDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly detailsService = inject(EventDetailsService);

  readonly event = signal<any>(null);
  readonly policies = signal<any[]>([]);
  
  // New Computed Signal for Smart Filtering
  readonly availablePolicies = computed(() => {
    const budget = this.event()?.budget ?? 0;
    return this.policies().filter(p => (p.maxCoverageAmount ?? 0) >= budget);
  });

  readonly isLoadingEvent = signal(true);
  readonly isLoadingPolicies = signal(true);
  readonly subscribingPolicyId = signal<number | null>(null);
  readonly quoteResult = signal<any>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly subscribeError = signal<string | null>(null);
  readonly subscribedPolicyIds = signal<Set<number>>(new Set());
  private subscriptions: any[] = [];

  private eventId!: number;

  constructor() {
    afterNextRender(() => {
      this.eventId = Number(this.route.snapshot.paramMap.get('id'));

      // Load order: event → subscriptions → policies
      // Subscriptions must be known before policies render so the
      // "Subscribed ✓" state is correct from the very first paint.
      this.detailsService.getEventById(this.eventId).subscribe({
        next: (res: any) => {
          const eventData = res.data ?? res;
          this.event.set(eventData);
          this.isLoadingEvent.set(false);

          const domain: string = eventData.eventType ?? eventData.domain ?? '';

          this.detailsService.getMySubscriptions().subscribe({
            next: (subRes: any) => {
              this.subscriptions = subRes.data ?? subRes;
              const ids = new Set<number>(
                this.subscriptions
                  .filter((s: any) => s.eventId === this.eventId)
                  .map((s: any) => s.policyId)
              );
              this.subscribedPolicyIds.set(ids);

              this.detailsService.getPoliciesByDomain(domain).subscribe({
                next: (policyRes: any) => {
                  this.policies.set(policyRes.data ?? policyRes);
                  this.isLoadingPolicies.set(false);
                },
                error: () => {
                  this.errorMessage.set('Failed to load policies.');
                  this.isLoadingPolicies.set(false);
                },
              });
            },
            error: () => {
              // Subscriptions failed — still show policies without subscribed state
              const domain2: string = eventData.eventType ?? eventData.domain ?? '';
              this.detailsService.getPoliciesByDomain(domain2).subscribe({
                next: (policyRes: any) => {
                  this.policies.set(policyRes.data ?? policyRes);
                  this.isLoadingPolicies.set(false);
                },
                error: () => {
                  this.errorMessage.set('Failed to load policies.');
                  this.isLoadingPolicies.set(false);
                },
              });
            },
          });
        },
        error: () => {
          this.errorMessage.set('Failed to load event details.');
          this.isLoadingEvent.set(false);
          this.isLoadingPolicies.set(false);
        },
      });
    });
  }

  subscribe(policyId: number): void {
    this.subscribingPolicyId.set(policyId);
    this.quoteResult.set(null);
    this.subscribeError.set(null);

    this.detailsService.createSubscription(this.eventId, policyId).subscribe({
      next: (res: any) => {
        this.quoteResult.set(res.data ?? res);
        this.subscribingPolicyId.set(null);
        // Immediately disable the button before the refresh round-trip
        this.subscribedPolicyIds.update(set => { set.add(policyId); return new Set(set); });
        this.loadSubscriptions();
      },
      error: (err) => {
        console.error('Subscription failed:', err);
        this.subscribeError.set(err?.error?.message ?? 'Subscription failed. Please try again.');
        this.subscribingPolicyId.set(null);
      },
    });
  }

  isSubscribed(policyId: number): boolean {
    return this.subscriptions.some(
      s => (s.policy?.policyId ?? s.policyId) === policyId &&
        (s.event?.eventId ?? s.eventId) === this.eventId
    );
  }

  private loadSubscriptions(): void {
    this.detailsService.getMySubscriptions().subscribe({
      next: (res: any) => {
        this.subscriptions = res.data ?? res;
        const ids = new Set<number>(
          this.subscriptions
            .filter((s: any) => s.eventId === this.eventId)
            .map((s: any) => s.policyId)
        );
        this.subscribedPolicyIds.set(ids);
      },
      error: (err) => console.error('Failed to load subscriptions', err),
    });
  }

  goBack(): void {
    this.router.navigate(['/my-events']);
  }
}
