import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ProfileList() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [badges, setBadges] = useState([]);
  const [userPosts, setUserPosts] = useState({ offers: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    skills: "",
    interests: "",
    province: "",
    district: "",
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

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

    loadProfile();
  }, [userId, API_BASE_URL]);

  const loadProfile = async () => {
    const token = localStorage.getItem("access");
    if (!token && !userId) {
      setError("You must be logged in to view your profile.");
      setLoading(false);
      return;
    }

    try {
      let profileUrl;
      if (userId) {
        // Viewing another user's profile
        profileUrl = `${API_BASE_URL}/api/profiles/${userId}/`;
      } else {
        // Viewing own profile
        profileUrl = `${API_BASE_URL}/api/profiles/me/`;
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const profileData = await (await fetch(profileUrl, { headers })).json();
      setProfile(profileData);
      setIsOwnProfile(!userId && currentUser === profileData.username);

      // Set edit form
      setEditForm({
        bio: profileData.bio || "",
        skills: profileData.skills || "",
        interests: profileData.interests || "",
        province: profileData.province || "",
        district: profileData.district || "",
      });

      // Get ratings and badges for this user
      const [ratingsRes, badgesRes, offersRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ratings/?username=${profileData.username}`, { headers }),
        fetch(`${API_BASE_URL}/api/badges/?username=${profileData.username}`, { headers }),
        fetch(`${API_BASE_URL}/api/offers/`, { headers }),
        fetch(`${API_BASE_URL}/api/requests/`, { headers }),
      ]);


      // Load ratings
      if (ratingsRes.ok) {
        const ratingsData = await ratingsRes.json();
        setRatings(Array.isArray(ratingsData) ? ratingsData : []);
      }

      // Load badges
      if (badgesRes.ok) {
        const badgesData = await badgesRes.json();
        setBadges(Array.isArray(badgesData) ? badgesData : []);
      }

      // Load user's posts
      if (offersRes.ok && requestsRes.ok) {
        const offersData = await offersRes.json();
        const requestsData = await requestsRes.json();
        const username = profileData.username;
        setUserPosts({
          offers: Array.isArray(offersData)
            ? offersData.filter((o) => o.username === username)
            : [],
          requests: Array.isArray(requestsData)
            ? requestsData.filter((r) => r.username === username)
            : [],
        });
      }
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in to edit your profile.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/me/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message || "Failed to update profile");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in.");
      return;
    }

    try {
      // TODO: Implement account deletion endpoint
      setMessage("Account deletion is not yet implemented. Please contact an administrator.");
    } catch (err) {
      setMessage(err.message || "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <p className="text-xl">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || "Profile not found"}</p>
          <button
            onClick={() => navigate("/home")}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isOwner = !userId && currentUser === profile.username;

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Profile Header */}
          <div className="flex items-start gap-6 mb-6">
            <div className="flex-shrink-0">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-400"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-amber-400 flex items-center justify-center text-4xl font-bold text-white">
                  {profile.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h1 className="text-4xl font-bold text-amber-700 mb-2">{profile.username}</h1>
              <p className="text-gray-600 mb-2">{profile.email}</p>
              {profile.location && (
                <p className="text-gray-500 text-sm mb-4">📍 {profile.location}</p>
              )}

              {/* Ratings Display */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-600">
                    {profile.average_rating || 0}
                  </span>
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-gray-500 text-sm">
                    ({profile.total_ratings || 0} ratings)
                  </span>
                </div>
                <div className="text-amber-600 font-semibold">
                  💰 {profile.timebank_balance || 0} Beellars
                </div>
              </div>

              {/* Edit/Delete buttons for own profile */}
              {isOwner && (
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleEditProfile}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            bio: profile.bio || "",
                            skills: profile.skills || "",
                            interests: profile.interests || "",
                            province: profile.province || "",
                            district: profile.district || "",
                          });
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete Account
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <h2 className="text-2xl font-semibold text-amber-700 mb-2">About</h2>
              {isEditing && isOwner ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={4}
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {profile.bio || "No bio yet."}
                </p>
              )}
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-2xl font-semibold text-amber-700 mb-2">Skills</h2>
              {isEditing && isOwner ? (
                <input
                  type="text"
                  value={editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                  placeholder="e.g., Cooking, Gardening, Tutoring (comma-separated)"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills
                    ? profile.skills.split(",").map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                        >
                          {skill.trim()}
                        </span>
                      ))
                    : "No skills listed."}
                </div>
              )}
            </div>

            {/* Interests */}
            <div>
              <h2 className="text-2xl font-semibold text-amber-700 mb-2">Interests</h2>
              {isEditing && isOwner ? (
                <input
                  type="text"
                  value={editForm.interests}
                  onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                  placeholder="e.g., Music, Sports, Reading (comma-separated)"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.interests
                    ? profile.interests.split(",").map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {interest.trim()}
                        </span>
                      ))
                    : "No interests listed."}
                </div>
              )}
            </div>

            {/* Location (editable) */}
            {isEditing && isOwner && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    value={editForm.province}
                    onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={editForm.district}
                    onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}

            {/* Badges */}
            {badges.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-amber-700 mb-2">Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="px-4 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg"
                    >
                      <span className="font-semibold text-amber-800">
                        🏆 {badge.badge_type_display}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ratings */}
            {ratings.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-amber-700 mb-2">Ratings & Reviews</h2>
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{rating.rater_username}</span>
                        <span className="text-yellow-400">
                          {"⭐".repeat(rating.rating)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {rating.comment && (
                        <p className="text-gray-700">{rating.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User's Posts */}
            {(userPosts.offers.length > 0 || userPosts.requests.length > 0) && (
              <div>
                <h2 className="text-2xl font-semibold text-amber-700 mb-2">Posts</h2>
                {userPosts.offers.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-amber-600 mb-2">Offers</h3>
                    <div className="space-y-2">
                      {userPosts.offers.map((offer) => (
                        <div
                          key={offer.id}
                          className="p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100"
                          onClick={() => navigate(`/offers/${offer.id}`)}
                        >
                          <h4 className="font-semibold">{offer.title}</h4>
                          <p className="text-sm text-gray-600">{offer.description.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {userPosts.requests.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-amber-600 mb-2">Requests</h3>
                    <div className="space-y-2">
                      {userPosts.requests.map((request) => (
                        <div
                          key={request.id}
                          className="p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100"
                          onClick={() => navigate(`/requests/${request.id}`)}
                        >
                          <h4 className="font-semibold">{request.title}</h4>
                          <p className="text-sm text-gray-600">{request.description.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileList;
