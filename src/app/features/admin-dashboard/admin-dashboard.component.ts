import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { AdminDashboardService, AdminEvent, Policy } from './admin-dashboard.service';
import { AuthService } from '../../core/auth.service';
import { NotificationDropdownComponent } from '../notifications/notification-dropdown.component';

type ActiveView = 'dashboard' | 'policies' | 'create-policy' | 'edit-policy' | 'create-underwriter' | 'create-claims-officer' | 'edit-underwriter' | 'edit-claims-officer' | 'view-underwriters' | 'view-claims-officers' | 'view-events' | 'view-all-claims' | 'view-all-subscriptions';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, NgClass, NotificationDropdownComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  private readonly service = inject(AdminDashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly activeView = signal<ActiveView>('dashboard');
  readonly policyFilter = signal<'active' | 'inactive'>('active');
  readonly sidebarOpen = signal(true);
  
  // Data Resources (Declarative)
  readonly statsResource = this.service.statsResource;
  readonly claimsResource = this.service.claimsResource;
  readonly subscriptionsResource = this.service.subscriptionsResource;
  readonly eventsResource = this.service.eventsResource;
  readonly underwritersResource = this.service.underwritersResource;
  readonly claimsOfficersResource = this.service.claimsOfficersResource;

  // Computed Data Signals
  readonly stats = computed(() => this.statsResource.value()?.data);
  readonly allClaims = computed(() => this.claimsResource.value()?.data ?? []);
  readonly allSubscriptions = computed(() => this.subscriptionsResource.value()?.data ?? []);
  readonly events = computed(() => this.eventsResource.value()?.data ?? []);
  readonly underwriters = computed(() => {
    const data = this.underwritersResource.value()?.data ?? [];
    return data.map((u: any) => ({ ...u, active: u.active ?? u.isActive ?? true }));
  });
  readonly claimsOfficers = computed(() => {
    const data = this.claimsOfficersResource.value()?.data ?? [];
    return data.map((u: any) => ({ ...u, active: u.active ?? u.isActive ?? true }));
  });

  // Local state for policies (handled manually due to complex filtering/crud)
  readonly policies = signal<Policy[]>([]);
  readonly isLoadingPolicies = signal(false);

  // General Loading State
  readonly isLoading = computed(() => 
    this.statsResource.isLoading() || 
    this.claimsResource.isLoading() || 
    this.subscriptionsResource.isLoading() || 
    this.eventsResource.isLoading() ||
    this.isLoadingPolicies()
  );

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private readonly editingPolicyId = signal<number | null>(null);
  private readonly editingUserId = signal<number | null>(null);

  readonly adminEmail = computed(() => this.authService.getEmail() || 'Admin');

  readonly policyForm = this.fb.nonNullable.group({
    policyName: ['', Validators.required],
    description: ['', Validators.required],
    domain: ['', Validators.required],
    baseRate: [0, [Validators.required, Validators.min(0)]],
    maxCoverageAmount: [0, [Validators.required, Validators.min(1)]],
    coversTheft: [false],
    coversWeather: [false],
    coversFire: [false],
    coversCancelation: [false],
  });

  readonly userForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
  });

  setView(view: ActiveView): void {
    this.activeView.set(view);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    
    // Trigger reloads for the specific view
    if (view === 'dashboard') this.statsResource.reload();
    else if (view === 'policies') this.loadPolicies();
    else if (view === 'view-underwriters') this.underwritersResource.reload();
    else if (view === 'view-claims-officers') this.claimsOfficersResource.reload();
    else if (view === 'view-events') this.eventsResource.reload();
    else if (view === 'view-all-claims') {
      this.claimsResource.reload();
      this.claimsOfficersResource.reload();
    }
    else if (view === 'view-all-subscriptions') {
      this.subscriptionsResource.reload();
      this.underwritersResource.reload();
    }
  }

  loadPolicies(): void {
    this.isLoadingPolicies.set(true);
    const obs = this.policyFilter() === 'active' ? this.service.getActivePolicies() : this.service.getPolicies();
    obs.subscribe({
      next: (res) => {
        let data = res.data ?? [];
        if (this.policyFilter() === 'inactive') data = data.filter((p: any) => p.isActive === false);
        this.policies.set(data);
        this.isLoadingPolicies.set(false);
      },
      error: () => this.isLoadingPolicies.set(false)
    });
  }

  loadActivePolicies(): void {
    this.policyFilter.set('active');
    this.loadPolicies();
  }

  loadInactivePolicies(): void {
    this.policyFilter.set('inactive');
    this.loadPolicies();
  }

  // Refreshes for the "Reload" buttons in UI
  loadAllClaims(): void { this.claimsResource.reload(); this.statsResource.reload(); }
  loadAllSubscriptions(): void { this.subscriptionsResource.reload(); this.statsResource.reload(); }
  loadEvents(): void { this.eventsResource.reload(); }

  submitCreatePolicy(): void {
    if (this.policyForm.invalid) return;
    this.service.createPolicy(this.policyForm.getRawValue()).subscribe({
      next: () => { 
        this.successMessage.set('Policy created!'); 
        this.loadPolicies(); 
        this.statsResource.reload();
      },
      error: () => this.errorMessage.set('Failed to create policy.')
    });
  }

  startEditPolicy(policy: Policy): void {
    this.editingPolicyId.set(policy.policyId ?? policy.id ?? null);
    this.policyForm.patchValue(policy as any);
    this.activeView.set('edit-policy');
  }

  submitEditPolicy(): void {
    const id = this.editingPolicyId();
    if (!id || this.policyForm.invalid) return;
    this.service.updatePolicy(id, this.policyForm.getRawValue()).subscribe({
      next: () => { this.setView('policies'); this.loadPolicies(); },
      error: () => this.errorMessage.set('Update failed.')
    });
  }

  startEditUser(user: any, view: 'edit-underwriter' | 'edit-claims-officer'): void {
    this.editingUserId.set(user.userId);
    this.userForm.patchValue({
      name: user.fullName,
      email: user.email,
      phone: user.phone || '',
      password: ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.activeView.set(view);
  }

  submitEditUser(): void {
    const id = this.editingUserId();
    if (!id || this.userForm.invalid) return;
    const val = this.userForm.getRawValue();
    this.service.updateUser(id, { fullName: val.name, email: val.email, password: val.password, phone: val.phone }).subscribe({
      next: () => { 
        this.successMessage.set('User updated!'); 
        this.underwritersResource.reload();
        this.claimsOfficersResource.reload();
        this.setView(this.activeView() === 'edit-underwriter' ? 'view-underwriters' : 'view-claims-officers'); 
      },
      error: () => this.errorMessage.set('Update failed.')
    });
  }

  deactivatePolicy(id: number | undefined): void {
    if (!id || !confirm('Deactivate policy?')) return;
    this.service.deletePolicy(id).subscribe(() => { this.loadPolicies(); this.statsResource.reload(); });
  }

  activatePolicy(id: number | undefined): void {
    if (!id) return;
    this.service.activatePolicy(id).subscribe(() => { this.loadPolicies(); this.statsResource.reload(); });
  }

  assignUnderwriter(id: number, event: any): void {
    const uid = event.target.value;
    if (uid) {
      this.service.assignUnderwriter(id, Number(uid)).subscribe(() => {
        this.subscriptionsResource.reload();
        this.statsResource.reload();
      });
    }
  }

  assignClaimsOfficer(id: number, event: any): void {
    const oid = event.target.value;
    if (oid) {
      this.service.assignClaimsOfficer(id, Number(oid)).subscribe(() => {
        this.claimsResource.reload();
        this.statsResource.reload();
      });
    }
  }

  submitCreateUnderwriter(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const val = this.userForm.getRawValue();
    this.service.createUnderwriter({ fullName: val.name, email: val.email, password: val.password, phone: val.phone }).subscribe({
      next: () => { 
        this.successMessage.set('Underwriter created successfully.'); 
        this.userForm.reset(); 
        this.underwritersResource.reload();
        this.statsResource.reload();
      },
      error: () => this.errorMessage.set('Failed to create underwriter.'),
    });
  }

  submitCreateClaimsOfficer(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const val = this.userForm.getRawValue();
    this.service.createClaimsOfficer({ fullName: val.name, email: val.email, password: val.password, phone: val.phone }).subscribe({
      next: () => { 
        this.successMessage.set('Claims Officer created successfully.'); 
        this.userForm.reset(); 
        this.claimsOfficersResource.reload();
        this.statsResource.reload();
      },
      error: () => this.errorMessage.set('Failed to create claims officer.'),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
