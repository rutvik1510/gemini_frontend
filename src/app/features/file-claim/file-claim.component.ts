import { Component, inject, OnInit, signal } from '@angular/core';
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
  private selectedFile: File | null = null;

  readonly form = this.fb.nonNullable.group({
    subscriptionId: [this.paramId ? Number(this.paramId) : '', [Validators.required, Validators.min(1)]],
    incidentDate: ['', Validators.required],
    filedAt: [new Date().toISOString().substring(0, 16), Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    claimAmount: ['', [Validators.required, Validators.min(1)]],
    evidenceDocPath: [''],
  });

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly fileError = signal<string | null>(null);

  ngOnInit(): void {
    this.subService.getMySubscriptions().subscribe({
      next: (res: any) => {
        const subs = res.data ?? res;
        if (Array.isArray(subs)) {
          const validSubs = subs.filter(s => {
            return s.status?.toUpperCase() === 'PAID' && !s.hasClaim && !s.isLocked;
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

    // Auto-sync Filing Date if Incident Date is moved to the future
    this.form.controls.incidentDate.valueChanges.subscribe((val) => {
      if (val) {
        const incDate = new Date(val);
        const currentFiledAt = new Date(this.form.controls.filedAt.value);
        
        if (incDate > currentFiledAt) {
          // Sync filing date to incident date (keeping it logical)
          // We add 1 minute to ensure it's strictly not 'before'
          const syncDate = new Date(incDate);
          const now = new Date();
          syncDate.setHours(now.getHours(), now.getMinutes());
          this.form.patchValue({ filedAt: syncDate.toISOString().substring(0, 16) });
        }
      }
    });
  }

  get selectedSubscription() {
    const subId = Number(this.form.controls.subscriptionId.value);
    if (!subId) return null;
    return this.availableSubscriptions().find(s => s.subscriptionId === subId) || null;
  }

  get maxCoverageAmt(): number {
    const sub = this.selectedSubscription;
    return sub?.maxCoverageAmount ?? sub?.policy?.maxCoverageAmount ?? 0;
  }

  get eventDate(): string {
    const sub = this.selectedSubscription;
    return sub?.eventDate ?? sub?.event?.eventDate ?? '';
  }

  private updateClaimAmountValidator(): void {
    const max = this.maxCoverageAmt;
    this.form.controls.claimAmount.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(max)
    ]);
    this.form.controls.claimAmount.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const { subscriptionId, incidentDate, filedAt, description, claimAmount } = this.form.getRawValue();

    if (this.selectedFile) {
      this.service.uploadFile(this.selectedFile).subscribe({
        next: (fileRes: any) => {
          const uploadedFileName = fileRes.data;
          this.submitClaim(subscriptionId, incidentDate, filedAt, description, claimAmount, uploadedFileName);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to upload evidence file.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.submitClaim(subscriptionId, incidentDate, filedAt, description, claimAmount, '');
    }
  }

  private submitClaim(subscriptionId: any, incidentDate: any, filedAt: any, description: any, claimAmount: any, evidenceDocPath: string): void {
    this.service.fileClaim({
      subscriptionId: Number(subscriptionId),
      incidentDate,
      filedAt,
      description,
      claimAmount: Number(claimAmount),
      evidenceDocPath
    }).subscribe({
      next: () => {
        this.successMessage.set('Claim filed successfully! Redirecting...');
        this.isSubmitting.set(false);
        setTimeout(() => this.router.navigate(['/my-subscriptions']), 1500);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to file claim. Please try again.');
        this.isSubmitting.set(false);
      },
    });
  }

  onEvidenceFileSelected(event: any): void {
    this.fileError.set(null);
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        this.selectedFileName.set(file.name);
        this.selectedFile = file;
        this.form.patchValue({ evidenceDocPath: file.name });
      } else {
        this.fileError.set('Please upload a PDF or Image file.');
        this.selectedFileName.set(null);
        this.selectedFile = null;
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/my-subscriptions']);
  }
}
