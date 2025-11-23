from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("", views.home, name="home"),
    path("health/", views.health, name="health"),
    path("register/", views.register_user, name="register_user"),
    path("login/", views.login_user, name="login_user"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profiles/", views.profile_list, name="profile_list"),
    path("offers/", views.offers_list_create, name="offers_list_create"),
    path("offers/<int:offer_id>/", views.offer_detail, name="offer_detail"),
    path("requests/", views.requests_list_create, name="requests_list_create"),
    path("requests/<int:request_id>/", views.request_detail, name="request_detail"),
    path("handshakes/", views.handshakes_list_create, name="handshakes_list_create"),
    path("handshakes/<int:handshake_id>/accept/", views.handshake_accept, name="handshake_accept"),
    path("handshakes/<int:handshake_id>/decline/", views.handshake_decline, name="handshake_decline"),
    path("handshakes/<int:handshake_id>/confirm/", views.handshake_confirm, name="handshake_confirm"),
    path("transactions/", views.transactions_list, name="transactions_list"),
]
