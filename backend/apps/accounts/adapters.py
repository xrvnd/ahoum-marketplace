from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from .models import UserProfile


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):

    def save_user(self, request, sociallogin, form=None):
        """
        Called when a brand-new user signs in via OAuth for the first time.
        Creates the User AND auto-creates their UserProfile.
        """
        user = super().save_user(request, sociallogin, form)

        # Pull avatar from Google/GitHub profile data if available
        avatar_url = ''
        extra_data = sociallogin.account.extra_data
        if 'picture' in extra_data:         # Google
            avatar_url = extra_data['picture']
        elif 'avatar_url' in extra_data:    # GitHub
            avatar_url = extra_data['avatar_url']

        UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'user', 'avatar_url': avatar_url}
        )
        return user

    def pre_social_login(self, request, sociallogin):
        """
        Called on EVERY login (including returning users).
        Ensures profile exists even if it was somehow deleted.
        """
        if sociallogin.is_existing:
            UserProfile.objects.get_or_create(
                user=sociallogin.user,
                defaults={'role': 'user'}
            )