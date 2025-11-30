from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

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

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
