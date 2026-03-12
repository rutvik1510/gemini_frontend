import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // ── Public ────────────────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },

  // ── ADMIN ─────────────────────────────────────────────────────────
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./features/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'ADMIN' },
  },

  // ── CUSTOMER ──────────────────────────────────────────────────────
  {
    path: 'customer-dashboard',
    loadComponent: () =>
      import('./features/customer-dashboard/customer-dashboard.component').then(
        (m) => m.CustomerDashboardComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CUSTOMER' },
  },
  {
    path: 'create-event',
    loadComponent: () =>
      import('./features/events/create-event.component').then(
        (m) => m.CreateEventComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CUSTOMER' },
  },
  {
    path: 'my-events',
    loadComponent: () =>
      import('./features/my-events/my-events.component').then(
        (m) => m.MyEventsComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CUSTOMER' },
  },
  {
    path: 'event-details/:id',
    loadComponent: () =>
      import('./features/event-details/event-details.component').then(
        (m) => m.EventDetailsComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CUSTOMER' },
  },
  {
    path: 'my-subscriptions',
    loadComponent: () =>
      import('./features/my-subscriptions/my-subscriptions.component').then(
        (m) => m.MySubscriptionsComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CUSTOMER' },
  },
  {
    path: 'file-claim',
    loadComponent: () =>
      import('./features/file-claim/file-claim.component').then(
        (m) => m.FileClaimComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CUSTOMER' },
  },
  {
    path: 'file-claim/:subscriptionId',
    loadComponent: () =>
      import('./features/file-claim/file-claim.component').then(
        (m) => m.FileClaimComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CUSTOMER' },
  },
  {
    path: 'my-claims',
    loadComponent: () =>
      import('./features/customer-claims/customer-claims.component').then(
        (m) => m.CustomerClaimsComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CUSTOMER' },
  },

  // ── UNDERWRITER ───────────────────────────────────────────────────
  {
    path: 'underwriter-dashboard',
    loadComponent: () =>
      import('./features/underwriter-dashboard/underwriter-dashboard.component').then(
        (m) => m.UnderwriterDashboardComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'UNDERWRITER' },
  },
  {
    path: 'underwriter/subscription/:id',
    loadComponent: () =>
      import('./features/subscription-review/subscription-review.component').then(
        (m) => m.SubscriptionReviewComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'UNDERWRITER' },
  },

  // ── CLAIMS OFFICER ────────────────────────────────────────────────
  {
    path: 'claims-dashboard',
    loadComponent: () =>
      import('./features/claims-officer/claims-officer-dashboard.component').then(
        (m) => m.ClaimsOfficerDashboardComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CLAIMS_OFFICER' },
  },
  {
    path: 'claims-detail/:id',
    loadComponent: () =>
      import('./features/claims-officer/claims-officer-detail.component').then(
        (m) => m.ClaimsOfficerDetailComponent,
      ),
    canActivate: [roleGuard],
    data: { role: 'CLAIMS_OFFICER' },
  },
];
