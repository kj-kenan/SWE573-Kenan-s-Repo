from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import UserProfile, Offer, Request, Handshake, Transaction, Question, Message, Rating, Badge

# ---------------------------------------------------------------------------
# USER PROFILE
# ---------------------------------------------------------------------------
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    location = serializers.SerializerMethodField()
    average_rating = serializers.ReadOnlyField()
    total_ratings = serializers.ReadOnlyField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id", "username", "email", "bio", "skills", "interests", 
            "profile_picture", "profile_picture_url", "timebank_balance", 
            "location", "province", "district", "is_visible", 
            "average_rating", "total_ratings", "created_at"
        ]
        read_only_fields = ["created_at", "average_rating", "total_ratings"]

    def get_location(self, obj):
        if obj.province and obj.district:
            return f"{obj.district}, {obj.province}"
        elif obj.province:
            return obj.province
        elif obj.district:
            return obj.district
        return None
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
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
            "available_slots",
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
            "available_slots",
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
        """Return active handshake info if exists - seeker is anonymous until accepted"""
        active = obj.handshakes.filter(
            status__in=["proposed", "accepted", "in_progress"]
        ).first()
        if active:
            # Only show seeker username if handshake is accepted or in progress
            # Keep it anonymous if still "proposed"
            seeker_username = None
            if active.status in ["accepted", "in_progress", "completed"]:
                seeker_username = active.seeker.username
            
            return {
                "id": active.id,
                "status": active.status,
                "seeker_username": seeker_username,  # Anonymous if proposed
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
            # Ensure we have the full offer object with user
            if not hasattr(offer, 'user') or offer.user is None:
                raise serializers.ValidationError(
                    "The offer does not have an owner. Cannot create handshake."
                )
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
            # Ensure we have the full request object with user
            if not hasattr(request_obj, 'user') or request_obj.user is None:
                raise serializers.ValidationError(
                    "The request does not have an owner. Cannot create handshake."
                )
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
    related_post_title = serializers.SerializerMethodField()
    transaction_type = serializers.SerializerMethodField()

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
            "related_post_title",
            "transaction_type",
        ]

    def get_related_post_title(self, obj):
        """Get the title of the related offer or request"""
        if obj.handshake.offer:
            return obj.handshake.offer.title
        elif obj.handshake.request:
            return obj.handshake.request.title
        return None

    def get_transaction_type(self, obj):
        """Determine if this is an earned or spent transaction for the current user"""
        request = self.context.get("request")
        if request and request.user:
            if obj.receiver == request.user:
                return "earned"
            elif obj.sender == request.user:
                return "spent"
        return None


# ---------------------------------------------------------------------------
# QUESTION & MESSAGE
# ---------------------------------------------------------------------------
class QuestionSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Question
        fields = [
            "id",
            "offer",
            "request",
            "author",
            "author_username",
            "content",
            "answer",
            "answered_at",
            "created_at",
        ]
        read_only_fields = ["author", "created_at", "answered_at"]

    def validate(self, data):
        offer = data.get("offer")
        request_obj = data.get("request")
        
        if not offer and not request_obj:
            raise serializers.ValidationError("Question must be linked to either an Offer or a Request.")
        if offer and request_obj:
            raise serializers.ValidationError("Question cannot be linked to both Offer and Request.")
        
        return data


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "handshake",
            "sender",
            "sender_username",
            "content",
            "created_at",
            "is_read",
        ]
        read_only_fields = ["sender", "created_at", "is_read"]


# ---------------------------------------------------------------------------
# RATINGS & BADGES
# ---------------------------------------------------------------------------
class RatingSerializer(serializers.ModelSerializer):
    rater_username = serializers.CharField(source="rater.username", read_only=True)
    rated_user_username = serializers.CharField(source="rated_user.username", read_only=True)

    class Meta:
        model = Rating
        fields = [
            "id",
            "handshake",
            "rater",
            "rater_username",
            "rated_user",
            "rated_user_username",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["rater", "created_at"]

    def validate(self, data):
        handshake = data.get("handshake")
        if handshake and handshake.status != "completed":
            raise serializers.ValidationError("Ratings can only be given for completed handshakes.")
        return data


class BadgeSerializer(serializers.ModelSerializer):
    badge_type_display = serializers.CharField(source="get_badge_type_display", read_only=True)

    class Meta:
        model = Badge
        fields = [
            "id",
            "user",
            "badge_type",
            "badge_type_display",
            "description",
            "earned_at",
        ]
        read_only_fields = ["earned_at"]
