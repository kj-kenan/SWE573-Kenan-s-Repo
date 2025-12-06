from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import Avg


class Offer(models.Model):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="offers", null=True, blank=True
    )
    title = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.CharField(max_length=50)
    date = models.DateField(null=True, blank=True)  # Deprecated, use available_slots
    available_slots = models.TextField(blank=True, null=True, help_text="JSON array of available date/time slots")
    tags = models.CharField(max_length=200, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="open"
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"Offer: {self.title}"


class Request(models.Model):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="requests", null=True, blank=True
    )
    title = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.CharField(max_length=50)
    date = models.DateField(null=True, blank=True)  # Deprecated, use available_slots
    available_slots = models.TextField(blank=True, null=True, help_text="JSON array of available date/time slots")
    tags = models.CharField(max_length=200, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="open"
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"Request: {self.title}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    skills = models.TextField(blank=True, help_text="Comma-separated list of skills")
    interests = models.TextField(blank=True, help_text="Comma-separated list of interests")
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)
    province = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    is_visible = models.BooleanField(default=True)
    timebank_balance = models.PositiveIntegerField(default=0)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile({self.user.username})"
    
    @property
    def average_rating(self):
        """Calculate average rating from all received ratings"""
        ratings = Rating.objects.filter(rated_user=self.user)
        if ratings.exists():
            return round(ratings.aggregate(models.Avg("rating"))["rating__avg"] or 0, 2)
        return 0.0
    
    @property
    def total_ratings(self):
        """Get total number of ratings received"""
        return Rating.objects.filter(rated_user=self.user).count()


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


class Question(models.Model):
    """Public pre-handshake questions displayed under posts"""
    offer = models.ForeignKey(
        Offer, on_delete=models.CASCADE, null=True, blank=True, related_name="questions"
    )
    request = models.ForeignKey(
        Request, on_delete=models.CASCADE, null=True, blank=True, related_name="questions"
    )
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="asked_questions"
    )
    content = models.TextField()
    answer = models.TextField(blank=True, null=True, help_text="Answer from the post owner")
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if not (self.offer or self.request):
            raise ValidationError("Question must be linked to either an Offer or a Request.")
        if self.offer and self.request:
            raise ValidationError("Question cannot be linked to both Offer and Request.")

    def __str__(self):
        target = self.offer.title if self.offer else self.request.title
        return f"Question on {target} by {self.author.username}"


class Message(models.Model):
    """Private messages after handshake is accepted"""
    handshake = models.ForeignKey(
        Handshake, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message from {self.sender.username} in handshake {self.handshake.id}"


class Rating(models.Model):
    """Ratings given after a completed handshake"""
    # Predefined tags
    TAG_CHOICES = [
        ("On Time", "On Time"),
        ("Good Communication", "Good Communication"),
        ("Friendly", "Friendly"),
        ("Reliable", "Reliable"),
        ("Professional", "Professional"),
        ("High Quality Work", "High Quality Work"),
        ("Efficient", "Efficient"),
        ("Organized", "Organized"),
        ("Respectful", "Respectful"),
        ("Above and Beyond", "Above and Beyond"),
    ]
    
    handshake = models.ForeignKey(
        Handshake, on_delete=models.CASCADE, related_name="ratings"
    )
    rater = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="ratings_given"
    )
    ratee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="ratings_received"
    )
    score = models.IntegerField(choices=[(i, i) for i in range(1, 11)])  # 1-10 score
    tags = models.JSONField(default=list, help_text="Array of tag strings (max 3)")
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [["handshake", "rater"]]  # One rating per user per handshake

    def clean(self):
        # Ensure rating is only given for completed handshakes
        if self.handshake.status != "completed":
            raise ValidationError("Ratings can only be given for completed handshakes.")
        # Ensure rater is either provider or seeker in the handshake
        if self.rater not in [self.handshake.provider, self.handshake.seeker]:
            raise ValidationError("Only participants in the handshake can rate.")
        # Ensure ratee is the other participant
        if self.ratee not in [self.handshake.provider, self.handshake.seeker]:
            raise ValidationError("You can only rate the other participant in the handshake.")
        if self.ratee == self.rater:
            raise ValidationError("You cannot rate yourself.")
        # Validate tags
        if self.tags:
            valid_tags = [tag[0] for tag in self.TAG_CHOICES]
            if len(self.tags) > 3:
                raise ValidationError("You can select at most 3 tags.")
            for tag in self.tags:
                if tag not in valid_tags:
                    raise ValidationError(f"Invalid tag: {tag}. Must be from predefined list.")

    def __str__(self):
        return f"Rating {self.score}/10 from {self.rater.username} to {self.ratee.username}"


class Badge(models.Model):
    """Badges earned by users for milestones"""
    BADGE_TYPES = [
        ("first_post", "First Post"),
        ("first_handshake", "First Handshake"),
        ("helper", "Helper"),
        ("community_builder", "Community Builder"),
        ("timebank_master", "TimeBank Master"),
        ("rated_highly", "Highly Rated"),
    ]
    
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="badges"
    )
    badge_type = models.CharField(max_length=50, choices=BADGE_TYPES)
    earned_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["-earned_at"]
        unique_together = [["user", "badge_type"]]  # One badge of each type per user

    def __str__(self):
        return f"{self.user.username} - {self.get_badge_type_display()}"


class ForumTopic(models.Model):
    """Forum topics for community discussions"""
    title = models.CharField(max_length=200)
    body = models.TextField()
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="forum_topics"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} by {self.author.username}"


class ForumReply(models.Model):
    """Replies to forum topics"""
    topic = models.ForeignKey(
        ForumTopic, on_delete=models.CASCADE, related_name="replies"
    )
    body = models.TextField()
    author = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="forum_replies"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]  # Chronological order

    def __str__(self):
        return f"Reply to '{self.topic.title}' by {self.author.username}"
