"""
Django management command to load additional sample offers and requests
Usage: python manage.py load_extra_posts
"""
import json
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Offer, Request


class Command(BaseCommand):
    help = 'Load additional sample offers and requests with available slots'

    def handle(self, *args, **options):
        # Map posts to suitable users based on service type
        offers_data = [
            {
                "username": "burakfix",  # DIY/repair person
                "title": "Midnight Bike Repair",
                "description": "I can fix bicycles late at night for delivery riders or night owls.",
                "duration": "1 hour",
                "tags": ["bike repair", "mechanics", "night help"],
                "latitude": 41.085112,
                "longitude": 29.041203,
                "max_participants": 1,
                "available_slots": json.dumps([
                    "2025-01-22T22:00:00",
                    "2025-01-24T23:00:00"
                ])
            },
            {
                "username": "onurfoto",  # Photographer
                "title": "Analog Photography Walk",
                "description": "I teach film photography while walking around the neighborhood.",
                "duration": "2 hours",
                "tags": ["photography", "film", "walking"],
                "latitude": 41.084532,
                "longitude": 29.040441,
                "max_participants": 3,
                "available_slots": json.dumps([
                    "2025-01-23T10:00:00",
                    "2025-01-26T15:00:00"
                ])
            },
            {
                "username": "aliusta",  # Carpenter
                "title": "IKEA Furniture Rescue",
                "description": "I save people from half-built IKEA disasters.",
                "duration": "2 hours",
                "tags": ["furniture", "assembly", "diy"],
                "latitude": 41.085401,
                "longitude": 29.039991,
                "max_participants": 1,
                "available_slots": json.dumps([
                    "2025-01-21T18:00:00",
                    "2025-01-25T14:00:00"
                ])
            },
            {
                "username": "hakanchef",  # Chef
                "title": "Turkish Coffee Masterclass",
                "description": "I teach proper Turkish coffee brewing and fortune reading basics.",
                "duration": "2 hours",
                "tags": ["coffee", "culture", "tradition"],
                "latitude": 41.084777,
                "longitude": 29.041812,
                "max_participants": 3,
                "available_slots": json.dumps([
                    "2025-01-22T11:00:00",
                    "2025-01-27T16:00:00"
                ])
            },
            {
                "username": "keremeco",  # Eco/gardening person
                "title": "Balcony Urban Gardening",
                "description": "Help you grow herbs and veggies on small balconies.",
                "duration": "2 hours",
                "tags": ["gardening", "urban", "plants"],
                "latitude": 41.083991,
                "longitude": 29.040302,
                "max_participants": 2,
                "available_slots": json.dumps([
                    "2025-01-23T09:00:00",
                    "2025-01-28T13:00:00"
                ])
            }
        ]

        requests_data = [
            {
                "username": "nazlisanat",  # Artist
                "title": "Fix My Wobbly Chair",
                "description": "One leg keeps shaking and it drives me crazy.",
                "duration": "1 hour",
                "tags": ["furniture repair"],
                "latitude": 41.084801,
                "longitude": 29.040912,
                "available_slots": json.dumps([
                    "2025-01-22T17:00:00",
                    "2025-01-24T19:00:00"
                ])
            },
            {
                "username": "elifogr",  # Student
                "title": "Beginner Guitar Help",
                "description": "I need help learning first chords.",
                "duration": "1 hour",
                "tags": ["guitar", "music"],
                "latitude": 41.085177,
                "longitude": 29.041311,
                "available_slots": json.dumps([
                    "2025-01-23T18:00:00",
                    "2025-01-26T12:00:00"
                ])
            },
            {
                "username": "meliskem",  # Marketing professional
                "title": "Laptop Running Too Slow",
                "description": "My laptop takes 10 minutes to boot.",
                "duration": "1 hour",
                "tags": ["computer help"],
                "latitude": 41.085004,
                "longitude": 29.041002,
                "available_slots": json.dumps([
                    "2025-01-21T20:00:00",
                    "2025-01-25T11:00:00"
                ])
            },
            {
                "username": "yasemindil",  # Tourism/language person
                "title": "Balcony Plant Setup",
                "description": "I want herbs but don't know where to start.",
                "duration": "1 hour",
                "tags": ["gardening", "plants"],
                "latitude": 41.084043,
                "longitude": 29.040144,
                "available_slots": json.dumps([
                    "2025-01-22T10:00:00",
                    "2025-01-27T14:00:00"
                ])
            },
            {
                "username": "zeynepyoga",  # Yoga instructor
                "title": "Cat Care for Weekend",
                "description": "Need someone to feed my cat for 2 days.",
                "duration": "2 hours",
                "tags": ["pet care", "cats"],
                "latitude": 41.084372,
                "longitude": 29.041201,
                "available_slots": json.dumps([
                    "2025-01-24T09:00:00",
                    "2025-01-25T09:00:00"
                ])
            }
        ]

        offers_created = 0
        offers_skipped = 0
        requests_created = 0
        requests_skipped = 0
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write("Loading additional sample posts...")
        self.stdout.write("="*60 + "\n")
        
        # Create Offers
        self.stdout.write("\n📦 Creating Extra Offers...\n")
        for offer_data in offers_data:
            username = offer_data['username']
            
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"  ❌ User '{username}' not found, skipping offer..."))
                offers_skipped += 1
                continue
            
            # Check if similar offer already exists
            if Offer.objects.filter(user=user, title=offer_data['title']).exists():
                self.stdout.write(self.style.WARNING(f"  ⚠️  Offer '{offer_data['title']}' already exists, skipping..."))
                offers_skipped += 1
                continue
            
            # Create offer
            offer = Offer.objects.create(
                user=user,
                title=offer_data['title'],
                description=offer_data['description'],
                duration=offer_data['duration'],
                tags=', '.join(offer_data['tags']) if isinstance(offer_data['tags'], list) else offer_data['tags'],
                latitude=offer_data['latitude'],
                longitude=offer_data['longitude'],
                max_participants=offer_data.get('max_participants', 1),
                available_slots=offer_data.get('available_slots'),
                status='open'
            )
            
            offers_created += 1
            self.stdout.write(self.style.SUCCESS(f"  ✅ {username}: {offer_data['title']}"))
        
        # Create Requests
        self.stdout.write("\n🔍 Creating Extra Requests...\n")
        for request_data in requests_data:
            username = request_data['username']
            
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"  ❌ User '{username}' not found, skipping request..."))
                requests_skipped += 1
                continue
            
            # Check if similar request already exists
            if Request.objects.filter(user=user, title=request_data['title']).exists():
                self.stdout.write(self.style.WARNING(f"  ⚠️  Request '{request_data['title']}' already exists, skipping..."))
                requests_skipped += 1
                continue
            
            # Create request
            request = Request.objects.create(
                user=user,
                title=request_data['title'],
                description=request_data['description'],
                duration=request_data['duration'],
                tags=', '.join(request_data['tags']) if isinstance(request_data['tags'], list) else request_data['tags'],
                latitude=request_data['latitude'],
                longitude=request_data['longitude'],
                available_slots=request_data.get('available_slots'),
                status='open'
            )
            
            requests_created += 1
            self.stdout.write(self.style.SUCCESS(f"  ✅ {username}: {request_data['title']}"))
        
        # Summary
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully created {offers_created} extra offers"))
        if offers_skipped > 0:
            self.stdout.write(self.style.WARNING(f"⚠️  Skipped {offers_skipped} duplicate offers"))
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully created {requests_created} extra requests"))
        if requests_skipped > 0:
            self.stdout.write(self.style.WARNING(f"⚠️  Skipped {requests_skipped} duplicate requests"))
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(f"\n📊 Added: {offers_created} offers + {requests_created} requests")
        self.stdout.write("\n📅 These posts include specific available time slots")
        self.stdout.write("\n" + "="*60 + "\n")

