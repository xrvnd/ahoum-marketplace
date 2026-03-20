from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Session
from .serializers import SessionSerializer, SessionListSerializer
from .permissions import IsCreator, IsOwnerOrReadOnly


class SessionViewSet(viewsets.ModelViewSet):
    """
    GET    /api/sessions/        → list all active sessions (public)
    POST   /api/sessions/        → create session (creator only)
    GET    /api/sessions/:id/    → session detail (public)
    PUT    /api/sessions/:id/    → full update (owner creator only)
    PATCH  /api/sessions/:id/    → partial update (owner creator only)
    DELETE /api/sessions/:id/    → delete (owner creator only)
    """

    queryset         = Session.objects.all().select_related('creator', 'creator__profile')
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['title', 'description']
    ordering_fields  = ['scheduled_at', 'price', 'created_at']
    ordering         = ['scheduled_at']  # default sort

    def get_serializer_class(self):
        """Use lightweight serializer for list, full serializer for detail/write."""
        if self.action == 'list':
            return SessionListSerializer
        return SessionSerializer

    def get_queryset(self):
        """
        Public catalog: only active sessions.
        Creator dashboard: creator sees ALL their sessions (including inactive).
        """
        user = self.request.user

        # Creator viewing their own dashboard — show all their sessions
        if (
            self.request.query_params.get('my') == 'true'
            and user.is_authenticated
            and hasattr(user, 'profile')
            and user.profile.role == 'creator'
        ):
            return Session.objects.filter(
                creator=user
            ).select_related('creator', 'creator__profile')

        # Everyone else — only active sessions
        return Session.objects.filter(
            is_active=True
        ).select_related('creator', 'creator__profile')

    def get_permissions(self):
        """
        GET requests → anyone (public catalog)
        POST        → must be a Creator
        PUT/PATCH/DELETE → must be Creator AND own the session
        """
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticatedOrReadOnly()]
        if self.action == 'create':
            return [IsCreator()]
        return [IsCreator(), IsOwnerOrReadOnly()]

    def perform_create(self, serializer):
        """Auto-assign the logged-in user as creator when saving."""
        serializer.save(creator=self.request.user)