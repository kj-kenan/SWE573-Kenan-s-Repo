
from core.views import home
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home),
    path('offers/', include('offers.urls')),
    path('', include('core.urls')),
           
] 

