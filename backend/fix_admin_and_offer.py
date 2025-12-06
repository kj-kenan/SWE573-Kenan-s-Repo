#!/usr/bin/env python
"""
Quick fix script:
1. Creates admin superuser (username: admin, password: admin123)
2. Fixes offer ID 1 to have an owner
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Offer

# Create admin superuser if it doesn't exist
admin, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'is_superuser': True,
        'is_staff': True,
    }
)
if created:
    admin.set_password('admin123')
    admin.save()
    print(f"✓ Created superuser: username=admin, password=admin123")
else:
    print(f"✓ Admin user already exists")

# Fix offer ID 1
try:
    offer = Offer.objects.get(id=1)
    if not offer.user:
        user = User.objects.first()
        if user:
            offer.user = user
            offer.save()
            print(f"✓ Fixed! Offer {offer.id} ({offer.title}) now belongs to {user.username}")
        else:
            print("✗ No users found to assign to offer")
    else:
        print(f"✓ Offer {offer.id} already has owner: {offer.user.username}")
except Offer.DoesNotExist:
    print("✗ Offer with ID 1 does not exist")

print("\nDone! You can now:")
print("1. Login to admin at http://localhost:8000/admin/ (username: admin, password: admin123)")
print("2. Try sending a handshake again")






