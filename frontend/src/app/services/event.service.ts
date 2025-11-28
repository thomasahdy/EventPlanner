import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface EventParticipant {
  user_id: string;
  role: string;  // "organizer" or "attendee"
  status?: string;  // "Going", "Maybe", "Not Going"
  email?: string;  // User email address
}

export interface Event {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  date: string;  // ISO format
  location: string;
  organizer_id: string;
  participants: EventParticipant[];
}

export interface CreateEventRequest {
  title: string;
  description: string;
  date: string;  // ISO format
  location: string;
}

export interface InviteRequest {
  email: string;
}

export interface ResponseRequest {
  status: string;  // "Going", "Maybe", "Not Going"
}

export interface SearchRequest {
  keyword?: string;
  start_date?: string;  // ISO format
  end_date?: string;    // ISO format
  role?: string;        // "organizer" or "attendee"
}

interface EventsResponse {
  events: Event[];
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = 'http://127.0.0.1:8000/api/events';

  private normalizeEvent(rawEvent: any): Event {
    if (!rawEvent) {
      throw new Error('Attempted to normalize empty event payload');
    }

    const normalizedId = rawEvent.id || rawEvent._id;
    if (!normalizedId) {
      console.warn('Received event without id-like field', rawEvent);
    }

    return {
      ...rawEvent,
      id: normalizedId,
      _id: normalizedId, // Keep _id for backward compatibility
      participants: rawEvent.participants ?? []
    };
  }

  private normalizeEventsResponse(response: any): EventsResponse {
    const eventsPayload = Array.isArray(response?.events) ? response.events : [];
    return {
      events: eventsPayload.map((event: any) => this.normalizeEvent(event))
    };
  }

  private normalizeSingleEventResponse(response: any): { event: Event } {
    return {
      event: this.normalizeEvent(response?.event ?? response)
    };
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    console.log('Using token for request:', token.substring(0, 20) + '...');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 404) {
        errorMessage = 'Event not found';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    console.error('EventService error:', errorMessage);
    console.error('Error details:', error);
    return throwError(() => errorMessage);
  }

  createEvent(event: CreateEventRequest): Observable<any> {
    console.log('Creating event:', event);
    return this.http.post(`${this.apiUrl}/`, event, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => this.normalizeSingleEventResponse(response)),
        tap(response => console.log('Create event response:', response)),
        catchError(this.handleError.bind(this))
      );
  }

  getOrganizedEvents(): Observable<EventsResponse> {
    console.log('Fetching organized events');
    return this.http.get<EventsResponse>(`${this.apiUrl}/organized`, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => this.normalizeEventsResponse(response)),
        tap(response => {
          console.log('Organized events response:', response);
          // Log the structure of the events
          if (response && response.events) {
            console.log('Events structure:', response.events.map((e) => ({ id: e.id, title: e.title })));
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  getInvitedEvents(): Observable<EventsResponse> {
    console.log('Fetching invited events');
    return this.http.get<EventsResponse>(`${this.apiUrl}/invited`, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => this.normalizeEventsResponse(response)),
        tap(response => {
          console.log('Invited events response:', response);
          // Log the structure of the events
          if (response && response.events) {
            console.log('Events structure:', response.events.map((e) => ({ id: e.id, title: e.title })));
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  getEventById(eventId: string): Observable<{ event: Event }> {
    console.log('Fetching event by ID:', eventId);
    return this.http.get(`${this.apiUrl}/${eventId}`, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => this.normalizeSingleEventResponse(response)),
        tap(response => console.log('Get event response:', response)),
        catchError(this.handleError.bind(this))
      );
  }

  deleteEvent(eventId: string): Observable<any> {
    console.log('Deleting event:', eventId);
    if (!eventId) {
      console.error('Attempted to delete event with undefined ID');
      return throwError(() => 'Event ID is required');
    }
    return this.http.delete(`${this.apiUrl}/${eventId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => console.log('Delete event response:', response)),
        catchError(this.handleError.bind(this))
      );
  }

  inviteUser(eventId: string, inviteData: InviteRequest): Observable<any> {
    console.log('Inviting user to event:', eventId, inviteData);
    return this.http.post(`${this.apiUrl}/${eventId}/invite`, inviteData, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => this.normalizeSingleEventResponse(response)),
        tap(response => console.log('Invite user response:', response)),
        catchError(this.handleError.bind(this))
      );
  }

  joinEvent(eventId: string): Observable<any> {
    console.log('Joining event:', eventId);
    return this.http.post(`${this.apiUrl}/${eventId}/join`, {}, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => this.normalizeSingleEventResponse(response)),
        tap(response => console.log('Join event response:', response)),
        catchError(this.handleError.bind(this))
      );
  }

  updateResponse(eventId: string, response: ResponseRequest): Observable<any> {
    console.log('Updating response for event:', eventId, response);
    return this.http.put(`${this.apiUrl}/${eventId}/response`, response, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => this.normalizeSingleEventResponse(response)),
        tap(response => console.log('Update response response:', response)),
        catchError(this.handleError.bind(this))
      );
  }

  searchEvents(searchParams: SearchRequest): Observable<any> {
    console.log('Searching events:', searchParams);
    return this.http.post(`${this.apiUrl}/search`, searchParams, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => this.normalizeEventsResponse(response)),
        tap(response => console.log('Search events response:', response)),
        catchError(this.handleError.bind(this))
      );
  }
}