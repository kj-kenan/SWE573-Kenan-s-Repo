import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setCurrentUser(decoded.username || decoded.user_id);
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

    // Fetch offer details
    fetch(`${API_BASE_URL}/api/offers/${id}/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setOffer(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load offer details.");
        setLoading(false);
        console.error("Error:", err);
      });
  }, [id, API_BASE_URL]);

  const handleSendHandshake = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in to send a handshake.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/handshakes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offer: parseInt(id), hours: 1 }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Handshake request sent successfully!");
        // Reload offer to get updated handshake status
        window.location.reload();
      } else {
        setMessage(data.detail || data.error || "Failed to send handshake.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleAcceptHandshake = async (handshakeId) => {
    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in.");
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
        setMessage("Handshake accepted!");
        window.location.reload();
      } else {
        setMessage(data.error || "Failed to accept handshake.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleDeclineHandshake = async (handshakeId) => {
    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in.");
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
        setMessage("Handshake declined.");
        window.location.reload();
      } else {
        setMessage(data.error || "Failed to decline handshake.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <p className="text-xl">Loading offer details...</p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || "Offer not found"}</p>
          <button
            onClick={() => navigate("/offers")}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Back to Offers
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser === offer.username;
  const activeHandshake = offer.active_handshake;
  const canSendHandshake =
    !isOwner && !activeHandshake && offer.status === "open";

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate("/offers")}
          className="mb-4 text-amber-700 hover:text-amber-900 font-semibold"
        >
          ← Back to Offers
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-amber-700 mb-4">{offer.title}</h1>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Posted by:</span> {offer.username || "Unknown"}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded ${
                  offer.status === "open"
                    ? "bg-green-100 text-green-800"
                    : offer.status === "in_progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {offer.status}
              </span>
            </p>
            {offer.created_at && (
              <p className="text-gray-500 text-sm">
                Created: {new Date(offer.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-amber-700 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{offer.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-amber-700 mb-1">Duration</h3>
              <p className="text-gray-700">{offer.duration || "Not specified"}</p>
            </div>
            {offer.date && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Date</h3>
                <p className="text-gray-700">
                  {new Date(offer.date).toLocaleDateString()}
                </p>
              </div>
            )}
            {offer.tags && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Tags</h3>
                <p className="text-gray-700">{offer.tags}</p>
              </div>
            )}
            {(offer.latitude && offer.longitude) && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Location</h3>
                <p className="text-gray-700">
                  {offer.latitude.toFixed(4)}, {offer.longitude.toFixed(4)}
                </p>
              </div>
            )}
          </div>

          {/* Handshake Section */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-2xl font-semibold text-amber-700 mb-4">
              Handshake Status
            </h2>

            {activeHandshake ? (
              <div className="bg-amber-50 p-4 rounded-lg mb-4">
                <p className="font-semibold mb-2">
                  Active Handshake ({activeHandshake.status})
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Seeker: {activeHandshake.seeker_username}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Hours: {activeHandshake.hours}
                </p>
                {isOwner && activeHandshake.status === "proposed" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAcceptHandshake(activeHandshake.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Accept Handshake
                    </button>
                    <button
                      onClick={() => handleDeclineHandshake(activeHandshake.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Decline Handshake
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 mb-4">No active handshake</p>
            )}

            {canSendHandshake && (
              <button
                onClick={handleSendHandshake}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition"
              >
                Send Handshake Request
              </button>
            )}

            {message && (
              <p
                className={`mt-4 ${
                  message.includes("success") || message.includes("accepted")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfferDetail;

