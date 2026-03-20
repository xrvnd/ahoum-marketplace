from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Booking
from .serializers import BookingSerializer
from apps.marketplace_sessions.models import Session


class BookingCreateView(APIView):
    """
    POST /api/bookings/
    Books a session for the logged-in user.
    Enforces: no double booking, no booking full sessions.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session')

        # ── Validate session exists ───────────────────────────────────────────
        try:
            session = Session.objects.get(id=session_id, is_active=True)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found or no longer active.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ── Prevent creator booking their own session ─────────────────────────
        if session.creator == request.user:
            return Response(
                {'error': 'You cannot book your own session.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Prevent double booking ────────────────────────────────────────────
        if Booking.objects.filter(
            user=request.user,
            session=session,
            status='confirmed'
        ).exists():
            return Response(
                {'error': 'You have already booked this session.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Prevent booking full sessions ─────────────────────────────────────
        if session.is_fully_booked:
            return Response(
                {'error': 'This session is fully booked.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── All checks passed — create the booking ────────────────────────────
        booking = Booking.objects.create(
            user=request.user,
            session=session,
            status='confirmed'
        )
        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyBookingsView(APIView):
    """
    GET /api/bookings/my/
    Returns all bookings for the logged-in user.
    Splits into active (upcoming) and past bookings for the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone

        bookings = Booking.objects.filter(
            user=request.user
        ).select_related('session', 'session__creator').order_by('-booked_at')

        now = timezone.now()

        # Split into active vs past for dashboard tabs
        active = bookings.filter(
            status='confirmed',
            session__scheduled_at__gte=now
        )
        past = bookings.filter(
            status='confirmed',
            session__scheduled_at__lt=now
        ) | bookings.filter(status='cancelled')

        return Response({
            'active': BookingSerializer(active, many=True).data,
            'past':   BookingSerializer(past,   many=True).data,
        })


class CancelBookingView(APIView):
    """
    PATCH /api/bookings/:id/cancel/
    Cancels a specific booking — only the booking owner can do this.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.status == 'cancelled':
            return Response(
                {'error': 'Booking is already cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'cancelled'
        booking.save()
        return Response(BookingSerializer(booking).data)


class SessionBookingsView(APIView):
    """
    GET /api/bookings/session/:id/
    Returns all bookings for a specific session.
    Only the session's creator can view this (for their dashboard).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        # Verify the session belongs to this creator
        try:
            session = Session.objects.get(
                id=session_id,
                creator=request.user
            )
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found or access denied.'},
                status=status.HTTP_404_NOT_FOUND
            )

        bookings = Booking.objects.filter(
            session=session
        ).select_related('user', 'user__profile')

        serializer = BookingSerializer(bookings, many=True)
        return Response({
            'session_title': session.title,
            'total_bookings': bookings.filter(status='confirmed').count(),
            'capacity': session.capacity,
            'bookings': serializer.data,
        })