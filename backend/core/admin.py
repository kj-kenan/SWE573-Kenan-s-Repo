
from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "province", "district", "timebank_balance", "is_visible", "created_at")
    search_fields = ("user__username", "province", "district")
    list_filter = ("is_visible",)
