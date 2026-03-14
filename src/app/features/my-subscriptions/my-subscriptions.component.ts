import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MySubscriptionsService } from './my-subscriptions.service';

@Component({
  selector: 'app-my-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-subscriptions.component.html',
})
export class MySubscriptionsComponent implements OnInit {
  private readonly service = inject(MySubscriptionsService);
  private readonly router = inject(Router);

  readonly subscriptions = signal<any[]>([]);
  readonly isLoading = signal(true);
  
  readonly isPaying = signal<number | null>(null);
  readonly isConfirming = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.service.getMySubscriptions().subscribe({
      next: (subRes: any) => {
        this.subscriptions.set(subRes.data ?? subRes ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load subscriptions.');
        this.isLoading.set(false);
      }
    });
  }

  showConfirm(id: number): void {
    this.isConfirming.set(id);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  cancelConfirm(): void {
    this.isConfirming.set(null);
  }

  payPremium(sub: any): void {
    const id = sub.subscriptionId || sub.id;
    const amount = sub.premiumAmount || 0;
    this.router.navigateByUrl(`/checkout?subscriptionId=${id}&amount=${amount}`);
  }

  statusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAID':     return 'bg-green-100 text-green-700';
      case 'APPROVED': return 'bg-blue-100 text-blue-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'PENDING':  return 'bg-yellow-100 text-yellow-700';
      default:         return 'bg-gray-100 text-gray-700';
    }
  }

  fileClaim(subscriptionId: number): void {
    this.router.navigate(['/file-claim', subscriptionId]);
  }

  goBack(): void {
    this.router.navigate(['/customer-dashboard']);
  }
}
