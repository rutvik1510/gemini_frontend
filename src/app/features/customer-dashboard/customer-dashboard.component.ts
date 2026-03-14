import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { NotificationDropdownComponent } from '../notifications/notification-dropdown.component';

@Component({
  standalone: true,
  selector: 'app-customer-dashboard',
  imports: [CommonModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './customer-dashboard.component.html',
})
export class CustomerDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly customerEmail = computed(() => {
    const token = this.authService.getToken();
    if (!token) return 'Customer';
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload['sub'] ?? payload['email'] ?? 'Customer';
    } catch {
      return 'Customer';
    }
  });

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
