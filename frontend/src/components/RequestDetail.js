import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
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
        // Always use username (string) for consistency with backend
        // Backend returns username as string, so we must compare strings
        const username = decoded.username;
        if (username) {
          setCurrentUser(username);
        } else {
          console.warn("JWT token does not contain 'username' field. Using user_id as fallback.");
          // If username is not available, we can't reliably detect ownership
          // Set to null to prevent false ownership detection
          setCurrentUser(null);
        }
      } catch (e) {
        console.error("Error decoding token:", e);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }

    // Fetch request details
    fetch(`${API_BASE_URL}/api/requests/${id}/`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setRequest(data);
        setLoading(false);
        
        // Load questions for this request
        fetch(`${API_BASE_URL}/api/questions/?request=${id}`)
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
        setError("Failed to load request details.");
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
        body: JSON.stringify({ request: parseInt(id), hours: 1 }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Handshake request sent successfully!");
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
          request: parseInt(id),
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
        fetch(`${API_BASE_URL}/api/questions/?request=${id}`)
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
    if (!answerText.trim()) return;

    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in.");
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
          answer: answerText,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        setMessage(errorData.error || `Failed to post answer (${response.status})`);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setMessage("Answer posted!");
        // Reload questions
        fetch(`${API_BASE_URL}/api/questions/?request=${id}`)
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

  const handleSendMessage = async () => {
    const currentHandshake = request?.active_handshake;
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
    const currentHandshake = request?.active_handshake;
    if (showChat && currentHandshake && currentHandshake.status !== "proposed") {
      loadMessages(currentHandshake.id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(currentHandshake.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [showChat, request, API_BASE_URL]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/requests/${id}/delete/`,
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
        setMessage("Request deleted successfully.");
        // Redirect to user's requests page after 1 second
        setTimeout(() => {
          navigate("/requests/my");
        }, 1000);
      } else {
        setMessage(data.error || "Failed to delete request.");
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
        // Update request state with new handshake data if available
        if (data.handshake) {
          setRequest((prevRequest) => ({
            ...prevRequest,
            active_handshake: data.handshake,
          }));
        } else {
          // Reload the request to get updated data
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
        <p className="text-xl">Loading request details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || "Request not found"}</p>
          <button
            onClick={() => navigate("/offers")}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  // Check if current user is the owner - handle null/undefined cases
  // Check if current user is the owner - handle null/undefined cases
  // Compare usernames (case-insensitive for safety, but both must be strings)
  const isOwner = Boolean(
    currentUser && 
    typeof currentUser === 'string' &&
    request.username && 
    typeof request.username === 'string' &&
    currentUser.toLowerCase().trim() === request.username.toLowerCase().trim()
  );
  const activeHandshake = request.active_handshake;
  // Handshake button: only show if NOT owner, user is logged in, no active handshake, and request is open
  const canSendHandshake = Boolean(
    currentUser && 
    !isOwner && 
    !activeHandshake && 
    request.status === "open"
  );
  
  // Determine if user can confirm completion (provider or seeker who hasn't confirmed yet)
  const canConfirmCompletion = activeHandshake && 
    (activeHandshake.status === "accepted" || activeHandshake.status === "in_progress") &&
    activeHandshake.status !== "completed" && currentUser && (() => {
      const isProvider = activeHandshake.provider_username && 
        activeHandshake.provider_username.toLowerCase() === currentUser.toLowerCase();
      const isSeeker = activeHandshake.seeker_username && 
        activeHandshake.seeker_username.toLowerCase() === currentUser.toLowerCase();
      return (isProvider && !activeHandshake.provider_confirmed) ||
             (isSeeker && !activeHandshake.seeker_confirmed);
    })();
  
  const isProvider = activeHandshake && activeHandshake.provider_username && currentUser &&
    activeHandshake.provider_username.toLowerCase() === currentUser.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate("/offers")}
          className="mb-4 text-amber-700 hover:text-amber-900 font-semibold"
        >
          ← Back to Requests
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold text-amber-700">{request.title}</h1>
            <div className="flex gap-2 items-center">
              {/* Confirm Completion Button - Top Right */}
              {canConfirmCompletion && (
                <button
                  onClick={() => handleConfirmCompletion(activeHandshake.id, isProvider)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition-colors"
                >
                  Confirm Completion
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => navigate(`/requests/${id}/edit`)}
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
              {request.user ? (
                <span
                  className="text-amber-700 hover:text-amber-900 cursor-pointer underline font-semibold"
                  onClick={() => navigate(`/profile/${request.user}`)}
                >
                  {request.username || "Unknown"}
                </span>
              ) : (
                request.username || "Unknown"
              )}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded ${
                  request.status === "open"
                    ? "bg-green-100 text-green-800"
                    : request.status === "in_progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {request.status === "open" ? "Open" : request.status === "in_progress" ? "In Progress" : request.status}
              </span>
            </p>
            {request.created_at && (
              <p className="text-gray-500 text-sm">
                Created: {new Date(request.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-amber-700 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-amber-700 mb-1">Duration</h3>
              <p className="text-gray-700">{request.duration || "Not specified"}</p>
            </div>
            {request.available_slots && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Available Dates & Times</h3>
                <div className="text-gray-700">
                  {(() => {
                    try {
                      const slots = JSON.parse(request.available_slots);
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
                      return <p>{request.available_slots}</p>;
                    }
                  })()}
                </div>
              </div>
            )}
            {!request.available_slots && request.date && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Date</h3>
                <p className="text-gray-700">
                  {new Date(request.date).toLocaleDateString()}
                </p>
              </div>
            )}
            {request.tags && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Tags</h3>
                <p className="text-gray-700">{request.tags}</p>
              </div>
            )}
            {(request.latitude && request.longitude) && (
              <div>
                <h3 className="font-semibold text-amber-700 mb-1">Location</h3>
                <p className="text-gray-700">
                  {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
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
                  Provider:{" "}
                  {activeHandshake.provider ? (
                    <span
                      className="text-amber-700 hover:text-amber-900 cursor-pointer underline font-semibold"
                      onClick={() => navigate(`/profile/${activeHandshake.provider}`)}
                    >
                      {activeHandshake.provider_username || "Anonymous"}
                    </span>
                  ) : (
                    activeHandshake.provider_username || "Anonymous"
                  )}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Seeker:{" "}
                  {activeHandshake.seeker ? (
                    <span
                      className="text-amber-700 hover:text-amber-900 cursor-pointer underline font-semibold"
                      onClick={() => navigate(`/profile/${activeHandshake.seeker}`)}
                    >
                      {activeHandshake.seeker_username || "Anonymous"}
                    </span>
                  ) : (
                    activeHandshake.seeker_username || "Anonymous"
                  )}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Hours: {activeHandshake.hours}
                </p>
                
                {/* Confirmation Status */}
                {(activeHandshake.status === "accepted" || activeHandshake.status === "in_progress") && (
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        <strong>Provider:</strong>{" "}
                        {activeHandshake.provider_confirmed ? (
                          <span className="text-green-600">✓ Confirmed</span>
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        <strong>Seeker:</strong>{" "}
                        {activeHandshake.seeker_confirmed ? (
                          <span className="text-green-600">✓ Confirmed</span>
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

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

                {/* Waiting message if user confirmed but partner hasn't */}
                {(activeHandshake.status === "accepted" || activeHandshake.status === "in_progress") && 
                 activeHandshake.status !== "completed" && (() => {
                  const isProvider = activeHandshake.provider_username && currentUser &&
                    activeHandshake.provider_username.toLowerCase() === currentUser.toLowerCase();
                  const isSeeker = activeHandshake.seeker_username && currentUser &&
                    activeHandshake.seeker_username.toLowerCase() === currentUser.toLowerCase();
                  
                  if ((isProvider && activeHandshake.provider_confirmed && !activeHandshake.seeker_confirmed) ||
                      (isSeeker && activeHandshake.seeker_confirmed && !activeHandshake.provider_confirmed)) {
                    return (
                      <p className="text-sm text-amber-600 mt-2 font-medium">
                        ⏳ Waiting for partner to confirm...
                      </p>
                    );
                  }
                  return null;
                })()}

                {/* Completed Status */}
                {activeHandshake.status === "completed" && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      ✓ Service Completed! Beellars have been transferred.
                    </p>
                  </div>
                )}

                {/* Show chat button only for owner or accepted partner */}
                {activeHandshake.status !== "proposed" && activeHandshake.status !== "completed" && (
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
                          {request.username} answered:
                        </p>
                        <p className="text-gray-800">{q.answer}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(q.answered_at).toLocaleString()}
                        </p>
                      </div>
                    ) : isOwner && (!activeHandshake || activeHandshake.status === "proposed") ? (
                      <div className="mt-3">
                        <textarea
                          placeholder="Answer this question..."
                          className="w-full p-2 border rounded text-sm"
                          rows={2}
                          value={answerInputs[q.id] || ""}
                          onChange={(e) => {
                            setAnswerInputs({ ...answerInputs, [q.id]: e.target.value });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              handleAnswerQuestion(q.id, answerInputs[q.id] || "");
                              setAnswerInputs({ ...answerInputs, [q.id]: "" });
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const answerText = answerInputs[q.id] || "";
                            if (answerText.trim()) {
                              handleAnswerQuestion(q.id, answerText);
                              setAnswerInputs({ ...answerInputs, [q.id]: "" });
                            }
                          }}
                          className="mt-2 px-3 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600"
                        >
                          Post Answer
                        </button>
                      </div>
                    ) : null}
                    <p className="text-xs text-gray-500 mt-2">
                      Asked: {new Date(q.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Allow questions if: not owner, logged in, and handshake is not accepted/in_progress (can ask even if proposed) */}
            {/* Owners should NEVER see the question form - they can only answer */}
            {!isOwner && currentUser && (!activeHandshake || activeHandshake.status === "proposed") && (
              <div className="mt-4">
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ask a question about this request..."
                  className="w-full p-3 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={3}
                />
                <button
                  onClick={handleAskQuestion}
                  className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
                >
                  Post Question
                </button>
              </div>
            )}
            {/* Show login prompt only for non-owners */}
            {!isOwner && !currentUser && (!activeHandshake || activeHandshake.status === "proposed") && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Please <a href="/login" className="text-amber-600 hover:underline font-semibold">log in</a> to ask a question.
                </p>
              </div>
            )}
            {/* Show message for owners */}
            {isOwner && questions.length === 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  No questions yet. When users ask questions, you can answer them here.
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
    </div>
  );
}

export default RequestDetail;

