#!/usr/bin/env python
"""
Script to fix offers/requests without owners.
Run with: python manage.py shell < fix_offers.py
Or: python manage.py shell
Then copy-paste the code below.
"""

from django.contrib.auth.models import User
from core.models import Offer, Request

# Get the first user (or create a test user)
user = User.objects.first()
if not user:
    print("No users found. Please create a user first.")
    exit()

# Fix offers without users
offers_without_user = Offer.objects.filter(user__isnull=True)
print(f"Found {offers_without_user.count()} offers without users")

for offer in offers_without_user:
    offer.user = user
    offer.save()
    print(f"Assigned offer {offer.id} ({offer.title}) to user {user.username}")

# Fix requests without users
requests_without_user = Request.objects.filter(user__isnull=True)
print(f"\nFound {requests_without_user.count()} requests without users")

for request in requests_without_user:
    request.user = user
    request.save()
    print(f"Assigned request {request.id} ({request.title}) to user {user.username}")

print("\nDone!")








