import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateEventComponent } from './create-event.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { EventService } from './event.service';
import { FileClaimService } from '../file-claim/file-claim.service';
import { of } from 'rxjs';

describe('CreateEventComponent', () => {
  let component: CreateEventComponent;
  let fixture: ComponentFixture<CreateEventComponent>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let fileServiceSpy: jasmine.SpyObj<FileClaimService>;

  beforeEach(async () => {
    eventServiceSpy = jasmine.createSpyObj('EventService', ['createMusicConcert', 'createCorporateConference']);
    fileServiceSpy = jasmine.createSpyObj('FileClaimService', ['uploadFile']);

    await TestBed.configureTestingModule({
      imports: [CreateEventComponent, ReactiveFormsModule],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: FileClaimService, useValue: fileServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    expect(component.eventForm.valid).toBeFalse();
  });

  it('should validate budget minimum value', () => {
    const budgetControl = component.eventForm.controls.budget;
    budgetControl.setValue('500');
    expect(budgetControl.hasError('min')).toBeTrue();
    
    budgetControl.setValue('1500');
    expect(budgetControl.hasError('min')).toBeFalse();
  });

  it('should call createMusicConcert when form is valid and type is music', () => {
    // Fill required fields
    component.eventForm.patchValue({
      eventType: 'OUTDOOR_MUSIC_CONCERT',
      eventName: 'Summer Fest',
      eventDate: '2026-12-12',
      location: 'NYC',
      budget: '5000',
      numberOfAttendees: '100'
    });

    eventServiceSpy.createMusicConcert.and.returnValue(of({ success: true }));
    
    component.onSubmit();

    expect(eventServiceSpy.createMusicConcert).toHaveBeenCalled();
    expect(component.successMessage()).toBe('Event created successfully!');
  });
});
