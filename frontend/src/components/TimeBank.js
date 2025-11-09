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
      // Decode user_id from JWT token
      const decoded = JSON.parse(atob(token.split(".")[1]));
      const userId = parseInt(decoded.user_id);

      // Fetch all profiles (or any endpoint containing timebank info)
      fetch(`${API_BASE_URL}/api/profiles/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch profile data.");
          return res.json();
        })
        .then((data) => {
          // Find the profile that matches the user_id
          const profile = data.find((p) => p.id === userId);
          if (profile) {
            setBalance(profile.timebank_balance);
          } else {
            setError("User profile not found.");
          }
        })
        .catch(() => setError("Server connection error."));
    } catch {
      setError("Invalid token format.");
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
