# core/urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

app_name = 'core'

urlpatterns = [
    path('health/', views.health, name='health'),
    path('offers/', views.offers_list, name='offers_list'),
    path('profiles/', views.profile_list, name='profile_list'),
    path('register/', views.register_user, name='register_user'), 
    path('login/', views.login_user, name='login_user'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]
