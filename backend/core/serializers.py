# core/serializers.py
from rest_framework import serializers
from .models import UserProfile
from .models import Offer, Request


# Converts UserProfile model instances to JSON for API responses
class UserProfileSerializer(serializers.ModelSerializer):
    # Pull "username" from related User model (UserProfile.user.username)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        # Keep it minimal for now; we can expand later (e.g., visibility flags)
        fields = ["username", "bio", "province", "district", "timebank_balance"]



class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = '__all__'  # tüm alanları dahil et


class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = '__all__'
