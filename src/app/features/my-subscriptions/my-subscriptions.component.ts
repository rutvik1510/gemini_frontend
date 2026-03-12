import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MySubscriptionsService } from './my-subscriptions.service';
import { CustomerClaimsService } from '../customer-claims/customer-claims.service';
import { catchError, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-my-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-subscriptions.component.html',
})
export class MySubscriptionsComponent implements OnInit {
  private readonly service = inject(MySubscriptionsService);
  private readonly claimsService = inject(CustomerClaimsService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly subscriptions = signal<any[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly paidSubscriptions = signal<Set<number>>(new Set());
  readonly claimedSubscriptionIds = signal<Set<number>>(new Set());

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const stored: number[] = JSON.parse(localStorage.getItem('paidSubscriptions') ?? '[]');
      this.paidSubscriptions.set(new Set(stored));

      // Read claimed IDs from localStorage immediately (fast path)
      const storedClaimed: number[] = JSON.parse(localStorage.getItem('claimedSubscriptions') ?? '[]');
      this.claimedSubscriptionIds.set(new Set(storedClaimed));
    }
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    // Load subscriptions first, then match claims against them
    this.service.getMySubscriptions().pipe(
      catchError((err) => {
        console.error('Failed to load subscriptions:', err);
        this.errorMessage.set('Failed to load subscriptions. Please try again.');
        return of([]);
      }),
      switchMap((subRes: any) => {
        const subs = subRes.data ?? subRes;
        this.subscriptions.set(subs);
        this.isLoading.set(false);

        // Now load claims (subscriptions are guaranteed to be set)
        return this.claimsService.getClaims().pipe(
          catchError((err) => {
            console.warn('Could not load claims list (non-critical):', err);
            return of([]);
          })
        );
      })
    ).subscribe((claimRes: any) => {
      const claimsList: any[] = claimRes.data ?? claimRes;
      const subs = this.subscriptions();
      const claimedIds = new Set<number>();

      if (Array.isArray(claimsList)) {
        claimsList.forEach((c: any) => {
          // Try direct subscriptionId first
          const directSid = c.subscriptionId ?? c.subscription_id;
          if (directSid) {
            claimedIds.add(Number(directSid));
            return;
          }
          // Fallback: match claim → subscription by eventName purely since claim.policyName is omitted by backend
          const matchedSub = subs.find((s: any) => {
            const subEventName = (s.event?.eventName ?? s.eventName ?? '').toLowerCase();
            return subEventName === (c.eventName ?? '').toLowerCase();
          });
          if (matchedSub) {
            claimedIds.add(Number(matchedSub.subscriptionId));
          }
        });
      }

      if (isPlatformBrowser(this.platformId)) {
        const existing: number[] = JSON.parse(localStorage.getItem('claimedSubscriptions') ?? '[]');
        existing.forEach(id => claimedIds.add(id));
        localStorage.setItem('claimedSubscriptions', JSON.stringify([...claimedIds]));
      }

      this.claimedSubscriptionIds.set(claimedIds);
    });
  }

  isPremiumPaid(subscriptionId: number): boolean {
    return this.paidSubscriptions().has(subscriptionId);
  }

  hasClaim(subscriptionId: any): boolean {
    return this.claimedSubscriptionIds().has(Number(subscriptionId));
  }

  payPremium(subscriptionId: number): void {
    const confirmed = confirm('Confirm premium payment?');
    if (!confirmed) return;
    const updated = new Set(this.paidSubscriptions());
    updated.add(subscriptionId);
    this.paidSubscriptions.set(updated);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('paidSubscriptions', JSON.stringify([...updated]));
    }
  }

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':   return 'bg-green-100 text-green-700';
      case 'APPROVED': return 'bg-blue-100 text-blue-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  fileClaim(subscriptionId: number): void {
    this.router.navigate(['/file-claim', subscriptionId]);
  }

  goBack(): void {
    this.router.navigate(['/customer-dashboard']);
  }
}
