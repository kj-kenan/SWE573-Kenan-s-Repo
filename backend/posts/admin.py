from django.contrib import admin
from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "type", "province", "district", "duration", "date_posted")
    list_filter = ("type", "province", "district")
    search_fields = ("title", "description", "tags", "province", "district")
    ordering = ("-date_posted",)
