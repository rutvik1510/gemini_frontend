import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClaimsOfficerService } from './claims-officer.service';
import { AuthService } from '../../core/auth.service';
import { FormsModule } from '@angular/forms';
import { NotificationDropdownComponent } from '../notifications/notification-dropdown.component';

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
  assignedOfficerName?: string;
}

@Component({
  selector: 'app-claims-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationDropdownComponent],
  templateUrl: './claims-officer-dashboard.component.html',
})
export class ClaimsOfficerDashboardComponent {
  private readonly service = inject(ClaimsOfficerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUsername = computed(() => this.authService.userName());

  readonly filter = signal<'all' | 'assigned'>('assigned');
  readonly claims = signal<Claim[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly processingId = signal<number | null>(null);

  // UI state for inline adjustments
  readonly adjustingId = signal<number | null>(null);
  customAmount: number = 0;

  constructor() {
    effect(() => {
      this.loadClaims(this.filter());
    });
  }

  setFilter(f: 'all' | 'assigned'): void {
    this.filter.set(f);
  }

  private loadClaims(f: 'all' | 'assigned'): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const obs = f === 'all' 
      ? this.service.getClaims() 
      : this.service.getAssignedClaims();

    obs.subscribe({
      next: (res: any) => {
        this.claims.set(res.data ?? res ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load claims.');
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
        this.loadClaims(this.filter());
      },
      error: (err) => {
        this.actionError.set(err?.error?.message ?? 'Failed to approve.');
        this.processingId.set(null);
      },
    });
  }

  reject(id: number): void {
    if (!confirm('Confirm rejection?')) return;
    this.processingId.set(id);
    this.actionError.set(null);
    this.service.rejectClaim(id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.loadClaims(this.filter());
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to reject.');
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

  viewDocument(path: string | undefined): void {
    if (!path) {
      alert('No evidence document provided.');
      return;
    }
    const url = path.startsWith('http') ? path : `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
    window.open(url, '_blank');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
