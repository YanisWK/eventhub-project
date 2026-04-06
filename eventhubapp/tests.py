from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status

from .models import Event, Participant, Registration

# Tests for models, permissions and registration rules
class EventHubTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Staff : can create and modify data
        self.admin_user = User.objects.create_user(
            username="admin",
            password="admin123",
            is_staff=True
        )

        # Viewer : read-only access
        self.viewer_user = User.objects.create_user(
            username="viewer",
            password="viewer123",
            is_staff=False
        )

        self.event = Event.objects.create(
            name="Tech Conference 2026",
            description="Tech event",
            date="2026-04-10T10:00:00Z",
            status="upcoming"
        )

        self.participant = Participant.objects.create(
            name="Toto Dupont",
            email="toto@example.com"
        )

    def test_event_creation(self):
        self.assertEqual(self.event.name, "Tech Conference 2026")
        self.assertEqual(self.event.status, "upcoming")

    def test_participant_creation(self):
        self.assertEqual(self.participant.name, "Toto Dupont")
        self.assertEqual(self.participant.email, "toto@example.com")

    def test_registration_creation(self):
        registration = Registration.objects.create(
            event=self.event,
            participant=self.participant
        )
        self.assertEqual(registration.event, self.event)
        self.assertEqual(registration.participant, self.participant)

    # Check that duplicate registrations are blocked
    def test_duplicate_registration_not_allowed(self):
        Registration.objects.create(event=self.event, participant=self.participant)

        with self.assertRaises(IntegrityError):
            Registration.objects.create(event=self.event, participant=self.participant)

    def test_admin_can_create_event(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post("/api/events/", {
            "name": "New Event",
            "description": "Created by admin",
            "date": "2026-05-01T12:00:00Z",
            "status": "upcoming"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_viewer_cannot_create_event(self):
        self.client.force_authenticate(user=self.viewer_user)

        response = self.client.post("/api/events/", {
            "name": "Event 2",
            "description": "Created by viewer",
            "date": "2026-05-01T12:00:00Z",
            "status": "upcoming"
        }, format="json")

        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED]
        )

    def test_admin_can_create_participant(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post("/api/participants/", {
            "name": "Titi Martin",
            "email": "titi@example.com"
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_viewer_cannot_create_participant(self):
        self.client.force_authenticate(user=self.viewer_user)

        response = self.client.post("/api/participants/", {
            "name": "Unauthorized User",
            "email": "unauth@example.com"
        }, format="json")

        self.assertIn(
            response.status_code,
            [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED]
        )