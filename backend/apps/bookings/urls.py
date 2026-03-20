from django.urls import path
from .views import (
    BookingCreateView,
    MyBookingsView,
    CancelBookingView,
    SessionBookingsView,
)

urlpatterns = [
    path('',                        BookingCreateView.as_view(),   name='booking-create'),
    path('my/',                     MyBookingsView.as_view(),      name='my-bookings'),
    path('<int:pk>/cancel/',        CancelBookingView.as_view(),   name='cancel-booking'),
    path('session/<int:session_id>/', SessionBookingsView.as_view(), name='session-bookings'),
]