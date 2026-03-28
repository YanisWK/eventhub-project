from rest_framework import viewsets, permissions
from .models import Event, Participant, Registration
from .serializers import EventSerializer, ParticipantSerializer, RegistrationSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin/éditeur peut tout faire, viewer a accès en lecture seule."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_staff


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    # permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Event.objects.all()
        # Filtrage par date et statut
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
    # permission_classes = [IsAdminOrReadOnly]


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    # permission_classes = [IsAdminOrReadOnly]