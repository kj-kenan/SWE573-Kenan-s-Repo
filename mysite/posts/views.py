from django.shortcuts import render, redirect
from .models import Post
from django.contrib.auth.models import User


def post_list(request):
    """List all posts, optionally filtered by type"""
    post_type = request.GET.get("type")  # ?type=offer veya ?type=request
    posts = Post.objects.all().order_by("-date_posted")
    if post_type in ["offer", "request"]:
        posts = posts.filter(type=post_type)
    return render(request, "posts/posts.html", {"posts": posts})


def post_create(request):
    """Single form for both offers and requests"""
    if request.method == "POST":
        Post.objects.create(
            user=request.user if request.user.is_authenticated else User.objects.first(),
            type=request.POST["type"],
            title=request.POST["title"],
            description=request.POST["description"],
            duration=request.POST["duration"],
            tags=request.POST["tags"],
            district=request.POST["district"],
            province=request.POST["province"],
        )
        return redirect("post_list")
    return render(request, "posts/post_form.html")
