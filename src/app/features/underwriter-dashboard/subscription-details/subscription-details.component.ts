import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionDetailsService } from './subscription-details.service';

interface RiskFactor {
  factor: string;
  contribution: number | string;
}

@Component({
  selector: 'app-subscription-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-details.component.html',
})
export class SubscriptionDetailsComponent {
  private readonly service = inject(SubscriptionDetailsService);
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
      const idStr = this.route.snapshot.paramMap.get('id');
      if (idStr) {
        this.subscriptionId = Number(idStr);
        this.load();
      }
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
        this.errorMessage.set('Failed to load subscription details.');
        this.isLoading.set(false);
      },
    });
  }

  getRiskBreakdown(): RiskFactor[] {
    const s = this.sub();
    if (!s) return [];
    
    const items: RiskFactor[] = [];
    
    // Core Logic Factors
    if ((s.numberOfAttendees ?? 0) > 1000) items.push({ factor: 'High Crowd Size (>1000)', contribution: '+2.0' });
    if (s.eventType === 'OUTDOOR_MUSIC_CONCERT') {
        if (s.fireworksUsed) items.push({ factor: 'Fireworks Display', contribution: '+1.5' });
        if (s.celebrityInvolved) items.push({ factor: 'Celebrity/VIP Presence', contribution: '+2.0' });
    }

    // Safety & Security (Our new objective fields)
    if (!s.hasFireNOC) items.push({ factor: 'No Fire NOC (Critical Risk)', contribution: '+3.0' });
    if (!s.hasProfessionalSecurity) items.push({ factor: 'No Professional Security', contribution: '+1.0' });
    if (s.hasMetalDetectors) items.push({ factor: 'Metal Detectors Present', contribution: '-0.5' });
    if (s.hasCCTV) items.push({ factor: 'CCTV Coverage', contribution: '-0.5' });

    // Weather
    if (s.weatherRisk > 0) items.push({ factor: `Weather (${s.weatherCondition})`, contribution: `+${s.weatherRisk}` });

    return items;
  }

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PAID':     return 'bg-emerald-100 text-emerald-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  approve(): void {
    if (!confirm('Confirm policy approval?')) return;
    this.processingAction.set('approve');
    this.service.approveSubscription(this.subscriptionId).subscribe({
      next: () => {
        this.successMessage.set('Subscription approved successfully.');
        this.load();
        this.processingAction.set(null);
      },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Approval failed.');
        this.processingAction.set(null);
      }
    });
  }

  reject(): void {
    const reason = prompt('Please enter a reason for rejection:');
    if (reason === null) return; // User cancelled prompt

    this.processingAction.set('reject');
    this.service.rejectSubscription(this.subscriptionId, reason).subscribe({
      next: () => {
        this.successMessage.set('Subscription rejected.');
        this.load();
        this.processingAction.set(null);
      },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Rejection failed.');
        this.processingAction.set(null);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/underwriter-dashboard']);
  }
}
