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

from .models import UserProfile, Offer, Request as RequestModel, Handshake, Transaction, Question, Message, Rating, Badge, ForumTopic, ForumReply
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
    ForumTopicSerializer,
    ForumReplySerializer,
)
from .email_utils import send_activation_email, send_password_reset_email, validate_password_reset_token

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
    email = request.data.get("email", "").strip() if request.data.get("email") else None
    username = request.data.get("username", "").strip() if request.data.get("username") else None
    
    if not email and not username:
        return Response({"error": "Email or username is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if email:
            print(f"🔍 Looking up user by email: {email}")
            user = User.objects.get(email=email)
        else:
            print(f"🔍 Looking up user by username: {username}")
            user = User.objects.get(username=username)
        print(f"✅ User found: {user.username} (ID: {user.id})")
    except User.DoesNotExist:
        # Don't reveal whether user exists for security reasons
        print(f"⚠️ User not found (email: {email}, username: {username}) - returning generic message for security")
        return Response({
            "message": "If an account with that email/username exists, an activation email has been sent."
        }, status=status.HTTP_200_OK)
    except User.MultipleObjectsReturned:
        # Handle case where multiple users might have the same email (shouldn't happen but handle it)
        print(f"❌ Multiple users found with email: {email}")
        if email:
            user = User.objects.filter(email=email).first()
        else:
            user = User.objects.filter(username=username).first()
        print(f"Using first user: {user.username} (ID: {user.id})")
    
    # Check if already verified
    try:
        profile = user.profile
        print(f"📋 Profile found for user {user.username}")
        if profile.email_verified:
            print(f"✅ User {user.username} already verified - skipping email send")
            return Response({
                "message": "Email is already verified. You can log in.",
                "already_verified": True
            }, status=status.HTTP_200_OK)
        print(f"⏳ User {user.username} not verified - will send activation email")
    except UserProfile.DoesNotExist:
        # Create profile if it doesn't exist
        print(f"📋 Creating profile for user {user.username}")
        profile = UserProfile.objects.create(user=user, timebank_balance=3, email_verified=False)
    
    # Validate user has an email address
    if not user.email:
        return Response({
            "error": "User account does not have an email address. Cannot send activation email."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Resend activation email
    print(f"\n{'='*60}")
    print(f"🔄 RESENDING ACTIVATION EMAIL")
    print(f"{'='*60}")
    print(f"User ID: {user.id}")
    print(f"Username: {user.username}")
    print(f"Email: {user.email}")
    print(f"Email Verified: {profile.email_verified}")
    print(f"{'='*60}\n")
    
    try:
        email_sent = send_activation_email(user, request)
        
        print(f"\n{'='*60}")
        print(f"Email send result: {email_sent}")
        print(f"{'='*60}\n")
        
        if email_sent:
            return Response({
                "message": "Activation email has been sent. Please check your inbox (or console if using console backend)."
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "error": "Failed to send activation email. Please try again later.",
                "details": "Check server console logs for details."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        import traceback
        print(f"\n❌ EXCEPTION in resend_activation:")
        traceback.print_exc()
        return Response({
            "error": f"Error sending activation email: {str(e)}"
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


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Request password reset.
    POST /api/auth/password-reset-request/ with body: {"email": "..."}
    Always returns success to avoid email enumeration.
    """
    email = request.data.get("email", "").strip()
    
    if not email:
        return Response({
            "message": "If an account with that email exists, a password reset email has been sent."
        }, status=status.HTTP_200_OK)
    
    try:
        user = User.objects.get(email=email)
        # Send password reset email
        email_sent = send_password_reset_email(user, request)
        print(f"Password reset email {'sent' if email_sent else 'failed'} for user: {user.username}")
    except User.DoesNotExist:
        # Don't reveal whether user exists
        pass
    except User.MultipleObjectsReturned:
        # Handle multiple users with same email (shouldn't happen but handle it)
        user = User.objects.filter(email=email).first()
        if user:
            email_sent = send_password_reset_email(user, request)
            print(f"Password reset email {'sent' if email_sent else 'failed'} for user: {user.username}")
    
    # Always return success to avoid email enumeration
    return Response({
        "message": "If an account with that email exists, a password reset email has been sent."
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def password_reset_verify(request, token):
    """
    Verify password reset token.
    GET /api/auth/password-reset-verify/<token>/
    """
    is_valid, user_id, error_message = validate_password_reset_token(token)
    
    if is_valid:
        return Response({
            "valid": True,
            "message": "Token is valid."
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            "valid": False,
            "error": error_message or "Invalid or expired token."
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """
    Confirm password reset and set new password.
    POST /api/auth/password-reset-confirm/ with body: {"token": "...", "new_password": "..."}
    """
    token = request.data.get("token")
    new_password = request.data.get("new_password")
    
    if not token or not new_password:
        return Response({
            "error": "Token and new_password are required."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength (basic validation)
    if len(new_password) < 8:
        return Response({
            "error": "Password must be at least 8 characters long."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate token
    is_valid, user_id, error_message = validate_password_reset_token(token)
    
    if not is_valid:
        return Response({
            "error": error_message or "Invalid or expired token."
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(pk=user_id)
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            "message": "Password has been reset successfully. You can now log in with your new password."
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            "error": "User not found."
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "error": f"Error resetting password: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def profile_list(request):
    """List all public profiles"""
    profiles = UserProfile.objects.filter(is_visible=True)
    serializer = UserProfileSerializer(profiles, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def public_profile_view(request, user_id):
    """
    Get public profile information for a user.
    GET /api/users/<id>/public/
    Returns only public information (no email, beellars, etc.)
    """
    try:
        target_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        profile = UserProfile.objects.get(user=target_user)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if profile is visible (unless viewing own profile)
    if profile.user != request.user and not profile.is_visible:
        return Response(
            {"error": "This profile is not visible."},
            status=status.HTTP_403_FORBIDDEN,
        )
    
    serializer = PublicProfileSerializer(profile, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


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
    try:
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
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
            offers = Offer.objects.exclude(status="cancelled").exclude(status="completed")
            
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
            requests = RequestModel.objects.exclude(status="cancelled").exclude(status="completed")
            
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

    # For offers: check if max_participants is reached
    if handshake.offer:
        accepted_count = handshake.offer.get_accepted_participant_count()
        if accepted_count >= handshake.offer.max_participants:
            return Response(
                {"error": f"This offer has reached its maximum number of participants ({handshake.offer.max_participants})."},
                status=status.HTTP_400_BAD_REQUEST
            )

    handshake.status = "accepted"
    handshake.save()

    # Mark post as "in_progress" when at least one handshake is accepted
    if handshake.offer:
        if handshake.offer.status == "open":
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


def _complete_handshake(handshake):
    """
    Helper function to handle handshake completion:
    - Transfer Beellars
    - Create transaction record
    - Mark post as completed (for requests, or offers when ALL handshakes complete)
    - Update handshake status
    
    Note: Both provider_confirmed and seeker_confirmed should already be True
    when this function is called.
    
    For offers: Each participant pays 1 Beellar, owner earns 1 Beellar TOTAL (not per participant).
    For requests: Standard 1-to-1 transaction.
    """
    hours = handshake.hours
    provider_profile = handshake.provider.profile
    seeker_profile = handshake.seeker.profile

    # Transfer Beellars
    if handshake.offer:
        # Check sufficient balance before transfer (offers always cost 1 Beellar per participant)
        if seeker_profile.timebank_balance < 1:
            return False, "Insufficient Beellar balance. Participant needs at least 1 Beellar."
        # Multi-participant offer: each participant pays 1 Beellar, owner gets 1 Beellar total
        # Check completed count BEFORE marking this one as completed
        completed_count_before = handshake.offer.handshakes.filter(status="completed").count()
        
        # Participant pays 1 Beellar
        seeker_profile.timebank_balance -= 1
        seeker_profile.save()
        
        # Owner earns 1 Beellar only on first completion
        if completed_count_before == 0:
            provider_profile.timebank_balance += 1
            provider_profile.save()
        
        # Create transaction record
        Transaction.objects.create(
            handshake=handshake,
            sender=handshake.seeker,
            receiver=handshake.provider,
            amount=1,  # Always 1 Beellar for offers
        )
        
        # Mark handshake as completed first
        handshake.status = "completed"
        handshake.save()
        
        # Check if ALL accepted handshakes are now completed
        # Count handshakes that are still accepted/in_progress (excluding declined)
        remaining_active = handshake.offer.handshakes.filter(
            status__in=["accepted", "in_progress"]
        ).exclude(status="declined").count()
        
        # Mark offer as completed only when no active handshakes remain
        if remaining_active == 0:
            handshake.offer.status = "completed"
            handshake.offer.save()
        return True, "Handshake completed successfully. Beellars transferred."
    else:
        # Request: standard 1-to-1 transaction
        # Check sufficient balance before transfer
        if seeker_profile.timebank_balance < hours:
            return False, "Insufficient Beellar balance."
        
        seeker_profile.timebank_balance -= hours
        provider_profile.timebank_balance += hours
        seeker_profile.save()
        provider_profile.save()

        # Create transaction record
        Transaction.objects.create(
            handshake=handshake,
            sender=handshake.seeker,
            receiver=handshake.provider,
            amount=hours,
        )

        # Mark request as completed (requests are always 1-to-1)
        handshake.request.status = "completed"
        handshake.request.save()
        
        # Mark handshake as completed
        handshake.status = "completed"
        handshake.save()
        
        return True, "Handshake completed successfully. Beellars transferred."


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def handshake_confirm_provider(request, handshake_id):
    """Provider confirms service completion"""
    handshake = get_object_or_404(Handshake, pk=handshake_id)
    user = request.user

    # Check user is the provider
    if user != handshake.provider:
        return Response(
            {"error": "Only the provider can confirm from this endpoint."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check handshake is in a valid state
    if handshake.status not in ["accepted", "in_progress"]:
        return Response(
            {"error": "Handshake must be accepted or in progress to confirm completion."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if already confirmed
    if handshake.provider_confirmed:
        return Response(
            {"error": "Provider has already confirmed completion."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if handshake is already completed
    if handshake.status == "completed":
        return Response(
            {"error": "Handshake is already completed."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set provider confirmation (don't save yet - we'll check completion first)
    handshake.provider_confirmed = True

    # Check if both sides have confirmed BEFORE saving
    both_confirmed = handshake.provider_confirmed and handshake.seeker_confirmed

    if both_confirmed:
        # Complete the handshake (this will handle transfer, transaction, and marking post as completed)
        success, message = _complete_handshake(handshake)
        if not success:
            # Rollback confirmation if transfer fails
            handshake.provider_confirmed = False
            handshake.save()
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "message": "Service completed! Beellars have been transferred.",
            "handshake": HandshakeSerializer(handshake).data
        }, status=status.HTTP_200_OK)
    else:
        # Only one side confirmed, just save the confirmation
        handshake.save()  # Model's save() won't trigger completion since both aren't confirmed
        return Response({
            "message": "Provider confirmation recorded. Waiting for seeker to confirm...",
            "handshake": HandshakeSerializer(handshake).data
        }, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def handshake_confirm_seeker(request, handshake_id):
    """Seeker confirms service completion"""
    handshake = get_object_or_404(Handshake, pk=handshake_id)
    user = request.user

    # Check user is the seeker
    if user != handshake.seeker:
        return Response(
            {"error": "Only the seeker can confirm from this endpoint."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check handshake is in a valid state
    if handshake.status not in ["accepted", "in_progress"]:
        return Response(
            {"error": "Handshake must be accepted or in progress to confirm completion."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if already confirmed
    if handshake.seeker_confirmed:
        return Response(
            {"error": "Seeker has already confirmed completion."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if handshake is already completed
    if handshake.status == "completed":
        return Response(
            {"error": "Handshake is already completed."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set seeker confirmation (don't save yet - we'll check completion first)
    handshake.seeker_confirmed = True

    # Check if both sides have confirmed BEFORE saving
    both_confirmed = handshake.provider_confirmed and handshake.seeker_confirmed

    if both_confirmed:
        # Complete the handshake (this will handle transfer, transaction, and marking post as completed)
        success, message = _complete_handshake(handshake)
        if not success:
            # Rollback confirmation if transfer fails
            handshake.seeker_confirmed = False
            handshake.save()
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "message": "Service completed! Beellars have been transferred.",
            "handshake": HandshakeSerializer(handshake).data
        }, status=status.HTTP_200_OK)
    else:
        # Only one side confirmed, just save the confirmation
        handshake.save()  # Model's save() won't trigger completion since both aren't confirmed
        return Response({
            "message": "Seeker confirmation recorded. Waiting for provider to confirm...",
            "handshake": HandshakeSerializer(handshake).data
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# TRANSACTION HISTORY & BALANCE
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def timebank_view(request):
    """
    Unified endpoint returning both balance and transaction history.
    GET /api/timebank/
    Returns: {balance: int, transactions: []}
    """
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    if created:
        # Set starting balance for newly created profile
        profile.timebank_balance = 3
        profile.save()
    
    # Get transaction history (sorted newest → oldest)
    transactions = Transaction.objects.filter(
        models.Q(sender=request.user) | models.Q(receiver=request.user)
    ).order_by("-created_at")
    
    serializer = TransactionSerializer(transactions, many=True, context={"request": request})
    
    return Response({
        "balance": profile.timebank_balance,
        "transactions": serializer.data
    })


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
    """
    Get transaction history for the logged-in user.
    Admins can view all transactions by passing ?all=true
    """
    # Check if user is admin and wants to see all transactions
    is_admin = request.user.is_staff or request.user.is_superuser
    show_all = request.query_params.get("all", "false").lower() == "true"
    
    if is_admin and show_all:
        # Admin viewing all transactions
        transactions = Transaction.objects.all().order_by("-created_at")
    else:
        # Regular user or admin viewing own transactions
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
                ratings = Rating.objects.filter(ratee=profile.user)
            except UserProfile.DoesNotExist:
                ratings = Rating.objects.none()
        elif username:
            # Filter by username
            try:
                user = User.objects.get(username=username)
                ratings = Rating.objects.filter(ratee=user)
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rating_create_for_handshake(request, handshake_id):
    """
    Create a rating for a completed handshake.
    POST /api/ratings/<handshake_id>/
    Body: { "score": 1-10, "tags": ["tag1", "tag2"], "comment": "optional" }
    """
    try:
        handshake = Handshake.objects.get(pk=handshake_id)
    except Handshake.DoesNotExist:
        return Response(
            {"error": "Handshake not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
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
    
    # Check if rating already exists
    if Rating.objects.filter(handshake=handshake, rater=request.user).exists():
        return Response(
            {"error": "You have already rated this handshake."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Determine ratee (the other participant)
    ratee = handshake.seeker if request.user == handshake.provider else handshake.provider
    
    # Prepare data for serializer
    data = request.data.copy()
    data["handshake"] = handshake_id
    data["ratee"] = ratee.id
    
    serializer = RatingSerializer(data=data, context={"request": request})
    if serializer.is_valid():
        serializer.save(rater=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([AllowAny])
def ratings_by_user(request, user_id):
    """
    Get all ratings received by a user.
    GET /api/ratings/user/<user_id>/
    """
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    ratings = Rating.objects.filter(ratee=user).order_by("-created_at")
    serializer = RatingSerializer(ratings, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ratings_by_handshake(request, handshake_id):
    """
    Get rating status for a handshake.
    GET /api/ratings/handshake/<handshake_id>/
    Returns information about ratings submitted by both participants.
    """
    try:
        handshake = Handshake.objects.get(pk=handshake_id)
    except Handshake.DoesNotExist:
        return Response(
            {"error": "Handshake not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validate user is part of handshake
    if request.user not in [handshake.provider, handshake.seeker]:
        return Response(
            {"error": "You are not part of this handshake."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get ratings for this handshake
    ratings = Rating.objects.filter(handshake=handshake)
    
    # Determine if current user has rated
    user_rating = ratings.filter(rater=request.user).first()
    has_rated = user_rating is not None
    
    # Determine if partner has rated
    partner = handshake.seeker if request.user == handshake.provider else handshake.provider
    partner_rating = ratings.filter(rater=partner).first()
    partner_has_rated = partner_rating is not None
    
    return Response({
        "handshake_id": handshake_id,
        "handshake_status": handshake.status,
        "has_rated": has_rated,
        "partner_has_rated": partner_has_rated,
        "user_rating": RatingSerializer(user_rating).data if user_rating else None,
        "partner_rating": RatingSerializer(partner_rating).data if partner_rating else None,
    })


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


def is_valid_service_tag(label, description):
    """
    Filter function to determine if a Wikidata entity is suitable as a service/activity tag.
    Excludes human names, celebrities, and unrelated entities.
    Prefers service-related, activity, or skill-like tags.
    
    Args:
        label: The entity label (e.g., "Cooking")
        description: The entity description (e.g., "preparation of food")
    
    Returns:
        bool: True if the tag is suitable for services/activities, False otherwise
    """
    if not label:
        return False
    
    # If no description, reject it (better to filter out than show irrelevant tags)
    if not description:
        return False
    
    description_lower = description.lower()
    label_lower = label.lower()
    
    # Exclude human-related keywords
    human_keywords = [
        "human", "person", "people", "individual",
        "male", "female", "man", "woman", "boy", "girl",
        "actor", "actress", "politician", "footballer", "football player",
        "scientist", "writer", "author", "singer", "musician",
        "artist", "painter", "director", "producer", "ceo",
        "president", "minister", "mayor", "governor", "leader",
        "character", "fictional character", "fictional",
        "born", "died", "century", "era", "age",
    ]
    
    # Check if description contains human-related keywords
    for keyword in human_keywords:
        if keyword in description_lower:
            return False
    
    # Exclude geographical/location-related keywords
    location_keywords = [
        "city", "town", "village", "place", "location", "country", "region",
        "state", "province", "district", "county", "municipality",
        "building", "monument", "museum", "airport", "station",
        "river", "mountain", "lake", "island", "continent",
    ]
    
    for keyword in location_keywords:
        if keyword in description_lower:
            return False
    
    # Additional check: if label itself looks like a person's name
    # (e.g., "John Smith", "Maria Garcia" - has two capitalized words that might be names)
    words = label.split()
    if len(words) == 2 and words[0][0].isupper() and words[1][0].isupper():
        # Could be a name, reject if description suggests person
        if any(keyword in description_lower for keyword in ["human", "person", "born", "died", "actor", "politician"]):
            return False
    
    # Additional check: Reject if it's clearly a proper noun (e.g., company names, brand names)
    # But allow common nouns that are activities/services
    if label[0].isupper() and len(words) == 1:
        # Single capitalized word - could be a proper noun
        # Check if description suggests it's not a service/activity
        proper_noun_indicators = ["company", "corporation", "organization", "institution", "university", "school"]
        if any(indicator in description_lower for indicator in proper_noun_indicators):
            return False
    
    # If we've passed all exclusion checks, accept it
    # The filtering is conservative - we only exclude obvious non-service entities
    return True


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def location_diagnostic(request, offer_id=None):
    """
    Diagnostic endpoint to help debug location issues.
    Shows both real and fuzzy coordinates for an offer.
    GET /api/offers/<offer_id>/location-diagnostic/
    """
    if not offer_id:
        return Response(
            {"error": "Offer ID is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response(
            {"error": "Offer not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if user owns the offer or is admin
    if offer.user != request.user and not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {"error": "You can only view diagnostics for your own offers"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from .location_utils import get_fuzzy_coordinates, calculate_distance_km
    
    real_lat = offer.latitude
    real_lng = offer.longitude
    
    if real_lat is None or real_lng is None:
        return Response({
            "error": "Offer has no location data",
            "offer_id": offer_id,
            "has_latitude": real_lat is not None,
            "has_longitude": real_lng is not None,
        })
    
    # Calculate fuzzy coordinates
    owner_id = offer.user.id if offer.user else None
    fuzzy_lat, fuzzy_lng = get_fuzzy_coordinates(
        real_lat,
        real_lng,
        offer.id,
        created_at=offer.created_at,
        owner_id=owner_id
    )
    
    # Calculate offset distance
    offset_distance = calculate_distance_km(real_lat, real_lng, fuzzy_lat, fuzzy_lng) if fuzzy_lat and fuzzy_lng else 0
    
    return Response({
        "offer_id": offer_id,
        "offer_title": offer.title,
        "real_coordinates": {
            "latitude": real_lat,
            "longitude": real_lng,
        },
        "fuzzy_coordinates": {
            "latitude": fuzzy_lat,
            "longitude": fuzzy_lng,
        },
        "offset_distance_meters": round(offset_distance * 1000, 2),
        "offset_distance_km": round(offset_distance, 4),
        "created_at": offer.created_at,
        "owner_id": owner_id,
        "note": "Fuzzy coordinates are used on maps for privacy (100-200m offset). Real coordinates are stored in database."
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def tags_wikidata(request):
    """
    Proxy endpoint for Wikidata search API.
    Returns simplified and filtered results from Wikidata wbsearchentities API.
    Filters out human names, celebrities, places, and other non-service entities.
    GET /api/tags/wikidata/?q=<search_term>
    """
    import urllib.request
    import urllib.parse
    import json
    from django.core.cache import cache
    
    query = request.query_params.get("q", "").strip()
    
    # Return empty list if query is too short
    if len(query) < 2:
        return Response({"results": []}, status=status.HTTP_200_OK)
    
    # Check cache first (5 minute cache)
    cache_key = f"wikidata_search_{query.lower()}"
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return Response(cached_result, status=status.HTTP_200_OK)
    
    try:
        # Build Wikidata API URL with type=item parameter
        params = {
            "action": "wbsearchentities",
            "search": query,
            "language": "en",
            "format": "json",
            "limit": 20,  # Fetch more to filter, then return top 10
            "type": "item",
        }
        url = "https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(params)
        
        # Create request with User-Agent header (Wikidata requires this to avoid 403)
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        
        # Make request with timeout
        with urllib.request.urlopen(req, timeout=5) as response:
            response_data = response.read().decode('utf-8')
            data = json.loads(response_data)
            
            # Extract and filter results
            filtered_results = []
            if "search" in data and isinstance(data["search"], list):
                for item in data["search"]:
                    label = item.get("label", "")
                    description = item.get("description", "")
                    wikidata_id = item.get("id", "")
                    
                    # Only process items with valid labels
                    if not label:
                        continue
                    
                    # Filter using our validation function
                    if is_valid_service_tag(label, description):
                        filtered_results.append({
                            "label": label,
                            "description": description or "",  # Handle missing descriptions gracefully
                            "wikidata_id": wikidata_id,
                        })
                        
                        # Limit to 10 results after filtering
                        if len(filtered_results) >= 10:
                            break
            
            print(f"Query: '{query}' - Filtered {len(filtered_results)} valid service tags from {len(data.get('search', []))} total results")
            
            # Cache the result for 5 minutes
            cache.set(cache_key, {"results": filtered_results}, 300)
            
            return Response({"results": filtered_results}, status=status.HTTP_200_OK)
            
    except urllib.error.URLError as e:
        # Network error - return empty list gracefully
        print(f"Wikidata API URLError: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return Response({"results": []}, status=status.HTTP_200_OK)
    except json.JSONDecodeError as e:
        # JSON parsing error
        print(f"Wikidata API JSON decode error: {e}")
        return Response({"results": []}, status=status.HTTP_200_OK)
    except Exception as e:
        # Any other error - return empty list gracefully
        print(f"Error fetching from Wikidata: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return Response({"results": []}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# FORUM
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def forum_topics_list_create(request):
    """
    List all forum topics or create a new topic.
    GET /api/forum/topics/ - List all topics
    POST /api/forum/topics/ - Create a new topic
    """
    if request.method == "GET":
        topics = ForumTopic.objects.all().order_by("-created_at")
        serializer = ForumTopicSerializer(topics, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # POST - Create new topic
    serializer = ForumTopicSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def forum_topic_detail(request, topic_id):
    """
    Get topic detail with all replies.
    GET /api/forum/topics/<id>/
    """
    try:
        topic = ForumTopic.objects.get(pk=topic_id)
    except ForumTopic.DoesNotExist:
        return Response({"error": "Topic not found"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = ForumTopicSerializer(topic, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def forum_topic_reply(request, topic_id):
    """
    Add a reply to a topic.
    POST /api/forum/topics/<id>/reply/
    """
    try:
        topic = ForumTopic.objects.get(pk=topic_id)
    except ForumTopic.DoesNotExist:
        return Response({"error": "Topic not found"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = ForumReplySerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        serializer.save(topic=topic, author=request.user)
        # Return updated topic with all replies
        topic_serializer = ForumTopicSerializer(topic, context={"request": request})
        return Response(topic_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def forum_topic_delete(request, topic_id):
    """
    Delete a forum topic (admin only).
    DELETE /api/forum/topics/<id>/delete/
    """
    try:
        topic = ForumTopic.objects.get(pk=topic_id)
    except ForumTopic.DoesNotExist:
        return Response({"error": "Topic not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is admin
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {"error": "Only administrators can delete topics."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    topic.delete()
    return Response({"message": "Topic deleted successfully."}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def forum_reply_delete(request, reply_id):
    """
    Delete a forum reply (admin only).
    DELETE /api/forum/replies/<id>/delete/
    """
    try:
        reply = ForumReply.objects.get(pk=reply_id)
    except ForumReply.DoesNotExist:
        return Response({"error": "Reply not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is admin
    if not (request.user.is_staff or request.user.is_superuser):
        return Response(
            {"error": "Only administrators can delete replies."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    reply.delete()
    return Response({"message": "Reply deleted successfully."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# INBOX
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inbox_pending_handshakes(request):
    """
    Get pending handshakes for the current user.
    GET /api/inbox/pending-handshakes/
    Returns handshakes with status "proposed" where user is the provider.
    """
    user = request.user
    pending_handshakes = Handshake.objects.filter(
        provider=user,
        status="proposed"
    ).order_by("-created_at")
    
    serializer = HandshakeSerializer(pending_handshakes, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inbox_unread_messages(request):
    """
    Get unread messages for the current user.
    GET /api/inbox/unread-messages/
    Returns messages in handshakes where user is a participant but not the sender, and is_read=False.
    """
    user = request.user
    # Get all handshakes where user is participant
    user_handshakes = Handshake.objects.filter(
        models.Q(provider=user) | models.Q(seeker=user)
    )
    
    # Get unread messages where user is not the sender
    unread_messages = Message.objects.filter(
        handshake__in=user_handshakes,
        is_read=False
    ).exclude(sender=user).order_by("-created_at")
    
    serializer = MessageSerializer(unread_messages, many=True, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inbox_conversations(request):
    """
    Get all conversations (handshakes with messages) for the current user.
    GET /api/inbox/conversations/
    Returns all handshakes that have messages, grouped by handshake.
    """
    user = request.user
    # Get all handshakes where user is participant
    user_handshakes = Handshake.objects.filter(
        models.Q(provider=user) | models.Q(seeker=user)
    ).filter(status__in=["accepted", "in_progress", "completed"])
    
    # Get handshakes that have messages
    conversations = []
    for handshake in user_handshakes:
        messages = Message.objects.filter(handshake=handshake).order_by("-created_at")
        if messages.exists():
            # Get the latest message
            latest_message = messages.first()
            unread_count = messages.filter(is_read=False).exclude(sender=user).count()
            
            # Get the other participant
            other_user = handshake.seeker if handshake.provider == user else handshake.provider
            
            conversations.append({
                "handshake": HandshakeSerializer(handshake, context={"request": request}).data,
                "other_user_id": other_user.id,
                "other_username": other_user.username,
                "latest_message": MessageSerializer(latest_message, context={"request": request}).data,
                "unread_count": unread_count,
                "total_messages": messages.count(),
            })
    
    # Sort by latest message time (newest first)
    conversations.sort(key=lambda x: x["latest_message"]["created_at"], reverse=True)
    
    return Response(conversations, status=status.HTTP_200_OK)
