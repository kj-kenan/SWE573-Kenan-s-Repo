"""
Custom authentication views with email verification checks.
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import UserProfile


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that checks email verification and adds username to token."""
    
    @classmethod
    def get_token(cls, user):
        """Add username to the token payload"""
        token = super().get_token(user)
        token['username'] = user.username
        return token
    
    def validate(self, attrs):
        # First, get the user and validate credentials
        data = super().validate(attrs)
        
        # Check if user's email is verified
        try:
            profile = self.user.profile
            if not profile.email_verified:
                # Raise PermissionDenied with specific error code for frontend handling
                raise PermissionDenied({
                    "error": "email_not_verified",
                    "detail": "Your email address has not been verified. Please check your email for the activation link.",
                    "message": "Please verify your email address before logging in."
                })
        except UserProfile.DoesNotExist:
            # Profile doesn't exist, treat as unverified
            raise PermissionDenied({
                "error": "email_not_verified",
                "detail": "Your email address has not been verified. Please check your email for the activation link.",
                "message": "Please verify your email address before logging in."
            })
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that blocks unverified users."""
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except PermissionDenied as e:
            # Format the error response to match frontend expectations
            error_detail = e.detail
            if isinstance(error_detail, dict) and error_detail.get("error") == "email_not_verified":
                return Response(
                    error_detail,
                    status=status.HTTP_403_FORBIDDEN
                )
            # If it's a string detail, convert to expected format
            elif isinstance(error_detail, str) and "email" in error_detail.lower():
                return Response(
                    {
                        "error": "email_not_verified",
                        "detail": error_detail,
                        "message": "Please verify your email address before logging in."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            # Re-raise for other PermissionDenied cases
            raise

