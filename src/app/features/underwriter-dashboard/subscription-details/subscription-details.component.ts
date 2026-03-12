import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionDetailsService } from './subscription-details.service';
import { UnderwriterDashboardService } from '../underwriter-dashboard.service';

interface RiskFactor {
  factor: string;
  contribution: number;
}

@Component({
  selector: 'app-subscription-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-details.component.html',
})
export class SubscriptionDetailsComponent {
  private readonly service = inject(SubscriptionDetailsService);
  private readonly underwriterService = inject(UnderwriterDashboardService);
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
    this.service.getSubscriptionDetails(this.subscriptionId).subscribe({
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

  getRiskBreakdown(): RiskFactor[] {
    const e = this.sub()?.event;
    if (!e) return [];
    const items: RiskFactor[] = [];
    if ((e.numberOfAttendees ?? 0) > 1000)           items.push({ factor: 'Attendees > 1,000',       contribution: 2.0 });
    if (e.isOutdoor)                                  items.push({ factor: 'Outdoor Event',            contribution: 1.0 });
    if (e.alcoholAllowed)                             items.push({ factor: 'Alcohol Allowed',          contribution: 1.0 });
    if (e.temporaryStructure)                         items.push({ factor: 'Temporary Structure',      contribution: 0.5 });
    if (e.fireworksUsed)                              items.push({ factor: 'Fireworks Used',           contribution: 1.5 });
    if (e.celebrityInvolved)                          items.push({ factor: 'Celebrity Involved',       contribution: 2.0 });
    if (e.locationRiskLevel?.toUpperCase() === 'HIGH') items.push({ factor: 'High Location Risk',     contribution: 1.5 });
    if (e.securityLevel?.toUpperCase() === 'LOW')     items.push({ factor: 'Low Security Level',       contribution: 1.0 });
    return items;
  }

  getRiskLevel(pct: number): string {
    if (pct <= 5)  return 'LOW';
    if (pct <= 10) return 'MEDIUM';
    return 'HIGH';
  }

  riskLevelClass(pct: number): string {
    const level = this.getRiskLevel(pct);
    if (level === 'LOW')    return 'bg-green-100 text-green-700';
    if (level === 'MEDIUM') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  approve(): void {
    this.processingAction.set('approve');
    this.actionError.set(null);
    this.successMessage.set(null);
    this.underwriterService.approveSubscription(this.subscriptionId).subscribe({
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
    this.underwriterService.rejectSubscription(this.subscriptionId).subscribe({
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
