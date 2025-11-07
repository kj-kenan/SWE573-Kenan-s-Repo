from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import UserProfile
from .serializers import UserProfileSerializer


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
