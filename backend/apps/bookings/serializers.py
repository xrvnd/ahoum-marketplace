from rest_framework import serializers
from .models import Booking
from apps.marketplace_sessions.serializers import SessionListSerializer


class BookingSerializer(serializers.ModelSerializer):
    session_detail = SessionListSerializer(source='session', read_only=True)

    class Meta:
        model  = Booking
        fields = [
            'id',
            'session',
            'session_detail',
            'status',
            'booked_at',
        ]
        read_only_fields = ['user', 'status', 'booked_at']