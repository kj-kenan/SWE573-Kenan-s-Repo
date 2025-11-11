from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("", views.home, name="home"),
    path('health/', views.health, name='health'),
    path('profiles/', views.profile_list, name='profile_list'),
    path('register/', views.register_user, name='register_user'),
    path('login/', views.login_user, name='login_user'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('offers/', views.offers_list_create, name='offers_list_create'),
    path('requests/', views.requests_list_create, name='requests_list_create'),
    path("handshakes/<int:handshake_id>/accept/", views.handshake_accept),
    path("handshakes/<int:handshake_id>/decline/", views.handshake_decline),
    path("handshakes/<int:handshake_id>/confirm/", views.handshake_confirm),
    path("transactions/", views.transactions_list),
]
