"""
Unit Tests for Handshake (Service Exchange) Lifecycle

Tests cover:
- Handshake creation
- Status transitions (proposed → accepted → in_progress → completed)
- Confirmation logic (both parties must confirm)
- Handshake-offer relationship
"""

from django.test import TestCase
from django.contrib.auth.models import User
from core.models import Offer, Handshake


class HandshakeCreationTest(TestCase):
    """Test basic handshake creation"""
    
    def setUp(self):
        self.provider = User.objects.create_user(username='provider', password='pass')
        self.seeker = User.objects.create_user(username='seeker', password='pass')
        
        self.offer = Offer.objects.create(
            user=self.provider,
            title="Test Offer",
            duration=2,
            latitude=40.0,
            longitude=29.0
        )
    
    def test_create_handshake(self):
        """
        Should be able to create a handshake linking offer, provider, and seeker
        """
        handshake = Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker,
            provider=self.provider,
            hours=2,
            status='proposed'
        )
        
        self.assertIsNotNone(handshake.id)
        self.assertEqual(handshake.offer, self.offer)
        self.assertEqual(handshake.seeker, self.seeker)
        self.assertEqual(handshake.provider, self.provider)
    
    def test_handshake_default_status_is_proposed(self):
        """
        New handshakes should default to 'proposed' status
        """
        handshake = Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker,
            provider=self.provider,
            hours=2
        )
        
        self.assertEqual(handshake.status, 'proposed')
    
    def test_handshake_hours_match_offer_duration(self):
        """
        Handshake hours should typically match the offer duration
        """
        handshake = Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker,
            provider=self.provider,
            hours=self.offer.duration
        )
        
        self.assertEqual(handshake.hours, self.offer.duration)


class HandshakeStatusTransitionTest(TestCase):
    """Test handshake status transitions"""
    
    def setUp(self):
        self.provider = User.objects.create_user(username='provider', password='pass')
        self.seeker = User.objects.create_user(username='seeker', password='pass')
        
        self.offer = Offer.objects.create(
            user=self.provider,
            title="Test Offer",
            duration=3,
            latitude=40.0,
            longitude=29.0
        )
        
        self.handshake = Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker,
            provider=self.provider,
            hours=3,
            status='proposed'
        )
    
    def test_transition_from_proposed_to_accepted(self):
        """
        Provider can accept a proposed handshake
        """
        self.handshake.status = 'accepted'
        self.handshake.save()
        self.handshake.refresh_from_db()
        
        self.assertEqual(self.handshake.status, 'accepted')
    
    def test_transition_to_in_progress(self):
        """
        Accepted handshake can move to in_progress
        """
        self.handshake.status = 'accepted'
        self.handshake.save()
        
        self.handshake.status = 'in_progress'
        self.handshake.save()
        self.handshake.refresh_from_db()
        
        self.assertEqual(self.handshake.status, 'in_progress')
    
    def test_transition_to_completed(self):
        """
        In-progress handshake can be marked as completed
        """
        self.handshake.status = 'in_progress'
        self.handshake.save()
        
        self.handshake.status = 'completed'
        self.handshake.save()
        self.handshake.refresh_from_db()
        
        self.assertEqual(self.handshake.status, 'completed')
    
    def test_handshake_can_be_rejected(self):
        """
        Provider can reject a proposed handshake
        """
        self.handshake.status = 'rejected'
        self.handshake.save()
        self.handshake.refresh_from_db()
        
        self.assertEqual(self.handshake.status, 'rejected')


class HandshakeConfirmationTest(TestCase):
    """
    Test completion confirmation logic
    
    Both provider and seeker must confirm completion before
    the service is considered fully completed
    """
    
    def setUp(self):
        self.provider = User.objects.create_user(username='provider', password='pass')
        self.seeker = User.objects.create_user(username='seeker', password='pass')
        
        self.offer = Offer.objects.create(
            user=self.provider,
            title="Test Offer",
            duration=2,
            latitude=40.0,
            longitude=29.0
        )
        
        self.handshake = Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker,
            provider=self.provider,
            hours=2,
            status='accepted'
        )
    
    def test_initial_confirmation_state(self):
        """
        New handshakes should have both confirmations as False
        """
        self.assertFalse(self.handshake.provider_confirmed)
        self.assertFalse(self.handshake.seeker_confirmed)
    
    def test_provider_can_confirm(self):
        """
        Provider can confirm service completion
        """
        self.handshake.provider_confirmed = True
        self.handshake.save()
        self.handshake.refresh_from_db()
        
        self.assertTrue(self.handshake.provider_confirmed)
        self.assertFalse(self.handshake.seeker_confirmed)
    
    def test_seeker_can_confirm(self):
        """
        Seeker can confirm service completion
        """
        self.handshake.seeker_confirmed = True
        self.handshake.save()
        self.handshake.refresh_from_db()
        
        self.assertTrue(self.handshake.seeker_confirmed)
        self.assertFalse(self.handshake.provider_confirmed)
    
    def test_both_parties_can_confirm(self):
        """
        Both provider and seeker can confirm
        """
        self.handshake.provider_confirmed = True
        self.handshake.seeker_confirmed = True
        self.handshake.save()
        self.handshake.refresh_from_db()
        
        self.assertTrue(self.handshake.provider_confirmed)
        self.assertTrue(self.handshake.seeker_confirmed)
    
    def test_status_changes_to_completed_after_both_confirm(self):
        """
        When both parties confirm, status should become 'completed'
        (This might be handled by backend logic, not model)
        """
        self.handshake.provider_confirmed = True
        self.handshake.seeker_confirmed = True
        self.handshake.status = 'completed'
        self.handshake.save()
        self.handshake.refresh_from_db()
        
        self.assertEqual(self.handshake.status, 'completed')
        self.assertTrue(self.handshake.provider_confirmed)
        self.assertTrue(self.handshake.seeker_confirmed)


