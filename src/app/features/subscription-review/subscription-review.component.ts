import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionReviewService } from './subscription-review.service';

export interface SubscriptionDetail {
  subscriptionId: number;
  eventName: string;
  eventType?: string;
  customerName?: string;
  customerPhone?: string;
  policyName?: string;
  policyDescription?: string;
  baseRate?: number;
  maxCoverageAmount?: number;
  premiumAmount?: number;
  riskPercentage?: number;
  riskLevel?: string;
  riskFactors?: string;
  status: string;
  rejectionReason?: string;
  assignedUnderwriterName?: string;
  location?: string;
  eventDate?: string;
  numberOfAttendees?: number;
  budget?: number;
  venueType?: string;
  durationInDays?: number;
  isOutdoor?: boolean;
  alcoholAllowed?: boolean;
  fireworksUsed?: boolean;
  celebrityInvolved?: boolean;
  temporaryStructure?: boolean;
  locationRiskLevel?: string;
  securityLevel?: string;
  temperature?: number;
  windSpeed?: number;
  humidity?: number;
  weatherCondition?: string;
  eventRisk?: number;
  weatherRisk?: number;
  totalRisk?: number;
  hasProfessionalSecurity?: boolean;
  hasCCTV?: boolean;
  hasMetalDetectors?: boolean;
  hasFireNOC?: boolean;
  hasOnSiteFireSafety?: boolean;
  safetyComplianceDocPath?: string;
}

@Component({
  selector: 'app-subscription-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-review.component.html',
})
export class SubscriptionReviewComponent implements OnInit {
  private readonly service = inject(SubscriptionReviewService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly sub = signal<SubscriptionDetail | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly processingAction = signal<string | null>(null);
  
  readonly showRejectForm = signal(false);
  readonly rejectionReason = signal('');

  private subscriptionId!: number;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.subscriptionId = Number(idParam);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.service.getDetails(this.subscriptionId).subscribe({
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

  statusBadgeClass(status: string | undefined): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PAID':     return 'bg-blue-100 text-blue-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
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
    const reason = this.rejectionReason().trim();
    if (!reason) {
      this.actionError.set('Please provide a reason for rejection.');
      return;
    }

    this.processingAction.set('reject');
    this.actionError.set(null);
    this.successMessage.set(null);
    this.service.reject(this.subscriptionId, reason).subscribe({
      next: () => {
        this.processingAction.set(null);
        this.showRejectForm.set(false);
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

  viewDocument(path: string | undefined): void {
    if (!path) return;
    const url = path.startsWith('http') ? path : `http://localhost:8080/uploads/${path}`;
    window.open(url, '_blank');
  }
}
