"""
Utility functions for email verification and activation tokens.
"""
import os
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.urls import reverse


ACTIVATION_TOKEN_EXPIRY_HOURS = 24


def generate_activation_token(user):
    """
    Generate a secure, time-limited activation token for a user.
    Uses Django's TimestampSigner for cryptographic signing with expiration.
    """
    signer = TimestampSigner()
    token = signer.sign(user.pk)
    return token


def validate_activation_token(token):
    """
    Validate an activation token and return the user ID if valid.
    Returns (is_valid, user_id, error_message)
    """
    signer = TimestampSigner()
    try:
        # Verify signature and expiration (default max_age is 60 days, but we'll override)
        max_age = 60 * 60 * ACTIVATION_TOKEN_EXPIRY_HOURS  # Convert hours to seconds
        user_id = signer.unsign(token, max_age=max_age)
        return True, user_id, None
    except SignatureExpired:
        return False, None, "Activation token has expired. Please request a new activation email."
    except BadSignature:
        return False, None, "Invalid activation token."
    except Exception as e:
        return False, None, f"Error validating token: {str(e)}"


def send_activation_email(user, request=None):
    """
    Send an activation email to the user with a verification link.
    """
    token = generate_activation_token(user)
    
    # Always use FRONTEND_URL from settings/env (don't derive from request)
    frontend_url = getattr(settings, 'FRONTEND_URL', os.getenv('FRONTEND_URL', 'http://localhost:3000'))
    
    # Create activation URL
    activation_url = f"{frontend_url}/activate/{token}"
    
    subject = "Activate your Hive account"
    
    # Create email body (HTML and plain text)
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">Welcome to The Hive! 🐝</h2>
            <p>Hello {user.username},</p>
            <p>Thank you for registering with The Hive. To complete your registration and activate your account, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{activation_url}" 
                   style="background-color: #f59e0b; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block; 
                          font-weight: bold;">
                    Activate Account
                </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">{activation_url}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
                This activation link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Best regards,<br>
                The Hive Team
            </p>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Welcome to The Hive!
    
    Hello {user.username},
    
    Thank you for registering with The Hive. To complete your registration and activate your account, please visit the following link:
    
    {activation_url}
    
    This activation link will expire in 24 hours. If you didn't create an account, please ignore this email.
    
    Best regards,
    The Hive Team
    """
    
    # Validate user email
    if not user.email:
        print(f"\n❌ ERROR: User {user.username} (ID: {user.id}) has no email address")
        return False
    
    try:
        from_email = settings.DEFAULT_FROM_EMAIL or 'noreply@thehive.com'
        print(f"\n{'='*60}")
        print(f"📧 SENDING ACTIVATION EMAIL")
        print(f"{'='*60}")
        print(f"To: {user.email}")
        print(f"From: {from_email}")
        print(f"Subject: {subject}")
        print(f"\nActivation URL: {activation_url}")
        print(f"Email Backend: {settings.EMAIL_BACKEND}")
        print(f"{'='*60}\n")
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"✅ Email sent successfully to {user.email}\n")
        return True
    except Exception as e:
        import traceback
        print(f"\n❌ ERROR sending activation email to {user.email}:")
        print(f"   Error: {str(e)}")
        print(f"\n   Full traceback:")
        traceback.print_exc()
        print()
        return False


def send_verification_success_email(user):
    """
    Send a notification email after successful email verification.
    """
    subject = "Email verified - Welcome to The Hive!"
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">Email Verified! 🎉</h2>
            <p>Hello {user.username},</p>
            <p>Your email address has been successfully verified. Your account is now fully activated!</p>
            <p>You can now log in and start using The Hive to share and receive services in your community.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
                Best regards,<br>
                The Hive Team
            </p>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Email Verified!
    
    Hello {user.username},
    
    Your email address has been successfully verified. Your account is now fully activated!
    
    You can now log in and start using The Hive to share and receive services in your community.
    
    Best regards,
    The Hive Team
    """
    
    try:
        from_email = settings.DEFAULT_FROM_EMAIL or 'noreply@thehive.com'
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        import traceback
        print(f"Error sending verification success email: {str(e)}")
        traceback.print_exc()
        return False


# Password Reset Utilities

PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1  # Password reset tokens expire in 1 hour


def generate_password_reset_token(user):
    """
    Generate a secure, time-limited password reset token for a user.
    Uses Django's TimestampSigner for cryptographic signing with expiration.
    """
    signer = TimestampSigner()
    token = signer.sign(user.pk)
    return token


def validate_password_reset_token(token):
    """
    Validate a password reset token and return the user ID if valid.
    Returns (is_valid, user_id, error_message)
    """
    signer = TimestampSigner()
    try:
        # Verify signature and expiration (1 hour)
        max_age = 60 * 60 * PASSWORD_RESET_TOKEN_EXPIRY_HOURS  # Convert hours to seconds
        user_id = signer.unsign(token, max_age=max_age)
        return True, user_id, None
    except SignatureExpired:
        return False, None, "Password reset token has expired. Please request a new password reset."
    except BadSignature:
        return False, None, "Invalid password reset token."
    except Exception as e:
        return False, None, f"Error validating token: {str(e)}"


def send_password_reset_email(user, request=None):
    """
    Send a password reset email to the user with a reset link.
    """
    token = generate_password_reset_token(user)
    
    # Always use FRONTEND_URL from settings/env (don't derive from request)
    frontend_url = getattr(settings, 'FRONTEND_URL', os.getenv('FRONTEND_URL', 'http://localhost:3000'))
    
    # Create reset URL
    reset_url = f"{frontend_url}/reset-password/{token}"
    
    subject = "Reset your Hive account password"
    
    # Create email body (HTML and plain text)
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">Password Reset Request 🐝</h2>
            <p>Hello {user.username},</p>
            <p>We received a request to reset your password for your Hive account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" 
                   style="background-color: #f59e0b; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block; 
                          font-weight: bold;">
                    Reset Password
                </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">{reset_url}</p>
            <p style="margin-top: 30px; font-size: 12px; color: #999;">
                This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Best regards,<br>
                The Hive Team
            </p>
        </div>
    </body>
    </html>
    """
    
    plain_message = f"""
    Password Reset Request
    
    Hello {user.username},
    
    We received a request to reset your password for your Hive account. Visit the following link to reset your password:
    
    {reset_url}
    
    This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
    
    Best regards,
    The Hive Team
    """
    
    # Validate user email
    if not user.email:
        print(f"\n❌ ERROR: User {user.username} (ID: {user.id}) has no email address")
        return False
    
    try:
        from_email = settings.DEFAULT_FROM_EMAIL or 'noreply@thehive.com'
        print(f"\n{'='*60}")
        print(f"📧 SENDING PASSWORD RESET EMAIL")
        print(f"{'='*60}")
        print(f"To: {user.email}")
        print(f"From: {from_email}")
        print(f"Subject: {subject}")
        print(f"\nReset URL: {reset_url}")
        print(f"Email Backend: {settings.EMAIL_BACKEND}")
        print(f"{'='*60}\n")
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"✅ Password reset email sent successfully to {user.email}\n")
        return True
    except Exception as e:
        import traceback
        print(f"\n❌ ERROR sending password reset email to {user.email}:")
        print(f"   Error: {str(e)}")
        print(f"\n   Full traceback:")
        traceback.print_exc()
        print()
        return False

