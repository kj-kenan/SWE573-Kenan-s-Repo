from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def root_view(request):
    return JsonResponse({
        "message": "The Hive API",
        "version": "1.0",
        "endpoints": {
            "health": "/api/health/",
            "offers": "/api/offers/",
            "requests": "/api/requests/",
            "handshakes": "/api/handshakes/",
            "admin": "/admin/"
        }
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path("api/", include("core.urls")), 
]
