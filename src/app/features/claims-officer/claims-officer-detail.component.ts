import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClaimsOfficerService } from './claims-officer.service';

export interface ClaimDetail {
  claimId: number;
  subscriptionId?: number;
  customerName?: string;
  customerPhone?: string;
  eventName?: string;
  eventType?: string;
  eventDate?: string;
  location?: string;
  numberOfAttendees?: number;
  budget?: number;
  policyName?: string;
  baseRate?: number;
  maxCoverageAmount?: number;
  premiumAmount?: number;
  claimAmount: number;
  incidentDate?: string;
  approvedAmount?: number;
  evidenceDocPath?: string;
  description?: string;
  filedAt: string;
  status: string;
  rejectionReason?: string;
  assignedOfficerName?: string;
  eventRisk?: number;
  weatherRisk?: number;
  totalRisk?: number;
  riskLevel?: string;
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
export class ClaimsOfficerDetailComponent implements OnInit {
  private readonly service = inject(ClaimsOfficerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly claimId = Number(this.route.snapshot.paramMap.get('id'));
  readonly claim = signal<ClaimDetail | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly processingAction = signal<string | null>(null);

  readonly showRejectForm = signal(false);
  readonly rejectionReason = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
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

  toggleRejectForm(): void {
    this.showRejectForm.update(v => !v);
    this.rejectionReason.set('');
    this.actionError.set(null);
  }

  onReasonInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.rejectionReason.set(target.value);
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
    const reason = this.rejectionReason().trim();
    if (!reason) {
      this.actionError.set('Please provide a reason for rejection.');
      return;
    }

    this.processingAction.set('reject');
    this.actionError.set(null);
    this.successMessage.set(null);
    this.service.rejectClaim(this.claimId, reason).subscribe({
      next: () => {
        this.processingAction.set(null);
        this.showRejectForm.set(false);
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

  viewDocument(path: string | undefined): void {
    if (!path) {
      alert('No evidence document provided.');
      return;
    }
    const url = path.startsWith('http') ? path : `http://localhost:8080/uploads/${path}`;
    window.open(url, '_blank');
  }
}
