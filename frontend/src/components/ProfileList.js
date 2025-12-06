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
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isViewerAdmin, setIsViewerAdmin] = useState(false);
  
  // Add missing state declarations
  const [timebankBalance, setTimebankBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingTimebank, setLoadingTimebank] = useState(true);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      setIsAuthenticated(true);
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setCurrentUser(decoded.username || decoded.user_id || decoded.user_id?.toString());
      } catch (e) {
        console.error("Error decoding token:", e);
      }
      
      // Check if current user is an admin
      fetch(`${API_BASE_URL}/api/profiles/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((ownProfile) => {
          // Check if the viewer is an admin (is_admin field from their own profile)
          setIsViewerAdmin(ownProfile.is_admin === true);
        })
        .catch((err) => {
          console.error("Error checking admin status:", err);
          setIsViewerAdmin(false);
        });
    } else {
      setIsAuthenticated(false);
      setIsViewerAdmin(false);
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
      // If no userId, we're viewing own profile (via /profile route)
      // Also check if username matches or if we successfully loaded /api/profiles/me/
      const viewingOwnProfile = !userId && (token ? true : false);
      setIsOwnProfile(viewingOwnProfile);

      // Set edit form
      setEditForm({
        bio: profileData.bio || "",
        skills: profileData.skills || "",
        interests: profileData.interests || "",
        province: profileData.province || "",
        district: profileData.district || "",
      });
      
      // Reset profile picture preview
      setProfilePicturePreview(null);
      setProfilePictureFile(null);

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

      // Load timebank data (only for own profile)
      if (viewingOwnProfile && token) {
        try {
          const timebankRes = await fetch(`${API_BASE_URL}/api/timebank/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (timebankRes.ok) {
            const timebankData = await timebankRes.json();
            setTimebankBalance(timebankData.balance || 0);
            setTransactions(Array.isArray(timebankData.transactions) ? timebankData.transactions : []);
          }
        } catch (err) {
          console.error("Error loading timebank:", err);
        } finally {
          setLoadingTimebank(false);
        }
      } else {
        setLoadingTimebank(false);
      }
    } catch (err) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage("Please select an image file.");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Image size must be less than 5MB.");
        return;
      }
      setProfilePictureFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfile = async () => {
    const token = localStorage.getItem("access");
    if (!token) {
      setMessage("Please log in to edit your profile.");
      return;
    }

    try {
      // Use FormData to support file uploads
      const formData = new FormData();
      formData.append("bio", editForm.bio);
      formData.append("skills", editForm.skills);
      formData.append("interests", editForm.interests);
      formData.append("province", editForm.province);
      formData.append("district", editForm.district);
      
      // Add profile picture if selected
      if (profilePictureFile) {
        formData.append("profile_picture", profilePictureFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/profiles/me/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - browser will set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
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

  // If no userId in URL, we're viewing own profile (via /profile route)
  // Show edit button if authenticated and viewing own profile
  const isOwner = !userId && isAuthenticated;

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
            <div className="flex-shrink-0 relative">
              {isEditing && isOwner && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    id="profile-picture-input"
                  />
                  <label
                    htmlFor="profile-picture-input"
                    className="absolute inset-0 cursor-pointer rounded-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity z-10 group"
                    title="Click to upload profile picture"
                  >
                    <span className="text-white text-sm font-semibold">📷 Upload</span>
                  </label>
                </>
              )}
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt={profile.username}
                  className={`w-32 h-32 rounded-full object-cover border-4 border-amber-400 ${isEditing && isOwner ? 'cursor-pointer' : ''}`}
                  onClick={isEditing && isOwner ? () => document.getElementById('profile-picture-input').click() : undefined}
                />
              ) : profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.username}
                  className={`w-32 h-32 rounded-full object-cover border-4 border-amber-400 ${isEditing && isOwner ? 'cursor-pointer' : ''}`}
                  onClick={isEditing && isOwner ? () => document.getElementById('profile-picture-input').click() : undefined}
                />
              ) : (
                <div 
                  className={`w-32 h-32 rounded-full bg-amber-400 flex items-center justify-center text-4xl font-bold text-white ${isEditing && isOwner ? 'cursor-pointer hover:bg-amber-500 transition-colors' : ''}`}
                  onClick={isEditing && isOwner ? () => document.getElementById('profile-picture-input').click() : undefined}
                >
                  {profile.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold text-amber-700">{profile.username}</h1>
                {profile.is_admin && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-2">{profile.email}</p>
              {/* Admin-only: Email verification status */}
              {isViewerAdmin && profile.email_verified !== null && profile.email_verified !== undefined && (
                <p className={`text-sm mb-2 ${profile.email_verified ? 'text-green-600' : 'text-red-600'}`}>
                  {profile.email_verified ? '✓ Email Verified' : '✗ Email Not Verified'}
                </p>
              )}
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
                          setProfilePictureFile(null);
                          setProfilePicturePreview(null);
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

            {/* Your Beellars - Only show for own profile */}
            {isOwnProfile && (
              <div>
                <h2 className="text-2xl font-semibold text-amber-700 mb-4">Your Beellars</h2>
                <div className="bg-white rounded-2xl shadow-lg border border-amber-200 px-8 py-6 text-center">
                  {loadingTimebank ? (
                    <p className="text-gray-600">Loading balance...</p>
                  ) : (
                    <p className="text-5xl font-bold text-gray-800">{timebankBalance}</p>
                  )}
                </div>
              </div>
            )}

            {/* Transaction History - Only show for own profile */}
            {isOwnProfile && (
              <div>
                <h2 className="text-2xl font-semibold text-amber-700 mb-4">Transaction History</h2>
                <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-6">
                  {loadingTimebank ? (
                    <p className="text-center text-gray-500 py-8">Loading transactions...</p>
                  ) : transactions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No transactions yet. Complete handshakes to see your transaction history.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((transaction) => {
                        const isEarned = transaction.transaction_type === "earned";
                        const isSpent = transaction.transaction_type === "spent";
                        
                        return (
                          <div
                            key={transaction.id}
                            className={`border-l-4 p-4 rounded-lg ${
                              isEarned
                                ? "bg-green-50 border-green-500"
                                : isSpent
                                ? "bg-red-50 border-red-500"
                                : "bg-gray-50 border-gray-300"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${
                                      isEarned
                                        ? "bg-green-200 text-green-800"
                                        : isSpent
                                        ? "bg-red-200 text-red-800"
                                        : "bg-gray-200 text-gray-800"
                                    }`}
                                  >
                                    {isEarned ? "💰 Earned" : isSpent ? "💸 Spent" : "📊 Transaction"}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {new Date(transaction.created_at).toLocaleDateString()} at{" "}
                                    {new Date(transaction.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                {transaction.related_post_title && (
                                  <p className="text-sm text-gray-700 mb-1">
                                    <span className="font-semibold">Related post:</span> {transaction.related_post_title}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {isEarned
                                    ? `Received from ${transaction.sender_username}`
                                    : isSpent
                                    ? `Paid to ${transaction.receiver_username}`
                                    : `${transaction.sender_username} → ${transaction.receiver_username}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p
                                  className={`text-2xl font-bold ${
                                    isEarned
                                      ? "text-green-600"
                                      : isSpent
                                      ? "text-red-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {isEarned ? "+" : isSpent ? "-" : ""}
                                  {transaction.amount}
                                </p>
                                <p className="text-xs text-gray-500">Beellars</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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