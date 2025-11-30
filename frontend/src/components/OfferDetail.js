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
  const [questions, setQuestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [answerInputs, setAnswerInputs] = useState({}); // Store answer inputs by question ID

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
      setMessage("Please log in to ask a question.");
      return;
    }

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

  // Check if user is logged in (has token, even if username not yet loaded)
  const isLoggedIn = Boolean(localStorage.getItem("access"));
  
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
  // Handshake button: only show if NOT owner, user is logged in, no active handshake, and offer is open
  const canSendHandshake = Boolean(
    isLoggedIn && 
    !isOwner && 
    !activeHandshake && 
    offer.status === "open"
  );
  
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
                  Seeker: {activeHandshake.seeker_username || "Anonymous"}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Hours: {activeHandshake.hours}
                </p>
                {/* Show accept/decline buttons for owner when handshake is proposed */}
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
                {/* Show chat button only for owner or accepted partner */}
                {activeHandshake.status !== "proposed" && (
                  (isOwner || 
                   (activeHandshake.seeker_username && currentUser && 
                    activeHandshake.seeker_username.toLowerCase() === currentUser.toLowerCase()) ||
                   (activeHandshake.provider_username && currentUser &&
                    activeHandshake.provider_username.toLowerCase() === currentUser.toLowerCase())
                  ) && (
                    <button
                      onClick={() => setShowChat(!showChat)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {showChat ? "Hide Chat" : "Open Chat"}
                    </button>
                  )
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
                      {q.author_username} asked:
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
                          <p className="text-xs opacity-75 mb-1">{msg.sender_username}</p>
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
    </div>
  );
}

export default OfferDetail;

