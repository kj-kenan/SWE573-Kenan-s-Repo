from django.db import models
from django.contrib.auth.models import User


class Post(models.Model):
    POST_TYPES = [
        ("offer", "Offer"),
        ("request", "Request"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=POST_TYPES)
    title = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.DecimalField(max_digits=4, decimal_places=1, help_text="in hours")
    tags = models.CharField(max_length=100, help_text="comma-separated tags")
    district = models.CharField(max_length=50)
    province = models.CharField(max_length=50)
    date_posted = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.type})"
