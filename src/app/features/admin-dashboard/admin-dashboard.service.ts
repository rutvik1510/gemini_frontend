import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Policy {
  id?: number;
  policyId?: number;
  policyName: string;
  description: string;
  domain: string;
  baseRate: number;
  maxCoverageAmount: number;
  coversTheft: boolean;
  coversWeather: boolean;
  coversFire: boolean;
  coversCancelation: boolean;
  isActive?: boolean;
  status?: string;
}

export interface CreatePolicyRequest {
  policyName: string;
  description: string;
  domain: string;
  baseRate: number;
  maxCoverageAmount: number;
  coversTheft: boolean;
  coversWeather: boolean;
  coversFire: boolean;
  coversCancelation: boolean;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
  timestamp: string;
}

export interface AdminStats {
  totalPolicies: number;
  activePolicies: number;
  totalEvents: number;
  totalUsers: number;
  pendingSubscriptions: number;
  pendingClaims: number;
  successfulClaims: number;
  settledClaims: number;
  totalRevenue: number;
  totalPayouts: number;
}

export interface AdminEvent {
  eventId?: number;
  id?: number;
  eventName: string;
  eventDate: string;
  location: string;
  eventType: string;
  organizerName?: string;
  organizerEmail?: string;
  expectedAttendance?: number;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/admin';

  getPolicies(): Observable<ApiResponse<Policy[]>> {
    return this.http.get<ApiResponse<Policy[]>>(`${this.base}/policies`);
  }

  getActivePolicies(): Observable<ApiResponse<Policy[]>> {
    return this.http.get<ApiResponse<Policy[]>>(`${this.base}/policies/active`);
  }

  createPolicy(payload: CreatePolicyRequest): Observable<ApiResponse<Policy>> {
    return this.http.post<ApiResponse<Policy>>(`${this.base}/policies`, payload);
  }

  updatePolicy(policyId: number, payload: CreatePolicyRequest): Observable<ApiResponse<Policy>> {
    return this.http.put<ApiResponse<Policy>>(`${this.base}/policies/${policyId}`, payload);
  }

  deletePolicy(policyId: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/policies/${policyId}`);
  }

  activatePolicy(policyId: number): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.base}/policies/${policyId}/activate`, {});
  }

  createUnderwriter(payload: CreateUserRequest): Observable<unknown> {
    return this.http.post(`${this.base}/create-underwriter`, payload);
  }

  createClaimsOfficer(payload: CreateUserRequest): Observable<unknown> {
    return this.http.post(`${this.base}/create-claims-officer`, payload);
  }

  updateUser(id: number, payload: CreateUserRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/users/${id}`, payload);
  }

  getUnderwriters(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/underwriters`);
  }

  getClaimsOfficers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/claims-officers`);
  }

  getStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.base}/dashboard/stats`);
  }

  getAllEvents(): Observable<ApiResponse<AdminEvent[]>> {
    return this.http.get<ApiResponse<AdminEvent[]>>(`${this.base}/events`);
  }

  getSubscriptions(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/subscriptions`);
  }

  getClaims(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/claims`);
  }

  assignUnderwriter(subscriptionId: number, underwriterId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/subscriptions/${subscriptionId}/assign/${underwriterId}`, {});
  }

  assignClaimsOfficer(claimId: number, officerId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/claims/${claimId}/assign/${officerId}`, {});
  }
}
