from rest_framework import serializers
from .models import UserProfile, Offer, Request, Handshake, Transaction

# ---------------------------------------------------------------------------
# USER PROFILE
# ---------------------------------------------------------------------------
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    location = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ["id", "username", "email", "bio", "timebank_balance", "location", "province", "district"]

    def get_location(self, obj):
        if obj.province and obj.district:
            return f"{obj.district}, {obj.province}"
        elif obj.province:
            return obj.province
        elif obj.district:
            return obj.district
        return None


# ---------------------------------------------------------------------------
# OFFER & REQUEST
# ---------------------------------------------------------------------------
class OfferSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    active_handshake = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = [
            "id",
            "user",
            "username",
            "title",
            "description",
            "duration",
            "date",
            "tags",
            "latitude",
            "longitude",
            "status",
            "created_at",
            "active_handshake",
        ]
        read_only_fields = ["user", "status", "created_at"]

    def get_username(self, obj):
        return obj.user.username if obj.user else None

    def get_active_handshake(self, obj):
        """Return active handshake info if exists"""
        active = obj.handshakes.filter(
            status__in=["proposed", "accepted", "in_progress"]
        ).first()
        if active:
            return {
                "id": active.id,
                "status": active.status,
                "seeker_username": active.seeker.username,
                "provider_username": active.provider.username,
                "hours": active.hours,
                "created_at": active.created_at,
            }
        return None


class RequestSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    active_handshake = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = [
            "id",
            "user",
            "username",
            "title",
            "description",
            "duration",
            "date",
            "tags",
            "latitude",
            "longitude",
            "status",
            "created_at",
            "active_handshake",
        ]
        read_only_fields = ["user", "status", "created_at"]

    def get_username(self, obj):
        return obj.user.username if obj.user else None

    def get_active_handshake(self, obj):
        """Return active handshake info if exists"""
        active = obj.handshakes.filter(
            status__in=["proposed", "accepted", "in_progress"]
        ).first()
        if active:
            return {
                "id": active.id,
                "status": active.status,
                "seeker_username": active.seeker.username,
                "provider_username": active.provider.username,
                "hours": active.hours,
                "created_at": active.created_at,
            }
        return None


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
        request_obj = validated_data.get("request")

        if offer:
            provider = offer.user
            # Check for existing active handshakes on this offer
            active_handshakes = Handshake.objects.filter(
                offer=offer,
                status__in=["proposed", "accepted", "in_progress"]
            ).exclude(id=None)
            if active_handshakes.exists():
                raise serializers.ValidationError(
                    "This offer already has an active handshake. Please wait for it to complete or be declined."
                )
        elif request_obj:
            provider = request_obj.user
            # Check for existing active handshakes on this request
            active_handshakes = Handshake.objects.filter(
                request=request_obj,
                status__in=["proposed", "accepted", "in_progress"]
            ).exclude(id=None)
            if active_handshakes.exists():
                raise serializers.ValidationError(
                    "This request already has an active handshake. Please wait for it to complete or be declined."
                )
        else:
            raise serializers.ValidationError("Either offer or request must be provided.")

        if not provider:
            raise serializers.ValidationError("The post owner could not be determined.")

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
