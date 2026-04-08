# Spotly - Full-Stack Event Management System

Spotly is a full-stack event management application built with **Django REST Framework** for the backend and **React** for the frontend. It allows staff users to create, update, and delete events and participants, while standard users have read-only access.

## Features

### Backend (Django REST Framework)
- Complete REST API for event, participant, and registration management
- JWT authentication with role-based access control
- Full CRUD operations with staff/viewer permissions
- SQLite database used during development
- Django REST Framework serializers and API endpoints
- API documentation with Swagger/OpenAPI

### Frontend (React)
- Single Page Application built with React
- Pages: Login, Dashboard, Events, Event Details, Participants
- Protected routes for authenticated users
- Conditional UI based on user role
- Event filtering by date and status
- Loading and error state handling
- Integration with the Django backend API

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm

## Installation

### Backend

```
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```
npm install
npm start
```

## Usage

1. Start the backend server:
   ```
   python manage.py runserver
   ```

2. Start the frontend:
   ```
   npm start
   ```

3. Log in with the superuser account you created.

4. Access the main pages:
- **Dashboard** for the summary view
- **Events** to list, filter, and manage events
- **Participants** to manage participant profiles

## Data Model

### Event
- `name` (string)
- `description` (text, optional)
- `date` (datetime)
- `status` (`upcoming`, `ongoing`, `finished`, `cancelled`)

### Participant
- `name` (string)
- `email` (email)

### Registration
- Dedicated many-to-many relationship between events and participants
- Prevents duplicate registrations for the same participant and event

## Permissions

### Staff Users
- View all events and participants
- Create new events and participants
- Update existing events and participants
- Delete events and participants
- Manage registrations

### Viewer Users
- View events and participants
- Read-only access
- No create, update, or delete permissions

## Useful Commands

### Backend

```
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```
npm start
npm run build
```

## Deployment

### Backend (Render)

Required files:
- `requirements.txt`
- `render.yaml`

Build command:
```
pip install -r requirements.txt && python manage.py migrate
```

Start command:
```
gunicorn config.wsgi:application
```

### Frontend (Vercel)

Main settings:
- Framework: React
- Build command: `npm run build`
- Output directory: `build`

## Technologies

### Backend
- Django 5.2.12
- Django REST Framework
- SimpleJWT
- drf-spectacular
- SQLite
- Gunicorn
- WhiteNoise

### Frontend
- React
- React Router
- React Hooks
- JavaScript
- CSS
- ESLint
