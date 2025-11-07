from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    # Link each profile to exactly one Django User
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    # Public info (adjust as needed)
    bio = models.TextField(blank=True)
    province = models.CharField(max_length=100, blank=True)   # only approximate location
    district = models.CharField(max_length=100, blank=True)

    # Visibility preference (e.g., hide district until handshake)
    is_visible = models.BooleanField(default=True)

    # TimeBank balance in hours (can be fractional, e.g., 1.5h)
    timebank_balance = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile({self.user.username})"
