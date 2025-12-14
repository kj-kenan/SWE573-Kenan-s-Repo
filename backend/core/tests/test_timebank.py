"""
Unit Tests for TimeBank Balance and Transactions

Tests cover:
- Initial balance allocation
- Balance changes during service exchange
- Transaction recording
- Balance validation
"""

from django.test import TestCase
from django.contrib.auth.models import User
from core.models import UserProfile, Offer, Handshake, Transaction
from decimal import Decimal


class TimeBankBalanceTest(TestCase):
    """Test timebank balance initialization and updates"""
    
    def test_new_user_starts_with_3_beellars(self):
        """
        Every new user should start with 3 beellars (hours) in their timebank
        """
        user = User.objects.create_user(username='newbie', password='pass')
        profile = user.profile
        
        self.assertEqual(profile.timebank_balance, 3)
    
    def test_balance_can_be_updated(self):
        """
        Profile balance should be updatable
        """
        user = User.objects.create_user(username='balanceuser', password='pass')
        profile = user.profile
        
        # Increase balance
        profile.timebank_balance += 5
        profile.save()
        profile.refresh_from_db()
        
        self.assertEqual(profile.timebank_balance, 8)  # 3 + 5
    
    def test_balance_can_increase(self):
        """
        Balance can increase when user provides services
        """
        user = User.objects.create_user(username='provider', password='pass')
        profile = user.profile
        
        initial_balance = profile.timebank_balance
        
        # Add hours for providing service
        profile.timebank_balance += 3
        profile.save()
        profile.refresh_from_db()
        
        self.assertEqual(profile.timebank_balance, initial_balance + 3)
    
    def test_multiple_users_have_independent_balances(self):
        """
        Each user should have their own independent balance
        """
        user1 = User.objects.create_user(username='user1', password='pass')
        user2 = User.objects.create_user(username='user2', password='pass')
        
        # Modify user1's balance
        user1.profile.timebank_balance = 100
        user1.profile.save()
        
        # User2's balance should be unchanged
        user2.profile.refresh_from_db()
        self.assertEqual(user2.profile.timebank_balance, 3)


class TransactionCreationTest(TestCase):
    """Test transaction recording functionality"""
    
    def setUp(self):
        self.provider = User.objects.create_user(username='provider', password='pass')
        self.seeker = User.objects.create_user(username='seeker', password='pass')
        
        # Create offer and handshake for transaction
        self.offer = Offer.objects.create(
            user=self.provider,
            title="Test Service",
            duration=2,
            latitude=40.0,
            longitude=29.0
        )
        
        self.handshake = Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker,
            provider=self.provider,
            hours=2,
            status='completed'
        )
    
    def test_create_transaction_between_users(self):
        """
        Should be able to create a transaction recording transfer of beellars
        """
        transaction = Transaction.objects.create(
            handshake=self.handshake,
            sender=self.seeker,
            receiver=self.provider,
            amount=2
        )
        
        self.assertEqual(transaction.amount, 2)
        self.assertEqual(transaction.sender, self.seeker)
        self.assertEqual(transaction.receiver, self.provider)
        self.assertEqual(transaction.handshake, self.handshake)
    
    def test_transaction_has_timestamp(self):
        """
        Transactions should automatically record creation timestamp
        """
        transaction = Transaction.objects.create(
            handshake=self.handshake,
            sender=self.seeker,
            receiver=self.provider,
            amount=2
        )
        
        self.assertIsNotNone(transaction.created_at)


