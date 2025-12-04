import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function HandshakesList() {
  const navigate = useNavigate();
  const [handshakes, setHandshakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

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
        setHandshakes(Array.isArray(data) ? data : []);
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
                        {handshake.offer
                          ? `Offer: ${handshake.offer}`
                          : `Request: ${handshake.request}`}
                      </h3>
                      <p className="text-gray-600">
                        <span className="font-semibold">Provider:</span>{" "}
                        {handshake.provider_username}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Seeker:</span>{" "}
                        {handshake.seeker_username}
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

                  {handshake.status === "accepted" ||
                  handshake.status === "in_progress" ? (
                    <p className="text-sm text-amber-600 mt-2">
                      Service is in progress. Both parties can confirm completion.
                    </p>
                  ) : handshake.status === "completed" ? (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Handshake completed successfully!
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default HandshakesList;






