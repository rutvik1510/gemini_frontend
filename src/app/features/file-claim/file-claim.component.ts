import { Component, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
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
  private readonly platformId = inject(PLATFORM_ID);

  readonly paramId = this.route.snapshot.paramMap.get('subscriptionId');
  readonly availableSubscriptions = signal<any[]>([]);
  readonly selectedFileName = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    subscriptionId: [this.paramId ? Number(this.paramId) : '', [Validators.required, Validators.min(1)]],
    incidentDate: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    claimAmount: ['', [Validators.required, Validators.min(1)]],
  });

  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  ngOnInit(): void {
    let claimedIds = new Set<number>();
    if (isPlatformBrowser(this.platformId)) {
      const storedClaimed: number[] = JSON.parse(localStorage.getItem('claimedSubscriptions') ?? '[]');
      claimedIds = new Set(storedClaimed.map(v => Number(v)));
    }

    this.subService.getMySubscriptions().subscribe({
      next: (res: any) => {
        const subs = res.data ?? res;
        if (Array.isArray(subs)) {
          let paidIds = new Set<number>();
          if (isPlatformBrowser(this.platformId)) {
            const stored: number[] = JSON.parse(localStorage.getItem('paidSubscriptions') ?? '[]');
            paidIds = new Set(stored.map(v => Number(v)));
          }

          const validSubs = subs.filter(s => {
            const status = s.status?.toUpperCase();
            if (claimedIds.has(Number(s.subscriptionId))) return false; // Hide if already claimed
            if (status === 'ACTIVE') return true;
            if (status === 'APPROVED' && paidIds.has(Number(s.subscriptionId))) return true;
            return false;
          });
          this.availableSubscriptions.set(validSubs);
          
          if (this.form.controls.subscriptionId.value) {
            this.updateClaimAmountValidator();
          }
        }
      },
      error: (err) => console.error('Failed to load subscriptions', err)
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

    this.isSubmitting = true;
    this.successMessage = null;
    this.errorMessage = null;

    const { description, claimAmount, incidentDate, subscriptionId } = this.form.getRawValue();

    this.service.fileClaim({
      subscriptionId: Number(subscriptionId),
      incidentDate,
      description,
      claimAmount: Number(claimAmount),
    }).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          // Update claimedSubscriptions
          const subIdNum = Number(subscriptionId);
          const claimedStr = localStorage.getItem('claimedSubscriptions');
          const claimedList: number[] = claimedStr ? JSON.parse(claimedStr) : [];
          if (!claimedList.includes(subIdNum)) {
            claimedList.push(subIdNum);
            localStorage.setItem('claimedSubscriptions', JSON.stringify(claimedList));
          }

          // Update claimedEvents if we can find the event ID
          const selectedSub = this.availableSubscriptions().find(s => s.subscriptionId === subIdNum);
          if (selectedSub && (selectedSub.event?.eventId || selectedSub.eventId)) {
            const eventId = Number(selectedSub.event?.eventId || selectedSub.eventId);
            const claimedEventsStr = localStorage.getItem('claimedEvents');
            const claimedEventsList: number[] = claimedEventsStr ? JSON.parse(claimedEventsStr) : [];
            if (!claimedEventsList.includes(eventId)) {
              claimedEventsList.push(eventId);
              localStorage.setItem('claimedEvents', JSON.stringify(claimedEventsList));
            }
          }
        }
        
        this.successMessage = 'Claim filed successfully!';
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/my-subscriptions']), 1500);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to file claim. Please try again.';
        this.isSubmitting = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFileName.set(file.name);
      } else {
        alert('Please upload a PDF file.');
        input.value = '';
        this.selectedFileName.set(null);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/my-subscriptions']);
  }
}
