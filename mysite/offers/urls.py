from django.urls import path
from . import views

urlpatterns = [
    path('new/', views.create_offer, name='create_offer'),
]
