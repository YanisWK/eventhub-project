from django.contrib import admin
from .models import Event, Participant, Registration

# Register models
admin.site.register(Event)
admin.site.register(Participant)
admin.site.register(Registration)