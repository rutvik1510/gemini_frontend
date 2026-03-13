  import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EventService } from './event.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-event.component.html',
})
export class CreateEventComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);

  readonly eventTypes = ['OUTDOOR_MUSIC_CONCERT', 'CORPORATE_TECH_CONFERENCE'];

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  today = new Date().toISOString().split('T')[0];

  readonly eventForm = this.fb.nonNullable.group({
    eventType: ['', Validators.required],

    // Common fields
    eventName: ['', Validators.required],
    eventDate: ['', [Validators.required, this.pastDateValidator]],
    location: ['', Validators.required],
    budget: ['', [Validators.required, Validators.min(1000)]],
    numberOfAttendees: ['', [Validators.required, Validators.min(1)]],
    durationInDays: [1, [Validators.required, Validators.min(1)]],

    // Objective Safety & Security (Replaces subjective dropdowns)
    hasProfessionalSecurity: [false],
    hasCCTV: [false],
    hasMetalDetectors: [false],
    hasFireNOC: [false],
    hasOnSiteFireSafety: [false],
    safetyComplianceDocPath: [''],

    // Music Concert specific
    isOutdoor: [false],
    alcoholAllowed: [false],
    temporaryStage: [false],
    fireworksUsed: [false],
    celebrityInvolved: [false],

    // Corporate Conference specific
    venueType: ['', Validators.required],
    highValueEquipment: [false],
    temporaryBooths: [false],
    emergencyPreparednessLevel: [''],
  });

  pastDateValidator(control: import('@angular/forms').AbstractControl) {
    if (!control.value) return null;
    const selected = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today ? { pastDate: true } : null;
  }

  ngOnInit(): void {
    this.eventForm.controls.eventType.valueChanges.subscribe((type) => {
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

  get selectedType(): string {
    return this.eventForm.controls.eventType.value;
  }

  get isMusicConcert(): boolean {
    return this.selectedType === 'OUTDOOR_MUSIC_CONCERT';
  }

  get isCorporateConference(): boolean {
    return this.selectedType === 'CORPORATE_TECH_CONFERENCE';
  }

  onSafetyFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // For this project, we just store the filename as a placeholder for the path
      this.eventForm.patchValue({ safetyComplianceDocPath: file.name });
    }
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const formValue = this.eventForm.getRawValue();
    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // Use common payload for all factual data
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
      safetyComplianceDocPath: formValue.safetyComplianceDocPath,
    };

    if (this.isMusicConcert) {
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
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to create event.');
          this.isSubmitting.set(false);
        },
      });
    } else if (this.isCorporateConference) {
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
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to create event.');
          this.isSubmitting.set(false);
        },
      });
    }
  }
}
