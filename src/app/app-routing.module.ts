import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./features/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'customer-dashboard',
    loadComponent: () =>
      import('./features/customer-dashboard/customer-dashboard.component').then(
        (m) => m.CustomerDashboardComponent,
      ),
  },
  {
    path: 'create-event',
    loadComponent: () =>
      import('./features/events/create-event.component').then(
        (m) => m.CreateEventComponent,
      ),
  },
  {
    path: 'my-events',
    loadComponent: () =>
      import('./features/my-events/my-events.component').then(
        (m) => m.MyEventsComponent,
      ),
  },
  {
    path: 'event-details/:id',
    loadComponent: () =>
      import('./features/event-details/event-details.component').then(
        (m) => m.EventDetailsComponent,
      ),
  },
  {
    path: 'my-subscriptions',
    loadComponent: () =>
      import('./features/my-subscriptions/my-subscriptions.component').then(
        (m) => m.MySubscriptionsComponent,
      ),
  },
  {
    path: 'file-claim',
    loadComponent: () =>
      import('./features/file-claim/file-claim.component').then(
        (m) => m.FileClaimComponent,
      ),
  },
  {
    path: 'file-claim/:subscriptionId',
    loadComponent: () =>
      import('./features/file-claim/file-claim.component').then(
        (m) => m.FileClaimComponent,
      ),
  },
  {
    path: 'underwriter-dashboard',
    loadComponent: () =>
      import('./features/underwriter-dashboard/underwriter-dashboard.component').then(
        (m) => m.UnderwriterDashboardComponent,
      ),
  },
  {
    path: 'underwriter/subscription/:id',
    loadComponent: () =>
      import('./features/subscription-review/subscription-review.component').then(
        (m) => m.SubscriptionReviewComponent,
      ),
  },
  {
    path: 'claims-dashboard',
    loadComponent: () =>
      import('./features/claims-officer/claims-officer-dashboard.component').then(
        (m) => m.ClaimsOfficerDashboardComponent,
      ),
  },
  {
    path: 'claims-detail/:id',
    loadComponent: () =>
      import('./features/claims-officer/claims-officer-detail.component').then(
        (m) => m.ClaimsOfficerDetailComponent,
      ),
  },
  {
    path: 'my-claims',
    loadComponent: () =>
      import('./features/customer-claims/customer-claims.component').then(
        (m) => m.CustomerClaimsComponent,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
