from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from .serializers import UserSerializer


def get_tokens_for_user(user):
    """Helper — generate JWT access + refresh for a given user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


@login_required  # allauth sets the session; this confirms it
def oauth_callback(request):
    """
    Django-side OAuth success handler.
    Issues JWT and redirects to Next.js /auth/callback?token=...
    """
    user   = request.user
    tokens = get_tokens_for_user(user)

    # Ensure profile exists (safety net)
    profile, _ = UserProfile.objects.get_or_create(user=user)

    frontend_url = (
        f"http://localhost:3000/auth/callback"
        f"?access={tokens['access']}"
        f"&refresh={tokens['refresh']}"
        f"&role={profile.role}"
    )
    return redirect(frontend_url)


class MeView(APIView):
    """GET /api/auth/me — returns the current logged-in user's full profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UpdateProfileView(APIView):
    """PATCH /api/auth/profile — update name, bio, role."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user    = request.user
        profile = user.profile
        data    = request.data

        # Update User fields
        user.first_name = data.get('first_name', user.first_name)
        user.last_name  = data.get('last_name', user.last_name)
        user.save()

        # Update Profile fields
        profile.bio        = data.get('bio', profile.bio)
        profile.avatar_url = data.get('avatar_url', profile.avatar_url)
        
        # Allow role switch (user ↔ creator) — adjust if you want to lock this
        if 'role' in data and data['role'] in ['user', 'creator']:
            profile.role = data['role']
        profile.save()

        return Response(UserSerializer(user).data)