from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

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
from .email_utils import send_activation_email

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
    try:
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")

        # Validate required fields
        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not email:
            return Response({"error": "Email address is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        try:
            validate_email(email)
        except ValidationError:
            return Response({"error": "Invalid email address format"}, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate username
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicate email
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email address is already registered"}, status=status.HTTP_400_BAD_REQUEST)

        # Create user with email_verified=False
        user = User.objects.create_user(username=username, password=password, email=email)
        
        # Profile will be created by signal with starting balance of 3 Beellars
        # But ensure it exists in case signal doesn't fire
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'timebank_balance': 3,
                'email_verified': False
            }
        )
        
        # If profile already exists but balance is 0, set to 3 (for existing users)
        if not created and profile.timebank_balance == 0:
            profile.timebank_balance = 3
        # Ensure email_verified is False for new registrations
        # Check if field exists before trying to set it (in case migration hasn't run)
        if hasattr(profile, 'email_verified'):
            profile.email_verified = False
        profile.save()
        
        # Send activation email (wrap in try-except so it doesn't fail registration)
        email_sent = False
        try:
            print(f"[DEBUG] Attempting to send activation email to {user.email}")
            email_sent = send_activation_email(user, request)
            print(f"[DEBUG] Email sending result: {email_sent}")
        except Exception as e:
            import traceback
            print(f"[ERROR] Error sending activation email: {str(e)}")
            traceback.print_exc()
            # Don't fail registration if email fails - user can request resend later
        
        return Response({
            "message": "Registration successful! Please check your email to activate your account.",
            "email_sent": email_sent
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback.print_exc()
        return Response({
            "error": f"Registration failed: {error_msg}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def activate_account(request):
    """
    Activate user account using activation token.
    POST /api/auth/activate/ with body: {"token": "..."}
    """
    token = request.data.get("token")
    
    if not token:
        return Response({"error": "Activation token is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    from .email_utils import validate_activation_token, send_verification_success_email
    
    is_valid, user_id, error_message = validate_activation_token(token)
    
    if not is_valid:
        return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(pk=user_id)
        profile = user.profile
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already verified
    if profile.email_verified:
        return Response({
            "message": "Email is already verified. You can log in.",
            "already_verified": True
        }, status=status.HTTP_200_OK)
    
    # Activate the account
    profile.email_verified = True
    profile.save()
    
    # Send success notification email (optional)
    send_verification_success_email(user)
    
    return Response({
        "message": "Email verified successfully! You can now log in.",
        "verified": True
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_activation(request):
    """
    Resend activation email to user.
    POST /api/auth/resend-activation/ with body: {"email": "..."} or {"username": "..."}
    """
    email = request.data.get("email")
    username = request.data.get("username")
    
    if not email and not username:
        return Response({"error": "Email or username is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if email:
            user = User.objects.get(email=email)
        else:
            user = User.objects.get(username=username)
    except User.DoesNotExist:
        # Don't reveal whether user exists for security reasons
        return Response({
            "message": "If an account with that email/username exists, an activation email has been sent."
        }, status=status.HTTP_200_OK)
    
    # Check if already verified
    try:
        profile = user.profile
        if profile.email_verified:
            return Response({
                "message": "Email is already verified. You can log in.",
                "already_verified": True
            }, status=status.HTTP_200_OK)
    except UserProfile.DoesNotExist:
        # Create profile if it doesn't exist
        profile = UserProfile.objects.create(user=user, timebank_balance=3, email_verified=False)
    
    # Resend activation email
    email_sent = send_activation_email(user, request)
    
    if email_sent:
        return Response({
            "message": "Activation email has been sent. Please check your inbox."
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            "error": "Failed to send activation email. Please try again later."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            from django.utils import timezone
            from datetime import datetime, timedelta
            from .location_utils import calculate_distance_km, get_fuzzy_coordinates
            
            # Filter out cancelled (deleted) offers
            offers = Offer.objects.exclude(status="cancelled")
            
            # Filter by tag
            tag = request.query_params.get("tag", None)
            if tag:
                offers = offers.filter(tags__icontains=tag)
            
            # Filter by date range (created_at)
            min_date = request.query_params.get("min_date", None)
            max_date = request.query_params.get("max_date", None)
            if min_date:
                try:
                    min_date_obj = datetime.strptime(min_date, "%Y-%m-%d").date()
                    offers = offers.filter(created_at__date__gte=min_date_obj)
                except ValueError:
                    pass
            if max_date:
                try:
                    max_date_obj = datetime.strptime(max_date, "%Y-%m-%d").date()
                    offers = offers.filter(created_at__date__lte=max_date_obj)
                except ValueError:
                    pass
            
            # Filter by distance (using fuzzy coordinates)
            distance_km = request.query_params.get("distance", None)
            user_lat = request.query_params.get("lat", None)
            user_lng = request.query_params.get("lng", None)
            
            if distance_km and user_lat and user_lng:
                try:
                    distance_km = float(distance_km)
                    user_lat = float(user_lat)
                    user_lng = float(user_lng)
                    
                    # Filter offers within distance using fuzzy coordinates
                    filtered_offers = []
                    for offer in offers:
                        if offer.latitude is None or offer.longitude is None:
                            continue
                        
                        # Calculate fuzzy coordinates for this offer
                        owner_id = offer.user.id if offer.user else None
                        fuzzy_lat, fuzzy_lng = get_fuzzy_coordinates(
                            offer.latitude,
                            offer.longitude,
                            offer.id,
                            created_at=offer.created_at,
                            owner_id=owner_id
                        )
                        
                        if fuzzy_lat and fuzzy_lng:
                            # Calculate distance from user to fuzzy location
                            dist = calculate_distance_km(user_lat, user_lng, fuzzy_lat, fuzzy_lng)
                            if dist <= distance_km:
                                filtered_offers.append(offer)
                    
                    offers = Offer.objects.filter(
                        id__in=[o.id for o in filtered_offers]
                    )
                except (ValueError, TypeError):
                    pass
            
            offers = offers.order_by("-created_at")
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


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def offer_edit(request, offer_id):
    """
    Edit an offer. Only the owner can edit their own offer.
    PUT /api/offers/<id>/edit/
    """
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response(
            {"error": "Offer not found"}, status=status.HTTP_404_NOT_FOUND
        )
    
    # Check ownership
    if offer.user != request.user:
        return Response(
            {"error": "You can only edit your own offers."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validate and update
    serializer = OfferSerializer(offer, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def offer_delete(request, offer_id):
    """
    Delete (soft-delete) an offer. Only the owner can delete their own offer.
    Posts with active handshakes cannot be deleted.
    DELETE /api/offers/<id>/delete/
    """
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response(
            {"error": "Offer not found"}, status=status.HTTP_404_NOT_FOUND
        )
    
    # Check ownership or admin status
    is_admin = request.user.is_staff or request.user.is_superuser
    if offer.user != request.user and not is_admin:
        return Response(
            {"error": "You can only delete your own offers."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check for active handshakes (admins can delete regardless)
    if not is_admin:
        active_handshakes = offer.handshakes.filter(
            status__in=["proposed", "accepted", "in_progress"]
        ).exists()
        
        if active_handshakes:
            return Response(
                {"error": "Cannot delete offer with an active handshake. Please wait for the handshake to complete or be declined."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Soft-delete: mark as cancelled (or admin can hard-delete)
    if is_admin:
        offer.delete()
        return Response(
            {"message": "Offer deleted successfully."},
            status=status.HTTP_200_OK
        )
    else:
        offer.status = "cancelled"
        offer.save()
        return Response(
            {"message": "Offer deleted successfully."},
            status=status.HTTP_200_OK
        )


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def requests_list_create(request):
    if request.method == "GET":
        try:
            from django.utils import timezone
            from datetime import datetime, timedelta
            from .location_utils import calculate_distance_km, get_fuzzy_coordinates
            
            # Filter out cancelled (deleted) requests
            requests = RequestModel.objects.exclude(status="cancelled")
            
            # Filter by tag
            tag = request.query_params.get("tag", None)
            if tag:
                requests = requests.filter(tags__icontains=tag)
            
            # Filter by date range (created_at)
            min_date = request.query_params.get("min_date", None)
            max_date = request.query_params.get("max_date", None)
            if min_date:
                try:
                    min_date_obj = datetime.strptime(min_date, "%Y-%m-%d").date()
                    requests = requests.filter(created_at__date__gte=min_date_obj)
                except ValueError:
                    pass
            if max_date:
                try:
                    max_date_obj = datetime.strptime(max_date, "%Y-%m-%d").date()
                    requests = requests.filter(created_at__date__lte=max_date_obj)
                except ValueError:
                    pass
            
            # Filter by distance (using fuzzy coordinates)
            distance_km = request.query_params.get("distance", None)
            user_lat = request.query_params.get("lat", None)
            user_lng = request.query_params.get("lng", None)
            
            if distance_km and user_lat and user_lng:
                try:
                    distance_km = float(distance_km)
                    user_lat = float(user_lat)
                    user_lng = float(user_lng)
                    
                    # Filter requests within distance using fuzzy coordinates
                    filtered_requests = []
                    for req in requests:
                        if req.latitude is None or req.longitude is None:
                            continue
                        
                        # Calculate fuzzy coordinates for this request
                        owner_id = req.user.id if req.user else None
                        fuzzy_lat, fuzzy_lng = get_fuzzy_coordinates(
                            req.latitude,
                            req.longitude,
                            req.id,
                            created_at=req.created_at,
                            owner_id=owner_id
                        )
                        
                        if fuzzy_lat and fuzzy_lng:
                            # Calculate distance from user to fuzzy location
                            dist = calculate_distance_km(user_lat, user_lng, fuzzy_lat, fuzzy_lng)
                            if dist <= distance_km:
                                filtered_requests.append(req)
                    
                    requests = RequestModel.objects.filter(
                        id__in=[r.id for r in filtered_requests]
                    )
                except (ValueError, TypeError):
                    pass
            
            requests = requests.order_by("-created_at")
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


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def request_edit(request, request_id):
    """
    Edit a request. Only the owner can edit their own request.
    PUT /api/requests/<id>/edit/
    """
    try:
        request_obj = RequestModel.objects.get(pk=request_id)
    except RequestModel.DoesNotExist:
        return Response(
            {"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND
        )
    
    # Check ownership
    if request_obj.user != request.user:
        return Response(
            {"error": "You can only edit your own requests."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validate and update
    serializer = RequestSerializer(request_obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def request_delete(request, request_id):
    """
    Delete (soft-delete) a request. Only the owner can delete their own request.
    Posts with active handshakes cannot be deleted.
    DELETE /api/requests/<id>/delete/
    """
    try:
        request_obj = RequestModel.objects.get(pk=request_id)
    except RequestModel.DoesNotExist:
        return Response(
            {"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND
        )
    
    # Check ownership or admin status
    is_admin = request.user.is_staff or request.user.is_superuser
    if request_obj.user != request.user and not is_admin:
        return Response(
            {"error": "You can only delete your own requests."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check for active handshakes (admins can delete regardless)
    if not is_admin:
        active_handshakes = request_obj.handshakes.filter(
            status__in=["proposed", "accepted", "in_progress"]
        ).exists()
        
        if active_handshakes:
            return Response(
                {"error": "Cannot delete request with an active handshake. Please wait for the handshake to complete or be declined."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Soft-delete: mark as cancelled (or admin can hard-delete)
    if is_admin:
        request_obj.delete()
        return Response(
            {"message": "Request deleted successfully."},
            status=status.HTTP_200_OK
        )
    else:
        request_obj.status = "cancelled"
        request_obj.save()
        return Response(
            {"message": "Request deleted successfully."},
            status=status.HTTP_200_OK
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
# TRANSACTION HISTORY & BALANCE
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def timebank_balance(request):
    """Get current user's Timebank balance"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    if created:
        # Set starting balance for newly created profile
        profile.timebank_balance = 3
        profile.save()
    return Response({"balance": profile.timebank_balance})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transactions_list(request):
    """Get transaction history for the logged-in user"""
    transactions = Transaction.objects.filter(
        models.Q(sender=request.user) | models.Q(receiver=request.user)
    ).order_by("-created_at")
    serializer = TransactionSerializer(transactions, many=True, context={"request": request})
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


@api_view(["GET"])
@permission_classes([AllowAny])
def tags_list(request):
    """
    Get all unique tags from offers and requests.
    Returns a list of unique tag names from the database.
    GET /api/tags/?query=coo (optional query parameter for filtering)
    """
    from django.db.models import Q
    
    # Get query parameter for filtering tags
    query = request.query_params.get("query", "").strip().lower()
    
    # Get all tags from offers and requests (excluding cancelled posts)
    offers = Offer.objects.exclude(status="cancelled").exclude(tags__isnull=True).exclude(tags="")
    requests = RequestModel.objects.exclude(status="cancelled").exclude(tags__isnull=True).exclude(tags="")
    
    # Collect all tags
    all_tags = set()
    
    for offer in offers:
        if offer.tags:
            # Split comma-separated tags and clean them
            tags = [tag.strip() for tag in offer.tags.split(",") if tag.strip()]
            all_tags.update(tags)
    
    for req in requests:
        if req.tags:
            # Split comma-separated tags and clean them
            tags = [tag.strip() for tag in req.tags.split(",") if tag.strip()]
            all_tags.update(tags)
    
    # Convert to sorted list
    unique_tags = sorted(list(all_tags), key=str.lower)
    
    # Filter by query if provided
    if query:
        unique_tags = [tag for tag in unique_tags if query in tag.lower()]
    
    return Response({"tags": unique_tags}, status=status.HTTP_200_OK)
