import { Component, inject, OnInit } from '@angular/core';
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

  successMessage: string | null = null;
  errorMessage: string | null = null;
  isSubmitting = false;

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
    locationRiskLevel: ['', Validators.required],
    securityLevel: ['', Validators.required],

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
    // Dynamically add/remove required validator on venueType based on event type
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

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    const formValue = this.eventForm.getRawValue();
    this.isSubmitting = true;
    this.successMessage = null;
    this.errorMessage = null;

    if (this.isMusicConcert) {
      const payload = {
        eventName: formValue.eventName,
        eventDate: formValue.eventDate,
        location: formValue.location,
        budget: formValue.budget,
        numberOfAttendees: formValue.numberOfAttendees,
        durationInDays: formValue.durationInDays,
        locationRiskLevel: formValue.locationRiskLevel,
        securityLevel: formValue.securityLevel,
        isOutdoor: formValue.isOutdoor,
        alcoholAllowed: formValue.alcoholAllowed,
        temporaryStage: formValue.temporaryStage,
        fireworksUsed: formValue.fireworksUsed,
        celebrityInvolved: formValue.celebrityInvolved,
      };
      this.eventService.createMusicConcert(payload).subscribe({
        next: (res) => {
          console.log('Music concert created:', res);
          this.successMessage = 'Event created successfully!';
          this.isSubmitting = false;
          this.eventForm.reset();
        },
        error: (err) => {
          console.error('Failed to create music concert:', err);
          this.errorMessage = 'Failed to create event. Please try again.';
          this.isSubmitting = false;
        },
      });
    } else if (this.isCorporateConference) {
      const payload = {
        eventName: formValue.eventName,
        eventDate: formValue.eventDate,
        location: formValue.location,
        budget: formValue.budget,
        numberOfAttendees: formValue.numberOfAttendees,
        durationInDays: formValue.durationInDays,
        locationRiskLevel: formValue.locationRiskLevel,
        securityLevel: formValue.securityLevel,
        venueType: formValue.venueType,
        highValueEquipment: formValue.highValueEquipment,
        temporaryBooths: formValue.temporaryBooths,
        emergencyPreparednessLevel: formValue.emergencyPreparednessLevel,
      };
      this.eventService.createCorporateConference(payload).subscribe({
        next: (res) => {
          console.log('Corporate conference created:', res);
          this.successMessage = 'Event created successfully!';
          this.isSubmitting = false;
          this.eventForm.reset();
        },
        error: (err) => {
          console.error('Failed to create corporate conference:', err);
          this.errorMessage = 'Failed to create event. Please try again.';
          this.isSubmitting = false;
        },
      });
    }
  }
}
