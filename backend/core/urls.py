from django.urls import path
from . import views
from .auth_views import CustomTokenObtainPairView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path("", views.home, name="home"),
    path("health/", views.health, name="health"),
    path("register/", views.register_user, name="register_user"),
    path("login/", views.login_user, name="login_user"),
    path("auth/activate/", views.activate_account, name="activate_account"),
    path("auth/resend-activation/", views.resend_activation, name="resend_activation"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profiles/", views.profile_list, name="profile_list"),
    path("profiles/me/", views.profile_own, name="profile_own"),
    path("profiles/<int:user_id>/", views.profile_detail, name="profile_detail"),
    path("ratings/", views.ratings_list_create, name="ratings_list_create"),
    path("badges/", views.badges_list, name="badges_list"),
    path("offers/", views.offers_list_create, name="offers_list_create"),
    path("offers/<int:offer_id>/", views.offer_detail, name="offer_detail"),
    path("offers/<int:offer_id>/edit/", views.offer_edit, name="offer_edit"),
    path("offers/<int:offer_id>/delete/", views.offer_delete, name="offer_delete"),
    path("requests/", views.requests_list_create, name="requests_list_create"),
    path("requests/<int:request_id>/", views.request_detail, name="request_detail"),
    path("requests/<int:request_id>/edit/", views.request_edit, name="request_edit"),
    path("requests/<int:request_id>/delete/", views.request_delete, name="request_delete"),
    path("handshakes/", views.handshakes_list_create, name="handshakes_list_create"),
    path("handshakes/<int:handshake_id>/accept/", views.handshake_accept, name="handshake_accept"),
    path("handshakes/<int:handshake_id>/decline/", views.handshake_decline, name="handshake_decline"),
    path("handshakes/<int:handshake_id>/confirm/", views.handshake_confirm, name="handshake_confirm"),
    path("timebank/balance/", views.timebank_balance, name="timebank_balance"),
    path("transactions/", views.transactions_list, name="transactions_list"),
    path("questions/", views.questions_list_create, name="questions_list_create"),
    path("questions/<int:question_id>/answer/", views.question_answer, name="question_answer"),
    path("messages/", views.messages_list_create, name="messages_list_create"),
    path("tags/", views.tags_list, name="tags_list"),
]
