from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import models

from .models import UserProfile, Offer, Request as RequestModel, Handshake, Transaction
from .serializers import (
    UserProfileSerializer,
    OfferSerializer,
    RequestSerializer,
    HandshakeSerializer,
    TransactionSerializer,
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
@permission_classes([IsAuthenticated])
def profile_list(request):
    profiles = UserProfile.objects.all()
    serializer = UserProfileSerializer(profiles, many=True)
    return Response(serializer.data)


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
