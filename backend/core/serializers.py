from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import UserProfile, Offer, Request, Handshake, Transaction, Question, Message, Rating, Badge, ForumTopic, ForumReply
from .location_utils import get_fuzzy_coordinates

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
    email_verified = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id", "username", "email", "bio", "skills", "interests", 
            "profile_picture", "profile_picture_url", "timebank_balance", 
            "location", "province", "district", "is_visible", 
            "average_rating", "total_ratings", "created_at", "email_verified", "is_admin"
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
    
    def get_email_verified(self, obj):
        """Show email verification status only to admins"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            is_admin = request.user.is_staff or request.user.is_superuser
            if is_admin:
                return getattr(obj, 'email_verified', False)
        return None  # Don't show to non-admins
    
    def get_is_admin(self, obj):
        """Show if the profile owner is an admin (only visible to other admins)"""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            is_viewer_admin = request.user.is_staff or request.user.is_superuser
            if is_viewer_admin:
                return obj.user.is_staff or obj.user.is_superuser
        return None  # Don't show to non-admins


class PublicProfileSerializer(serializers.ModelSerializer):
    """Serializer for public profile viewing - excludes private information"""
    username = serializers.CharField(source="user.username", read_only=True)
    location = serializers.SerializerMethodField()
    average_rating = serializers.ReadOnlyField()
    total_ratings = serializers.ReadOnlyField()
    profile_picture_url = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()
    ratings = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "bio",
            "skills",
            "interests",
            "profile_picture_url",
            "location",
            "province",
            "district",
            "average_rating",
            "total_ratings",
            "badges",
            "ratings",
            "top_tags",
        ]
        read_only_fields = ["average_rating", "total_ratings", "top_tags"]

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
    
    def get_badges(self, obj):
        """Get all badges for the user"""
        badges = obj.user.badges.all().order_by("-earned_at")
        return [
            {
                "id": badge.id,
                "badge_type": badge.badge_type,
                "badge_type_display": badge.get_badge_type_display(),
                "description": badge.description,
                "earned_at": badge.earned_at,
            }
            for badge in badges
        ]
    
    def get_ratings(self, obj):
        """Get all ratings and feedback for the user"""
        from .models import Rating
        ratings = Rating.objects.filter(ratee=obj.user).order_by("-created_at")
        return [
            {
                "id": rating.id,
                "rater": rating.rater.id,
                "rater_username": rating.rater.username,
                "score": rating.score,
                "tags": rating.tags,
                "comment": rating.comment,
                "created_at": rating.created_at,
            }
            for rating in ratings
        ]
    
    def get_top_tags(self, obj):
        """Get top 3 most common tags from all ratings"""
        from .models import Rating
        from collections import Counter
        ratings = Rating.objects.filter(ratee=obj.user)
        all_tags = []
        for rating in ratings:
            if rating.tags:
                all_tags.extend(rating.tags)
        top_tags = [tag for tag, count in Counter(all_tags).most_common(3)]
        return top_tags


# ---------------------------------------------------------------------------
# OFFER & REQUEST
# ---------------------------------------------------------------------------
class OfferSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    active_handshake = serializers.SerializerMethodField()
    fuzzy_lat = serializers.SerializerMethodField()
    fuzzy_lng = serializers.SerializerMethodField()
    accepted_participant_count = serializers.SerializerMethodField()
    remaining_slots = serializers.SerializerMethodField()

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
            "fuzzy_lat",
            "fuzzy_lng",
            "status",
            "created_at",
            "active_handshake",
            "max_participants",
            "accepted_participant_count",
            "remaining_slots",
        ]
        read_only_fields = ["user", "status", "created_at", "accepted_participant_count", "remaining_slots"]

    def get_username(self, obj):
        return obj.user.username if obj.user else None

    def get_fuzzy_lat(self, obj):
        """Calculate fuzzy latitude for map display using 2D circular scatter"""
        if obj.latitude is None or obj.longitude is None:
            return None
        owner_id = obj.user.id if obj.user else None
        fuzzy_lat, _ = get_fuzzy_coordinates(
            obj.latitude, 
            obj.longitude, 
            obj.id,
            created_at=obj.created_at,
            owner_id=owner_id
        )
        return fuzzy_lat

    def get_fuzzy_lng(self, obj):
        """Calculate fuzzy longitude for map display using 2D circular scatter"""
        if obj.latitude is None or obj.longitude is None:
            return None
        owner_id = obj.user.id if obj.user else None
        _, fuzzy_lng = get_fuzzy_coordinates(
            obj.latitude, 
            obj.longitude, 
            obj.id,
            created_at=obj.created_at,
            owner_id=owner_id
        )
        return fuzzy_lng
    
    def get_accepted_participant_count(self, obj):
        """Get count of accepted participants"""
        return obj.get_accepted_participant_count()
    
    def get_remaining_slots(self, obj):
        """Get remaining participant slots"""
        return obj.get_remaining_slots()
    
    def validate_max_participants(self, value):
        """Validate max_participants is at least 1"""
        if value < 1:
            raise serializers.ValidationError("Maximum participants must be at least 1.")
        return value

    def get_active_handshake(self, obj):
        """Return active handshake info if exists (for single participant) or list of handshakes (for multi-participant)"""
        active_handshakes = obj.handshakes.filter(
            status__in=["proposed", "accepted", "in_progress"]
        )
        
        # For backwards compatibility, return first handshake if only one
        # But also include participant count info
        if active_handshakes.count() > 0:
            handshakes_list = [
                {
                    "id": h.id,
                    "status": h.status,
                    "seeker_username": h.seeker.username,
                    "seeker": h.seeker.id,
                    "provider_username": h.provider.username,
                    "provider": h.provider.id,
                    "hours": h.hours,
                    "created_at": h.created_at,
                    "provider_confirmed": h.provider_confirmed,
                    "seeker_confirmed": h.seeker_confirmed,
                }
                for h in active_handshakes
            ]
            # Return first handshake for backwards compatibility, plus full list
            return {
                **handshakes_list[0],
                "all_handshakes": handshakes_list,
                "participant_count": active_handshakes.filter(status__in=["accepted", "in_progress", "completed"]).count(),
            }
        return None


class RequestSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    active_handshake = serializers.SerializerMethodField()
    fuzzy_lat = serializers.SerializerMethodField()
    fuzzy_lng = serializers.SerializerMethodField()

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
            "fuzzy_lat",
            "fuzzy_lng",
            "status",
            "created_at",
            "active_handshake",
        ]
        read_only_fields = ["user", "status", "created_at"]

    def get_username(self, obj):
        return obj.user.username if obj.user else None

    def get_fuzzy_lat(self, obj):
        """Calculate fuzzy latitude for map display using 2D circular scatter"""
        if obj.latitude is None or obj.longitude is None:
            return None
        owner_id = obj.user.id if obj.user else None
        fuzzy_lat, _ = get_fuzzy_coordinates(
            obj.latitude, 
            obj.longitude, 
            obj.id,
            created_at=obj.created_at,
            owner_id=owner_id
        )
        return fuzzy_lat

    def get_fuzzy_lng(self, obj):
        """Calculate fuzzy longitude for map display using 2D circular scatter"""
        if obj.latitude is None or obj.longitude is None:
            return None
        owner_id = obj.user.id if obj.user else None
        _, fuzzy_lng = get_fuzzy_coordinates(
            obj.latitude, 
            obj.longitude, 
            obj.id,
            created_at=obj.created_at,
            owner_id=owner_id
        )
        return fuzzy_lng

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
    offer_title = serializers.SerializerMethodField()
    request_title = serializers.SerializerMethodField()

    class Meta:
        model = Handshake
        fields = [
            "id",
            "offer",
            "request",
            "offer_title",
            "request_title",
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
            "offer_title",
            "request_title",
        ]

    def get_offer_title(self, obj):
        return obj.offer.title if obj.offer else None

    def get_request_title(self, obj):
        return obj.request.title if obj.request else None

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
            
            # Check if user already has a handshake with this offer (prevent duplicates)
            existing_handshake = Handshake.objects.filter(
                offer=offer,
                seeker=user
            ).exclude(status="declined").first()
            if existing_handshake:
                raise serializers.ValidationError(
                    "You already have a handshake with this offer."
                )
            
            # For offers: check if max_participants is reached
            accepted_count = offer.get_accepted_participant_count()
            if accepted_count >= offer.max_participants:
                raise serializers.ValidationError(
                    f"This offer has reached its maximum number of participants ({offer.max_participants})."
                )
        elif request_obj:
            # Ensure we have the full request object with user
            if not hasattr(request_obj, 'user') or request_obj.user is None:
                raise serializers.ValidationError(
                    "The request does not have an owner. Cannot create handshake."
                )
            provider = request_obj.user
            # Requests must remain 1-to-1: only one active handshake allowed
            active_handshakes = Handshake.objects.filter(
                request=request_obj,
                status__in=["proposed", "accepted", "in_progress"]
            ).exclude(id=None)
            if active_handshakes.exists():
                raise serializers.ValidationError(
                    "This request already has an active handshake. Requests can only have one participant."
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
    ratee_username = serializers.CharField(source="ratee.username", read_only=True)

    class Meta:
        model = Rating
        fields = [
            "id",
            "handshake",
            "rater",
            "rater_username",
            "ratee",
            "ratee_username",
            "score",
            "tags",
            "comment",
            "created_at",
        ]
        read_only_fields = ["rater", "ratee", "created_at"]

    def validate_score(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Score must be between 1 and 10.")
        return value

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list.")
        if len(value) > 3:
            raise serializers.ValidationError("You can select at most 3 tags.")
        if len(value) < 1:
            raise serializers.ValidationError("You must select at least 1 tag.")
        
        # Validate tags are from predefined list
        valid_tags = [tag[0] for tag in Rating.TAG_CHOICES]
        for tag in value:
            if tag not in valid_tags:
                raise serializers.ValidationError(f"Invalid tag: {tag}. Must be from predefined list.")
        
        return value

    def validate(self, data):
        handshake = data.get("handshake")
        if handshake and handshake.status != "completed":
            raise serializers.ValidationError("Ratings can only be given for completed handshakes.")
        
        # Validate handshake participants
        rater = self.context.get("request").user if self.context.get("request") else None
        if rater and handshake:
            if rater not in [handshake.provider, handshake.seeker]:
                raise serializers.ValidationError("You are not part of this handshake.")
            # Set ratee to the other participant
            if rater == handshake.provider:
                data["ratee"] = handshake.seeker
            else:
                data["ratee"] = handshake.provider
        
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


# ---------------------------------------------------------------------------
# FORUM
# ---------------------------------------------------------------------------
class ForumReplySerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = ForumReply
        fields = [
            "id",
            "topic",
            "body",
            "author",
            "author_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["topic", "author", "created_at", "updated_at"]


class ForumTopicSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    reply_count = serializers.SerializerMethodField()
    replies = ForumReplySerializer(many=True, read_only=True)

    class Meta:
        model = ForumTopic
        fields = [
            "id",
            "title",
            "body",
            "author",
            "author_username",
            "created_at",
            "updated_at",
            "reply_count",
            "replies",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]

    def get_reply_count(self, obj):
        return obj.replies.count()
