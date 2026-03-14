import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomerClaimsService } from './customer-claims.service';
import { AuthService } from '../../core/auth.service';

export interface CustomerClaim {
  claimId: number;
  eventName: string;
  claimAmount: number;
  incidentDate?: string;
  rejectionReason?: string;
  approvedAmount?: number;
  filedAt: string;
  status: string;
}

@Component({
  selector: 'app-customer-claims',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-claims.component.html',
})
export class CustomerClaimsComponent implements OnInit {
  private readonly service = inject(CustomerClaimsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly claims = signal<CustomerClaim[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isCollecting = signal<number | null>(null);
  readonly isConfirming = signal<number | null>(null);

  ngOnInit(): void {
    this.loadClaims();
  }

  showConfirm(id: number): void {
    this.isConfirming.set(id);
  }

  cancelConfirm(): void {
    this.isConfirming.set(null);
  }

  private loadClaims(): void {
    this.isLoading.set(true);
    this.service.getClaims().subscribe({
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

  isPaid(status: string): boolean {
    const s = status?.toUpperCase();
    return s === 'COLLECTED' || s === 'PAID' || s === 'SETTLED' || s === 'CLOSED';
  }

  receivePayment(claimId: number): void {
    this.isCollecting.set(claimId);
    this.isConfirming.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    this.service.collectClaim(claimId).subscribe({
      next: () => {
        this.successMessage.set('Payout successfully transferred!');
        this.isCollecting.set(null);
        this.loadClaims();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Collection failed.');
        this.isCollecting.set(null);
      }
    });
  }

  statusClass(status: string): string {
    const s = status?.toUpperCase();
    switch (s) {
      case 'APPROVED': return 'bg-blue-100 text-blue-700'; 
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'COLLECTED':
      case 'PAID':
      case 'SETTLED':  return 'bg-green-100 text-green-700';
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  stageClass(status: string, stage: 'filed' | 'review' | 'outcome'): string {
    const s = status?.toUpperCase();
    if (stage === 'filed') return 'bg-green-500 text-white';
    if (stage === 'review') {
      if (s === 'PENDING') return 'bg-yellow-400 text-white';
      return 'bg-green-500 text-white';
    }
    if (s === 'APPROVED' || s === 'COLLECTED' || s === 'PAID' || s === 'SETTLED') return 'bg-green-500 text-white';
    if (s === 'REJECTED') return 'bg-red-500 text-white';
    return 'bg-slate-200 text-slate-400';
  }

  outcomeLabel(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'REJECTED') return 'Rejected';
    if (s === 'COLLECTED' || s === 'PAID' || s === 'SETTLED') return 'Collected';
    return 'Approved';
  }

  goBack(): void {
    this.router.navigate(['/customer-dashboard']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
