import { Component, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FileClaimService } from './file-claim.service';
import { MySubscriptionsService } from '../my-subscriptions/my-subscriptions.service';

@Component({
  selector: 'app-file-claim',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './file-claim.component.html',
})
export class FileClaimComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FileClaimService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subService = inject(MySubscriptionsService);

  readonly paramId = this.route.snapshot.paramMap.get('subscriptionId');
  readonly availableSubscriptions = signal<any[]>([]);
  readonly selectedFileName = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    subscriptionId: [this.paramId ? Number(this.paramId) : '', [Validators.required, Validators.min(1)]],
    incidentDate: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    claimAmount: ['', [Validators.required, Validators.min(1)]],
    evidenceDocPath: [''],
  });

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // 100% Backend Driven: Fetch latest subscription states
    this.subService.getMySubscriptions().subscribe({
      next: (res: any) => {
        const subs = res.data ?? res;
        if (Array.isArray(subs)) {
          const validSubs = subs.filter(s => {
            // Rule: Must be PAID and have NO existing claim according to the DB
            return s.status?.toUpperCase() === 'PAID' && !s.hasClaim;
          });
          this.availableSubscriptions.set(validSubs);
          
          if (this.form.controls.subscriptionId.value) {
            this.updateClaimAmountValidator();
          }
        }
      },
      error: (err) => console.error('Failed to load subscriptions from backend', err)
    });

    this.form.controls.subscriptionId.valueChanges.subscribe(() => {
      this.updateClaimAmountValidator();
    });
  }

  get selectedSubscription() {
    const subId = Number(this.form.controls.subscriptionId.value);
    if (!subId) return null;
    return this.availableSubscriptions().find(s => s.subscriptionId === subId) || null;
  }

  get maxCoverageAmt(): number {
    const sub = this.selectedSubscription;
    return sub ? (sub.maxCoverageAmount ?? sub.policy?.maxCoverageAmount ?? 0) : 0;
  }

  get eventDate(): string {
    const sub = this.selectedSubscription;
    return sub ? (sub.event?.eventDate ?? sub.eventDate) : '';
  }

  private updateClaimAmountValidator(): void {
    const maxAmt = this.maxCoverageAmt;
    if (maxAmt > 0) {
      this.form.controls.claimAmount.setValidators([Validators.required, Validators.min(1), Validators.max(maxAmt)]);
    } else {
      this.form.controls.claimAmount.setValidators([Validators.required, Validators.min(1)]);
    }
    this.form.controls.claimAmount.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const { description, claimAmount, incidentDate, subscriptionId, evidenceDocPath } = this.form.getRawValue();

    // Send to backend for final validation and storage
    this.service.fileClaim({
      subscriptionId: Number(subscriptionId),
      incidentDate,
      description,
      claimAmount: Number(claimAmount),
      evidenceDocPath
    }).subscribe({
      next: () => {
        this.successMessage.set('Claim filed successfully! Redirecting...');
        this.isSubmitting.set(false);
        // Refresh purely from backend after a small delay
        setTimeout(() => this.router.navigate(['/my-subscriptions']), 1500);
      },
      error: (err) => {
        // Backend returned a validation error (e.g., policy not paid, duplicate claim)
        this.errorMessage.set(err?.error?.message ?? 'Failed to file claim. Please try again.');
        this.isSubmitting.set(false);
      },
    });
  }

  onEvidenceFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        this.selectedFileName.set(file.name);
        this.form.patchValue({ evidenceDocPath: file.name });
      } else {
        alert('Please upload a PDF or Image file.');
        this.selectedFileName.set(null);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/my-subscriptions']);
  }
}
