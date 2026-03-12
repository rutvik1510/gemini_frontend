import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe, isPlatformBrowser, NgClass } from '@angular/common';
import { AdminDashboardService, AdminEvent, Policy, CreateUserRequest } from './admin-dashboard.service';
import { AuthService } from '../../core/auth.service';
import { ClaimsOfficerService } from '../claims-officer/claims-officer.service';
import { UnderwriterDashboardService } from '../underwriter-dashboard/underwriter-dashboard.service';

type ActiveView = 'dashboard' | 'policies' | 'create-policy' | 'edit-policy' | 'create-underwriter' | 'create-claims-officer' | 'view-underwriters' | 'view-claims-officers' | 'view-events' | 'view-all-claims' | 'view-all-subscriptions';

function decodeJwtEmail(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload['sub'] ?? payload['email'] ?? 'Admin';
  } catch {
    return 'Admin';
  }
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, NgClass],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly service = inject(AdminDashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly claimsOfficerService = inject(ClaimsOfficerService);
  private readonly underwriterService = inject(UnderwriterDashboardService);

  readonly activeView = signal<ActiveView>('dashboard');
  readonly policies = signal<Policy[]>([]);
  readonly underwriters = signal<any[]>([]);
  readonly claimsOfficers = signal<any[]>([]);
  readonly events = signal<AdminEvent[]>([]);
  readonly allClaims = signal<any[]>([]);
  readonly allSubscriptions = signal<any[]>([]);
  readonly totalClaimsAmount = signal<number>(0);
  readonly stats = signal<any>(null);
  readonly adminEmail = signal<string>('Admin');
  readonly isLoadingPolicies = signal(false);
  readonly isLoadingUsers = signal(false);
  readonly isLoadingEvents = signal(false);
  readonly isLoadingClaims = signal(false);
  readonly isLoadingSubscriptions = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly sidebarOpen = signal(true);
  readonly policyFilter = signal<'active' | 'inactive'>('active');
  private editingPolicyId = signal<number | null>(null);

  readonly policyForm = this.fb.nonNullable.group({
    policyName: ['', Validators.required],
    description: ['', Validators.required],
    domain: ['', Validators.required],
    baseRate: [0, [Validators.required, Validators.min(0)]],
    maxCoverageAmount: [0, [Validators.required, Validators.min(1)]],
    deductible: [0, [Validators.required, Validators.min(0)]],
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
    if (!isPlatformBrowser(this.platformId)) return; // Skip all HTTP calls during SSR
    const token = this.authService.getToken();
    if (token) {
      this.adminEmail.set(decodeJwtEmail(token));
    }
    this.loadStats();
    this.loadActivePolicies();
    this.loadAllClaims();
  }

  loadStats(): void {
    this.service.getStats().subscribe({
      next: (res) => this.stats.set(res.data),
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  setView(view: ActiveView): void {
    this.activeView.set(view);
    this.clearMessages();
    this.policyForm.reset();
    this.userForm.reset();
    
    if (view === 'view-underwriters') {
      this.loadUnderwriters();
    } else if (view === 'view-claims-officers') {
      this.loadClaimsOfficers();
    } else if (view === 'policies') {
      this.loadPolicies();
    } else if (view === 'dashboard') {
      this.loadStats();
    } else if (view === 'view-events') {
      this.loadEvents();
    } else if (view === 'view-all-claims') {
      this.loadAllClaims();
    } else if (view === 'view-all-subscriptions') {
      this.loadAllSubscriptions();
    }
  }

  loadPolicies(): void {
    if (this.policyFilter() === 'active') {
      this.loadActivePolicies();
    } else {
      this.loadInactivePolicies();
    }
  }

  loadActivePolicies(): void {
    this.policyFilter.set('active');
    this.isLoadingPolicies.set(true);
    this.service.getActivePolicies().subscribe({
      next: (res) => {
        this.policies.set(res.data ?? []);
        this.isLoadingPolicies.set(false);
      },
      error: () => {
        // fallback: get all and filter
        this.service.getPolicies().subscribe({
          next: (res) => {
            this.policies.set((res.data ?? []).filter(p => p.isActive !== false));
            this.isLoadingPolicies.set(false);
          },
          error: () => {
            this.isLoadingPolicies.set(false);
            this.errorMessage.set('Failed to load policies.');
          },
        });
      },
    });
  }

  loadInactivePolicies(): void {
    this.policyFilter.set('inactive');
    this.isLoadingPolicies.set(true);
    this.service.getPolicies().subscribe({
      next: (res) => {
        this.policies.set((res.data ?? []).filter(p => p.isActive === false));
        this.isLoadingPolicies.set(false);
      },
      error: () => {
        this.isLoadingPolicies.set(false);
        this.errorMessage.set('Failed to load policies.');
      },
    });
  }

  submitPolicy(): void {
    if (this.policyForm.invalid) { this.policyForm.markAllAsTouched(); return; }
    const payload = this.policyForm.getRawValue();
    this.service.createPolicy(payload).subscribe({
      next: () => {
        this.successMessage.set('Policy created successfully.');
        this.policyForm.reset();
        this.loadActivePolicies();
      },
      error: () => this.errorMessage.set('Failed to create policy.'),
    });
  }

  startEditPolicy(policy: Policy): void {
    this.editingPolicyId.set(policy.policyId ?? policy.id ?? null);
    this.policyForm.patchValue({
      policyName: policy.policyName,
      description: policy.description,
      domain: policy.domain,
      baseRate: policy.baseRate,
      maxCoverageAmount: policy.maxCoverageAmount,
      deductible: policy.deductible,
      coversTheft: policy.coversTheft,
      coversWeather: policy.coversWeather,
      coversFire: policy.coversFire,
      coversCancelation: policy.coversCancelation,
    });
    this.clearMessages();
    this.activeView.set('edit-policy');
  }

  submitEditPolicy(): void {
    if (this.policyForm.invalid) { this.policyForm.markAllAsTouched(); return; }
    const id = this.editingPolicyId();
    if (id === null) return;
    this.service.updatePolicy(id, this.policyForm.getRawValue()).subscribe({
      next: () => {
        this.successMessage.set('Policy updated successfully.');
        this.policyForm.reset();
        this.editingPolicyId.set(null);
        this.activeView.set('policies');
        this.loadPolicies();
      },
      error: () => this.errorMessage.set('Failed to update policy.'),
    });
  }

  deletePolicy(id: number | undefined): void {
    console.log('Delete clicked for policy id:', id);
    if (id === undefined || id === null) {
      console.error('deletePolicy: id is undefined — backend policy object:', id);
      return;
    }
    if (!confirm('Are you sure you want to deactivate this policy?')) return;
    this.service.deletePolicy(id).subscribe({
      next: () => {
        console.log('Policy deleted successfully');
        this.successMessage.set('Policy deactivated successfully.');
        this.loadActivePolicies();
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.errorMessage.set('Failed to delete policy.');
      },
    });
  }

  submitUnderwriter(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const val = this.userForm.getRawValue();
    const payload: CreateUserRequest = {
      fullName: val.name,
      email: val.email,
      password: val.password,
      phone: val.phone
    };
    this.service.createUnderwriter(payload).subscribe({
      next: () => { this.successMessage.set('Underwriter created successfully.'); this.userForm.reset(); },
      error: (err) => { console.error('Create underwriter error:', err); this.errorMessage.set('Failed to create underwriter.'); },
    });
  }

  submitClaimsOfficer(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const val = this.userForm.getRawValue();
    const payload: CreateUserRequest = {
      fullName: val.name,
      email: val.email,
      password: val.password,
      phone: val.phone
    };
    this.service.createClaimsOfficer(payload).subscribe({
      next: () => { this.successMessage.set('Claims Officer created successfully.'); this.userForm.reset(); },
      error: (err) => { console.error('Create claims officer error:', err); this.errorMessage.set('Failed to create claims officer.'); },
    });
  }

  loadUnderwriters(): void {
    this.isLoadingUsers.set(true);
    this.service.getUnderwriters().subscribe({
      next: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        // Normalize status field for robust display
        const normalized = data.map((u: any) => ({
          ...u,
          active: u.active ?? u.isActive ?? true
        }));
        this.underwriters.set(normalized);
        this.isLoadingUsers.set(false);
      },
      error: (err) => {
        console.error('Load underwriters error:', err);
        this.errorMessage.set('Failed to load underwriters.');
        this.isLoadingUsers.set(false);
      }
    });
  }

  loadClaimsOfficers(): void {
    this.isLoadingUsers.set(true);
    this.service.getClaimsOfficers().subscribe({
      next: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        // Normalize status field for robust display
        const normalized = data.map((u: any) => ({
          ...u,
          active: u.active ?? u.isActive ?? true
        }));
        this.claimsOfficers.set(normalized);
        this.isLoadingUsers.set(false);
      },
      error: (err) => {
        console.error('Load claims officers error:', err);
        this.errorMessage.set('Failed to load claims officers.');
        this.isLoadingUsers.set(false);
      }
    });
  }

  loadEvents(): void {
    this.isLoadingEvents.set(true);
    this.service.getAllEvents().subscribe({
      next: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        this.events.set(data);
        this.isLoadingEvents.set(false);
      },
      error: (err: any) => {
        console.error('Load events error:', err);
        this.errorMessage.set('Failed to load events.');
        this.isLoadingEvents.set(false);
      },
    });
  }

  loadAllClaims(): void {
    this.isLoadingClaims.set(true);
    this.claimsOfficerService.getClaims().subscribe({
      next: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        this.allClaims.set(data);
        
        // Calculate total claims amount
        const total = data.reduce((sum: number, claim: any) => {
          return sum + (Number(claim.claimAmount) || 0);
        }, 0);
        this.totalClaimsAmount.set(total);
        
        this.isLoadingClaims.set(false);
      },
      error: (err: any) => {
        console.error('Load claims error:', err);
        this.errorMessage.set('Failed to load claims.');
        this.isLoadingClaims.set(false);
      },
    });
  }

  loadAllSubscriptions(): void {
    this.isLoadingSubscriptions.set(true);
    this.underwriterService.getAllSubscriptions().subscribe({
      next: (res: any) => {
        const data = res?.data ?? (Array.isArray(res) ? res : []);
        this.allSubscriptions.set(data);
        this.isLoadingSubscriptions.set(false);
      },
      error: (err: any) => {
        console.error('Load subscriptions error:', err);
        this.errorMessage.set('Failed to load subscriptions.');
        this.isLoadingSubscriptions.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  private clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }
}