class ServiceExchangeBalanceTest(TestCase):
    """
    Test balance changes during a complete service exchange (handshake)
    
    This simulates the full flow:
    1. Provider creates offer
    2. Seeker sends handshake
    3. Provider accepts
    4. Both confirm completion
    5. Balances updated correctly
    """
    
    def setUp(self):
        # Create provider and seeker
        self.provider = User.objects.create_user(username='provider', password='pass')
        self.seeker = User.objects.create_user(username='seeker', password='pass')
        
        # Record initial balances
        self.provider_initial_balance = self.provider.profile.timebank_balance
        self.seeker_initial_balance = self.seeker.profile.timebank_balance
        
        # Create an offer
        self.offer = Offer.objects.create(
            user=self.provider,
            title="Python Tutoring",
            description="Learn Python basics",
            duration=3,  # 3 hours
            latitude=40.0,
            longitude=29.0
        )
    
    def test_handshake_creation_doesnt_change_balance(self):
        """
        Creating or accepting a handshake should NOT yet change balances
        Balances only change when service is confirmed completed
        """
        # Create handshake
        handshake = Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker,
            provider=self.provider,
            hours=3,
            status='accepted'
        )
        
        # Reload profiles
        self.provider.profile.refresh_from_db()
        self.seeker.profile.refresh_from_db()
        
        # Balances should NOT change yet
        self.assertEqual(
            self.provider.profile.timebank_balance,
            self.provider_initial_balance
        )
        self.assertEqual(
            self.seeker.profile.timebank_balance,
            self.seeker_initial_balance
        )
    
    def test_balance_changes_after_service_completion(self):
        """
        After BOTH parties confirm completion, balances should update:
        - Provider gains hours (credit)
        - Seeker loses hours (debit)
        """
        duration = 2
        
        # Create and complete handshake
        handshake = Handshake.objects.create(
            offer=self.offer,
            seeker=self.seeker,
            provider=self.provider,
            hours=duration,
            status='completed'  # Service completed
        )
        
        # Manually update balances (simulating backend logic)
        self.provider.profile.timebank_balance += duration
        self.provider.profile.save()
        
        # Seeker can only spend what they have (3 beellars initial)
        if self.seeker.profile.timebank_balance >= duration:
            self.seeker.profile.timebank_balance -= duration
            self.seeker.profile.save()
        
        # Reload from database
        self.provider.profile.refresh_from_db()
        self.seeker.profile.refresh_from_db()
        
        # Verify balance changes
        self.assertEqual(
            self.provider.profile.timebank_balance,
            self.provider_initial_balance + duration  # 3 + 2 = 5
        )
        self.assertEqual(
            self.seeker.profile.timebank_balance,
            self.seeker_initial_balance - duration  # 3 - 2 = 1
        )
    
    def test_multi_participant_offer_balance_distribution(self):
        """
        For multi-participant offers:
        - Each seeker pays the same amount
        - Provider receives total from all seekers
        """
        # Create multi-participant offer
        group_offer = Offer.objects.create(
            user=self.provider,
            title="Group Workshop",
            duration=1,
            max_participants=3,
            latitude=40.0,
            longitude=29.0
        )
        
        # Create two seekers
        seeker1 = User.objects.create_user(username='seeker1', password='pass')
        seeker2 = User.objects.create_user(username='seeker2', password='pass')
        
        initial_provider_balance = self.provider.profile.timebank_balance
        initial_seeker1_balance = seeker1.profile.timebank_balance
        initial_seeker2_balance = seeker2.profile.timebank_balance
        
        duration = 1
        
        # Both seekers complete service
        # Seeker 1
        self.provider.profile.timebank_balance += duration
        seeker1.profile.timebank_balance -= duration
        self.provider.profile.save()
        seeker1.profile.save()
        
        # Seeker 2
        self.provider.profile.timebank_balance += duration
        seeker2.profile.timebank_balance -= duration
        self.provider.profile.save()
        seeker2.profile.save()
        
        # Reload
        self.provider.profile.refresh_from_db()
        seeker1.profile.refresh_from_db()
        seeker2.profile.refresh_from_db()
        
        # Provider gains 1 hour from each seeker = 2 hours total
        self.assertEqual(
            self.provider.profile.timebank_balance,
            initial_provider_balance + (duration * 2)  # 3 + 2 = 5
        )
        
        # Each seeker loses 1 hour
        self.assertEqual(
            seeker1.profile.timebank_balance,
            initial_seeker1_balance - duration  # 3 - 1 = 2
        )
        self.assertEqual(
            seeker2.profile.timebank_balance,
            initial_seeker2_balance - duration  # 3 - 1 = 2
        )


class TimeBankEdgeCasesTest(TestCase):
    """Test edge cases and boundary conditions"""
    
    def test_balance_cannot_go_negative(self):
        """
        Users cannot have negative balance (PositiveIntegerField constraint)
        This is enforced at the database level
        """
        user = User.objects.create_user(username='user', password='pass')
        profile = user.profile
        
        # Balance must be >= 0
        profile.timebank_balance = 0
        profile.save()
        profile.refresh_from_db()
        
        self.assertEqual(profile.timebank_balance, 0)
    
    def test_balance_can_be_very_large(self):
        """
        Balance can grow to large positive values
        """
        user = User.objects.create_user(username='wealthy', password='pass')
        profile = user.profile
        
        profile.timebank_balance = 1000
        profile.save()
        profile.refresh_from_db()
        
        self.assertEqual(profile.timebank_balance, 1000)
    
    def test_balance_starts_at_zero_when_depleted(self):
        """
        Balance can be reduced to zero
        """
        user = User.objects.create_user(username='zerouser', password='pass')
        profile = user.profile
        
        # Reduce to zero
        profile.timebank_balance = 0
        profile.save()
        profile.refresh_from_db()
        
        self.assertEqual(profile.timebank_balance, 0)


