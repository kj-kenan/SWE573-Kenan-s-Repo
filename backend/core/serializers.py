from rest_framework import serializers
from .models import (
    UserProfile,
    Offer,
    Request,
    Handshake,
    Transaction,
)


class UserProfileSerializer(serializers.ModelSerializer):
    # Pull "username" from related User model (UserProfile.user.username)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = ["username", "bio", "province", "district", "timebank_balance"]


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = "__all__"


class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = "__all__"



class HandshakeSerializer(serializers.ModelSerializer):
    provider_username = serializers.CharField(source="provider.username", read_only=True)
    seeker_username = serializers.CharField(source="seeker.username", read_only=True)

    class Meta:
        model = Handshake
        fields = [
            "id",
            "offer",
            "request",
            "provider",
            "provider_username",
            "seeker",
            "seeker_username",
            "hours",
            "status",
            "provider_confirmed",
            "seeker_confirmed",
            "created_at",
        ]
        read_only_fields = [
            "status",
            "provider_confirmed",
            "seeker_confirmed",
            "created_at",
        ]



class TransactionSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    receiver_username = serializers.CharField(source="receiver.username", read_only=True)
    handshake_info = HandshakeSerializer(source="handshake", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "handshake",
            "handshake_info",
            "sender",
            "sender_username",
            "receiver",
            "receiver_username",
            "amount",
            "created_at",
        ]
        read_only_fields = ["created_at"]
