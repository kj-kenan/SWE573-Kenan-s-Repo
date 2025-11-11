from rest_framework import serializers
from .models import UserProfile, Offer, Request, Handshake, Transaction

# ---------------------------------------------------------------------------
# USER PROFILE
# ---------------------------------------------------------------------------
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = UserProfile
        fields = ["id", "username", "email", "bio", "timebank_balance", "location"]


# ---------------------------------------------------------------------------
# OFFER & REQUEST
# ---------------------------------------------------------------------------
class OfferSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Offer
        fields = [
            "id",
            "user",
            "username",
            "title",
            "description",
            "tags",
            "latitude",
            "longitude",
            "status",
            "created_at",
        ]
        read_only_fields = ["user", "status", "created_at"]


class RequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Request
        fields = [
            "id",
            "user",
            "username",
            "title",
            "description",
            "tags",
            "latitude",
            "longitude",
            "status",
            "created_at",
        ]
        read_only_fields = ["user", "status", "created_at"]


# ---------------------------------------------------------------------------
# HANDSHAKE
# ---------------------------------------------------------------------------
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
            "provider",
            "seeker",
            "status",
            "provider_confirmed",
            "seeker_confirmed",
            "created_at",
        ]

    def validate(self, data):
        offer = data.get("offer")
        request = data.get("request")

        if not offer and not request:
            raise serializers.ValidationError("Handshake must be linked to either an Offer or a Request.")
        if offer and request:
            raise serializers.ValidationError("Handshake cannot be linked to both Offer and Request.")
        return data

    def create(self, validated_data):
        user = self.context["request"].user
        offer = validated_data.get("offer")
        request = validated_data.get("request")

        if offer:
            provider = offer.user if hasattr(offer, "user") else offer.created_by
        elif request:
            provider = request.user if hasattr(request, "user") else request.created_by
        else:
            raise serializers.ValidationError("Either offer or request must be provided.")

        if provider == user:
            raise serializers.ValidationError("You cannot initiate a handshake with yourself.")

        handshake = Handshake.objects.create(
            provider=provider,
            seeker=user,
            **validated_data,
        )
        return handshake


# ---------------------------------------------------------------------------
# TRANSACTION
# ---------------------------------------------------------------------------
class TransactionSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    receiver_username = serializers.CharField(source="receiver.username", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "handshake",
            "sender",
            "sender_username",
            "receiver",
            "receiver_username",
            "amount",
            "created_at",
        ]
