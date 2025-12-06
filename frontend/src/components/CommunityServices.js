import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ServiceFilters from "./ServiceFilters";

function CommunityServices() {
  const navigate = useNavigate();
  const [allPosts, setAllPosts] = useState([]); // Combined offers + requests
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState({
    tag: null,
    postType: "all",
    onlyMyPosts: false,
    distance: null,
    minDate: null,
    maxDate: null,
    userLocation: null,
  });

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  // Get current user from token
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const username = decoded.username;
        if (username) {
          setCurrentUser(username);
        } else {
          fetch(`${API_BASE_URL}/api/profiles/me/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => {
              if (res.ok) {
                return res.json();
              }
              throw new Error("Failed to fetch profile");
            })
            .then((profile) => {
              if (profile && profile.username) {
                setCurrentUser(profile.username);
              }
            })
            .catch((err) => {
              console.error("Error fetching username:", err);
            });
        }
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }
  }, [API_BASE_URL]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch all posts (offers + requests)
  const fetchAllPosts = async (filters = null) => {
    setFiltering(!!filters);
    
    try {
      const token = localStorage.getItem("access");
      const headers = token
        ? {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        : { "Content-Type": "application/json" };

      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters?.tag) {
        params.append("tag", filters.tag);
      }
      if (filters?.minDate) {
        params.append("min_date", filters.minDate);
      }
      if (filters?.maxDate) {
        params.append("max_date", filters.maxDate);
      }
      if (filters?.distance && filters?.userLocation) {
        params.append("distance", filters.distance);
        params.append("lat", filters.userLocation.lat);
        params.append("lng", filters.userLocation.lng);
      }

      const queryString = params.toString();

      // Fetch offers and requests
      const [offersRes, requestsRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/api/offers/${queryString ? `?${queryString}` : ""}`,
          { headers }
        ),
        fetch(
          `${API_BASE_URL}/api/requests/${queryString ? `?${queryString}` : ""}`,
          { headers }
        ),
      ]);

      if (!offersRes.ok || !requestsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const offersData = await offersRes.json();
      const requestsData = await requestsRes.json();

      // Add post type identifier to each item
      const offers = Array.isArray(offersData)
        ? offersData.map((offer) => ({ ...offer, postType: "offer" }))
        : [];
      const requests = Array.isArray(requestsData)
        ? requestsData.map((request) => ({ ...request, postType: "request" }))
        : [];

      // Combine and sort by created_at (newest first)
      const combined = [...offers, ...requests].sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );

      setAllPosts(combined);
      
      // Apply client-side filters
      applyClientSideFilters(combined, filters || appliedFilters);
    } catch (err) {
      setError("Unable to fetch posts. Please try again later.");
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
      setFiltering(false);
    }
  };

  // Apply client-side filters (post type, only my posts)
  const applyClientSideFilters = (posts, filters) => {
    let filtered = [...posts];

    // Filter by post type
    if (filters.postType === "offers") {
      filtered = filtered.filter((post) => post.postType === "offer");
    } else if (filters.postType === "requests") {
      filtered = filtered.filter((post) => post.postType === "request");
    }

    // Filter by ownership
    if (filters.onlyMyPosts && currentUser) {
      filtered = filtered.filter((post) => {
        if (!post.username || typeof post.username !== "string") {
          return false;
        }
        return (
          post.username.toLowerCase().trim() === currentUser.toLowerCase().trim()
        );
      });
    }

    setFilteredPosts(filtered);
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchAllPosts();
  }, []);

  // Apply filters when filters change
  const handleFilterChange = (newFilters) => {
    setAppliedFilters(newFilters);
    fetchAllPosts(newFilters);
  };

  const handleDistanceChange = (distance) => {
    // This is just for visual preview, actual filtering happens on Apply
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 to-yellow-50 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center mt-10 text-xl">Loading community services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 to-yellow-50 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center mt-10 text-red-600 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-yellow-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-6 text-center text-amber-700">
          Community Services
        </h1>

        {/* Filter Bar */}
        <ServiceFilters
          onFilterChange={handleFilterChange}
          onDistanceChange={handleDistanceChange}
          userLocation={userLocation}
        />

        {/* Loading indicator when filtering */}
        {filtering && (
          <div className="text-center mb-4">
            <p className="text-amber-700">Applying filters...</p>
          </div>
        )}

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="rounded-xl shadow-md p-8 text-center" style={{ backgroundColor: '#FFF8E6' }}>
            <p className="text-lg" style={{ color: '#333' }}>
              {appliedFilters.onlyMyPosts
                ? "You haven't created any posts yet."
                : "No posts found matching your filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => {
              const isOwnPost = Boolean(
                currentUser &&
                typeof currentUser === "string" &&
                post.username &&
                typeof post.username === "string" &&
                currentUser.toLowerCase().trim() === post.username.toLowerCase().trim()
              );

              const detailPath =
                post.postType === "offer"
                  ? `/offers/${post.id}`
                  : `/requests/${post.id}`;

              const editPath =
                post.postType === "offer"
                  ? `/offers/${post.id}/edit`
                  : `/requests/${post.id}/edit`;

              return (
                <div
                  key={`${post.postType}-${post.id}`}
                  className={`rounded-xl shadow-md hover:shadow-lg transition border-2 ${
                    isOwnPost
                      ? "border-amber-400"
                      : "border-amber-200"
                  }`}
                  style={{ backgroundColor: isOwnPost ? '#FFF8E6' : '#FFF8E6' }}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1" style={{ color: '#333' }}>
                          {post.title}
                        </h3>
                        {post.user && (
                          <button
                            onClick={() => navigate(`/profile/${post.user}`)}
                            className="text-sm text-amber-600 hover:text-amber-800 hover:underline"
                          >
                            by {post.username || "Unknown"}
                          </button>
                        )}
                        {!post.user && (
                          <span className="text-sm" style={{ color: '#333' }}>
                            by {post.username || "Unknown"}
                          </span>
                        )}
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-semibold rounded ${
                          post.postType === "offer"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {post.postType === "offer" ? "Offer" : "Request"}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="mb-3 line-clamp-3 text-sm" style={{ color: '#333' }}>
                      {post.description}
                    </p>

                    {/* Tags */}
                    {post.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags
                          .split(",")
                          .slice(0, 3)
                          .map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Status */}
                    {post.status && (
                      <div className="mb-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            post.status === "open"
                              ? "bg-green-100 text-green-800"
                              : post.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {post.status === "open"
                            ? "Open"
                            : post.status === "in_progress"
                            ? "In Progress"
                            : post.status}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-200">
                      <button
                        onClick={() => navigate(detailPath)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold text-sm transition"
                      >
                        View Details
                      </button>
                      {isOwnPost && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(editPath);
                            }}
                            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (
                                !window.confirm(
                                  "Are you sure you want to delete this post? This action cannot be undone."
                                )
                              ) {
                                return;
                              }

                              const token = localStorage.getItem("access");
                              if (!token) {
                                alert("Please log in to delete a post.");
                                return;
                              }

                              try {
                                const deleteEndpoint =
                                  post.postType === "offer"
                                    ? `${API_BASE_URL}/api/offers/${post.id}/delete/`
                                    : `${API_BASE_URL}/api/requests/${post.id}/delete/`;

                                const response = await fetch(deleteEndpoint, {
                                  method: "DELETE",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                });

                                const data = await response.json();

                                if (response.ok) {
                                  alert("Post deleted successfully!");
                                  // Refresh the list
                                  fetchAllPosts(appliedFilters);
                                } else {
                                  alert(data.error || "Failed to delete post.");
                                }
                              } catch (err) {
                                alert("Network error. Please try again.");
                                console.error("Error:", err);
                              }
                            }}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityServices;

