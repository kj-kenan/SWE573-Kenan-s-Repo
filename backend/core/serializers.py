# core/serializers.py
from rest_framework import serializers
from .models import UserProfile

# Converts UserProfile model instances to JSON for API responses
class UserProfileSerializer(serializers.ModelSerializer):
    # Pull "username" from related User model (UserProfile.user.username)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        # Keep it minimal for now; we can expand later (e.g., visibility flags)
        fields = ["username", "bio", "province", "district", "timebank_balance"]
