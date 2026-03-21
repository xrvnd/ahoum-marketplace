from django.db import models
from django.contrib.auth.models import User
from apps.marketplace_sessions.models import Session


class Booking(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    session    = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='bookings')
    status     = models.CharField(max_length=10, choices=STATUS_CHOICES, default='confirmed')
    booked_at  = models.DateTimeField(auto_now_add=True)
    

    class Meta:
        # One user cannot book the same session twice
        unique_together = ('user', 'session')

    def __str__(self):
        return f"{self.user.email} → {self.session.title} [{self.status}]"