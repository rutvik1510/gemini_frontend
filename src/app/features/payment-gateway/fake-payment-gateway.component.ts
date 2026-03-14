import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MySubscriptionsService } from '../my-subscriptions/my-subscriptions.service';

@Component({
  selector: 'app-fake-payment-gateway',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <!-- Gateway Header -->
        <div class="bg-indigo-600 p-8 text-white text-center">
          <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-black tracking-tight">Secure Checkout</h1>
          <p class="text-indigo-100 text-sm font-medium mt-1 uppercase tracking-widest">EventGuard Payments</p>
        </div>

        <div class="p-8">
          <!-- Order Summary -->
          <div class="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Amount to Pay</p>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-black text-slate-800">₹{{ amount() | number }}</span>
              <span class="text-slate-500 font-bold">INR</span>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-200 flex justify-between text-sm">
              <span class="text-slate-500 font-medium">Subscription ID</span>
              <span class="text-slate-800 font-bold">#{{ subscriptionId() }}</span>
            </div>
          </div>

          <!-- Payment Options -->
          <div class="space-y-4 mb-8">
            <div class="flex items-center gap-4 p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50 cursor-pointer">
              <div class="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-black text-slate-800">Credit / Debit Card</p>
                <p class="text-xs text-slate-500 font-medium">Visa, Mastercard, Amex</p>
              </div>
              <div class="w-5 h-5 rounded-full border-4 border-indigo-600"></div>
            </div>
          </div>

          @if (errorMessage()) {
            <div class="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
              {{ errorMessage() }}
            </div>
          }

          <!-- Pay Button -->
          <button (click)="processPayment()" [disabled]="isProcessing()"
            class="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
            @if (isProcessing()) {
              <div class="flex items-center justify-center gap-3">
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Securing Funds...</span>
              </div>
            } @else {
              <span>Pay ₹{{ amount() | number }} Securely</span>
            }
          </button>

          <p class="text-center text-[10px] text-slate-400 font-medium mt-6 uppercase tracking-tighter">
            🔒 SSL Encrypted • PCI DSS Compliant
          </p>
        </div>
      </div>
    </div>
  `,
})
export class FakePaymentGatewayComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(MySubscriptionsService);

  readonly subscriptionId = signal<number>(0);
  readonly amount = signal<number>(0);
  readonly isProcessing = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const sid = this.route.snapshot.queryParamMap.get('subscriptionId');
    const amt = this.route.snapshot.queryParamMap.get('amount');
    
    if (!sid) {
      this.router.navigate(['/customer-dashboard']);
      return;
    }

    this.subscriptionId.set(Number(sid));
    this.amount.set(Number(amt || 0));
  }

  processPayment(): void {
    this.isProcessing.set(true);
    this.errorMessage.set(null);

    // Simulate network delay for "gateways"
    setTimeout(() => {
      this.service.payPremium(this.subscriptionId()).subscribe({
        next: () => {
          this.router.navigate(['/my-subscriptions'], { 
            queryParams: { paid: 'true', id: this.subscriptionId() } 
          });
        },
        error: (err) => {
          this.isProcessing.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Payment rejected by bank.');
        }
      });
    }, 2000);
  }
}
