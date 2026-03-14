import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
  incidentDate?: string;
  rejectionReason?: string;
  approvedAmount?: number;
  evidenceDocPath?: string;
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
export class ClaimsOfficerDashboardComponent implements OnInit {
  private readonly service = inject(ClaimsOfficerService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly allClaims = signal<Claim[]>([]);
  readonly filter = signal<'ALL' | 'ASSIGNED'>('ASSIGNED');
  readonly isLoading = signal(true);
  readonly actionError = signal<string | null>(null);
  
  readonly processingId = signal<number | null>(null);
  readonly rejectingId = signal<number | null>(null);
  readonly rejectionReason = signal('');

  readonly officerEmail = computed(() => this.authService.getEmail() || 'Officer');

  ngOnInit(): void {
    this.loadClaims(this.filter());
  }

  setFilter(f: 'ALL' | 'ASSIGNED'): void {
    this.filter.set(f);
    this.loadClaims(f);
  }

  loadClaims(f: 'ALL' | 'ASSIGNED' = 'ASSIGNED'): void {
    this.isLoading.set(true);
    const obs = f === 'ALL' ? this.service.getAllClaims() : this.service.getAssignedClaims();
    
    obs.subscribe({
      next: (res: any) => {
        this.allClaims.set(res.data ?? res ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  viewDetails(id: number): void {
    this.router.navigate(['/claims-detail', id]);
  }

  toggleRejectForm(id: number): void {
    if (this.rejectingId() === id) {
      this.rejectingId.set(null);
      this.rejectionReason.set('');
    } else {
      this.rejectingId.set(id);
      this.rejectionReason.set('');
    }
    this.actionError.set(null);
  }

  onReasonInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.rejectionReason.set(target.value);
  }

  approve(id: number): void {
    this.processingId.set(id);
    this.actionError.set(null);
    this.service.approveClaim(id, {}).subscribe({
      next: () => {
        this.processingId.set(null);
        this.loadClaims(this.filter());
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to approve.');
        this.processingId.set(null);
      },
    });
  }

  reject(id: number): void {
    const reason = this.rejectionReason().trim();
    if (!reason) {
      this.actionError.set('Please provide a reason for rejection.');
      return;
    }

    this.processingId.set(id);
    this.actionError.set(null);
    this.service.rejectClaim(id, reason).subscribe({
      next: () => {
        this.processingId.set(null);
        this.rejectingId.set(null);
        this.loadClaims(this.filter());
      },
      error: (err: any) => {
        this.actionError.set(err?.error?.message ?? 'Failed to reject.');
        this.processingId.set(null);
      },
    });
  }

  viewDocument(path: string | undefined): void {
    if (!path) {
      return;
    }
    const url = path.startsWith('http') ? path : `http://localhost:8080/uploads/${path}`;
    window.open(url, '_blank');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
