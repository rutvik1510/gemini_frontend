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
  readonly isPaying = signal<number | null>(null);
  readonly isConfirming = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly claimedSubscriptionIds = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.service.getMySubscriptions().pipe(
      catchError((err) => {
        console.error('Failed to load subscriptions:', err);
        this.errorMessage.set('Failed to load subscriptions. Please try again.');
        return of({ data: [] });
      }),
      switchMap((subRes: any) => {
        const subs = subRes.data ?? subRes;
        this.subscriptions.set(Array.isArray(subs) ? subs : []);

        return this.claimsService.getClaims().pipe(
          catchError((err) => {
            console.warn('Could not load claims list:', err);
            return of({ data: [] });
          })
        );
      })
    ).subscribe((claimRes: any) => {
      const claimsList: any[] = claimRes.data ?? claimRes;
      const claimedIds = new Set<number>();

      if (Array.isArray(claimsList)) {
        claimsList.forEach((c: any) => {
          const sid = c.subscriptionId || c.subscription_id;
          if (sid) {
            claimedIds.add(Number(sid));
          }
        });
      }

      this.claimedSubscriptionIds.set(claimedIds);
      this.isLoading.set(false);
    });
  }

  hasClaim(subscriptionId: any): boolean {
    return this.claimedSubscriptionIds().has(Number(subscriptionId));
  }

  showConfirm(id: number): void {
    this.isConfirming.set(id);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  cancelConfirm(): void {
    this.isConfirming.set(null);
  }

  payPremium(subscriptionId: number): void {
    this.isPaying.set(subscriptionId);
    this.isConfirming.set(null);
    
    this.service.payPremium(subscriptionId).pipe(
      catchError(err => {
        console.error('Failed to pay premium:', err);
        this.errorMessage.set('Secure payment failed. Please try again.');
        this.isPaying.set(null);
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this.isPaying.set(null);
        this.successMessage.set('Payment confirmed! Your policy is now active.');
        this.loadData(); 
        setTimeout(() => this.successMessage.set(null), 5000);
      }
    });
  }

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID':     return 'bg-green-100 text-green-700';
      case 'APPROVED': return 'bg-blue-100 text-blue-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PENDING':  return 'bg-yellow-100 text-yellow-700';
      default:         return 'bg-gray-100 text-gray-700';
    }
  }

  fileClaim(subscriptionId: number): void {
    this.router.navigate(['/file-claim', subscriptionId]);
  }

  goBack(): void {
    this.router.navigate(['/customer-dashboard']);
  }
}
