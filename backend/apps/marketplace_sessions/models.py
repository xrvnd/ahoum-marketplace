from django.db import models
from django.contrib.auth.models import User


class Session(models.Model):
    creator       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    title         = models.CharField(max_length=200)
    description   = models.TextField()
    price         = models.DecimalField(max_digits=8, decimal_places=2, default='0.00')
    scheduled_at  = models.DateTimeField()
    duration_mins = models.PositiveIntegerField(default=60)
    capacity      = models.PositiveIntegerField(default=10)
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.creator.email}"

    @property
    def bookings_count(self):
        return self.bookings.filter(status='confirmed').count()

    @property
    def is_fully_booked(self):
        return self.bookings_count >= self.capacity