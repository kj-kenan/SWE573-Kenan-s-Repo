from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import UserProfile
from .serializers import UserProfileSerializer
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from rest_framework import status
from django.contrib.auth import authenticate
from .models import Offer, Request
from .serializers import OfferSerializer, RequestSerializer
from django.http import JsonResponse





@api_view(["GET"])
def profile_list(request):
    """
    Returns all user profiles in JSON format.
    This uses the serializer to convert database objects into readable data.
    """
    profiles = UserProfile.objects.all() 
    serializer = UserProfileSerializer(profiles, many=True)  
    return Response(serializer.data) 



@api_view(["GET"])
def offers_list(request):
    # Temporary dummy data
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
    return render(request, "core/home.html")

def about(request):
    return render(request, "core/about.html")



@api_view(["POST"])
def register_user(request):
    """
    Creates a new user account.
    Expected JSON:
    {
        "username": "newuser",
        "password": "123456",
        "email": "example@mail.com"
    }
    """
    data = request.data

    # Basic validation
    if not data.get("username") or not data.get("password"):
        return Response({"error": "Username and password are required."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Check if username already exists
    if User.objects.filter(username=data["username"]).exists():
        return Response({"error": "Username already taken."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Create new user
    user = User.objects.create(
        username=data["username"],
        email=data.get("email", ""),
        password=make_password(data["password"])
    )

    return Response({"message": f"User '{user.username}' created successfully."},
                    status=status.HTTP_201_CREATED)

@api_view(["POST"])
def login_user(request):
    """
    Authenticates a user.
    Expected JSON:
    {
        "username": "user",
        "password": "passweord"
    }
    """
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
    
@api_view(['GET', 'POST'])
def offers_list_create(request):
    if request.method == 'GET':
        offers = Offer.objects.all()
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = OfferSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def requests_list_create(request):
    if request.method == 'GET':
        requests = Request.objects.all()
        serializer = RequestSerializer(requests, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = RequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



def home(request):
    return JsonResponse({"message": "Welcome to The Hive"})


