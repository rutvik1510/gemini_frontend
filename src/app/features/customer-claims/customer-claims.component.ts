import { Component, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CustomerClaimsService } from './customer-claims.service';
import { AuthService } from '../../core/auth.service';

export interface CustomerClaim {
  claimId: number;
  eventName: string;
  claimAmount: number;
  filedAt: string;
  status: string;
}

@Component({
  selector: 'app-customer-claims',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-claims.component.html',
})
export class CustomerClaimsComponent {
  private readonly service = inject(CustomerClaimsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly claims = signal<CustomerClaim[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  constructor() {
    afterNextRender(() => {
      this.loadClaims();
    });
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

  isPaid(status: string): boolean {
    const s = status?.toUpperCase();
    return s === 'COLLECTED' || s === 'PAID' || s === 'SETTLED' || s === 'CLOSED';
  }

  receivePayment(claimId: number): void {
    const confirmed = confirm('Confirm receiving claim payment?');
    if (!confirmed) return;
    
    this.service.collectClaim(claimId).subscribe({
      next: () => {
        this.loadClaims();
      },
      error: (err) => {
        alert('Failed to collect payment. Please ensure the backend is running and the endpoint exists.');
        console.error(err);
      }
    });
  }

  statusClass(status: string): string {
    const s = status?.toUpperCase();
    switch (s) {
      case 'APPROVED': return 'bg-blue-100 text-blue-700'; // Approved but not yet paid
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'COLLECTED':
      case 'PAID':
      case 'SETTLED':  return 'bg-green-100 text-green-700'; // Fully collected/settled
      default:         return 'bg-yellow-100 text-yellow-700';
    }
  }

  // Returns Tailwind classes for each progress stage pill.
  // stage: 'filed' | 'review' | 'outcome'
  stageClass(status: string, stage: 'filed' | 'review' | 'outcome'): string {
    const s = status?.toUpperCase();
    if (stage === 'filed') {
      return 'bg-green-500 text-white';
    }
    if (stage === 'review') {
      if (s === 'PENDING') return 'bg-yellow-400 text-white';
      return 'bg-green-500 text-white';
    }
    // outcome stage
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
