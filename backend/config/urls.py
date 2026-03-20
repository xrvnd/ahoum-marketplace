from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # allauth handles ALL OAuth routes:
    # /accounts/google/login/
    # /accounts/google/login/callback/
    # /accounts/logout/ etc.
    path('accounts/', include('allauth.urls')),

    # Our custom JWT + profile endpoints
    path('api/auth/', include('apps.accounts.urls')),

    path('api/sessions/', include('apps.marketplace_sessions.urls')),
    path('api/bookings/',  include('apps.bookings.urls')),
]