"""
Utility functions for fuzzy location calculation.
Provides deterministic fuzzy offsets for map markers using 2D circular scatter
to protect user privacy while maintaining consistent positioning.
"""
import hashlib
import math
import random


# Radius range in degrees for circular scatter (100-200 meters)
# At equator: 1 degree ≈ 111,000 meters
# 100 meters ≈ 0.0009 degrees
# 200 meters ≈ 0.0018 degrees
MIN_RADIUS_DEGREES = 0.0009  # Minimum 100 meters
MAX_RADIUS_DEGREES = 0.0018  # Maximum 200 meters


def generate_deterministic_seed(post_id, created_at, owner_id):
    """
    Generate a deterministic numeric seed based on post attributes.
    Uses SHA256 to create a consistent seed for the same post.
    
    Args:
        post_id: The unique ID of the post
        created_at: Creation timestamp (datetime or string)
        owner_id: User ID of the post owner
    
    Returns:
        int: Numeric seed for random number generation
    """
    # Convert all components to strings for hashing
    created_at_str = str(created_at) if created_at else ""
    seed_string = f"{post_id}:{created_at_str}:{owner_id}"
    
    # Generate SHA256 hash
    hash_obj = hashlib.sha256(seed_string.encode('utf-8'))
    hash_hex = hash_obj.hexdigest()
    
    # Convert first 16 hex characters to integer (64-bit seed)
    numeric_seed = int(hash_hex[:16], 16)
    
    return numeric_seed


def calculate_circular_scatter_offset(post_id, created_at, owner_id):
    """
    Calculate a deterministic fuzzy offset using 2D circular scatter.
    Uses random radius and angle for more visually unpredictable distribution
    while remaining deterministic for the same post.
    
    Args:
        post_id: The unique ID of the post (offer or request)
        created_at: Creation timestamp (datetime or string)
        owner_id: User ID of the post owner
    
    Returns:
        tuple: (offset_lat, offset_lng) in degrees
    """
    # Generate deterministic seed
    seed = generate_deterministic_seed(post_id, created_at, owner_id)
    
    # Create deterministic random number generator
    rng = random.Random(seed)
    
    # Generate random radius in range [MIN_RADIUS_DEGREES, MAX_RADIUS_DEGREES]
    # Using uniform distribution for even scatter across the circle
    # Ensures offset is always between 100-200 meters from real location
    radius = rng.uniform(MIN_RADIUS_DEGREES, MAX_RADIUS_DEGREES)
    
    # Generate random angle in range [0, 2π]
    angle = rng.uniform(0, 2 * math.pi)
    
    # Calculate offset using polar to cartesian conversion
    # lat_offset = r * cos(angle)
    # lng_offset = r * sin(angle)
    offset_lat = radius * math.cos(angle)
    offset_lng = radius * math.sin(angle)
    
    return offset_lat, offset_lng


def get_fuzzy_coordinates(latitude, longitude, post_id, created_at=None, owner_id=None):
    """
    Get fuzzy coordinates for a post using 2D circular scatter.
    Real coordinates remain unchanged in the database.
    
    Args:
        latitude: Real latitude coordinate
        longitude: Real longitude coordinate
        post_id: The unique ID of the post
        created_at: Creation timestamp (datetime or string, optional)
        owner_id: User ID of the post owner (optional)
    
    Returns:
        tuple: (fuzzy_lat, fuzzy_lng) - fuzzy coordinates for display
    """
    if latitude is None or longitude is None:
        return None, None
    
    # Calculate circular scatter offset
    offset_lat, offset_lng = calculate_circular_scatter_offset(post_id, created_at, owner_id)
    
    # Apply offset to real coordinates
    fuzzy_lat = latitude + offset_lat
    fuzzy_lng = longitude + offset_lng
    
    # Ensure coordinates remain valid
    # Latitude must be between -90 and 90
    fuzzy_lat = max(-90.0, min(90.0, fuzzy_lat))
    # Longitude can wrap around, but we'll keep it in reasonable range
    fuzzy_lng = fuzzy_lng % 360
    if fuzzy_lng > 180:
        fuzzy_lng -= 360
    
    return fuzzy_lat, fuzzy_lng


def calculate_distance_degrees(lat1, lon1, lat2, lon2):
    """
    Calculate approximate distance in degrees between two coordinates.
    Used for validation that fuzzy offset doesn't exceed safe distance.
    """
    lat_diff = lat2 - lat1
    lon_diff = lon2 - lon1
    return math.sqrt(lat_diff**2 + lon_diff**2)


def calculate_distance_km(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates in kilometers using Haversine formula.
    
    Args:
        lat1: Latitude of first point
        lon1: Longitude of first point
        lat2: Latitude of second point
        lon2: Longitude of second point
    
    Returns:
        float: Distance in kilometers
    """
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Calculate differences
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    # Haversine formula
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance

