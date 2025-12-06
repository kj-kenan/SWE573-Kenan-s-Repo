import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function Forum() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicBody, setNewTopicBody] = useState("");
  const [newReplyBody, setNewReplyBody] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("You must be logged in to view the forum.");
      setLoading(false);
      return;
    }

    // Get current user from token
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser(decoded.username || decoded.user_id);
    } catch (e) {
      console.error("Error decoding token:", e);
    }

    // Check if user is admin
    fetch(`${API_BASE_URL}/api/profiles/me/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((profile) => {
        setIsAdmin(profile.is_admin === true);
      })
      .catch((err) => {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
      });

    if (topicId) {
      loadTopicDetail(topicId);
    } else {
      loadTopics();
    }
  }, [topicId, API_BASE_URL]);

  const loadTopics = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/forum/topics/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load topics");
      }

      const data = await response.json();
      setTopics(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadTopicDetail = async (id) => {
    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/forum/topics/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load topic");
      }

      const data = await response.json();
      setTopic(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicBody.trim()) {
      setError("Please fill in both title and body.");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      setError("Please log in.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/forum/topics/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTopicTitle.trim(),
          body: newTopicBody.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewTopicTitle("");
        setNewTopicBody("");
        setShowNewTopicForm(false);
        loadTopics();
      } else {
        setError(data.error || "Failed to create topic.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleAddReply = async () => {
    if (!newReplyBody.trim()) {
      setError("Please enter a reply.");
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      setError("Please log in.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/forum/topics/${topicId}/reply/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            body: newReplyBody.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setNewReplyBody("");
        setError("");
        // Update topic with new reply
        setTopic(data);
      } else {
        setError(data.error || "Failed to post reply.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm("Are you sure you want to delete this topic? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/forum/topics/${topicId}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        if (topicId === parseInt(topicId)) {
          navigate("/forum");
        } else {
          loadTopics();
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete topic.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm("Are you sure you want to delete this reply? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/forum/replies/${replyId}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        loadTopicDetail(topicId);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete reply.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <p className="text-xl">Loading forum...</p>
      </div>
    );
  }

  if (error && !topicId) {
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

  // Topic Detail View
  if (topicId && topic) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate("/forum")}
            className="mb-4 text-amber-700 hover:text-amber-900 font-semibold"
          >
            ← Back to Forum
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-amber-700 mb-2">{topic.title}</h1>
                <p className="text-sm text-gray-600">
                  by{" "}
                  <span
                    className="font-semibold text-amber-700 hover:text-amber-900 cursor-pointer underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${topic.author}`);
                    }}
                  >
                    {topic.author_username}
                  </span>{" "}
                  on {new Date(topic.created_at).toLocaleString()}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDeleteTopic(topic.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Delete Topic
                </button>
              )}
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{topic.body}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
                {error}
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <h2 className="text-2xl font-semibold text-amber-700 mb-4">
                Replies ({topic.replies?.length || 0})
              </h2>

              {topic.replies && topic.replies.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {topic.replies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p
                            className="font-semibold text-amber-700 hover:text-amber-900 cursor-pointer underline inline-block"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${reply.author}`);
                            }}
                          >
                            {reply.author_username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleString()}
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-6">No replies yet. Be the first to reply!</p>
              )}

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-amber-700 mb-3">Post a Reply</h3>
                <textarea
                  value={newReplyBody}
                  onChange={(e) => setNewReplyBody(e.target.value)}
                  placeholder="Write your reply here..."
                  className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={4}
                />
                <button
                  onClick={handleAddReply}
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold"
                >
                  Post Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Topics List View
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-amber-700">Community Forum</h1>
          <button
            onClick={() => setShowNewTopicForm(!showNewTopicForm)}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold"
          >
            {showNewTopicForm ? "Cancel" : "New Topic"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
            {error}
          </div>
        )}

        {showNewTopicForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-amber-700 mb-4">Create New Topic</h2>
            <input
              type="text"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="Topic Title"
              className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <textarea
              value={newTopicBody}
              onChange={(e) => setNewTopicBody(e.target.value)}
              placeholder="Topic Description..."
              className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              rows={6}
            />
            <button
              onClick={handleCreateTopic}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold"
            >
              Create Topic
            </button>
          </div>
        )}

        {topics.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 text-lg">
              No topics yet. Be the first to start a discussion!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
                onClick={() => navigate(`/forum/${t.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-bold text-amber-700">{t.title}</h2>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(t.id);
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-gray-600 mb-3 line-clamp-2">{t.body}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    by{" "}
                    <span
                      className="font-semibold text-amber-700 hover:text-amber-900 cursor-pointer underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${t.author}`);
                      }}
                    >
                      {t.author_username}
                    </span>{" "}
                    on {new Date(t.created_at).toLocaleString()}
                  </span>
                  <span className="text-amber-600 font-semibold">
                    {t.reply_count || 0} {t.reply_count === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Forum;

