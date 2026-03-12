import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
    selector: 'app-unauthorized',
    standalone: true,
    template: `
    <div class="min-h-screen flex items-center justify-center px-4"
         style="background: linear-gradient(135deg, #1a0008 0%, #3b0016 100%)">
      <div class="text-center max-w-md">
        <!-- Icon -->
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
             style="background: rgba(155,0,56,0.25); border: 1px solid rgba(212,24,90,0.3)">
          <svg class="w-10 h-10 text-[#d4185a]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 class="text-4xl font-extrabold text-white mb-3">Access Denied</h1>
        <p class="text-lg text-[#f5a8c4]/60 mb-8 leading-relaxed">
          You don't have permission to view this page.<br>
          Please contact your administrator if you think this is a mistake.
        </p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button (click)="goBack()"
            class="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105"
            style="background: linear-gradient(135deg, #9b0038, #d4185a)">
            Go Back
          </button>
          <button (click)="goHome()"
            class="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-105"
            style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15)">
            Home
          </button>
        </div>

        @if (roles.length > 0) {
          <p class="text-sm text-[#f5a8c4]/30 mt-8">
            Your current role: <span class="text-[#e85c8a] font-semibold">{{ roles.join(', ') }}</span>
          </p>
        }
      </div>
    </div>
  `,
})
export class UnauthorizedComponent {
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);

    readonly roles = this.auth.getRoles();

    goBack(): void { window.history.back(); }
    goHome(): void { this.router.navigate(['/home']); }
}
