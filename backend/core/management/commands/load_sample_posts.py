"""
Django management command to load sample offers and requests into the database
Usage: python manage.py load_sample_posts
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Offer, Request


class Command(BaseCommand):
    help = 'Load sample offers and requests into the database'

    def handle(self, *args, **options):
        offers_data = [
    {
      "username": "emrecan",
      "title": "Basic Website Setup and Debugging",
      "description": "I can help you create a simple personal website or debug small HTML, CSS, or JavaScript issues. Ideal for beginners who want hands-on guidance.",
      "duration": "2 hours",
      "tags": ["web development", "coding", "IT support", "frontend"],
      "latitude": 40.9923,
      "longitude": 29.0281,
      "max_participants": 2
    },
    {
      "username": "emrecan",
      "title": "Intro to Git and GitHub",
      "description": "I will explain basic Git concepts and help you use GitHub for small projects. We can practice commits, branches, and pull requests together.",
      "duration": "1 hour",
      "tags": ["git", "github", "version control", "coding"],
      "latitude": 40.9889,
      "longitude": 29.0234,
      "max_participants": 2
    },
    {
      "username": "aylin34",
      "title": "Conversational English Practice",
      "description": "I offer relaxed English conversation sessions focusing on daily topics. Helpful for improving confidence and pronunciation.",
      "duration": "1 hour",
      "tags": ["english", "language exchange", "conversation"],
      "latitude": 41.0435,
      "longitude": 29.0091,
      "max_participants": 3
    },
    {
      "username": "aylin34",
      "title": "Basic Resume and CV Review",
      "description": "I can review your CV and give feedback on clarity, structure, and wording. Especially useful for students or early-career professionals.",
      "duration": "1 hour",
      "tags": ["career", "cv review", "mentoring"],
      "latitude": 41.0408,
      "longitude": 29.0062,
      "max_participants": 2
    },
    {
      "username": "muratusta",
      "title": "Small Home Repair Assistance",
      "description": "I can help with basic home repairs like fixing loose doors or simple plumbing issues. Tools included.",
      "duration": "2 hours",
      "tags": ["home repair", "maintenance", "handyman"],
      "latitude": 41.0189,
      "longitude": 29.0176,
      "max_participants": 1
    },
    {
      "username": "muratusta",
      "title": "Furniture Assembly Help",
      "description": "I will help you assemble flat-pack furniture such as shelves or tables. Ideal for IKEA-style furniture.",
      "duration": "2 hours",
      "tags": ["furniture", "assembly", "home"],
      "latitude": 41.0212,
      "longitude": 29.0128,
      "max_participants": 1
    },
    {
      "username": "selinart",
      "title": "Beginner Watercolor Painting",
      "description": "I offer an introduction to watercolor techniques and color mixing. Materials guidance included.",
      "duration": "2 hours",
      "tags": ["art", "painting", "watercolor"],
      "latitude": 41.0461,
      "longitude": 29.0049,
      "max_participants": 3
    },
    {
      "username": "selinart",
      "title": "Creative Sketching Session",
      "description": "We will practice basic sketching techniques and observation drawing. Suitable for absolute beginners.",
      "duration": "1 hour",
      "tags": ["drawing", "art", "creativity"],
      "latitude": 41.0444,
      "longitude": 29.0103,
      "max_participants": 3
    },
    {
      "username": "denizfit",
      "title": "Outdoor Cardio Fitness Session",
      "description": "A light to moderate outdoor workout focusing on cardio and mobility. Adapted to your fitness level.",
      "duration": "1 hour",
      "tags": ["fitness", "cardio", "outdoor"],
      "latitude": 40.9876,
      "longitude": 29.0279,
      "max_participants": 3
    },
    {
      "username": "denizfit",
      "title": "Beginner Strength Training",
      "description": "I can guide you through basic bodyweight strength exercises. No gym equipment required.",
      "duration": "1 hour",
      "tags": ["fitness", "strength", "training"],
      "latitude": 40.9912,
      "longitude": 29.0217,
      "max_participants": 2
    },
    {
      "username": "hakanchef",
      "title": "Traditional Turkish Home Cooking",
      "description": "I teach simple and delicious Turkish home-style dishes. Perfect for beginners who want practical recipes.",
      "duration": "3 hours",
      "tags": ["cooking", "turkish cuisine", "food"],
      "latitude": 41.1492,
      "longitude": 29.0528,
      "max_participants": 2
    },
    {
      "username": "hakanchef",
      "title": "Meal Prep for Busy Weekdays",
      "description": "Learn how to prepare multiple meals efficiently for the week. Focus on healthy and budget-friendly food.",
      "duration": "2 hours",
      "tags": ["meal prep", "cooking", "nutrition"],
      "latitude": 41.1468,
      "longitude": 29.0475,
      "max_participants": 2
    },
    {
      "username": "elifogr",
      "title": "Math Tutoring for High School",
      "description": "I can help with algebra and basic calculus topics. Explanations are clear and step-by-step.",
      "duration": "1 hour",
      "tags": ["math", "tutoring", "education"],
      "latitude": 41.0195,
      "longitude": 29.0199,
      "max_participants": 1
    },
    {
      "username": "elifogr",
      "title": "Study Planning and Organization",
      "description": "I help students create realistic study plans and improve time management. Useful before exams.",
      "duration": "1 hour",
      "tags": ["study skills", "planning", "students"],
      "latitude": 41.0221,
      "longitude": 29.0143,
      "max_participants": 2
    },
    {
      "username": "onurfoto",
      "title": "Portrait Photography Session",
      "description": "I offer casual portrait photography using natural light. Great for social media or personal use.",
      "duration": "1 hour",
      "tags": ["photography", "portrait", "camera"],
      "latitude": 41.0417,
      "longitude": 29.0068,
      "max_participants": 1
    },
    {
      "username": "onurfoto",
      "title": "Basic Camera Settings Workshop",
      "description": "Learn how to use manual camera settings like ISO, aperture, and shutter speed. Hands-on practice included.",
      "duration": "2 hours",
      "tags": ["photography", "camera", "workshop"],
      "latitude": 41.0389,
      "longitude": 29.0109,
      "max_participants": 3
    },
    {
      "username": "yasemindil",
      "title": "Turkish Language Practice",
      "description": "I offer Turkish conversation practice for non-native speakers. Focus on daily phrases and pronunciation.",
      "duration": "1 hour",
      "tags": ["turkish", "language exchange", "conversation"],
      "latitude": 41.0176,
      "longitude": 29.0118,
      "max_participants": 3
    },
    {
      "username": "yasemindil",
      "title": "Proofreading Turkish Texts",
      "description": "I can proofread short Turkish texts for grammar and clarity. Ideal for students or blog writers.",
      "duration": "1 hour",
      "tags": ["proofreading", "turkish", "writing"],
      "latitude": 41.0239,
      "longitude": 29.0187,
      "max_participants": 2
    },
    {
      "username": "burakfix",
      "title": "Basic Electrical Fixes",
      "description": "I help with simple electrical issues like replacing sockets or light fixtures. Safety-first approach.",
      "duration": "2 hours",
      "tags": ["electrical", "home repair", "maintenance"],
      "latitude": 41.1523,
      "longitude": 29.0462,
      "max_participants": 1
    },
    {
      "username": "burakfix",
      "title": "Home Safety Check",
      "description": "I can review basic home safety issues and suggest improvements. Includes electrical and small fixes.",
      "duration": "1 hour",
      "tags": ["home safety", "inspection", "maintenance"],
      "latitude": 41.1479,
      "longitude": 29.0516,
      "max_participants": 1
    },
    {
      "username": "zeynepyoga",
      "title": "Beginner Yoga Flow",
      "description": "A gentle yoga session focusing on flexibility and breathing. Suitable for beginners.",
      "duration": "1 hour",
      "tags": ["yoga", "wellness", "stretching"],
      "latitude": 41.0217,
      "longitude": 29.0122,
      "max_participants": 3
    },
    {
      "username": "zeynepyoga",
      "title": "Stress Relief Yoga Session",
      "description": "This session focuses on relaxation and reducing stress through slow movements and breathwork.",
      "duration": "1 hour",
      "tags": ["yoga", "stress relief", "mindfulness"],
      "latitude": 41.0183,
      "longitude": 29.0171,
      "max_participants": 3
    },
    {
      "username": "keremeco",
      "title": "Energy Saving Tips for Homes",
      "description": "I can advise on simple ways to reduce electricity and heating costs. Practical and easy-to-apply tips.",
      "duration": "1 hour",
      "tags": ["energy saving", "sustainability", "home"],
      "latitude": 41.1497,
      "longitude": 29.0541,
      "max_participants": 2
    },
    {
      "username": "keremeco",
      "title": "Basic Recycling Guidance",
      "description": "Learn how to properly separate and recycle household waste in Istanbul. Suitable for families.",
      "duration": "1 hour",
      "tags": ["recycling", "environment", "sustainability"],
      "latitude": 41.1521,
      "longitude": 29.0498,
      "max_participants": 3
    },
    {
      "username": "meliskem",
      "title": "Organic Balcony Gardening",
      "description": "I can teach how to grow herbs and vegetables on a small balcony. Covers soil, watering, and sunlight.",
      "duration": "2 hours",
      "tags": ["gardening", "plants", "organic"],
      "latitude": 40.9938,
      "longitude": 29.0292,
      "max_participants": 2
    },
    {
      "username": "meliskem",
      "title": "Indoor Plant Care Basics",
      "description": "Learn how to keep indoor plants healthy and thriving. Includes watering and light tips.",
      "duration": "1 hour",
      "tags": ["plants", "gardening", "home"],
      "latitude": 40.9882,
      "longitude": 29.0211,
      "max_participants": 3
    },
    {
      "username": "aliusta",
      "title": "Basic Carpentry Help",
      "description": "I help with small carpentry tasks like fixing shelves or wooden doors. Tools provided.",
      "duration": "2 hours",
      "tags": ["carpentry", "woodwork", "home repair"],
      "latitude": 41.0413,
      "longitude": 29.0039,
      "max_participants": 1
    },
    {
      "username": "aliusta",
      "title": "Custom Shelf Installation",
      "description": "I can install wall-mounted shelves securely and neatly. Ideal for homes and small offices.",
      "duration": "2 hours",
      "tags": ["furniture", "installation", "carpentry"],
      "latitude": 41.0456,
      "longitude": 29.0098,
      "max_participants": 1
    },
    {
      "username": "nazlisanat",
      "title": "Handmade Crafts Workshop",
      "description": "I teach simple handmade craft techniques using affordable materials. Great for creative beginners.",
      "duration": "2 hours",
      "tags": ["crafts", "handmade", "art"],
      "latitude": 41.0244,
      "longitude": 29.0139,
      "max_participants": 3
    },
    {
      "username": "nazlisanat",
      "title": "Beginner Ceramic Art Session",
      "description": "An introduction to basic ceramic shaping techniques. Focus on creativity rather than perfection.",
      "duration": "3 hours",
      "tags": ["ceramics", "art", "creative"],
      "latitude": 41.0198,
      "longitude": 29.0174,
      "max_participants": 2
    }
]

        requests_data = [
    {
      "username": "elifogr",
      "title": "Help With Heavy Furniture Moving",
      "description": "I need help moving a large desk and bookshelf within my apartment. One or two people would be enough.",
      "duration": "1 hour",
      "tags": ["moving", "furniture", "help"],
      "latitude": 41.0219,
      "longitude": 29.0168
    },
    {
      "username": "aylin34",
      "title": "Fixing a Leaking Kitchen Tap",
      "description": "My kitchen tap is leaking and I need someone experienced with basic plumbing to take a look.",
      "duration": "1 hour",
      "tags": ["plumbing", "home repair", "maintenance"],
      "latitude": 41.0411,
      "longitude": 29.0087
    },
    {
      "username": "denizfit",
      "title": "Need Portrait Photos for Profile",
      "description": "I need a few natural-looking portrait photos for my professional profiles.",
      "duration": "1 hour",
      "tags": ["photography", "portrait", "profile"],
      "latitude": 40.9897,
      "longitude": 29.0245
    },
    {
      "username": "meliskem",
      "title": "Balcony Shelf Installation",
      "description": "I need help installing small shelves on my balcony for plants and storage.",
      "duration": "2 hours",
      "tags": ["carpentry", "installation", "home"],
      "latitude": 40.9926,
      "longitude": 29.0261
    },
    {
      "username": "onurfoto",
      "title": "Basic Electrical Outlet Check",
      "description": "One of my electrical outlets seems loose and I want to make sure it is safe to use.",
      "duration": "1 hour",
      "tags": ["electrical", "safety", "home repair"],
      "latitude": 41.0449,
      "longitude": 29.0061
    },
    {
      "username": "emrecan",
      "title": "Need Help Setting Up Home Wi-Fi",
      "description": "My modem settings are confusing and the connection keeps dropping. I need someone to help optimize the Wi-Fi setup.",
      "duration": "1 hour",
      "tags": ["wifi", "internet", "tech support"],
      "latitude": 40.9914,
      "longitude": 29.0262
    },
    {
      "username": "muratusta",
      "title": "Looking for Basic English Practice",
      "description": "I want to practice simple daily English conversations to feel more confident when traveling.",
      "duration": "1 hour",
      "tags": ["english", "language practice", "conversation"],
      "latitude": 41.0207,
      "longitude": 29.0149
    },
    {
      "username": "selinart",
      "title": "Need Help Framing Artwork",
      "description": "I have a few paintings and need advice and help with proper framing and wall placement.",
      "duration": "1 hour",
      "tags": ["art", "framing", "home decor"],
      "latitude": 41.0439,
      "longitude": 29.0084
    },
    {
      "username": "denizfit",
      "title": "Nutrition Advice for Training",
      "description": "I'm increasing my workouts and need basic nutrition guidance to support my routine.",
      "duration": "1 hour",
      "tags": ["nutrition", "health", "fitness"],
      "latitude": 40.9888,
      "longitude": 29.0226
    },
    {
      "username": "hakanchef",
      "title": "Help Designing a Weekly Menu",
      "description": "I want to plan a balanced weekly menu but need a second opinion and fresh ideas.",
      "duration": "1 hour",
      "tags": ["meal planning", "food", "nutrition"],
      "latitude": 41.1476,
      "longitude": 29.0489
    },
    {
      "username": "yasemindil",
      "title": "Need Assistance Translating Short Text",
      "description": "I have a short text in English that needs to be translated into Turkish accurately.",
      "duration": "1 hour",
      "tags": ["translation", "language", "writing"],
      "latitude": 41.0228,
      "longitude": 29.0161
    },
    {
      "username": "burakfix",
      "title": "Help Organizing Tool Storage",
      "description": "My garage tools are messy and I need help organizing them efficiently.",
      "duration": "2 hours",
      "tags": ["organization", "tools", "garage"],
      "latitude": 41.1511,
      "longitude": 29.0532
    },
    {
      "username": "zeynepyoga",
      "title": "Looking for Meditation Guidance",
      "description": "I want to start meditating regularly but need guidance on basic techniques.",
      "duration": "1 hour",
      "tags": ["meditation", "mindfulness", "wellbeing"],
      "latitude": 41.0196,
      "longitude": 29.0134
    },
    {
      "username": "keremeco",
      "title": "Need Help With Home Composting",
      "description": "I want to start composting at home but don't know where to begin.",
      "duration": "1 hour",
      "tags": ["compost", "environment", "sustainability"],
      "latitude": 41.1488,
      "longitude": 29.0517
    },
    {
      "username": "meliskem",
      "title": "Advice on Balcony Sunlight Planning",
      "description": "I'm not sure which plants suit my balcony's sunlight conditions. I need guidance.",
      "duration": "1 hour",
      "tags": ["gardening", "plants", "balcony"],
      "latitude": 40.9901,
      "longitude": 29.0248
    },
    {
      "username": "aliusta",
      "title": "Need Help Measuring for New Furniture",
      "description": "I want to buy new furniture but need help measuring the space correctly.",
      "duration": "1 hour",
      "tags": ["furniture", "measurement", "home"],
      "latitude": 41.0447,
      "longitude": 29.0065
    },
    {
      "username": "nazlisanat",
      "title": "Looking for Social Media Content Ideas",
      "description": "I want to promote my handmade products online and need creative content ideas.",
      "duration": "1 hour",
      "tags": ["social media", "marketing", "creativity"],
      "latitude": 41.0211,
      "longitude": 29.0157
    },
    {
      "username": "onurfoto",
      "title": "Help Writing an Artist Bio",
      "description": "I need help writing a short and clear bio for my photography portfolio.",
      "duration": "1 hour",
      "tags": ["writing", "portfolio", "branding"],
      "latitude": 41.0398,
      "longitude": 29.0096
    },
    {
      "username": "aylin34",
      "title": "Need Beginner Excel Help",
      "description": "I struggle with basic Excel formulas and want help understanding them.",
      "duration": "1 hour",
      "tags": ["excel", "office skills", "software"],
      "latitude": 41.0426,
      "longitude": 29.0059
    },
    {
      "username": "elifogr",
      "title": "Looking for Public Speaking Tips",
      "description": "I have an upcoming presentation and need tips to feel more confident.",
      "duration": "1 hour",
      "tags": ["public speaking", "communication", "confidence"],
      "latitude": 41.0204,
      "longitude": 29.0182
    },
    {
      "username": "denizfit",
      "title": "Need Stretching Routine for Desk Work",
      "description": "I spend long hours sitting and need a stretching routine to reduce stiffness.",
      "duration": "1 hour",
      "tags": ["stretching", "health", "office life"],
      "latitude": 40.9879,
      "longitude": 29.0283
    },
    {
      "username": "hakanchef",
      "title": "Help With Kitchen Organization",
      "description": "My kitchen storage is inefficient and I need ideas to organize it better.",
      "duration": "2 hours",
      "tags": ["kitchen", "organization", "home"],
      "latitude": 41.1506,
      "longitude": 29.0468
    },
    {
      "username": "yasemindil",
      "title": "Need Book Recommendations for Language Learning",
      "description": "I'm looking for book recommendations to improve my vocabulary and reading skills.",
      "duration": "1 hour",
      "tags": ["books", "learning", "language"],
      "latitude": 41.0189,
      "longitude": 29.0127
    },
    {
      "username": "burakfix",
      "title": "Help Planning Small DIY Project",
      "description": "I want to build a small wooden stand and need help planning the steps.",
      "duration": "1 hour",
      "tags": ["DIY", "planning", "woodwork"],
      "latitude": 41.1539,
      "longitude": 29.0491
    },
    {
      "username": "keremeco",
      "title": "Need Advice on Reducing Water Usage",
      "description": "I want to lower my household water consumption and need practical tips.",
      "duration": "1 hour",
      "tags": ["water saving", "environment", "sustainability"],
      "latitude": 41.1473,
      "longitude": 29.0546
    }
]

        offers_created = 0
        offers_skipped = 0
        requests_created = 0
        requests_skipped = 0
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write("Loading sample offers and requests...")
        self.stdout.write("="*60 + "\n")
        
        # Create Offers
        self.stdout.write("\n📦 Creating Offers...\n")
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
                status='open'
            )
            
            offers_created += 1
            self.stdout.write(self.style.SUCCESS(f"  ✅ {username}: {offer_data['title']}"))
        
        # Create Requests
        self.stdout.write("\n🔍 Creating Requests...\n")
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
                status='open'
            )
            
            requests_created += 1
            self.stdout.write(self.style.SUCCESS(f"  ✅ {username}: {request_data['title']}"))
        
        # Summary
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully created {offers_created} offers"))
        if offers_skipped > 0:
            self.stdout.write(self.style.WARNING(f"⚠️  Skipped {offers_skipped} duplicate offers"))
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully created {requests_created} requests"))
        if requests_skipped > 0:
            self.stdout.write(self.style.WARNING(f"⚠️  Skipped {requests_skipped} duplicate requests"))
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(f"\n📊 Total: {offers_created} offers + {requests_created} requests")
        self.stdout.write("\n🗺️  All posts are located around Beşiktaş, Kadıköy, Sarıyer, and Üsküdar")
        self.stdout.write("\n" + "="*60 + "\n")


