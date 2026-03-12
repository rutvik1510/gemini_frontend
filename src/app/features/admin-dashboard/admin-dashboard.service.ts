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
  isActive?: boolean;
  status?: string;
}

export interface CreatePolicyRequest {
  policyName: string;
  description: string;
  domain: string;
  baseRate: number;
  maxCoverageAmount: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
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
  pendingSubscriptions: number;
  pendingClaims: number;
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

  createUnderwriter(payload: CreateUserRequest): Observable<unknown> {
    return this.http.post(`${this.base}/create-underwriter`, payload);
  }

  createClaimsOfficer(payload: CreateUserRequest): Observable<unknown> {
    return this.http.post(`${this.base}/create-claims-officer`, payload);
  }

  getUnderwriters(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/dashboard/underwriters`);
  }

  getClaimsOfficers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/dashboard/claims-officers`);
  }

  getStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.base}/dashboard/stats`);
  }

  getAllEvents(): Observable<ApiResponse<AdminEvent[]>> {
    return this.http.get<ApiResponse<AdminEvent[]>>(`${this.base}/events`);
  }
}
