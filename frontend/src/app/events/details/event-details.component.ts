import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService, Event, InviteRequest, ResponseRequest, EventParticipant } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.css']
})
export class EventDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);  // Make it public
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  event: Event | null = null;
  isLoading = true;
  error: string | null = null;
  success: string | null = null;
  inviteForm: FormGroup;
  isOrganizer = false;
  isParticipant = false;
  canJoin = false; // User can join if not already a participant
  currentUserStatus: string | null = null;
  currentUserId: string | null = null;

  constructor() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    const eventId = this.route.snapshot.paramMap.get('id');
    console.log('Event ID from route:', eventId);
    if (eventId) {
      this.loadEvent(eventId);
    } else {
      this.error = 'Event ID not provided';
      this.isLoading = false;
    }
  }

  loadEvent(eventId: string): void {
    console.log('Loading event with ID:', eventId);
    if (!eventId) {
      this.error = 'Invalid event ID';
      this.isLoading = false;
      return;
    }
    
    this.eventService.getEventById(eventId).subscribe({
      next: (response) => {
        console.log('Event loaded:', response);
        this.event = response.event;
        
        // Ensure event has normalized ID
        if (this.event && !this.event.id) {
          this.event.id = this.event._id || eventId;
        }
        
        this.isLoading = false;
        
        this.isOrganizer = this.event?.organizer_id === this.currentUserId;
        this.isParticipant = this.event?.participants.some(
          (participant) => participant.user_id === this.currentUserId
        ) ?? false;
        this.canJoin = !this.isParticipant && !this.isOrganizer;
        this.currentUserStatus = this.getParticipantStatus();
        
        console.log('Event state:', {
          isOrganizer: this.isOrganizer,
          isParticipant: this.isParticipant,
          canJoin: this.canJoin,
          currentUserId: this.currentUserId
        });
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.error = error || 'Failed to load event. Event may not exist.';
        this.isLoading = false;
      }
    });
  }

  getParticipantStatus(): string {
    if (!this.event || !this.currentUserId) return '';
    
    const participant = this.event.participants.find(
      (p) => p.user_id === this.currentUserId
    );
    return participant?.status || '';
  }

  getParticipantByEmail(email: string): EventParticipant | undefined {
    if (!this.event) return undefined;
    // In a real app, you would have participant emails
    // For now, we'll just return the first participant
    return this.event.participants[0];
  }

  onInvite(): void {
    if (!this.isOrganizer) {
      this.error = 'Only organizers can invite attendees.';
      return;
    }

    if (this.inviteForm.valid && this.event) {
      this.error = null;
      this.success = null;
      
      const inviteData: InviteRequest = {
        email: this.inviteForm.value.email
      };

      this.eventService.inviteUser(this.event.id!, inviteData).subscribe({
        next: (response) => {
          // Update the event with the new participant
          this.event = response.event;
          this.inviteForm.reset();
          this.success = 'User invited successfully!';
        },
        error: (error) => {
          console.error('Error inviting user:', error);
          this.error = error || 'Failed to invite user. Please try again.';
        }
      });
    } else {
      // Mark form as touched to show validation errors
      this.inviteForm.markAllAsTouched();
    }
  }

  onJoinEvent(): void {
    if (!this.event) {
      this.error = 'Event not loaded';
      return;
    }
    
    const eventId = this.event.id || this.event._id;
    if (!eventId) {
      this.error = 'Event ID is missing';
      return;
    }
    
    this.error = null;
    this.success = null;

    console.log('Joining event with ID:', eventId);
    this.eventService.joinEvent(eventId).subscribe({
      next: (response) => {
        console.log('Join event response:', response);
        // Update the event and user status
        this.event = response.event;
        this.isParticipant = true;
        this.canJoin = false;
        this.currentUserStatus = this.getParticipantStatus();
        this.success = 'Successfully joined the event! You can now set your attendance status.';
      },
      error: (error) => {
        console.error('Error joining event:', error);
        this.error = error || 'Failed to join event. Please try again.';
      }
    });
  }

  onUpdateResponse(status: string): void {
    if (this.event) {
      this.error = null;
      this.success = null;
      
      const response: ResponseRequest = { status };

      this.eventService.updateResponse(this.event.id!, response).subscribe({
        next: (response) => {
          // Update the event with the new status
          this.event = response.event;
          this.currentUserStatus = status;
          this.success = `Response updated to "${status}"!`;
        },
        error: (error) => {
          console.error('Error updating response:', error);
          this.error = error || 'Failed to update response. Please try again.';
        }
      });
    }
  }

  onDeleteEvent(): void {
    if (this.event && confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      this.eventService.deleteEvent(this.event.id!).subscribe({
        next: () => {
          // Show success message and navigate back to events
          this.success = 'Event deleted successfully!';
          setTimeout(() => {
            this.router.navigate(['/events']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          this.error = error || 'Failed to delete event. You may not have permission to delete this event.';
        }
      });
    }
  }

  // Form getters
  get email() { return this.inviteForm.get('email'); }
}