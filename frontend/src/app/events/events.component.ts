import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService, Event, EventParticipant } from '../services/event.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  
  organizedEvents: Event[] = [];
  invitedEvents: Event[] = [];
  currentUserId: string | null = null;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.error = null;
    this.success = null;
    
    // Load organized events
    this.eventService.getOrganizedEvents().subscribe({
      next: (response) => {
        this.organizedEvents = (response.events || []).map(event => ({
          ...event,
          id: event.id || event._id
        }));
        console.log('Organized events loaded:', this.organizedEvents.map(e => ({ id: e.id, title: e.title })));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading organized events:', error);
        this.error = error || 'Failed to load organized events';
        this.isLoading = false;
      }
    });
    
    // Load invited events
    this.eventService.getInvitedEvents().subscribe({
      next: (response) => {
        this.invitedEvents = (response.events || []).map(event => ({
          ...event,
          id: event.id || event._id
        }));
        console.log('Invited events loaded:', this.invitedEvents.map(e => ({ id: e.id, title: e.title })));
      },
      error: (error) => {
        console.error('Error loading invited events:', error);
        if (!this.error) {
          this.error = error || 'Failed to load invited events';
        }
      }
    });
  }

  onDeleteEvent(eventId: string | undefined): void {
    const idToDelete = eventId;
    console.log('Attempting to delete event with ID:', idToDelete);
    if (!idToDelete) {
      this.error = 'Invalid event ID';
      return;
    }
    
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      this.eventService.deleteEvent(idToDelete).subscribe({
        next: () => {
          console.log('Event deleted successfully');
          // Remove the event from the lists (check both id and _id)
          this.organizedEvents = this.organizedEvents.filter(event => 
            (event.id || event._id) !== idToDelete
          );
          this.invitedEvents = this.invitedEvents.filter(event => 
            (event.id || event._id) !== idToDelete
          );
          this.success = 'Event deleted successfully!';
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          this.error = error || 'Failed to delete event. You may not have permission to delete this event.';
        }
      });
    }
  }

  getEventStatus(participants: EventParticipant[] = []): string {
    if (!participants || participants.length === 0 || !this.currentUserId) {
      return 'No response';
    }

    const participant = participants.find((p) => p.user_id === this.currentUserId);
    return participant?.status || 'No response';
  }
  
  refreshEvents(): void {
    this.loadEvents();
  }
}