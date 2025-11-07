# core/urls.py
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('health/', views.health, name='health'),
    path('offers/', views.offers_list, name='offers_list'),
    path('profiles/', views.profile_list, name='profile_list'),
]
