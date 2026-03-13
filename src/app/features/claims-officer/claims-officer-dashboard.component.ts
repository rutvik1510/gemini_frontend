import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClaimsOfficerService } from './claims-officer.service';
import { AuthService } from '../../core/auth.service';
import { FormsModule } from '@angular/forms';

export interface Claim {
  claimId: number;
  customerName?: string;
  eventName: string;
  policyName?: string;
  claimAmount: number;
  approvedAmount?: number;
  evidenceDocPath?: string;
  riskLevel?: string;
  filedAt: string;
  status: string;
}

@Component({
  selector: 'app-claims-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claims-officer-dashboard.component.html',
})
export class ClaimsOfficerDashboardComponent {
  private readonly service = inject(ClaimsOfficerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly claims = signal<Claim[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly processingId = signal<number | null>(null);

  // UI state for inline adjustments
  readonly adjustingId = signal<number | null>(null);
  customAmount: number = 0;

  constructor() {
    afterNextRender(() => this.loadClaims());
  }

  private loadClaims(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.service.getClaims().subscribe({
      next: (res: any) => {
        this.claims.set(res.data ?? res);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load claims. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  startAdjusting(claim: Claim): void {
    this.adjustingId.set(claim.claimId);
    this.customAmount = claim.claimAmount;
  }

  cancelAdjustment(): void {
    this.adjustingId.set(null);
  }

  approveWithFullAmount(id: number): void {
    this.executeApproval(id, null);
  }

  approveWithCustomAmount(id: number): void {
    const amount = this.customAmount;
    const claim = this.claims().find(c => c.claimId === id);
    if (amount > (claim?.claimAmount ?? 0)) {
      alert('Approved amount cannot exceed requested amount.');
      return;
    }
    this.executeApproval(id, amount);
  }

  private executeApproval(id: number, amount: number | null): void {
    this.processingId.set(id);
    this.actionError.set(null);
    const payload = amount ? { approvedAmount: amount } : {};

    this.service.approveClaim(id, payload).subscribe({
      next: () => {
        this.processingId.set(null);
        this.adjustingId.set(null);
        this.loadClaims();
      },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Failed to approve claim.');
        this.processingId.set(null);
      },
    });
  }

  reject(id: number): void {
    if (!confirm('Confirm claim rejection?')) return;
    this.processingId.set(id);
    this.actionError.set(null);
    this.service.rejectClaim(id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.loadClaims();
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to reject claim.');
        this.processingId.set(null);
      },
    });
  }

  statusClass(status: string): string {
    const s = status?.toUpperCase();
    switch (s) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'COLLECTED': return 'bg-blue-100 text-blue-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  viewDetails(id: number): void {
    this.router.navigate(['/claims-detail', id]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
