from django.shortcuts import render

def create_offer(request):
    return render(request, "offers/new_offer.html")