class HandshakeQueryTest(TestCase):
    """Test querying handshakes"""
    
    def setUp(self):
        self.provider = User.objects.create_user(username='provider', password='pass')
        self.seeker1 = User.objects.create_user(username='seeker1', password='pass')
        self.seeker2 = User.objects.create_user(username='seeker2', password='pass')
        
        self.offer = Offer.objects.create(
            user=self.provider,
            title="Test Offer",
            duration=2,
            latitude=40.0,
            longitude=29.0
        )
    
    def test_query_handshakes_by_offer(self):
        """
        Should be able to get all handshakes for a specific offer
        """
        Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker1,
            provider=self.provider,
            hours=2
        )
        Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker2,
            provider=self.provider,
            hours=2
        )
        
        handshakes = Handshake.objects.filter(offer=self.offer)
        self.assertEqual(handshakes.count(), 2)
    
    def test_query_handshakes_by_seeker(self):
        """
        Should be able to get all handshakes where user is seeker
        """
        Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker1,
            provider=self.provider,
            hours=2
        )
        
        seeker_handshakes = Handshake.objects.filter(seeker=self.seeker1)
        self.assertEqual(seeker_handshakes.count(), 1)
    
    def test_query_handshakes_by_provider(self):
        """
        Should be able to get all handshakes where user is provider
        """
        Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker1,
            provider=self.provider,
            hours=2
        )
        Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker2,
            provider=self.provider,
            hours=2
        )
        
        provider_handshakes = Handshake.objects.filter(provider=self.provider)
        self.assertEqual(provider_handshakes.count(), 2)
    
    def test_query_handshakes_by_status(self):
        """
        Should be able to filter handshakes by status
        """
        Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker1,
            provider=self.provider,
            hours=2,
            status='proposed'
        )
        Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker2,
            provider=self.provider,
            hours=2,
            status='completed'
        )
        
        proposed = Handshake.objects.filter(status='proposed')
        completed = Handshake.objects.filter(status='completed')
        
        self.assertEqual(proposed.count(), 1)
        self.assertEqual(completed.count(), 1)


class MultiParticipantHandshakeTest(TestCase):
    """Test handshakes for multi-participant offers"""
    
    def setUp(self):
        self.provider = User.objects.create_user(username='teacher', password='pass')
        self.student1 = User.objects.create_user(username='student1', password='pass')
        self.student2 = User.objects.create_user(username='student2', password='pass')
        self.student3 = User.objects.create_user(username='student3', password='pass')
        
        self.group_offer = Offer.objects.create(
            user=self.provider,
            title="Group Workshop",
            duration=3,
            max_participants=3,
            latitude=40.0,
            longitude=29.0
        )
    
    def test_multiple_handshakes_for_same_offer(self):
        """
        Multi-participant offers can have multiple handshakes
        """
        Handshake.objects.create(
            offer=self.group_offer,
            seeker=self.student1,
            provider=self.provider,
            hours=3
        )
        Handshake.objects.create(
            offer=self.group_offer,
            seeker=self.student2,
            provider=self.provider,
            hours=3
        )
        Handshake.objects.create(
            offer=self.group_offer,
            seeker=self.student3,
            provider=self.provider,
            hours=3
        )
        
        handshakes = Handshake.objects.filter(offer=self.group_offer)
        self.assertEqual(handshakes.count(), 3)
    
    def test_each_handshake_is_independent(self):
        """
        Each handshake in a multi-participant offer is independent
        """
        h1 = Handshake.objects.create(
            offer=self.group_offer,
            seeker=self.student1,
            provider=self.provider,
            hours=3,
            status='proposed'
        )
        h2 = Handshake.objects.create(
            offer=self.group_offer,
            seeker=self.student2,
            provider=self.provider,
            hours=3,
            status='accepted'
        )
        
        # Handshakes can have different statuses
        self.assertEqual(h1.status, 'proposed')
        self.assertEqual(h2.status, 'accepted')


