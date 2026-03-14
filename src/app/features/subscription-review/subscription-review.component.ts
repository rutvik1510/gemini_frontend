import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionReviewService } from './subscription-review.service';

@Component({
  selector: 'app-subscription-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-review.component.html',
})
export class SubscriptionReviewComponent {
  private readonly service = inject(SubscriptionReviewService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly sub = signal<any>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly processingAction = signal<string | null>(null);

  private subscriptionId!: number;

  constructor() {
    afterNextRender(() => {
      this.subscriptionId = Number(this.route.snapshot.paramMap.get('id'));
      this.load();
    });
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.service.getSubscription(this.subscriptionId).subscribe({
      next: (res: any) => {
        this.sub.set(res.data ?? res);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load subscription details. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  // ── Risk helpers ──────────────────────────────────────────────────────────

  getEventRiskTotal(): number {
    return this.sub()?.eventRisk ?? 0;
  }

  getWeatherRisk(): number {
    return this.sub()?.weatherRisk ?? 0;
  }

  getTotalRisk(): number {
    return this.sub()?.totalRisk ?? 0;
  }

  getRiskFactorsArray(): string[] {
    const factors = this.sub()?.riskFactors;
    if (!factors) return [];
    return factors.split(',').map((f: string) => f.trim());
  }

  riskLevelLabel(pct: number): string {
    if (pct <= 5)  return 'LOW';
    if (pct <= 10) return 'MEDIUM';
    return 'HIGH';
  }

  riskBadgeClass(pct: number): string {
    const l = this.riskLevelLabel(pct);
    if (l === 'LOW')    return 'bg-green-100 text-green-700 border border-green-200';
    if (l === 'MEDIUM') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    return 'bg-red-100 text-red-700 border border-red-200';
  }

  statusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  isPending(): boolean {
    return this.sub()?.status?.toUpperCase() === 'PENDING';
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  approve(): void {
    this.processingAction.set('approve');
    this.actionError.set(null);
    this.successMessage.set(null);
    this.service.approve(this.subscriptionId).subscribe({
      next: () => {
        this.processingAction.set(null);
        this.successMessage.set('Subscription approved successfully.');
        this.load();
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to approve subscription.');
        this.processingAction.set(null);
      },
    });
  }

  reject(): void {
    this.processingAction.set('reject');
    this.actionError.set(null);
    this.successMessage.set(null);
    this.service.reject(this.subscriptionId).subscribe({
      next: () => {
        this.processingAction.set(null);
        this.successMessage.set('Subscription rejected.');
        this.load();
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to reject subscription.');
        this.processingAction.set(null);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/underwriter-dashboard']);
  }
}
