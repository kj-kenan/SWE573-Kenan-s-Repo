import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Inbox() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending-handshakes");
  const [pendingHandshakes, setPendingHandshakes] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("You must be logged in to view your inbox.");
      setLoading(false);
      return;
    }

    loadTabData();
  }, [activeTab, API_BASE_URL]);

  const loadTabData = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      if (activeTab === "pending-handshakes") {
        const response = await fetch(`${API_BASE_URL}/api/inbox/pending-handshakes/`, { headers });
        if (response.ok) {
          const data = await response.json();
          setPendingHandshakes(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load pending handshakes");
        }
      } else if (activeTab === "unread-messages") {
        const response = await fetch(`${API_BASE_URL}/api/inbox/unread-messages/`, { headers });
        if (response.ok) {
          const data = await response.json();
          setUnreadMessages(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load unread messages");
        }
      } else if (activeTab === "conversations") {
        const response = await fetch(`${API_BASE_URL}/api/inbox/conversations/`, { headers });
        if (response.ok) {
          const data = await response.json();
          setConversations(Array.isArray(data) ? data : []);
        } else {
          throw new Error("Failed to load conversations");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptHandshake = async (handshakeId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/handshakes/${handshakeId}/accept/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadTabData(); // Reload data
      } else {
        const data = await response.json();
        alert(data.error || "Failed to accept handshake.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const handleDeclineHandshake = async (handshakeId) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/handshakes/${handshakeId}/decline/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadTabData(); // Reload data
      } else {
        const data = await response.json();
        alert(data.error || "Failed to decline handshake.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const getPostLink = (handshake) => {
    if (handshake.offer) {
      return `/offers/${handshake.offer}`;
    } else if (handshake.request) {
      return `/requests/${handshake.request}`;
    }
    return null;
  };

  if (error && !localStorage.getItem("access")) {
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
        <h1 className="text-4xl font-bold text-amber-700 mb-6 text-center">Inbox</h1>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("pending-handshakes")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "pending-handshakes"
                  ? "bg-amber-500 text-white border-b-2 border-amber-600"
                  : "text-gray-600 hover:bg-amber-50"
              }`}
            >
              Pending Handshakes
              {pendingHandshakes.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {pendingHandshakes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("unread-messages")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "unread-messages"
                  ? "bg-amber-500 text-white border-b-2 border-amber-600"
                  : "text-gray-600 hover:bg-amber-50"
              }`}
            >
              Unread Messages
              {unreadMessages.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {unreadMessages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("conversations")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "conversations"
                  ? "bg-amber-500 text-white border-b-2 border-amber-600"
                  : "text-gray-600 hover:bg-amber-50"
              }`}
            >
              All Conversations
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Pending Handshakes Tab */}
                {activeTab === "pending-handshakes" && (
                  <div>
                    {pendingHandshakes.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No pending handshakes. Great job staying on top of things! 🎉
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {pendingHandshakes.map((handshake) => (
                          <div
                            key={handshake.id}
                            className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-amber-700 mb-2">
                                  {handshake.offer_title
                                    ? `Offer: ${handshake.offer_title}`
                                    : handshake.request_title
                                    ? `Request: ${handshake.request_title}`
                                    : "Handshake Request"}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                  From: <span className="font-semibold">{handshake.seeker_username}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  Hours: {handshake.hours} | Created:{" "}
                                  {new Date(handshake.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleAcceptHandshake(handshake.id)}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleDeclineHandshake(handshake.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                              >
                                Decline
                              </button>
                              {getPostLink(handshake) && (
                                <button
                                  onClick={() => navigate(getPostLink(handshake))}
                                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
                                >
                                  View Post
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Unread Messages Tab */}
                {activeTab === "unread-messages" && (
                  <div>
                    {unreadMessages.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No unread messages. You're all caught up! ✨
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {unreadMessages.map((message) => (
                          <div
                            key={message.id}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100"
                            onClick={() => {
                              // Navigate to the handshake detail or chat view
                              navigate(`/handshakes`);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-blue-700 mb-1">
                                  From: {message.sender_username}
                                </p>
                                <p className="text-gray-700 mb-2">{message.content}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(message.created_at).toLocaleString()}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                New
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Conversations Tab */}
                {activeTab === "conversations" && (
                  <div>
                    {conversations.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No conversations yet. Start a handshake to begin messaging!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {conversations.map((conv, idx) => (
                          <div
                            key={conv.handshake.id || idx}
                            className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                            onClick={() => {
                              const postLink = getPostLink(conv.handshake);
                              if (postLink) {
                                navigate(postLink);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-semibold text-amber-700">
                                    {conv.other_username}
                                  </p>
                                  {conv.unread_count > 0 && (
                                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                      {conv.unread_count} unread
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  {conv.handshake.offer_title
                                    ? `Offer: ${conv.handshake.offer_title}`
                                    : conv.handshake.request_title
                                    ? `Request: ${conv.handshake.request_title}`
                                    : "Conversation"}
                                </p>
                                <p className="text-gray-700 text-sm line-clamp-2">
                                  {conv.latest_message.content}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(conv.latest_message.created_at).toLocaleString()} •{" "}
                                  {conv.total_messages} {conv.total_messages === 1 ? "message" : "messages"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inbox;



