from rest_framework import serializers
from .models import Event, Participant, Registration
from django.contrib.auth.models import User
from rest_framework import serializers

# Serializer to expose authenticated user information
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'is_staff', 'is_superuser']
        
# Serializers for event, participant, and registration CRUD
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = '__all__'


class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = '__all__'

    def validate(self, data):
        event = data.get('event')
        participant = data.get('participant')

        queryset = Registration.objects.filter(event=event, participant=participant)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        # a participant cannot register twice for the same event
        if queryset.exists():
            raise serializers.ValidationError({
                "detail": "This participant is already registered for this event."
            })

        return data
