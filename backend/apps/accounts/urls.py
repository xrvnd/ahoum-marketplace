from django.urls import path
from . import views

urlpatterns = [
    path('callback/', views.oauth_callback, name='oauth-callback'),
    path('me/', views.MeView.as_view(), name='me'),
    path('profile/', views.UpdateProfileView.as_view(), name='update-profile'),
]