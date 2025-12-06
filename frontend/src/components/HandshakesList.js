import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RatingModal from "./RatingModal";

function HandshakesList() {
  const navigate = useNavigate();
  const [handshakes, setHandshakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedHandshake, setSelectedHandshake] = useState(null);
  const [partnerName, setPartnerName] = useState("");
  const [ratingStatuses, setRatingStatuses] = useState({}); // { handshake_id: { has_rated, partner_has_rated } }

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("You must be logged in to view handshakes.");
      setLoading(false);
      return;
    }

    // Decode token to get current user
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser(decoded.username || decoded.user_id);
    } catch (e) {
      console.error("Error decoding token:", e);
    }

    // Fetch handshakes
    fetch(`${API_BASE_URL}/api/handshakes/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const handshakesArray = Array.isArray(data) ? data : [];
        setHandshakes(handshakesArray);
        
        // Fetch rating statuses for all completed handshakes
        const completedHandshakes = handshakesArray.filter(h => h.status === "completed");
        completedHandshakes.forEach(handshake => {
          fetch(`${API_BASE_URL}/api/ratings/handshake/${handshake.id}/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
            .then(res => res.json())
            .then(statusData => {
              if (statusData.has_rated !== undefined) {
                setRatingStatuses(prev => ({
                  ...prev,
                  [handshake.id]: {
                    has_rated: statusData.has_rated,
                    partner_has_rated: statusData.partner_has_rated,
                  }
                }));
              }
            })
            .catch(err => console.error("Error fetching rating status:", err));
        });
        
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        console.error("Error loading handshakes:", err);
      });
  }, [API_BASE_URL]);

  const handleAccept = async (handshakeId) => {
    const token = localStorage.getItem("access");
    if (!token) {
      alert("Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/handshakes/${handshakeId}/accept/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Handshake accepted!");
        window.location.reload();
      } else {
        alert(data.error || "Failed to accept handshake.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleDecline = async (handshakeId) => {
    const token = localStorage.getItem("access");
    if (!token) {
      alert("Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/handshakes/${handshakeId}/decline/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Handshake declined.");
        window.location.reload();
      } else {
        alert(data.error || "Failed to decline handshake.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleOpenRatingModal = (handshake) => {
    const isProvider = currentUser === handshake.provider_username;
    const partnerName = isProvider ? handshake.seeker_username : handshake.provider_username;
    setSelectedHandshake(handshake);
    setPartnerName(partnerName);
    setRatingModalOpen(true);
  };

  const handleSubmitRating = async (ratingData) => {
    const token = localStorage.getItem("access");
    if (!token || !selectedHandshake) {
      throw new Error("Missing token or handshake");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/ratings/${selectedHandshake.id}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ratingData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit rating.");
    }

    // Update rating status
    setRatingStatuses(prev => ({
      ...prev,
      [selectedHandshake.id]: {
        has_rated: true,
        partner_has_rated: prev[selectedHandshake.id]?.partner_has_rated || false,
      }
    }));

    setRatingModalOpen(false);
    setSelectedHandshake(null);
    setPartnerName("");
  };

  const handleConfirmCompletion = async (handshakeId, isProvider) => {
    const token = localStorage.getItem("access");
    if (!token) {
      alert("Please log in.");
      return;
    }

    const endpoint = isProvider
      ? `${API_BASE_URL}/api/handshakes/${handshakeId}/confirm-provider/`
      : `${API_BASE_URL}/api/handshakes/${handshakeId}/confirm-seeker/`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Update the handshake in state instead of reloading
        if (data.handshake) {
          setHandshakes((prevHandshakes) =>
            prevHandshakes.map((h) => {
              if (h.id === handshakeId) {
                // Merge the updated handshake data
                return { ...h, ...data.handshake };
              }
              return h;
            })
          );
        } else {
          // If no handshake in response, refresh the list
          const token = localStorage.getItem("access");
          fetch(`${API_BASE_URL}/api/handshakes/`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => res.json())
            .then((handshakeData) => {
              setHandshakes(Array.isArray(handshakeData) ? handshakeData : []);
            })
            .catch((err) => console.error("Error refreshing handshakes:", err));
        }
        // Show success message (optional, can be removed if preferred)
        if (data.message) {
          // You can replace alert with a toast notification if available
          console.log(data.message);
        }
      } else {
        alert(data.error || "Failed to confirm completion.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <p className="text-xl">Loading handshakes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-amber-700 mb-6 text-center">
          My Handshakes
        </h1>

        {handshakes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg">
              You don't have any handshakes yet.
            </p>
            <button
              onClick={() => navigate("/offers")}
              className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              Browse Offers
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {handshakes.map((handshake) => {
              const isProvider = currentUser === handshake.provider_username;
              const isSeeker = currentUser === handshake.seeker_username;
              const canAccept = isProvider && handshake.status === "proposed";
              const canDecline = isProvider && handshake.status === "proposed";

              return (
                <div
                  key={handshake.id}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-amber-700 mb-2">
                        {handshake.offer_title
                          ? `Offer: ${handshake.offer_title}`
                          : handshake.request_title
                          ? `Request: ${handshake.request_title}`
                          : handshake.offer
                          ? `Offer: ${handshake.offer}`
                          : `Request: ${handshake.request}`}
                      </h3>
                      <p className="text-gray-600">
                        <span className="font-semibold">Provider:</span>{" "}
                        {handshake.provider ? (
                          <span
                            className="text-amber-700 hover:text-amber-900 cursor-pointer underline font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${handshake.provider}`);
                            }}
                          >
                            {handshake.provider_username}
                          </span>
                        ) : (
                          handshake.provider_username
                        )}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Seeker:</span>{" "}
                        {handshake.seeker ? (
                          <span
                            className="text-amber-700 hover:text-amber-900 cursor-pointer underline font-semibold"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${handshake.seeker}`);
                            }}
                          >
                            {handshake.seeker_username}
                          </span>
                        ) : (
                          handshake.seeker_username
                        )}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Hours:</span>{" "}
                        {handshake.hours}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold ${
                        handshake.status === "proposed"
                          ? "bg-yellow-100 text-yellow-800"
                          : handshake.status === "accepted" ||
                            handshake.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : handshake.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {handshake.status}
                    </span>
                  </div>

                  {handshake.created_at && (
                    <p className="text-sm text-gray-500 mb-4">
                      Created: {new Date(handshake.created_at).toLocaleString()}
                    </p>
                  )}

                  {(canAccept || canDecline) && (
                    <div className="flex gap-2 mt-4">
                      {canAccept && (
                        <button
                          onClick={() => handleAccept(handshake.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Accept
                        </button>
                      )}
                      {canDecline && (
                        <button
                          onClick={() => handleDecline(handshake.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Decline
                        </button>
                      )}
                    </div>
                  )}

                  {/* Completion Confirmation Section */}
                  {(handshake.status === "accepted" || handshake.status === "in_progress") && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Service Completion</h4>
                      
                      {/* Confirmation Status */}
                      <div className="mb-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            <strong>Provider:</strong>{" "}
                            {handshake.provider_confirmed ? (
                              <span className="text-green-600">✓ Confirmed</span>
                            ) : (
                              <span className="text-gray-500">Pending</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">
                            <strong>Seeker:</strong>{" "}
                            {handshake.seeker_confirmed ? (
                              <span className="text-green-600">✓ Confirmed</span>
                            ) : (
                              <span className="text-gray-500">Pending</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Unified Confirm Completion Button */}
                      {handshake.status !== "completed" && (
                        <>
                          {/* Show button only if user is part of handshake and hasn't confirmed yet */}
                          {((isProvider && !handshake.provider_confirmed) ||
                            (isSeeker && !handshake.seeker_confirmed)) && (
                            <button
                              onClick={() =>
                                handleConfirmCompletion(handshake.id, isProvider)
                              }
                              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition-colors"
                            >
                              Confirm Completion
                            </button>
                          )}
                          
                          {/* Show "Waiting for partner to confirm..." if user has confirmed but partner hasn't */}
                          {((isProvider && handshake.provider_confirmed && !handshake.seeker_confirmed) ||
                            (isSeeker && handshake.seeker_confirmed && !handshake.provider_confirmed)) && (
                            <p className="text-sm text-amber-600 mt-2 font-medium">
                              ⏳ Waiting for partner to confirm...
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Completed Status with Rating */}
                  {handshake.status === "completed" && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 font-medium mb-3">
                        ✓ Service Completed! Beellars have been transferred.
                      </p>
                      {ratingStatuses[handshake.id]?.has_rated ? (
                        <p className="text-sm text-amber-600 font-medium">
                          ✓ Rating submitted
                        </p>
                      ) : (
                        <button
                          onClick={() => handleOpenRatingModal(handshake)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-sm font-medium transition-colors"
                        >
                          Rate your partner
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {selectedHandshake && (
        <RatingModal
          handshake={selectedHandshake}
          partnerName={partnerName}
          isOpen={ratingModalOpen}
          onClose={() => {
            setRatingModalOpen(false);
            setSelectedHandshake(null);
            setPartnerName("");
          }}
          onSubmit={handleSubmitRating}
        />
      )}
    </div>
  );
}

export default HandshakesList;










