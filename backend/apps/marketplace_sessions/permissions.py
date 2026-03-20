from rest_framework.permissions import BasePermission


class IsCreator(BasePermission):
    """Allow access only to users with role='creator'."""

    message = "You must be a Creator to perform this action."

    def has_permission(self, request, view):
        # User must be logged in AND have creator role
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'creator'
        )


class IsOwnerOrReadOnly(BasePermission):
    """Allow creators to only edit/delete their OWN sessions."""

    message = "You can only modify your own sessions."

    def has_object_permission(self, request, view, obj):
        # GET requests are always allowed (read-only)
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        # Write requests only allowed if you own the session
        return obj.creator == request.user