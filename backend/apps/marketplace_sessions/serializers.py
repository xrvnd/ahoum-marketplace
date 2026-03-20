from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Session


class CreatorSerializer(serializers.ModelSerializer):
    """Minimal creator info embedded inside each Session response."""

    # Use source='profile.avatar_url' to reach nested UserProfile
    avatar_url = serializers.URLField(source='profile.avatar_url', read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'first_name', 'last_name', 'email', 'avatar_url']


class SessionSerializer(serializers.ModelSerializer):
    """
    Full Session serializer.
    - Read:  returns creator details + computed fields
    - Write: accepts only the fields a creator fills in
    """

    # Nested read-only creator info (shown in catalog cards)
    creator         = CreatorSerializer(read_only=True)

    # Computed from @property on the model — no DB column
    bookings_count  = serializers.IntegerField(read_only=True)
    is_fully_booked = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Session
        fields = [
            'id',
            'title',
            'description',
            'price',
            'scheduled_at',
            'duration_mins',
            'capacity',
            'is_active',
            'creator',
            'bookings_count',
            'is_fully_booked',
            'created_at',
        ]
        # Creator is set automatically from request.user — not from request body
        read_only_fields = ['creator', 'created_at']


class SessionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for the catalog list page.
    Why: Avoid over-fetching — list pages don't need every field.
    """
    creator_name    = serializers.SerializerMethodField()
    bookings_count  = serializers.IntegerField(read_only=True)
    is_fully_booked = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Session
        fields = [
            'id',
            'title',
            'price',
            'scheduled_at',
            'duration_mins',
            'capacity',
            'is_fully_booked',
            'bookings_count',
            'creator_name',
        ]

    def get_creator_name(self, obj):
        return f"{obj.creator.first_name} {obj.creator.last_name}".strip() or obj.creator.email