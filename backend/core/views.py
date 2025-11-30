from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import models

from .models import UserProfile, Offer, Request as RequestModel, Handshake, Transaction, Question, Message, Rating, Badge
from .serializers import (
    UserProfileSerializer,
    OfferSerializer,
    RequestSerializer,
    HandshakeSerializer,
    TransactionSerializer,
    QuestionSerializer,
    MessageSerializer,
    RatingSerializer,
    BadgeSerializer,
)

# ---------------------------------------------------------------------------
# BASIC ROUTES
# ---------------------------------------------------------------------------

def home(request):
    return JsonResponse({"message": "Welcome to The Hive"})


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


# ---------------------------------------------------------------------------
# AUTH & PROFILE
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email")

    if not username or not password:
        return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    user.save()
    UserProfile.objects.create(user=user)
    return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)
    if user is not None:
        return Response({"message": "Login successful", "username": username})
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["GET"])
@permission_classes([AllowAny])
def profile_list(request):
    """List all public profiles"""
    profiles = UserProfile.objects.filter(is_visible=True)
    serializer = UserProfileSerializer(profiles, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_detail(request, user_id=None):
    """Get, update own profile or view other user's public profile"""
    # If user_id is provided, view that user's profile (public)
    # Otherwise, view/edit own profile
    if user_id:
        try:
            target_user = User.objects.get(pk=user_id)
            profile = get_object_or_404(UserProfile, user=target_user)
            # Only show if profile is visible or if viewing own profile
            if not profile.is_visible and profile.user != request.user:
                return Response(
                    {"error": "Profile is not visible."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
    else:
        # View/edit own profile
        profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == "GET":
        serializer = UserProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)
    
    # PUT/PATCH - only allowed for own profile
    if profile.user != request.user:
        return Response(
            {"error": "You can only edit your own profile."},
            status=status.HTTP_403_FORBIDDEN,
        )
    
    serializer = UserProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_own(request):
    """Get or update current user's own profile"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == "GET":
        serializer = UserProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)
    
    # PUT/PATCH - update own profile
    serializer = UserProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# OFFER & REQUEST SYSTEM
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def offers_list_create(request):
    if request.method == "GET":
        try:
            offers = Offer.objects.all().order_by("-created_at")
            serializer = OfferSerializer(offers, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    serializer = OfferSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def offer_detail(request, offer_id):
    try:
        offer = Offer.objects.get(pk=offer_id)
        serializer = OfferSerializer(offer)
        return Response(serializer.data)
    except Offer.DoesNotExist:
        return Response(
            {"error": "Offer not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def requests_list_create(request):
    if request.method == "GET":
        try:
            requests = RequestModel.objects.all().order_by("-created_at")
            serializer = RequestSerializer(requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    serializer = RequestSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def request_detail(request, request_id):
    try:
        request_obj = RequestModel.objects.get(pk=request_id)
        serializer = RequestSerializer(request_obj)
        return Response(serializer.data)
    except RequestModel.DoesNotExist:
        return Response(
            {"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ---------------------------------------------------------------------------
# HANDSHAKE SYSTEM
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def handshakes_list_create(request):
    if request.method == "GET":
        user = request.user
        handshakes = Handshake.objects.filter(
            models.Q(provider=user) | models.Q(seeker=user)
        ).order_by("-created_at")
        serializer = HandshakeSerializer(handshakes, many=True)
        return Response(serializer.data)

    serializer = HandshakeSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        handshake = serializer.save()
        return Response(HandshakeSerializer(handshake).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def handshake_accept(request, handshake_id):
    handshake = get_object_or_404(Handshake, pk=handshake_id)
    user = request.user

    if user != handshake.provider:
        return Response({"error": "Only provider can accept this handshake."}, status=status.HTTP_403_FORBIDDEN)

    handshake.status = "accepted"
    handshake.save()

    if handshake.offer:
        handshake.offer.status = "in_progress"
        handshake.offer.save()
    elif handshake.request:
        handshake.request.status = "in_progress"
        handshake.request.save()

    return Response({"message": "Handshake accepted."}, status=status.HTTP_200_OK)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def handshake_decline(request, handshake_id):
    handshake = get_object_or_404(Handshake, pk=handshake_id)
    user = request.user

    if user != handshake.provider:
        return Response({"error": "Only provider can decline this handshake."}, status=status.HTTP_403_FORBIDDEN)

    handshake.status = "declined"
    handshake.save()
    return Response({"message": "Handshake declined."}, status=status.HTTP_200_OK)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def handshake_confirm(request, handshake_id):
    handshake = get_object_or_404(Handshake, pk=handshake_id)
    user = request.user

    if user not in [handshake.provider, handshake.seeker]:
        return Response({"error": "You are not part of this handshake."}, status=status.HTTP_403_FORBIDDEN)

    if user == handshake.provider:
        handshake.provider_confirmed = True
    elif user == handshake.seeker:
        handshake.seeker_confirmed = True

    if handshake.provider_confirmed and handshake.seeker_confirmed:
        handshake.status = "completed"
        hours = handshake.hours
        provider_profile = handshake.provider.profile
        seeker_profile = handshake.seeker.profile

        if seeker_profile.timebank_balance < hours:
            return Response({"error": "Insufficient Beellar balance."}, status=status.HTTP_400_BAD_REQUEST)

        seeker_profile.timebank_balance -= hours
        provider_profile.timebank_balance += hours
        seeker_profile.save()
        provider_profile.save()

        Transaction.objects.create(
            handshake=handshake,
            sender=handshake.seeker,
            receiver=handshake.provider,
            amount=hours,
        )

    handshake.save()
    return Response(HandshakeSerializer(handshake).data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# TRANSACTION HISTORY
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transactions_list(request):
    transactions = Transaction.objects.filter(
        models.Q(sender=request.user) | models.Q(receiver=request.user)
    ).order_by("-created_at")
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


# ---------------------------------------------------------------------------
# QUESTIONS (PUBLIC PRE-HANDSHAKE)
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def questions_list_create(request):
    """Get questions for an offer/request, or create a new question"""
    if request.method == "GET":
        offer_id = request.query_params.get("offer")
        request_id = request.query_params.get("request")
        
        try:
            if offer_id:
                questions = Question.objects.filter(offer_id=offer_id)
            elif request_id:
                questions = Question.objects.filter(request_id=request_id)
            else:
                return Response(
                    {"error": "Must provide either 'offer' or 'request' parameter"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = QuestionSerializer(questions, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # POST - requires authentication
    if not request.user.is_authenticated:
        return Response(
            {"detail": "Authentication required to ask questions"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        # Check if user is trying to ask a question on their own post
        offer_id = request.data.get("offer")
        request_id = request.data.get("request")
        
        if offer_id:
            offer = get_object_or_404(Offer, pk=offer_id)
            if offer.user == request.user:
                return Response(
                    {"error": "You cannot ask questions on your own posts."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request_id:
            request_obj = get_object_or_404(RequestModel, pk=request_id)
            if request_obj.user == request.user:
                return Response(
                    {"error": "You cannot ask questions on your own posts."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = QuestionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def question_answer(request, question_id):
    """Allow post owner to answer a question"""
    question = get_object_or_404(Question, pk=question_id)
    user = request.user
    
    # Check if user is the owner of the post
    is_owner = False
    if question.offer:
        is_owner = question.offer.user == user
    elif question.request:
        is_owner = question.request.user == user
    
    if not is_owner:
        return Response(
            {"error": "Only the post owner can answer questions."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if handshake is already accepted (answers only allowed before handshake)
    if question.offer:
        active_handshake = question.offer.handshakes.filter(
            status__in=["accepted", "in_progress", "completed"]
        ).first()
    else:
        active_handshake = question.request.handshakes.filter(
            status__in=["accepted", "in_progress", "completed"]
        ).first()
    
    if active_handshake:
        return Response(
            {"error": "Questions can only be answered before a handshake is accepted."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Update the answer
    answer_text = request.data.get("answer", "").strip()
    if not answer_text:
        return Response(
            {"error": "Answer cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from django.utils import timezone
    question.answer = answer_text
    question.answered_at = timezone.now()
    question.save()
    
    serializer = QuestionSerializer(question)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# MESSAGES (PRIVATE CHAT AFTER HANDSHAKE)
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def messages_list_create(request):
    """Get messages for a handshake, or send a new message"""
    handshake_id = request.query_params.get("handshake")
    
    if request.method == "GET":
        if not handshake_id:
            return Response(
                {"error": "Must provide 'handshake' parameter"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        handshake = get_object_or_404(Handshake, pk=handshake_id)
        
        # Only participants can view messages
        if request.user not in [handshake.provider, handshake.seeker]:
            return Response(
                {"error": "You are not part of this handshake"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only show messages if handshake is accepted or in progress
        if handshake.status not in ["accepted", "in_progress", "completed"]:
            return Response(
                {"error": "Messages are only available after handshake is accepted"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        messages = Message.objects.filter(handshake=handshake)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    # POST - send message
    serializer = MessageSerializer(data=request.data)
    if serializer.is_valid():
        handshake = serializer.validated_data.get("handshake")
        
        # Only participants can send messages
        if request.user not in [handshake.provider, handshake.seeker]:
            return Response(
                {"error": "You are not part of this handshake"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow messages if handshake is accepted or in progress
        if handshake.status not in ["accepted", "in_progress", "completed"]:
            return Response(
                {"error": "Messages are only available after handshake is accepted"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer.save(sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# RATINGS & BADGES
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def ratings_list_create(request):
    """List ratings for a user, or create a new rating"""
    if request.method == "GET":
        user_id = request.query_params.get("user")
        username = request.query_params.get("username")
        if user_id:
            # Filter by user ID (profile ID)
            from .models import UserProfile
            try:
                profile = UserProfile.objects.get(pk=user_id)
                ratings = Rating.objects.filter(rated_user=profile.user)
            except UserProfile.DoesNotExist:
                ratings = Rating.objects.none()
        elif username:
            # Filter by username
            try:
                user = User.objects.get(username=username)
                ratings = Rating.objects.filter(rated_user=user)
            except User.DoesNotExist:
                ratings = Rating.objects.none()
        else:
            # Return all ratings if no filter
            ratings = Rating.objects.all()
        serializer = RatingSerializer(ratings, many=True)
        return Response(serializer.data)
    
    # POST - create rating (requires authentication)
    if not request.user.is_authenticated:
        return Response(
            {"error": "Authentication required to create ratings."},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    serializer = RatingSerializer(data=request.data)
    if serializer.is_valid():
        handshake = serializer.validated_data.get("handshake")
        rated_user = serializer.validated_data.get("rated_user")
        
        # Validate handshake is completed
        if handshake.status != "completed":
            return Response(
                {"error": "Ratings can only be given for completed handshakes."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate user is part of handshake
        if request.user not in [handshake.provider, handshake.seeker]:
            return Response(
                {"error": "You are not part of this handshake."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate rated_user is the other participant
        other_participant = handshake.seeker if request.user == handshake.provider else handshake.provider
        if rated_user != other_participant:
            return Response(
                {"error": "You can only rate the other participant in the handshake."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if rating already exists
        if Rating.objects.filter(handshake=handshake, rater=request.user).exists():
            return Response(
                {"error": "You have already rated this handshake."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(rater=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def badges_list(request):
    """List badges for a user"""
    user_id = request.query_params.get("user")  # This is profile ID
    username = request.query_params.get("username")
    
    if user_id:
        # Get user from profile ID
        try:
            profile = UserProfile.objects.get(pk=user_id)
            badges = Badge.objects.filter(user=profile.user)
        except UserProfile.DoesNotExist:
            badges = Badge.objects.none()
    elif username:
        # Get user from username
        try:
            user = User.objects.get(username=username)
            badges = Badge.objects.filter(user=user)
        except User.DoesNotExist:
            badges = Badge.objects.none()
    else:
        return Response(
            {"error": "Must provide 'user' or 'username' parameter"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = BadgeSerializer(badges, many=True)
    return Response(serializer.data)
