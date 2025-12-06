import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function OffersList({ defaultTab = "offers", defaultSubTab = "all" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab); // "all" or "my"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ Environment variable + fallback
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    // Get current user from token
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        // Always use username (string) for consistency with backend
        const username = decoded.username;
        if (username) {
          setCurrentUser(username);
        } else {
          // If username not in token, fetch from backend profile
          console.warn("JWT token does not contain 'username' field. Fetching from backend...");
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
              } else {
                console.error("Profile does not contain username");
                setCurrentUser(null);
              }
            })
            .catch((err) => {
              console.error("Error fetching username:", err);
              setCurrentUser(null);
            });
        }
      } catch (e) {
        console.error("Error decoding token:", e);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }

    const fetchData = async () => {
      try {
        const [offersRes, requestsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/offers/`),
          fetch(`${API_BASE_URL}/api/requests/`),
        ]);

        if (!offersRes.ok || !requestsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const offersData = await offersRes.json();
        const requestsData = await requestsRes.json();

        setOffers(offersData);
        setRequests(requestsData);
      } catch (err) {
        setError("Unable to fetch offers/requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  // Update active tab/subtab based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path === "/offers" || path === "/offers/all") {
      setActiveTab("offers");
      setActiveSubTab("all");
    } else if (path === "/offers/my") {
      setActiveTab("offers");
      setActiveSubTab("my");
    } else if (path === "/requests/all") {
      setActiveTab("requests");
      setActiveSubTab("all");
    } else if (path === "/requests/my") {
      setActiveTab("requests");
      setActiveSubTab("my");
    }
  }, [location.pathname]);

  if (loading) return <p className="text-center mt-10">Loading services...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  // Filter based on active tab and sub-tab
  let currentList = activeTab === "offers" ? offers : requests;
  
  // If "My Offers" or "My Requests" sub-tab is active, filter to show only current user's posts
  // Compare usernames as strings (case-insensitive) for reliability
  if (activeSubTab === "my") {
    if (currentUser && typeof currentUser === 'string') {
      currentList = currentList.filter((item) => {
        if (!item.username || typeof item.username !== 'string') {
          return false;
        }
        return item.username.toLowerCase().trim() === currentUser.toLowerCase().trim();
      });
    } else {
      // If currentUser is not loaded yet, show empty list (will show "You haven't created any..." message)
      currentList = [];
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-amber-700">
        Community Services
      </h2>

      <div className="flex flex-col items-center mb-6 gap-4">
        {/* Main tabs: Offers / Requests */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              navigate("/offers/all");
            }}
            className={`px-4 py-2 rounded font-semibold transition ${
              activeTab === "offers"
                ? "bg-amber-500 text-white shadow"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Offers
          </button>
          <button
            onClick={() => {
              navigate("/requests/all");
            }}
            className={`px-4 py-2 rounded font-semibold transition ${
              activeTab === "requests"
                ? "bg-amber-500 text-white shadow"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Requests
          </button>
        </div>

        {/* Sub-tabs: All / My Offers (only show if logged in) */}
        {currentUser && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => navigate(activeTab === "offers" ? "/offers/all" : "/requests/all")}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                activeSubTab === "all"
                  ? "bg-amber-400 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All {activeTab === "offers" ? "Offers" : "Requests"}
            </button>
            <button
              onClick={() => navigate(activeTab === "offers" ? "/offers/my" : "/requests/my")}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                activeSubTab === "my"
                  ? "bg-amber-400 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              My {activeTab === "offers" ? "Offers" : "Requests"}
            </button>
          </div>
        )}
      </div>

      {currentList.length === 0 ? (
        <p className="text-center text-gray-500">
          {activeSubTab === "my" 
            ? `You haven't created any ${activeTab} yet.`
            : `No ${activeTab} available yet.`}
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {currentList.map((item) => {
            const detailPath = activeTab === "offers" 
              ? `/offers/${item.id}` 
              : `/requests/${item.id}`;
            
            // Check if current user owns this post
            const isOwnPost = Boolean(
              currentUser && 
              typeof currentUser === 'string' &&
              item.username && 
              typeof item.username === 'string' &&
              currentUser.toLowerCase().trim() === item.username.toLowerCase().trim()
            );
            
            return (
              <div
                key={item.id}
                className={`border p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer ${
                  isOwnPost && activeSubTab === "all" ? "bg-amber-50 border-amber-300" : ""
                }`}
                onClick={() => navigate(detailPath)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-lg text-amber-700 flex-1">
                    {item.title}
                  </h3>
                  {isOwnPost && activeSubTab === "all" && (
                    <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded">
                      Your post
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-2 line-clamp-2">{item.description}</p>
                <p className="text-sm text-gray-500 mb-2">
                  🏷️ {item.tags || "No tags"} | ⏰ {item.duration || "N/A"}
                </p>
                {item.active_handshake && (
                  <p className="text-xs text-amber-600 font-semibold">
                    🤝 Active handshake ({item.active_handshake.status})
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">Click to view details →</p>
                {/* Show owner controls in "All" view for own posts, or in "My" view for all posts */}
                {(isOwnPost && activeSubTab === "all") || activeSubTab === "my" ? (
                  <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const editPath = activeTab === "offers" 
                          ? `/offers/${item.id}/edit`
                          : `/requests/${item.id}/edit`;
                        navigate(editPath);
                      }}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                          return;
                        }
                        
                        const token = localStorage.getItem("access");
                        if (!token) {
                          alert("Please log in to delete a post.");
                          return;
                        }

                        try {
                          const deleteEndpoint = activeTab === "offers"
                            ? `${API_BASE_URL}/api/offers/${item.id}/delete/`
                            : `${API_BASE_URL}/api/requests/${item.id}/delete/`;
                          
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
                            window.location.reload();
                          } else {
                            alert(data.error || "Failed to delete post.");
                          }
                        } catch (err) {
                          alert("Network error. Please try again.");
                          console.error("Error:", err);
                        }
                      }}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OffersList;
