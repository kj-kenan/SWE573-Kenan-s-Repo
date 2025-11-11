from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Offer(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.CharField(max_length=50)
    date = models.DateField(null=True, blank=True)
    tags = models.CharField(max_length=200, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Offer: {self.title}"


class Request(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.CharField(max_length=50)
    date = models.DateField(null=True, blank=True)
    tags = models.CharField(max_length=200, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Request: {self.title}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    province = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    is_visible = models.BooleanField(default=True)
    timebank_balance = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile({self.user.username})"


class Handshake(models.Model):
    STATUS_CHOICES = [
        ("proposed", "Proposed"),
        ("accepted", "Accepted"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("settled", "Settled"),
        ("declined", "Declined"),
    ]

    offer = models.ForeignKey(
        Offer, on_delete=models.CASCADE, null=True, blank=True, related_name="handshakes"
    )
    request = models.ForeignKey(
        Request, on_delete=models.CASCADE, null=True, blank=True, related_name="handshakes"
    )
    provider = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="provided_handshakes"
    )
    seeker = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="requested_handshakes"
    )
    hours = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="proposed")
    provider_confirmed = models.BooleanField(default=False)
    seeker_confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "seeker", "offer"], name="unique_offer_handshake"
            )
        ]

    def clean(self):
        if not (self.offer or self.request):
            raise ValidationError("Handshake must be linked to either an Offer or a Request.")
        if self.offer and self.request:
            raise ValidationError("Handshake cannot be linked to both Offer and Request.")

    def save(self, *args, **kwargs):
        # Auto-complete logic
        if self.provider_confirmed and self.seeker_confirmed and self.status != "completed":
            self.status = "completed"
        super().save(*args, **kwargs)

    def __str__(self):
        target = self.offer.title if self.offer else self.request.title
        return f"Handshake({self.provider.username} ↔ {self.seeker.username}) on {target}"


class Transaction(models.Model):
    handshake = models.ForeignKey(
        Handshake, on_delete=models.CASCADE, related_name="transactions"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_transactions"
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_transactions"
    )
    amount = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction: {self.sender.username} → {self.receiver.username} ({self.amount} Beellar)"
