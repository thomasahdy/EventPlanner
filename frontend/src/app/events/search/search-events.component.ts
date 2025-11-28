import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EventService, Event, SearchRequest } from '../../services/event.service';

@Component({
  selector: 'app-search-events',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './search-events.component.html',
  styleUrls: ['./search-events.component.css']
})
export class SearchEventsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);

  searchForm: FormGroup;
  events: Event[] = [];
  isLoading = false;
  error: string | null = null;
  success: string | null = null;
  hasSearched = false;

  constructor() {
    this.searchForm = this.fb.group({
      keyword: [''],
      startDate: [''],
      endDate: [''],
      role: ['']
    });
  }

  ngOnInit(): void {
    // Load all events initially
    this.searchEvents();
  }

  searchEvents(): void {
    this.isLoading = true;
    this.error = null;
    this.success = null;

    const formValue = this.searchForm.value;
    const searchRequest: SearchRequest = {};

    if (formValue.keyword) {
      searchRequest.keyword = formValue.keyword;
    }

    if (formValue.startDate) {
      searchRequest.start_date = new Date(formValue.startDate).toISOString();
    }

    if (formValue.endDate) {
      searchRequest.end_date = new Date(formValue.endDate).toISOString();
    }

    if (formValue.role) {
      searchRequest.role = formValue.role;
    }

    this.eventService.searchEvents(searchRequest).subscribe({
      next: (response) => {
        this.events = response.events || [];
        // Ensure all events have normalized IDs (normalization is handled by EventService)
        this.events = this.events.map(event => ({
          ...event,
          id: event.id || event._id
        }));
        console.log('Search results:', this.events.map(e => ({ id: e.id, title: e.title })));
        this.isLoading = false;
        this.hasSearched = true;
        this.success = `Found ${this.events.length} events matching your criteria.`;
      },
      error: (error) => {
        console.error('Error searching events:', error);
        this.error = error.error?.detail || 'Failed to search events. Please try again.';
        this.isLoading = false;
        this.hasSearched = true;
      }
    });
  }

  onReset(): void {
    this.searchForm.reset();
    this.hasSearched = false;
    this.events = [];
    this.error = null;
    this.success = null;
  }

  // Form getters
  get keyword() { return this.searchForm.get('keyword'); }
  get startDate() { return this.searchForm.get('startDate'); }
  get endDate() { return this.searchForm.get('endDate'); }
  get role() { return this.searchForm.get('role'); }
}