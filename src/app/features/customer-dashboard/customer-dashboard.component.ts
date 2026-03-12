import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';

function decodeJwtEmail(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload['sub'] ?? payload['email'] ?? 'Customer';
  } catch {
    return 'Customer';
  }
}

@Component({
  standalone: true,
  selector: 'app-customer-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-dashboard.component.html',
})
export class CustomerDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly customerEmail = signal<string>('Customer');

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      this.customerEmail.set(decodeJwtEmail(token));
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
