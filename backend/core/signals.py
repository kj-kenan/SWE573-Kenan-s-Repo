# core/signals.py
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import UserProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create a UserProfile when a new User is created."""
    if created:
        # Create profile with starting balance of 3 Beellars and email_verified=False
        UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                'timebank_balance': 3,
                'email_verified': False
            }
        )
