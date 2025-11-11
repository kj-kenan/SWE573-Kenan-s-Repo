from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate
from rest_framework import status

from .models import UserProfile, Offer, Request, Handshake, Transaction
from .serializers import (
    UserProfileSerializer,
    OfferSerializer,
    RequestSerializer,
    HandshakeSerializer,
    TransactionSerializer,
)


# -------------------------
#  BASIC / EXISTING VIEWS
# -------------------------

@api_view(["GET"])
def profile_list(request):
    profiles = UserProfile.objects.all()
    serializer = UserProfileSerializer(profiles, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def offers_list(request):
    data = [
        {"id": 1, "title": "Guitar Lessons"},
        {"id": 2, "title": "Cooking Class"},
        {"id": 3, "title": "Car Repair Help"},
    ]
    return Response(data)


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


def home(request):
    return JsonResponse({"message": "Welcome to The Hive"})


def about(request):
    return render(request, "core/about.html")


@api_view(["POST"])
def register_user(request):
    data = request.data

    if not data.get("username") or not data.get("password"):
        return Response({"error": "Username and password are required."},
                        status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=data["username"]).exists():
        return Response({"error": "Username already taken."},
                        status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create(
        username=data["username"],
        email=data.get("email", ""),
        password=make_password(data["password"])
    )

    return Response({"message": f"User '{user.username}' created successfully."},
                    status=status.HTTP_201_CREATED)


@api_view(["POST"])
def login_user(request):
    data = request.data

    if not data.get("username") or not data.get("password"):
        return Response({"error": "Username and password are required."},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=data["username"], password=data["password"])

    if user is not None:
        return Response({"message": f"Welcome, {user.username}!"}, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Invalid username or password."},
                        status=status.HTTP_401_UNAUTHORIZED)


@api_view(["GET", "POST"])
def offers_list_create(request):
    if request.method == "GET":
        offers = Offer.objects.all()
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = OfferSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def requests_list_create(request):
    if request.method == "GET":
        requests_qs = Request.objects.all()
        serializer = RequestSerializer(requests_qs, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = RequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------
#  NEW: HANDSHAKE & TIMEBANK
# -------------------------

@api_view(["GET", "POST"])
def handshakes_list_create(request):
    """
    GET: List all handshakes
    POST: Create a new handshake request (offer OR request)
    Expected POST data:
    {
        "offer": 1,  # or "request": 2
        "provider": 3,
        "seeker": 5,
        "hours": 2
    }
    """
    if request.method == "GET":
        handshakes = Handshake.objects.all().order_by("-created_at")
        serializer = HandshakeSerializer(handshakes, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = HandshakeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def handshake_accept(request, handshake_id):
    """
    Accept a handshake request.
    """
    try:
        handshake = Handshake.objects.get(pk=handshake_id)
    except Handshake.DoesNotExist:
        return Response({"error": "Handshake not found"}, status=status.HTTP_404_NOT_FOUND)

    handshake.status = "accepted"
    handshake.save()
    return Response({"message": "Handshake accepted."})


@api_view(["POST"])
def handshake_decline(request, handshake_id):
    """
    Decline a handshake request.
    """
    try:
        handshake = Handshake.objects.get(pk=handshake_id)
    except Handshake.DoesNotExist:
        return Response({"error": "Handshake not found"}, status=status.HTTP_404_NOT_FOUND)

    handshake.status = "declined"
    handshake.save()
    return Response({"message": "Handshake declined."})


@api_view(["POST"])
def handshake_confirm(request, handshake_id):
    """
    Each side confirms completion. When both confirm, Beellars are transferred.
    """
    try:
        handshake = Handshake.objects.get(pk=handshake_id)
    except Handshake.DoesNotExist:
        return Response({"error": "Handshake not found"}, status=status.HTTP_404_NOT_FOUND)

    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Set confirmation flags
    if handshake.provider.id == int(user_id):
        handshake.provider_confirmed = True
    elif handshake.seeker.id == int(user_id):
        handshake.seeker_confirmed = True
    else:
        return Response({"error": "User not part of this handshake"}, status=status.HTTP_403_FORBIDDEN)

    handshake.save()

    # If both confirmed → complete + transfer
    if handshake.provider_confirmed and handshake.seeker_confirmed:
        handshake.status = "completed"

        # Transfer Beellars (whole hours)
        hours = handshake.hours
        provider_profile = handshake.provider.profile
        seeker_profile = handshake.seeker.profile

        # Prevent negative balances
        if seeker_profile.timebank_balance < hours:
            return Response({"error": "Insufficient balance."}, status=status.HTTP_400_BAD_REQUEST)

        seeker_profile.timebank_balance -= hours
        provider_profile.timebank_balance += hours
        seeker_profile.save()
        provider_profile.save()

        # Record transaction
        Transaction.objects.create(
            handshake=handshake,
            sender=handshake.seeker,
            receiver=handshake.provider,
            amount=hours,
        )

        handshake.save()

    serializer = HandshakeSerializer(handshake)
    return Response(serializer.data)


@api_view(["GET"])
def transactions_list(request):
    """
    List all Beellar transactions.
    """
    transactions = Transaction.objects.all().order_by("-created_at")
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)
