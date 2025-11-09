// frontend/src/components/ProfileList.js
import React, { useEffect, useState } from "react";

function ProfileList() {
  const [profiles, setProfiles] = useState([]);
  const [message, setMessage] = useState("");

  // ✅ Environment variable + fallback
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    // Get JWT token from localStorage
    const token = localStorage.getItem("access");

    if (!token) {
      setMessage("You must be logged in to view profiles.");
      return;
    }

    // Fetch all profiles with Authorization header
    fetch(`${API_BASE_URL}/api/profiles/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.status === 401) {
          throw new Error("Unauthorized. Token expired or invalid.");
        }
        return response.json();
      })
      .then((data) => {
        setProfiles(data);
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }, [API_BASE_URL]);

  return (
    <div
      style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}
    >
      <h2>User Profiles</h2>
      {message && <p style={{ color: "red" }}>{message}</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {profiles.map((profile) => (
          <li
            key={profile.id}
            style={{
              background: "#f0f0f0",
              margin: "10px 0",
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <strong>{profile.user}</strong> — {profile.bio || "No bio yet"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProfileList;
