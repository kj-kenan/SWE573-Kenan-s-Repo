import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("You must be logged in to view profiles.");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/users/${id}/public/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          } else if (res.status === 404) {
            throw new Error("Profile not found.");
          } else if (res.status === 403) {
            throw new Error("This profile is not visible.");
          }
          throw new Error("Failed to load profile.");
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load profile.");
        setLoading(false);
      });
  }, [id, API_BASE_URL]);

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
            onClick={() => navigate("/offers")}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-amber-700 hover:text-amber-900 font-semibold"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            {profile.profile_picture_url && (
              <img
                src={profile.profile_picture_url}
                alt={profile.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-amber-400"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-amber-700 mb-2">
                {profile.username}
              </h1>
              {profile.location && (
                <p className="text-gray-600">
                  📍 {profile.location}
                </p>
              )}
              {profile.average_rating > 0 && (
                <p className="text-gray-600 mt-1">
                  ⭐ {profile.average_rating.toFixed(1)} / 10.0 ({profile.total_ratings} {profile.total_ratings === 1 ? "rating" : "ratings"})
                </p>
              )}
              {/* Top Tags */}
              {profile.top_tags && profile.top_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.top_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-amber-700 mb-2">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-amber-700 mb-2">Skills</h2>
              <p className="text-gray-700">{profile.skills}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-amber-700 mb-2">Interests</h2>
              <p className="text-gray-700">{profile.interests}</p>
            </div>
          )}

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-amber-700 mb-4">Badges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-amber-700 mb-1">
                      {badge.badge_type_display || badge.badge_type}
                    </h3>
                    {badge.description && (
                      <p className="text-sm text-gray-600">{badge.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Earned: {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings & Feedback */}
          {profile.ratings && profile.ratings.length > 0 && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-amber-700 mb-4">
                Ratings & Feedback ({profile.ratings.length})
              </h2>
              <div className="space-y-4">
                {profile.ratings.map((rating) => (
                  <div
                    key={rating.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {rating.rater ? (
                            <span
                              className="text-amber-700 hover:text-amber-900 cursor-pointer underline"
                              onClick={() => navigate(`/profile/${rating.rater}`)}
                            >
                              {rating.rater_username}
                            </span>
                          ) : (
                            rating.rater_username
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-bold text-amber-600">
                            {rating.score}/10
                          </span>
                          {rating.tags && rating.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {rating.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {rating.comment && (
                      <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!profile.bio && !profile.skills && !profile.interests && 
            (!profile.badges || profile.badges.length === 0) &&
            (!profile.ratings || profile.ratings.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              <p>This profile doesn't have much information yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;

