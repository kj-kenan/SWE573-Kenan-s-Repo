import React, { useEffect, useState } from "react";

function TimeBank() {
  const [balance, setBalance] = useState(null); // user's beellar amount
  const [error, setError] = useState("");

  // ✅ Environment variable + fallback
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    try {
      // Decode username from JWT token
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const username = decoded.username;

      // Fetch all profiles
      fetch(`${API_BASE_URL}/api/profiles/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              throw new Error("Authentication failed. Please log in again.");
            }
            throw new Error("Failed to fetch profile data.");
          }
          return res.json();
        })
        .then((data) => {
          // Find the profile that matches the username
          const profile = Array.isArray(data) 
            ? data.find((p) => p.username === username)
            : null;
          
          if (profile) {
            setBalance(profile.timebank_balance || 0);
          } else {
            setError("User profile not found. Please try logging in again.");
          }
        })
        .catch((err) => {
          setError(err.message || "Server connection error.");
          console.error("Error:", err);
        });
    } catch (err) {
      setError("Invalid token format. Please log in again.");
      console.error("Token decode error:", err);
    }
  }, [API_BASE_URL]);

  if (error) {
    return <p className="text-center text-red-600 mt-10">{error}</p>;
  }

  if (balance === null) {
    return <p className="text-center mt-10">Loading your beellars...</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-100 to-yellow-50">
      <div className="bg-white rounded-2xl shadow-lg border border-amber-200 px-10 py-16 text-center">
        <h1 className="text-4xl font-extrabold text-amber-600 mb-4">
          Your Beellars
        </h1>
        <p className="text-6xl font-bold text-gray-800">{balance}</p>
      </div>
    </div>
  );
}

export default TimeBank;
