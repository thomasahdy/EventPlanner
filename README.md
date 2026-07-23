# EventPlanner

EventPlanner is a full-stack event planning application built with an Angular frontend and a FastAPI backend. It provides a polished interface for managing event discovery, authentication, invitations, attendance responses, and event creation.

## Features

- Landing page with marketing-style overview
- User authentication with signup and login
- Protected dashboard for authenticated users
- Event listing and event details
- Create, search, invite, join, and respond to events
- JWT-based authentication
- MongoDB-backed data storage
- CORS-enabled API for local and deployed frontend access

## Tech Stack

### Frontend
- Angular 20
- TypeScript
- HTML / CSS
- RxJS
- Karma / Jasmine for testing

### Backend
- FastAPI
- Python 3.11+
- MongoDB with Motor
- JWT authentication
- Uvicorn

## Repository Structure

```text
EventPlanner/
├── frontend/
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── Dockerfile
└── backend/
    ├── src/
    ├── app.py
    ├── Dockerfile
    └── requirements.txt
