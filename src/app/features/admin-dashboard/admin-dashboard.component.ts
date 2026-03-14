import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe, NgClass } from '@angular/common';
import { AdminDashboardService, AdminEvent, Policy, CreateUserRequest } from './admin-dashboard.service';
import { AuthService } from '../../core/auth.service';
import { NotificationDropdownComponent } from '../notifications/notification-dropdown.component';

type ActiveView = 'dashboard' | 'policies' | 'create-policy' | 'edit-policy' | 'create-underwriter' | 'create-claims-officer' | 'edit-underwriter' | 'edit-claims-officer' | 'view-underwriters' | 'view-claims-officers' | 'view-events' | 'view-all-claims' | 'view-all-subscriptions';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, NgClass, NotificationDropdownComponent],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly service = inject(AdminDashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly activeView = signal<ActiveView>('dashboard');
  readonly policyFilter = signal<'active' | 'inactive'>('active');
  readonly sidebarOpen = signal(true);
  
  // Data Signals
  readonly stats = signal<any>(null);
  readonly policies = signal<Policy[]>([]);
  readonly underwriters = signal<any[]>([]);
  readonly claimsOfficers = signal<any[]>([]);
  readonly events = signal<AdminEvent[]>([]);
  readonly allClaims = signal<any[]>([]);
  readonly allSubscriptions = signal<any[]>([]);

  // Loading States
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  private readonly editingPolicyId = signal<number | null>(null);
  private readonly editingUserId = signal<number | null>(null);

  readonly totalClaimsAmount = computed(() => 
    this.allClaims().reduce((sum, c) => sum + (Number(c.claimAmount) || 0), 0)
  );

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

  ngOnInit(): void {
    this.loadInitialDashboardData();
  }

  loadInitialDashboardData(): void {
    this.loadStats();
    this.loadAllClaims();
    this.loadAllSubscriptions();
  }

  setView(view: ActiveView): void {
    this.activeView.set(view);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    
    if (view === 'dashboard') this.loadInitialDashboardData();
    else if (view === 'policies') this.loadPolicies();
    else if (view === 'view-underwriters') this.loadUnderwriters();
    else if (view === 'view-claims-officers') this.loadClaimsOfficers();
    else if (view === 'view-events') this.loadEvents();
    else if (view === 'view-all-claims') {
      this.loadAllClaims();
      this.loadClaimsOfficers();
    }
    else if (view === 'view-all-subscriptions') {
      this.loadAllSubscriptions();
      this.loadUnderwriters();
    }
  }

  loadStats(): void {
    this.service.getStats().subscribe(res => this.stats.set(res.data));
  }

  loadPolicies(): void {
    this.isLoading.set(true);
    const obs = this.policyFilter() === 'active' ? this.service.getActivePolicies() : this.service.getPolicies();
    obs.subscribe({
      next: (res) => {
        let data = res.data ?? [];
        if (this.policyFilter() === 'inactive') data = data.filter((p: any) => p.isActive === false);
        this.policies.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
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

  loadUnderwriters(): void {
    this.isLoading.set(true);
    this.service.getUnderwriters().subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        this.underwriters.set(data.map((u: any) => ({ ...u, active: u.active ?? u.isActive ?? true })));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadClaimsOfficers(): void {
    this.isLoading.set(true);
    this.service.getClaimsOfficers().subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        this.claimsOfficers.set(data.map((u: any) => ({ ...u, active: u.active ?? u.isActive ?? true })));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.service.getAllEvents().subscribe({
      next: (res: any) => { this.events.set(res.data ?? res); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  loadAllClaims(): void {
    this.isLoading.set(true);
    this.service.getClaims().subscribe({
      next: (res: any) => { this.allClaims.set(res.data ?? res); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  loadAllSubscriptions(): void {
    this.isLoading.set(true);
    this.service.getSubscriptions().subscribe({
      next: (res: any) => { this.allSubscriptions.set(res.data ?? res); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  submitPolicy(): void {
    if (this.policyForm.invalid) return;
    this.service.createPolicy(this.policyForm.getRawValue()).subscribe({
      next: () => { this.successMessage.set('Policy created!'); this.loadPolicies(); },
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
      password: '' // Optional
    });
    // Remove password requirement for edits
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
        this.setView(this.activeView() === 'edit-underwriter' ? 'view-underwriters' : 'view-claims-officers'); 
      },
      error: () => this.errorMessage.set('Update failed.')
    });
  }

  deletePolicy(id: number | undefined): void {
    if (!id || !confirm('Deactivate?')) return;
    this.service.deletePolicy(id).subscribe(() => this.loadPolicies());
  }

  assignUnderwriter(id: number, event: any): void {
    const uid = event.target.value;
    if (uid) this.service.assignUnderwriter(id, Number(uid)).subscribe(() => this.loadAllSubscriptions());
  }

  assignClaimsOfficer(id: number, event: any): void {
    const oid = event.target.value;
    if (oid) this.service.assignClaimsOfficer(id, Number(oid)).subscribe(() => this.loadAllClaims());
  }

  submitUnderwriter(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const val = this.userForm.getRawValue();
    this.service.createUnderwriter({ fullName: val.name, email: val.email, password: val.password, phone: val.phone }).subscribe({
      next: () => { this.successMessage.set('Underwriter created successfully.'); this.userForm.reset(); this.loadUnderwriters(); },
      error: () => this.errorMessage.set('Failed to create underwriter.'),
    });
  }

  submitClaimsOfficer(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const val = this.userForm.getRawValue();
    this.service.createClaimsOfficer({ fullName: val.name, email: val.email, password: val.password, phone: val.phone }).subscribe({
      next: () => { this.successMessage.set('Claims Officer created successfully.'); this.userForm.reset(); this.loadClaimsOfficers(); },
      error: () => this.errorMessage.set('Failed to create claims officer.'),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
