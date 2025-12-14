"""
Unit Tests for User and UserProfile Creation

Tests cover:
- Automatic profile creation when a user is created
- Initial timebank balance (20 beellars for new users)
- Profile field defaults and updates
"""

from django.test import TestCase
from django.contrib.auth.models import User
from core.models import UserProfile


class UserProfileCreationTest(TestCase):
    """Test automatic UserProfile creation via Django signals"""
    
    def test_profile_created_automatically_on_user_creation(self):
        """
        When a User is created, a UserProfile should be automatically created
        via the post_save signal defined in signals.py
        """
        # Create a new user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Check that a profile was automatically created
        self.assertTrue(UserProfile.objects.filter(user=user).exists())
        
        # Get the profile
        profile = UserProfile.objects.get(user=user)
        
        # Verify the profile is linked to the correct user
        self.assertEqual(profile.user, user)
    
    def test_new_user_receives_initial_timebank_balance(self):
        """
        New users should receive an initial balance of 3 beellars (hours)
        """
        user = User.objects.create_user(
            username='newuser',
            email='new@example.com',
            password='pass123'
        )
        
        profile = user.profile
        
        # Check initial balance is 3 hours
        self.assertEqual(profile.timebank_balance, 3)
    
    def test_profile_has_correct_default_values(self):
        """
        UserProfile should have sensible defaults when created
        """
        user = User.objects.create_user(
            username='defaultuser',
            password='pass123'
        )
        
        profile = user.profile
        
        # Check defaults
        self.assertEqual(profile.timebank_balance, 3)
        self.assertEqual(profile.bio, "")
        self.assertEqual(profile.skills, "")
        self.assertEqual(profile.interests, "")
        self.assertTrue(profile.is_visible)
        self.assertFalse(profile.email_verified)
    
    def test_profile_fields_can_be_updated(self):
        """
        Profile fields should be updatable
        """
        user = User.objects.create_user(username='updateuser', password='pass')
        profile = user.profile
        
        # Update fields
        profile.bio = "I love helping others!"
        profile.skills = "Python, Django, Teaching"
        profile.interests = "Technology, Music"
        profile.province = "Istanbul"
        profile.district = "Kadikoy"
        profile.save()
        
        # Reload from database
        profile.refresh_from_db()
        
        # Verify updates persisted
        self.assertEqual(profile.bio, "I love helping others!")
        self.assertEqual(profile.skills, "Python, Django, Teaching")
        self.assertEqual(profile.province, "Istanbul")
        self.assertEqual(profile.district, "Kadikoy")


class UserProfileRatingsTest(TestCase):
    """Test rating calculations for UserProfile"""
    
    def test_average_rating_with_no_ratings(self):
        """
        A user with no ratings should have an average rating of 0.0
        """
        user = User.objects.create_user(username='unrated', password='pass')
        profile = user.profile
        
        self.assertEqual(profile.average_rating, 0.0)
        self.assertEqual(profile.total_ratings, 0)
    
    def test_profile_username_property(self):
        """
        Profile should provide easy access to username via property
        """
        user = User.objects.create_user(username='propertytest', password='pass')
        profile = user.profile
        
        # Access username through profile
        self.assertEqual(profile.user.username, 'propertytest')


