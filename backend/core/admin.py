
from django.contrib import admin
from .models import UserProfile, Offer, Request, Handshake, Transaction, Question, Message, Rating, Badge, Rating, Badge

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "province", "district", "timebank_balance", "is_visible", "created_at")
    search_fields = ("user__username", "province", "district")
    list_filter = ("is_visible",)


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "status", "created_at")
    search_fields = ("title", "description", "user__username")
    list_filter = ("status", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "status", "created_at")
    search_fields = ("title", "description", "user__username")
    list_filter = ("status", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Handshake)
class HandshakeAdmin(admin.ModelAdmin):
    list_display = ("id", "offer", "request", "provider", "seeker", "status", "hours", "created_at")
    search_fields = ("provider__username", "seeker__username")
    list_filter = ("status", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "receiver", "amount", "created_at")
    search_fields = ("sender__username", "receiver__username")
    list_filter = ("created_at",)
    readonly_fields = ("created_at",)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "offer", "request", "author", "has_answer", "created_at")
    search_fields = ("author__username", "content", "answer")
    list_filter = ("created_at", "answered_at")
    readonly_fields = ("created_at", "answered_at")
    
    def has_answer(self, obj):
        return bool(obj.answer)
    has_answer.boolean = True
    has_answer.short_description = "Answered"


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "handshake", "sender", "is_read", "created_at")
    search_fields = ("sender__username", "content")
    list_filter = ("is_read", "created_at",)
    readonly_fields = ("created_at",)


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("id", "handshake", "rater", "rated_user", "rating", "created_at")
    search_fields = ("rater__username", "rated_user__username", "comment")
    list_filter = ("rating", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "badge_type", "earned_at")
    search_fields = ("user__username", "badge_type")
    list_filter = ("badge_type", "earned_at")
    readonly_fields = ("earned_at",)
