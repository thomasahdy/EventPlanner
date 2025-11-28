import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { 
    path: 'landing', 
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'signup', 
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'events', 
    loadComponent: () => import('./events/events.component').then(m => m.EventsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'events/create', 
    loadComponent: () => import('./events/create/create-event.component').then(m => m.CreateEventComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'events/search', 
    loadComponent: () => import('./events/search/search-events.component').then(m => m.SearchEventsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'events/:id', 
    loadComponent: () => import('./events/details/event-details.component').then(m => m.EventDetailsComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/landing' }
];