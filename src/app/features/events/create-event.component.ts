  import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { EventService } from './event.service';
import { FileClaimService } from '../file-claim/file-claim.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-event.component.html',
})
export class CreateEventComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly fileService = inject(FileClaimService);

  readonly eventTypes = ['OUTDOOR_MUSIC_CONCERT', 'CORPORATE_TECH_CONFERENCE'];

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  private selectedFile: File | null = null;

  today = new Date().toISOString().split('T')[0];

  readonly eventForm = this.fb.nonNullable.group({
    eventType: ['', Validators.required],
    eventName: ['', Validators.required],
    eventDate: ['', [Validators.required, this.pastDateValidator]],
    location: ['', Validators.required],
    budget: ['', [Validators.required, Validators.min(1000)]],
    numberOfAttendees: ['', [Validators.required, Validators.min(1)]],
    durationInDays: [1, [Validators.required, Validators.min(1)]],
    hasProfessionalSecurity: [false],
    hasCCTV: [false],
    hasMetalDetectors: [false],
    hasFireNOC: [false],
    hasOnSiteFireSafety: [false],
    safetyComplianceDocPath: [''],
    isOutdoor: [false],
    alcoholAllowed: [false],
    temporaryStage: [false],
    fireworksUsed: [false],
    celebrityInvolved: [false],
    venueType: ['', Validators.required],
    highValueEquipment: [false],
    temporaryBooths: [false],
    emergencyPreparednessLevel: [''],
  });

  // Signal for event type changes
  readonly selectedType = toSignal(this.eventForm.controls.eventType.valueChanges, { initialValue: '' });

  readonly isMusicConcert = computed(() => this.selectedType() === 'OUTDOOR_MUSIC_CONCERT');
  readonly isCorporateConference = computed(() => this.selectedType() === 'CORPORATE_TECH_CONFERENCE');

  constructor() {
    // Reactively update validators based on selectedType signal
    effect(() => {
      const type = this.selectedType();
      const venueCtrl = this.eventForm.controls.venueType;
      if (type === 'CORPORATE_TECH_CONFERENCE') {
        venueCtrl.setValidators(Validators.required);
      } else {
        venueCtrl.clearValidators();
        venueCtrl.setValue('');
      }
      venueCtrl.updateValueAndValidity();
    });
  }

  pastDateValidator(control: import('@angular/forms').AbstractControl) {
    if (!control.value) return null;
    const selected = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today ? { pastDate: true } : null;
  }

  ngOnInit(): void {}

  onSafetyFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.eventForm.patchValue({ safetyComplianceDocPath: file.name });
    }
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.selectedFile) {
      this.fileService.uploadFile(this.selectedFile).subscribe({
        next: (res: any) => {
          this.executeEventCreation(res.data);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to upload compliance document.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.executeEventCreation('');
    }
  }

  private executeEventCreation(uploadedPath: string): void {
    const formValue = this.eventForm.getRawValue();
    
    const commonPayload = {
      eventName: formValue.eventName,
      eventDate: formValue.eventDate,
      location: formValue.location,
      budget: formValue.budget,
      numberOfAttendees: formValue.numberOfAttendees,
      durationInDays: formValue.durationInDays,
      hasProfessionalSecurity: formValue.hasProfessionalSecurity,
      hasCCTV: formValue.hasCCTV,
      hasMetalDetectors: formValue.hasMetalDetectors,
      hasFireNOC: formValue.hasFireNOC,
      hasOnSiteFireSafety: formValue.hasOnSiteFireSafety,
      safetyComplianceDocPath: uploadedPath,
    };

    if (this.isMusicConcert()) {
      const payload = {
        ...commonPayload,
        isOutdoor: formValue.isOutdoor,
        alcoholAllowed: formValue.alcoholAllowed,
        temporaryStage: formValue.temporaryStage,
        fireworksUsed: formValue.fireworksUsed,
        celebrityInvolved: formValue.celebrityInvolved,
      };
      this.eventService.createMusicConcert(payload).subscribe({
        next: () => {
          this.successMessage.set('Event created successfully!');
          this.isSubmitting.set(false);
          this.eventForm.reset();
          this.selectedFile = null;
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to create event.');
          this.isSubmitting.set(false);
        },
      });
    } else if (this.isCorporateConference()) {
      const payload = {
        ...commonPayload,
        venueType: formValue.venueType,
        highValueEquipment: formValue.highValueEquipment,
        temporaryBooths: formValue.temporaryBooths,
        emergencyPreparednessLevel: formValue.emergencyPreparednessLevel,
      };
      this.eventService.createCorporateConference(payload).subscribe({
        next: () => {
          this.successMessage.set('Event created successfully!');
          this.isSubmitting.set(false);
          this.eventForm.reset();
          this.selectedFile = null;
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to create event.');
          this.isSubmitting.set(false);
        },
      });
    }
  }
}
