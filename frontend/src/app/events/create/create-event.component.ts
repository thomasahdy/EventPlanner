import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService, CreateEventRequest } from '../../services/event.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private router = inject(Router);

  eventForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  constructor() {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      date: ['', Validators.required],
      time: ['', Validators.required],
      location: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSubmit(): void {
    if (this.eventForm.valid) {
      this.isSubmitting = true;
      this.error = null;
      this.success = null;

      // Combine date and time
      const formData = this.eventForm.value;
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      const eventRequest: CreateEventRequest = {
        title: formData.title,
        description: formData.description,
        date: dateTime.toISOString(),
        location: formData.location
      };

      this.eventService.createEvent(eventRequest).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.success = 'Event created successfully!';
          // Redirect to events page after a short delay
          setTimeout(() => {
            this.router.navigate(['/events']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error creating event:', error);
          this.isSubmitting = false;
          this.error = error.error?.detail || 'Failed to create event. Please try again.';
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/events']);
  }

  private markFormGroupTouched() {
    Object.keys(this.eventForm.controls).forEach(key => {
      const control = this.eventForm.get(key);
      control?.markAsTouched();
    });
  }

  // Form getters for easy access
  get title() { return this.eventForm.get('title'); }
  get description() { return this.eventForm.get('description'); }
  get date() { return this.eventForm.get('date'); }
  get time() { return this.eventForm.get('time'); }
  get location() { return this.eventForm.get('location'); }
}