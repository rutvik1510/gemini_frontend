import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimsOfficerService } from './claims-officer.service';

export interface ClaimDetail {
  claimId: number;
  customerName?: string;
  claimAmount: number;
  approvedAmount?: number;
  evidenceDocPath?: string;
  description?: string;
  filedAt: string;
  status: string;
  // Event
  eventName?: string;
  eventType?: string;
  location?: string;
  eventDate?: string;
  numberOfAttendees?: number;
  budget?: number;
  // Policy
  policyName?: string;
  baseRate?: number;
  premiumPaid?: number;
  maxCoverageAmount?: number;
  // Risk
  eventRisk?: number;
  weatherRisk?: number;
  totalRisk?: number;
  riskLevel?: string;
  // Weather
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  weatherCondition?: string;
}

@Component({
  selector: 'app-claims-officer-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './claims-officer-detail.component.html',
})
export class ClaimsOfficerDetailComponent {
  private readonly service = inject(ClaimsOfficerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly claim = signal<ClaimDetail | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly processingAction = signal<string | null>(null);

  private claimId!: number;

  constructor() {
    afterNextRender(() => {
      this.claimId = Number(this.route.snapshot.paramMap.get('id'));
      this.load();
    });
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.service.getClaimDetails(this.claimId).subscribe({
      next: (res: any) => {
        this.claim.set(res.data ?? res);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load claim details. Please try again.');
        this.isLoading.set(false);
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
      case 'COLLECTED': return 'bg-blue-100 text-blue-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  approve(): void {
    if (!confirm('Approve this claim for the full requested amount?')) return;
    
    this.processingAction.set('approve');
    this.actionError.set(null);
    this.successMessage.set(null);
    this.service.approveClaim(this.claimId, {}).subscribe({
      next: () => {
        this.processingAction.set(null);
        this.successMessage.set('Claim approved successfully.');
        this.load();
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to approve claim.');
        this.processingAction.set(null);
      },
    });
  }

  reject(): void {
    if (!confirm('Are you sure you want to reject this claim?')) return;
    
    this.processingAction.set('reject');
    this.actionError.set(null);
    this.successMessage.set(null);
    this.service.rejectClaim(this.claimId).subscribe({
      next: () => {
        this.processingAction.set(null);
        this.successMessage.set('Claim rejected successfully.');
        this.load();
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to reject claim.');
        this.processingAction.set(null);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/claims-dashboard']);
  }
}
