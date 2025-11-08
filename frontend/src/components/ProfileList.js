// frontend/src/components/ProfileList.js
import React, { useEffect, useState } from "react";

function ProfileList() {
  const [profiles, setProfiles] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // localStorage'daki token'ı al
    const token = localStorage.getItem("access");

    if (!token) {
      setMessage("You must be logged in to view profiles.");
      return;
    }

    // Token'ı Authorization header'ına ekleyerek istek at
    fetch("http://127.0.0.1:8000/api/profiles/", {
      headers: {
        "Authorization": `Bearer ${token}`,
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
  }, []);

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }}>
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
