import { Component, inject, signal, computed, effect, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UnderwriterDashboardService } from './underwriter-dashboard.service';
import { AuthService } from '../../core/auth.service';
import { NotificationDropdownComponent } from '../notifications/notification-dropdown.component';

export interface UnderwriterSubscription {
  subscriptionId: number;
  eventName: string;
  customerName: string;
  policyName: string;
  riskPercentage: number;
  premiumAmount: number;
  status: string;
  assignedUnderwriterName?: string;
  safetyComplianceDocPath?: string;
}

@Component({
  selector: 'app-underwriter-dashboard',
  standalone: true,
  imports: [CommonModule, NotificationDropdownComponent],
  templateUrl: './underwriter-dashboard.component.html',
})
export class UnderwriterDashboardComponent {
  private readonly service = inject(UnderwriterDashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUsername = computed(() => this.authService.userName());

  readonly subscriptions = signal<UnderwriterSubscription[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly processingId = signal<number | null>(null);

  constructor() {
    afterNextRender(() => {
      this.loadSubscriptions();
    });
  }

  loadSubscriptions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    
    this.service.getAssignedSubscriptions().subscribe({
      next: (res: any) => {
        this.subscriptions.set(res.data ?? res ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load subscriptions.');
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
        this.actionError.set(err?.error?.message ?? 'Failed to approve.');
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
        this.actionError.set(err?.error?.message ?? 'Failed to reject.');
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

  viewDocument(path: string | undefined): void {
    if (!path) {
      alert('No document uploaded.');
      return;
    }
    // Handle both absolute and relative paths
    const url = path.startsWith('http') ? path : `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
    window.open(url, '_blank');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
