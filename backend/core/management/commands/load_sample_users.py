"""
Django management command to load sample users into the database
Usage: python manage.py load_sample_users
"""
import json
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import UserProfile


class Command(BaseCommand):
    help = 'Load sample users into the database'

    def handle(self, *args, **options):
        sample_users = [
  {
    "username": "emrecan",
    "email": "emre.can@gmail.com",
    "full_name": "Emre Can Yıldırım",
    "bio": "I'm a software developer working remotely and enjoying Istanbul life. I like helping people solve tech problems and learning new skills from the community.",
    "skills": ["web development", "basic IT support", "problem solving"],
    "interests": ["technology", "cycling", "podcasts"],
    "location": "Kadıköy"
  },
  {
    "username": "aylin34",
    "email": "aylin.kaya@hotmail.com",
    "full_name": "Aylin Kaya",
    "bio": "I work as a primary school teacher and love sharing knowledge. In my free time, I enjoy crafts and spending time outdoors.",
    "skills": ["tutoring", "child education", "arts and crafts"],
    "interests": ["hiking", "journaling", "DIY projects"],
    "location": "Üsküdar"
  },
  {
    "username": "muratusta",
    "email": "murat.usta@yahoo.com",
    "full_name": "Murat Usta",
    "bio": "I'm a retired electrician who still enjoys fixing things. Helping neighbors makes me feel useful and connected.",
    "skills": ["electrical repair", "home maintenance", "troubleshooting"],
    "interests": ["woodworking", "walking", "chess"],
    "location": "Beşiktaş"
  },
  {
    "username": "selinart",
    "email": "selin.art@gmail.com",
    "full_name": "Selin Arslan",
    "bio": "I'm a visual artist working with illustration and digital art. I enjoy collaborating and exchanging creative ideas.",
    "skills": ["illustration", "graphic design", "digital drawing"],
    "interests": ["museums", "sketching", "creative writing"],
    "location": "Beyoğlu"
  },
  {
    "username": "denizfit",
    "email": "deniz.fit@gmail.com",
    "full_name": "Deniz Aksoy",
    "bio": "I'm a fitness enthusiast and part-time trainer. I believe small daily habits can improve life quality.",
    "skills": ["personal training", "stretching routines", "fitness planning"],
    "interests": ["fitness", "healthy cooking", "nature walks"],
    "location": "Ataşehir"
  },
  {
    "username": "hakanchef",
    "email": "hakan.mutfak@gmail.com",
    "full_name": "Hakan Demir",
    "bio": "Cooking is my passion and profession. I enjoy teaching simple, tasty recipes and learning new cuisines.",
    "skills": ["home cooking", "meal prep", "kitchen organization"],
    "interests": ["food culture", "travel shows", "spices"],
    "location": "Fatih"
  },
  {
    "username": "elifogr",
    "email": "elif.ogrenci@gmail.com",
    "full_name": "Elif Nur Şahin",
    "bio": "I'm a university student studying sociology. I love listening to people's stories and being part of community projects.",
    "skills": ["research assistance", "note taking", "basic tutoring"],
    "interests": ["reading", "volunteering", "documentaries"],
    "location": "Şişli"
  },
  {
    "username": "onurfoto",
    "email": "onur.photo@gmail.com",
    "full_name": "Onur Çelik",
    "bio": "I'm a freelance photographer focused on everyday life moments. I enjoy helping people capture memories.",
    "skills": ["photography", "photo editing", "camera basics"],
    "interests": ["street photography", "cycling", "travel"],
    "location": "Balat"
  },
  {
    "username": "yasemindil",
    "email": "yasemin.dil@gmail.com",
    "full_name": "Yasemin Koç",
    "bio": "I work in tourism and love learning languages. I enjoy cultural exchange and meeting new people.",
    "skills": ["language practice (English)", "language practice (Italian)", "conversation coaching"],
    "interests": ["languages", "travel planning", "journaling"],
    "location": "Karaköy"
  },
  {
    "username": "burakfix",
    "email": "burak.fixit@gmail.com",
    "full_name": "Burak Özkan",
    "bio": "I enjoy fixing and building things in my free time. Helping others with practical problems is very satisfying for me.",
    "skills": ["furniture assembly", "minor repairs", "tool use"],
    "interests": ["DIY projects", "podcasts", "cycling"],
    "location": "Maltepe"
  },
  {
    "username": "zeynepyoga",
    "email": "zeynep.yoga@gmail.com",
    "full_name": "Zeynep Aydın",
    "bio": "I'm a yoga instructor focused on mindfulness and balance. I like creating calm spaces for people.",
    "skills": ["yoga instruction", "breathing exercises", "meditation"],
    "interests": ["wellness", "herbal teas", "journaling"],
    "location": "Moda"
  },
  {
    "username": "keremeco",
    "email": "kerem.eco@gmail.com",
    "full_name": "Kerem Tunalı",
    "bio": "I work in environmental consulting and care deeply about sustainability. I enjoy sharing eco-friendly practices.",
    "skills": ["sustainability advice", "waste reduction", "urban gardening"],
    "interests": ["ecology", "cycling", "documentaries"],
    "location": "Sarıyer"
  },
  {
    "username": "meliskem",
    "email": "melis.kemal@gmail.com",
    "full_name": "Melis Kemal",
    "bio": "I'm a marketing professional who likes organizing and planning. I enjoy helping others structure their ideas.",
    "skills": ["content planning", "presentation prep", "copy editing"],
    "interests": ["productivity", "design blogs", "pilates"],
    "location": "Levent"
  },
  {
    "username": "aliusta",
    "email": "ali.usta@hotmail.com",
    "full_name": "Ali Rıza Yılmaz",
    "bio": "I'm a semi-retired carpenter with decades of experience. I like teaching practical skills and chatting over tea.",
    "skills": ["woodworking", "furniture repair", "measuring and planning"],
    "interests": ["carpentry", "tea brewing", "local history"],
    "location": "Ümraniye"
  },
  {
    "username": "nazlisanat",
    "email": "nazli.sanat@gmail.com",
    "full_name": "Nazlı Erdem",
    "bio": "I'm a ceramic hobbyist exploring creative expression. I love exchanging handmade skills and inspiration.",
    "skills": ["basic ceramics", "handcraft techniques", "glazing basics"],
    "interests": ["pottery", "slow living", "photography"],
    "location": "Cihangir"
  }
]

        # Default password for all sample users
        default_password = "hive2025"
        
        created_count = 0
        skipped_count = 0
        
        self.stdout.write("\nLoading sample users...\n")
        
        for user_data in sample_users:
            username = user_data['username']
            email = user_data['email']
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f"  ⚠️  User '{username}' already exists, skipping..."))
                skipped_count += 1
                continue
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=default_password
            )
            
            # Get or create profile (should be auto-created by signals, but just in case)
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Update profile with additional info
            profile.bio = user_data['bio']
            profile.skills = ', '.join(user_data['skills'])
            profile.interests = ', '.join(user_data['interests'])
            profile.province = 'Istanbul'
            profile.district = user_data['location']
            profile.timebank_balance = 3  # Starting balance
            profile.email_verified = True  # Verify email so they can login
            profile.save()
            
            created_count += 1
            self.stdout.write(self.style.SUCCESS(f"  ✅ Created user: {username} ({user_data['full_name']}) - {user_data['location']}"))
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS(f"\n✅ Successfully created {created_count} users"))
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(f"⚠️  Skipped {skipped_count} existing users"))
        self.stdout.write(f"\n📝 Default password for all users: {default_password}")
        self.stdout.write(f"💰 All users start with 3 Beellars")
        self.stdout.write("\n" + "="*60 + "\n")

