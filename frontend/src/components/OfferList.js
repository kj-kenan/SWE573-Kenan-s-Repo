import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function OffersList() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("offers");
  const [activeSubTab, setActiveSubTab] = useState("all"); // "all" or "my"
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
        setCurrentUser(decoded.username || decoded.user_id);
      } catch (e) {
        console.error("Error decoding token:", e);
      }
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

  if (loading) return <p className="text-center mt-10">Loading services...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  // Filter based on active tab and sub-tab
  let currentList = activeTab === "offers" ? offers : requests;
  
  // If "My Offers" sub-tab is active, filter to show only current user's posts
  if (activeSubTab === "my" && currentUser) {
    currentList = currentList.filter((item) => item.username === currentUser);
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
              setActiveTab("offers");
              setActiveSubTab("all"); // Reset to "all" when switching main tab
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
              setActiveTab("requests");
              setActiveSubTab("all"); // Reset to "all" when switching main tab
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
              onClick={() => setActiveSubTab("all")}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                activeSubTab === "all"
                  ? "bg-amber-400 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All {activeTab === "offers" ? "Offers" : "Requests"}
            </button>
            <button
              onClick={() => setActiveSubTab("my")}
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
            
            return (
              <div
                key={item.id}
                className="border p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(detailPath)}
              >
                <h3 className="font-bold text-lg mb-1 text-amber-700">
                  {item.title}
                </h3>
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
                {activeSubTab === "my" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement edit functionality
                        alert("Edit functionality coming soon!");
                      }}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement delete functionality
                        if (window.confirm("Are you sure you want to delete this post?")) {
                          alert("Delete functionality coming soon!");
                        }
                      }}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OffersList;
