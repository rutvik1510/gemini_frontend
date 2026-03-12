import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClaimsOfficerService } from './claims-officer.service';
import { AuthService } from '../../core/auth.service';

export interface Claim {
  claimId: number;
  customerName?: string;
  eventName: string;
  policyName?: string;
  claimAmount: number;
  riskLevel?: string;
  filedAt: string;
  status: string;
}

@Component({
  selector: 'app-claims-officer-dashboard',
  standalone: true,
  imports: [CommonModule],
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

  approve(id: number): void {
    this.processingId.set(id);
    this.actionError.set(null);
    this.service.approveClaim(id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.loadClaims();
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to approve claim.');
        this.processingId.set(null);
      },
    });
  }

  reject(id: number): void {
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

  riskLevelClass(level: string | undefined): string {
    switch (level?.toUpperCase()) {
      case 'LOW':    return 'bg-green-100 text-green-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      default:       return 'bg-red-100 text-red-700';
    }
  }

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
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
