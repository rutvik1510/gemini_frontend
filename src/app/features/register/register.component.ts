import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from './register.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly registerService = inject(RegisterService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly errorMessage = signal<string | null>(null);
  readonly isLoading = signal(false);

  get nameControl() { return this.form.controls.name; }
  get emailControl() { return this.form.controls.email; }
  get phoneControl() { return this.form.controls.phone; }
  get companyNameControl() { return this.form.controls.companyName; }
  get passwordControl() { return this.form.controls.password; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.registerService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        alert('Registration successful. Please login.');
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Registration failed. Please try again.',
        );
      },
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
