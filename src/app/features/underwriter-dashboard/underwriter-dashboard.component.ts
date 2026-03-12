import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnderwriterDashboardService } from './underwriter-dashboard.service';
import { AuthService } from '../../core/auth.service';

export interface UnderwriterSubscription {
  subscriptionId: number;
  eventName: string;
  customerName: string;
  policyName: string;
  riskPercentage: number;
  premiumAmount: number;
  status: string;
}

@Component({
  selector: 'app-underwriter-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './underwriter-dashboard.component.html',
})
export class UnderwriterDashboardComponent {
  private readonly service = inject(UnderwriterDashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly subscriptions = signal<UnderwriterSubscription[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly processingId = signal<number | null>(null);

  constructor() {
    afterNextRender(() => this.loadSubscriptions());
  }

  private loadSubscriptions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.service.getAllSubscriptions().subscribe({
      next: (res: any) => {
        this.subscriptions.set(res.data ?? res);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load subscriptions. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  approve(id: number): void {
    this.processingId.set(id);
    this.actionError.set(null);
    this.service.approveSubscription(id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.loadSubscriptions();
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to approve subscription.');
        this.processingId.set(null);
      },
    });
  }

  reject(id: number): void {
    this.processingId.set(id);
    this.actionError.set(null);
    this.service.rejectSubscription(id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.loadSubscriptions();
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to reject subscription.');
        this.processingId.set(null);
      },
    });
  }

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  viewDetails(id: number): void {
    this.router.navigate(['/underwriter/subscription', id]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
