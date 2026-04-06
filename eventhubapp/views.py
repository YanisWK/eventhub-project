from rest_framework import viewsets, permissions
from .models import Event, Participant, Registration
from .serializers import EventSerializer, ParticipantSerializer, RegistrationSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import Event, Participant, Registration
from .serializers import (
    EventSerializer, ParticipantSerializer, RegistrationSerializer, UserSerializer
)

# Returns info about the current user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin/éditeur peut tout faire, viewer a accès en lecture seule."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_staff

# event CRUD operations and filtering
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Event.objects.all()
        # Filter by date and status
        date = self.request.query_params.get('date')
        status = self.request.query_params.get('status')
        if date:
            queryset = queryset.filter(date__date=date)
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [IsAdminOrReadOnly]


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAdminOrReadOnly]