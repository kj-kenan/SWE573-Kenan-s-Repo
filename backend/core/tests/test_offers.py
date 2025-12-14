"""
Unit Tests for Offer Creation and Management

Tests cover:
- Offer creation with required fields
- Offer ownership
- Offer status management
- Tags and metadata
"""

from django.test import TestCase
from django.contrib.auth.models import User
from core.models import Offer
from datetime import date, timedelta


class OfferCreationTest(TestCase):
    """Test basic offer creation functionality"""
    
    def setUp(self):
        """Create a test user before each test"""
        self.user = User.objects.create_user(
            username='offerowner',
            password='testpass123'
        )
    
    def test_create_basic_offer(self):
        """
        Should be able to create an offer with required fields
        """
        offer = Offer.objects.create(
            user=self.user,
            title="Free Python Tutoring",
            description="I can teach Python basics",
            duration=2,
            latitude=41.0082,
            longitude=28.9784
        )
        
        # Verify offer was created
        self.assertIsNotNone(offer.id)
        self.assertEqual(offer.title, "Free Python Tutoring")
        self.assertEqual(offer.user, self.user)
    
    def test_offer_has_correct_owner(self):
        """
        Offer should be correctly linked to its creator
        """
        offer = Offer.objects.create(
            user=self.user,
            title="Test Offer",
            duration=1,
            latitude=40.0,
            longitude=29.0
        )
        
        # Check ownership
        self.assertEqual(offer.user, self.user)
        self.assertEqual(offer.user.username, 'offerowner')
    
    def test_offer_default_status_is_open(self):
        """
        New offers should have status 'open' by default
        """
        offer = Offer.objects.create(
            user=self.user,
            title="Test Offer",
            duration=1,
            latitude=40.0,
            longitude=29.0
        )
        
        self.assertEqual(offer.status, 'open')
    
    def test_offer_with_tags(self):
        """
        Offers should support tags stored as JSONField
        """
        offer = Offer.objects.create(
            user=self.user,
            title="Cooking Class",
            duration=3,
            tags=["cooking", "food", "teaching"],
            latitude=40.0,
            longitude=29.0
        )
        
        # Verify tags are stored correctly
        self.assertIsInstance(offer.tags, list)
        self.assertIn("cooking", offer.tags)
        self.assertEqual(len(offer.tags), 3)
    
    def test_offer_with_future_date(self):
        """
        Offers can have a scheduled date in the future
        """
        future_date = date.today() + timedelta(days=7)
        
        offer = Offer.objects.create(
            user=self.user,
            title="Future Workshop",
            duration=2,
            date=future_date,
            latitude=40.0,
            longitude=29.0
        )
        
        self.assertEqual(offer.date, future_date)
    
    def test_offer_with_available_slots(self):
        """
        Offers can have available time slots (JSONField)
        """
        slots = [
            {"date": "2025-12-20", "time": "14:00"},
            {"date": "2025-12-21", "time": "15:00"}
        ]
        
        offer = Offer.objects.create(
            user=self.user,
            title="Flexible Tutoring",
            duration=1,
            available_slots=slots,
            latitude=40.0,
            longitude=29.0
        )
        
        self.assertEqual(len(offer.available_slots), 2)
        self.assertEqual(offer.available_slots[0]["time"], "14:00")


class OfferMultiParticipantTest(TestCase):
    """Test multi-participant offer functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(username='teacher', password='pass')
    
    def test_offer_can_have_max_participants(self):
        """
        Offers can limit the number of participants
        """
        offer = Offer.objects.create(
            user=self.user,
            title="Group Workshop",
            duration=3,
            max_participants=5,
            latitude=40.0,
            longitude=29.0
        )
        
        self.assertEqual(offer.max_participants, 5)
    
    def test_single_participant_offer_by_default(self):
        """
        If max_participants is not set, it defaults to 1 (or None)
        """
        offer = Offer.objects.create(
            user=self.user,
            title="One-on-One Session",
            duration=1,
            latitude=40.0,
            longitude=29.0
        )
        
        # max_participants might be None or 1 depending on model default
        self.assertTrue(offer.max_participants is None or offer.max_participants == 1)


class OfferQueryTest(TestCase):
    """Test querying and filtering offers"""
    
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')
    
    def test_query_offers_by_user(self):
        """
        Should be able to filter offers by creator
        """
        # User1 creates 2 offers
        Offer.objects.create(
            user=self.user1,
            title="Offer 1",
            duration=1,
            latitude=40.0,
            longitude=29.0
        )
        Offer.objects.create(
            user=self.user1,
            title="Offer 2",
            duration=2,
            latitude=40.0,
            longitude=29.0
        )
        
        # User2 creates 1 offer
        Offer.objects.create(
            user=self.user2,
            title="Offer 3",
            duration=1,
            latitude=40.0,
            longitude=29.0
        )
        
        # Query by user
        user1_offers = Offer.objects.filter(user=self.user1)
        user2_offers = Offer.objects.filter(user=self.user2)
        
        self.assertEqual(user1_offers.count(), 2)
        self.assertEqual(user2_offers.count(), 1)
    
    def test_query_open_offers(self):
        """
        Should be able to filter offers by status
        """
        Offer.objects.create(
            user=self.user1,
            title="Open Offer",
            duration=1,
            status='open',
            latitude=40.0,
            longitude=29.0
        )
        Offer.objects.create(
            user=self.user1,
            title="Closed Offer",
            duration=1,
            status='closed',
            latitude=40.0,
            longitude=29.0
        )
        
        open_offers = Offer.objects.filter(status='open')
        self.assertEqual(open_offers.count(), 1)
        self.assertEqual(open_offers.first().title, "Open Offer")


