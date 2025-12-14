import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RatingModal from "./RatingModal";

function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [answerInputs, setAnswerInputs] = useState({}); // Store answer inputs by question ID
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [ratingStatus, setRatingStatus] = useState(null); // { has_rated, partner_has_rated }
  const [userBalance, setUserBalance] = useState(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        // JWT tokens from simplejwt may contain 'username' or we may need to fetch it
        // Try username first, then user_id as fallback (but we'll fetch username from backend if needed)
        const username = decoded.username;
        if (username) {
          setCurrentUser(username);
        } else {
          // Token exists but no username - fetch username from backend profile
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
              console.error("Error fetching profile:", err);
              // If we can't get username, we can't detect ownership but user is still logged in
              // Use a placeholder to indicate logged in status
              setCurrentUser("__LOGGED_IN__");
            });
        }
      } catch (e) {
        console.error("Error decoding token:", e);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }

    // Fetch user balance
    if (token) {
      fetch(`${API_BASE_URL}/api/profiles/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((profile) => {
          setUserBalance(profile.timebank_balance || 0);
        })
        .catch((err) => console.error("Error fetching user balance:", err));
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
        
        // Load rating status if handshake is completed
        if (data.active_handshake && data.active_handshake.status === "completed") {
          const token = localStorage.getItem("access");
          if (token) {
            fetch(`${API_BASE_URL}/api/ratings/handshake/${data.active_handshake.id}/`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })
              .then(res => res.json())
              .then(statusData => {
                if (statusData.has_rated !== undefined) {
                  setRatingStatus({
                    has_rated: statusData.has_rated,
                    partner_has_rated: statusData.partner_has_rated,
                  });
                }
              })
              .catch(err => console.error("Error fetching rating status:", err));
          }
        }
        
        // Load questions for this offer
        fetch(`${API_BASE_URL}/api/questions/?offer=${id}`)
          .then((res) => {
            if (!res.ok) {
              // If not OK, return empty array instead of trying to parse JSON
              return [];
            }
            return res.json();
          })
          .then((qData) => setQuestions(Array.isArray(qData) ? qData : []))
          .catch((err) => {
            console.error("Error loading questions:", err);
            setQuestions([]); // Set empty array on error
          });
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

    // Check user balance first
    if (userBalance !== null && userBalance <= 0) {
      setMessage("❌ You need at least 1 Beellar to send a handshake request. Provide services to earn Beellars!");
      return;
    }

    try {
      console.log("Sending handshake to:", `${API_BASE_URL}/api/handshakes/`);
      console.log("Offer ID:", id);
      
      const response = await fetch(`${API_BASE_URL}/api/handshakes/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offer: parseInt(id), hours: 1 }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        setMessage("Handshake request sent successfully!");
        // Reload offer to get updated handshake status
        window.location.reload();
      } else {
        // Handle different error formats
        let errorMsg = "Failed to send handshake.";
        if (data.detail) {
          errorMsg = data.detail;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (Array.isArray(data.non_field_errors)) {
          errorMsg = data.non_field_errors.join(", ");
        } else if (typeof data === "object") {
          // Try to get first error message
          const firstError = Object.values(data)[0];
          if (Array.isArray(firstError)) {
            errorMsg = firstError[0];
          } else if (typeof firstError === "string") {
            errorMsg = firstError;
          }
        }
        setMessage(errorMsg);
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

  const loadMessages = async (handshakeId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/?handshake=${handshakeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;

    const token = localStorage.getItem("access");
    if (!token) {
      console.error("No access token found in localStorage");
      setMessage("Please log in to ask a question.");
      return;
    }
    
    console.log("Token found, current user:", currentUser);

    try {
      console.log("Posting question to:", `${API_BASE_URL}/api/questions/`);
      const response = await fetch(`${API_BASE_URL}/api/questions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          offer: parseInt(id),
          content: newQuestion,
        }),
      });

      if (!response.ok) {
        // Try to parse error response, but handle HTML responses
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON (e.g., HTML 404 page), use status text
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        setMessage(errorData.detail || errorData.error || `Failed to post question (${response.status})`);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setNewQuestion("");
        setMessage("Question posted!");
        // Reload questions
        fetch(`${API_BASE_URL}/api/questions/?offer=${id}`)
          .then((res) => {
            if (!res.ok) return [];
            return res.json();
          })
          .then((qData) => setQuestions(Array.isArray(qData) ? qData : []))
          .catch((err) => {
            console.error("Error reloading questions:", err);
            setQuestions([]);
          });
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleAnswerQuestion = async (questionId, answerText) => {
    if (!answerText.trim()) {
      setMessage("Please enter an answer before submitting.");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in to answer questions.");
      return;
    }

    try {
      console.log("Answering question:", questionId);
      const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}/answer/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answer: answerText.trim(),
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        const errorMsg = errorData.error || errorData.detail || `Failed to post answer (${response.status})`;
        setMessage(errorMsg);
        setTimeout(() => setMessage(""), 5000);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setMessage("Answer posted successfully!");
        setTimeout(() => setMessage(""), 3000);
        
        // Clear the answer input for this question
        setAnswerInputs({ ...answerInputs, [questionId]: "" });
        
        // Reload questions to show the new answer
        fetch(`${API_BASE_URL}/api/questions/?offer=${id}`)
          .then((res) => {
            if (!res.ok) {
              console.error("Failed to reload questions:", res.status);
              return [];
            }
            return res.json();
          })
          .then((qData) => {
            setQuestions(Array.isArray(qData) ? qData : []);
          })
          .catch((err) => {
            console.error("Error reloading questions:", err);
            // Still try to reload the page as fallback
            window.location.reload();
          });
      }
    } catch (err) {
      setMessage("Network error. Please check your connection and try again.");
      console.error("Error:", err);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleSendMessage = async () => {
    const currentHandshake = offer?.active_handshake;
    if (!newMessage.trim() || !currentHandshake) return;

    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          handshake: currentHandshake.id,
          content: newMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewMessage("");
        loadMessages(currentHandshake.id);
      } else {
        setMessage(data.error || "Failed to send message.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  // Load messages when handshake is accepted and chat is shown
  useEffect(() => {
    const currentHandshake = offer?.active_handshake;
    if (showChat && currentHandshake && currentHandshake.status !== "proposed") {
      loadMessages(currentHandshake.id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(currentHandshake.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showChat, offer, API_BASE_URL]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this offer? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/offers/${id}/delete/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Offer deleted successfully.");
        // Redirect to user's offers page after 1 second
        setTimeout(() => {
          navigate("/offers/my");
        }, 1000);
      } else {
        setMessage(data.error || "Failed to delete offer.");
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

  const handleConfirmCompletion = async (handshakeId, isProvider) => {
    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in.");
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
        // Update offer state with new handshake data if available
        if (data.handshake) {
          setOffer((prevOffer) => {
            // For multi-participant offers, update the specific handshake in all_handshakes
            if (prevOffer.active_handshake?.all_handshakes) {
              const updatedAllHandshakes = prevOffer.active_handshake.all_handshakes.map(h =>
                h.id === data.handshake.id ? data.handshake : h
              );
              return {
                ...prevOffer,
                active_handshake: {
                  ...prevOffer.active_handshake,
                  all_handshakes: updatedAllHandshakes,
                  // Update the main handshake if it's the one being confirmed
                  ...(prevOffer.active_handshake.id === data.handshake.id ? data.handshake : {}),
                },
              };
            }
            // For single participant, just replace
            return {
              ...prevOffer,
              active_handshake: data.handshake,
            };
          });
        } else {
          // Reload the offer to get updated data
          window.location.reload();
        }
        setMessage(data.message || "Confirmation recorded!");
      } else {
        setMessage(data.error || "Failed to confirm completion.");
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

  // Check if user is logged in (has token, even if username not yet loaded)
  const token = localStorage.getItem("access");
  const isLoggedIn = Boolean(token);
  
  // Debug: Log authentication state
  console.log('🔍 OfferDetail Auth Debug:', {
    hasToken: !!token,
    tokenLength: token?.length,
    isLoggedIn,
    currentUser,
    offerUsername: offer?.username,
    localStorageKeys: Object.keys(localStorage),
  });
  
  // Check if current user is the owner - handle null/undefined cases
  // Compare usernames (case-insensitive for safety, but both must be strings)
  const isOwner = Boolean(
    currentUser && 
    typeof currentUser === 'string' &&
    offer.username && 
    typeof offer.username === 'string' &&
    currentUser.toLowerCase().trim() === offer.username.toLowerCase().trim()
  );
  const activeHandshake = offer.active_handshake;
  const allHandshakes = activeHandshake?.all_handshakes || (activeHandshake ? [activeHandshake] : []);
  const userHandshake = allHandshakes.find(h => 
    h.seeker_username && currentUser && h.seeker_username.toLowerCase() === currentUser.toLowerCase()
  );
  
  // Handshake button: only show if NOT owner, user is logged in, offer is open, and slots available
  const canSendHandshake = Boolean(
    isLoggedIn && 
    !isOwner && 
    !userHandshake &&
    offer.status === "open" &&
    (offer.remaining_slots === undefined || offer.remaining_slots > 0)
  );
  
  // For multi-participant: Check if user has any handshake that needs confirmation
  const userHandshakeNeedingConfirmation = allHandshakes.find(h => {
    if (!currentUser) return false;
    const isProviderForH = h.provider_username && h.provider_username.toLowerCase() === currentUser.toLowerCase();
    const isSeekerForH = h.seeker_username && h.seeker_username.toLowerCase() === currentUser.toLowerCase();
    const needsConfirmation = (h.status === "accepted" || h.status === "in_progress") && h.status !== "completed";
    return needsConfirmation && (
      (isProviderForH && !h.provider_confirmed) ||
      (isSeekerForH && !h.seeker_confirmed)
    );
  });
  
  const isProvider = isOwner; // Owner is always the provider
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Ownership check:', {
      currentUser,
      currentUserType: typeof currentUser,
      offerUsername: offer.username,
      offerUsernameType: typeof offer.username,
      isOwner,
      canSendHandshake,
      activeHandshake: activeHandshake?.status
    });
  }

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
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-amber-700">{offer.title}</h1>
            <div className="flex gap-2 items-center">
              {isOwner && (
                <>
                  <button
                    onClick={() => navigate(`/offers/${id}/edit`)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Posted by:</span>{" "}
              {offer.user ? (
                <span
                  className="text-amber-700 hover:text-amber-900 cursor-pointer underline font-semibold"
                  onClick={() => navigate(`/profile/${offer.user}`)}
                >
                  {offer.username || "Unknown"}
                </span>
              ) : (
                offer.username || "Unknown"
              )}
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
                {offer.status === "open" ? "Open" : offer.status === "in_progress" ? "In Progress" : offer.status}
              </span>
            </p>
            {offer.max_participants && offer.max_participants > 1 && (
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">Participants:</span>{" "}
                {offer.accepted_participant_count || 0} / {offer.max_participants} 
                {offer.remaining_slots !== undefined && offer.remaining_slots > 0 && (
                  <span className="text-green-600 ml-2">({offer.remaining_slots} slots remaining)</span>
                )}
                {offer.remaining_slots === 0 && (
                  <span className="text-red-600 ml-2">(Full)</span>
                )}
              </p>
            )}
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
            {offer.available_slots && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Available Dates & Times</h3>
                <div className="text-gray-700">
                  {(() => {
                    try {
                      const slots = JSON.parse(offer.available_slots);
                      return (
                        <ul className="list-disc list-inside space-y-1">
                          {slots.map((slot, idx) => (
                            <li key={idx}>
                              {new Date(slot.date).toLocaleDateString()} at {slot.time}
                            </li>
                          ))}
                        </ul>
                      );
                    } catch (e) {
                      return <p>{offer.available_slots}</p>;
                    }
                  })()}
                </div>
              </div>
            )}
            {!offer.available_slots && offer.date && (
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
                  {offer.latitude.toFixed(6)}, {offer.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Handshake Section */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-2xl font-semibold text-amber-700 mb-4">
              {offer.max_participants > 1 ? "Handshakes" : "Handshake Status"}
            </h2>

            {allHandshakes.length > 0 ? (
              <div className="space-y-4 mb-4">
                {allHandshakes.map((handshake) => {
                  const isProviderForThis = handshake.provider_username && currentUser &&
                    handshake.provider_username.toLowerCase() === currentUser.toLowerCase();
                  const isSeekerForThis = handshake.seeker_username && currentUser &&
                    handshake.seeker_username.toLowerCase() === currentUser.toLowerCase();
                  
                  return (
                    <div key={handshake.id} className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <p className="font-semibold mb-2">
                        Handshake with {handshake.seeker_username} ({handshake.status})
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Participant:{" "}
                        <span
                          className="text-amber-700 hover:text-amber-900 cursor-pointer underline font-semibold"
                          onClick={() => navigate(`/profile/${handshake.seeker}`)}
                        >
                          {handshake.seeker_username || "Anonymous"}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Hours: {handshake.hours}
                      </p>
                      
                      {/* Confirmation Status */}
                      {(handshake.status === "accepted" || handshake.status === "in_progress") && (
                        <div className="mb-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              <strong>{handshake.provider_username || offer.username}:</strong>{" "}
                              {handshake.provider_confirmed ? (
                                <span className="text-green-600">✓ Confirmed</span>
                              ) : (
                                <span className="text-gray-500">Pending</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              <strong>{handshake.seeker_username}:</strong>{" "}
                              {handshake.seeker_confirmed ? (
                                <span className="text-green-600">✓ Confirmed</span>
                              ) : (
                                <span className="text-gray-500">Pending</span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Show accept/decline buttons for owner when handshake is proposed */}
                      {isOwner && handshake.status === "proposed" && (
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleAcceptHandshake(handshake.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Accept Handshake
                          </button>
                          <button
                            onClick={() => handleDeclineHandshake(handshake.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Decline Handshake
                          </button>
                        </div>
                      )}

                      {/* Show confirm completion button for owner (per handshake) */}
                      {isOwner && (handshake.status === "accepted" || handshake.status === "in_progress") && 
                       !handshake.provider_confirmed && (
                        <button
                          onClick={() => handleConfirmCompletion(handshake.id, true)}
                          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
                        >
                          Confirm Completion with {handshake.seeker_username}
                        </button>
                      )}
                      
                      {/* Participant's view: Show confirm completion button */}
                      {isSeekerForThis && (handshake.status === "accepted" || handshake.status === "in_progress") && 
                       !handshake.seeker_confirmed && (
                        <button
                          onClick={() => handleConfirmCompletion(handshake.id, false)}
                          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
                        >
                          Confirm Completion
                        </button>
                      )}

                      {/* Waiting message */}
                      {(handshake.status === "accepted" || handshake.status === "in_progress") && 
                       handshake.status !== "completed" && (
                        (isOwner && handshake.provider_confirmed && !handshake.seeker_confirmed) ||
                        (isSeekerForThis && handshake.seeker_confirmed && !handshake.provider_confirmed)
                      ) && (
                        <p className="text-sm text-amber-600 mt-2 font-medium">
                          ⏳ Waiting for partner to confirm...
                        </p>
                      )}

                      {/* Completed Status */}
                      {handshake.status === "completed" && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700 font-medium">
                            Service completed! Beellars have been transferred.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 mb-4">No active handshakes</p>
            )}

            {canSendHandshake && (
              <>
                <button
                  onClick={handleSendHandshake}
                  disabled={userBalance !== null && userBalance <= 0}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    userBalance !== null && userBalance <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                >
                  Send Handshake Request
                </button>
                {userBalance !== null && userBalance <= 0 && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    ⚠️ You need at least 1 Beellar to send handshake requests
                  </p>
                )}
              </>
            )}
            {!canSendHandshake && offer.remaining_slots === 0 && !isOwner && (
              <></>
            )}

            {message && (
              <p
                className={`mt-4 ${
                  message.includes("success") || message.includes("accepted") || message.includes("Completed")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message.includes("Service Completed") ? "" : message}
              </p>
            )}
          </div>

          {/* Public Questions Section */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-2xl font-semibold text-amber-700 mb-4">
              Questions & Answers
            </h2>

            {questions.length === 0 ? (
              <p className="text-gray-600 mb-4">
                {isOwner 
                  ? "No questions yet. When users ask questions, you can answer them here."
                  : "No questions yet. Be the first to ask!"}
              </p>
            ) : (
              <div className="space-y-4 mb-4">
                {questions.map((q) => (
                  <div key={q.id} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-sm text-gray-600 mb-1">
                      {q.author ? (
                        <span
                          className="text-amber-700 hover:text-amber-900 cursor-pointer underline"
                          onClick={() => navigate(`/profile/${q.author}`)}
                        >
                          {q.author_username}
                        </span>
                      ) : (
                        q.author_username
                      )}{" "}
                      asked:
                    </p>
                    <p className="text-gray-800 mb-2">{q.content}</p>
                    {q.answer ? (
                      <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                        <p className="font-semibold text-sm text-amber-700 mb-1">
                          {offer.username} answered:
                        </p>
                        <p className="text-gray-800">{q.answer}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {q.answered_at ? new Date(q.answered_at).toLocaleString() : ''}
                        </p>
                      </div>
                    ) : (
                      // Show answer UI for owners if question is unanswered
                      // Only allow answering before handshake is accepted (backend enforces this)
                      isOwner && (!activeHandshake || activeHandshake.status === "proposed") && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-semibold text-blue-700 mb-2">
                            💬 Answer this question:
                          </p>
                          <textarea
                            placeholder="Write your answer here..."
                            className="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            rows={3}
                            value={answerInputs[q.id] || ""}
                            onChange={(e) => {
                              setAnswerInputs({ ...answerInputs, [q.id]: e.target.value });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && e.ctrlKey) {
                                const answerText = answerInputs[q.id] || "";
                                if (answerText.trim()) {
                                  handleAnswerQuestion(q.id, answerText);
                                  setAnswerInputs({ ...answerInputs, [q.id]: "" });
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const answerText = answerInputs[q.id] || "";
                              if (answerText.trim()) {
                                handleAnswerQuestion(q.id, answerText);
                                setAnswerInputs({ ...answerInputs, [q.id]: "" });
                              } else {
                                setMessage("Please enter an answer before submitting.");
                              }
                            }}
                            className="mt-2 px-4 py-2 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 font-semibold"
                          >
                            Post Answer
                          </button>
                        </div>
                      )
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Asked: {new Date(q.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Question Form - ONLY for non-owners */}
            {/* Owners should NEVER see the question form - they can only answer */}
            {!isOwner && (
              <>
                {isLoggedIn && (!activeHandshake || activeHandshake.status === "proposed") && (
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-amber-700 mb-2">Ask a Question</h3>
                    <textarea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Ask a question about this offer..."
                      className="w-full p-3 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      rows={3}
                    />
                    <button
                      onClick={handleAskQuestion}
                      className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 font-semibold"
                    >
                      Post Question
                    </button>
                  </div>
                )}
                {/* Show login prompt only for non-owners who are not logged in */}
                {!isLoggedIn && (!activeHandshake || activeHandshake.status === "proposed") && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Please <a href="/login" className="text-amber-600 hover:underline font-semibold">log in</a> to ask a question.
                    </p>
                  </div>
                )}
              </>
            )}
            {/* Show helpful message for owners when there are no questions */}
            {isOwner && questions.length === 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  No questions yet. When users ask questions, you can answer them here.
                </p>
              </div>
            )}
            {/* Show helpful message for owners when handshake is already accepted (can't answer anymore) */}
            {isOwner && questions.length > 0 && activeHandshake && activeHandshake.status !== "proposed" && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Note: Questions can only be answered before a handshake is accepted. New questions can still be asked by other users.
                </p>
              </div>
            )}
          </div>

          {/* Private Chat Section (after handshake accepted) - Only visible to owner or accepted partner */}
          {showChat && activeHandshake && activeHandshake.status !== "proposed" && 
            (isOwner || 
             (activeHandshake.seeker_username && currentUser && 
              activeHandshake.seeker_username.toLowerCase() === currentUser.toLowerCase()) ||
             (activeHandshake.provider_username && currentUser &&
              activeHandshake.provider_username.toLowerCase() === currentUser.toLowerCase())
            ) && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-2xl font-semibold text-amber-700 mb-4">
                Private Chat
              </h2>

              <div className="bg-gray-50 p-4 rounded-lg mb-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <p className="text-gray-600">No messages yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMyMessage = msg.sender_username === currentUser;
                      return (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            isMyMessage
                              ? "bg-amber-500 text-white ml-auto max-w-[80%]"
                              : "bg-white text-gray-800 max-w-[80%]"
                          }`}
                        >
                          <p
                            className="text-xs opacity-75 mb-1 cursor-pointer hover:underline"
                            onClick={() => {
                              if (msg.sender) {
                                navigate(`/profile/${msg.sender}`);
                              }
                            }}
                          >
                            {msg.sender_username}
                          </p>
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {offer?.active_handshake && offer.active_handshake.status === "completed" && (
        <RatingModal
          handshake={offer.active_handshake}
          partnerName={partnerName}
          isOpen={ratingModalOpen}
          onClose={() => {
            setRatingModalOpen(false);
            setPartnerName("");
          }}
          onSubmit={async (ratingData) => {
            const token = localStorage.getItem("access");
            if (!token || !offer.active_handshake) {
              throw new Error("Missing token or handshake");
            }

            const response = await fetch(
              `${API_BASE_URL}/api/ratings/${offer.active_handshake.id}/`,
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
            setRatingStatus({
              has_rated: true,
              partner_has_rated: ratingStatus?.partner_has_rated || false,
            });

            setRatingModalOpen(false);
            setPartnerName("");
          }}
        />
      )}
    </div>
  );
}

export default OfferDetail;

