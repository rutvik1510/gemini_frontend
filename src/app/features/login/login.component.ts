import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from './login.service';
import { AuthService } from '../../core/auth.service';

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/admin-dashboard',
  CUSTOMER: '/customer-dashboard',
  UNDERWRITER: '/underwriter-dashboard',
  CLAIMS_OFFICER: '/claims-dashboard',
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly loginService = inject(LoginService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });

  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  get emailControl() { return this.form.controls.email; }
  get passwordControl() { return this.form.controls.password; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.loginService.login(email, password).subscribe({
      next: (response) => {
        const { token, name, email: userEmail } = response.data;
        this.authService.login(token, name, userEmail);
        
        const roles = this.authService.getRoles();
        const role = roles[0];

        this.isLoading.set(false);
        const route = (role && ROLE_ROUTES[role]) ?? '/customer-dashboard';
        this.router.navigateByUrl(route);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Invalid email or password');
      },
    });
  }
}
