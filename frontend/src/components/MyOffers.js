import React, { useEffect, useState } from "react";

function MyOffers() {
  const [offers, setOffers] = useState([]);        // stores the user's own offers
  const [loading, setLoading] = useState(true);    // true while fetching data
  const [error, setError] = useState("");          // stores any error message

  // ✅ Environment variable + fallback
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setError("You must be logged in to view your offers.");
      setLoading(false);
      return;
    }

    // Fetch all offers from the backend
    fetch(`${API_BASE_URL}/api/offers/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // include authentication header
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Decode JWT to get the username of the logged-in user
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const username = decoded.username || decoded.user_id || "";

        // Filter only the offers created by this user (compare username)
        const myOffers = Array.isArray(data)
          ? data.filter((offer) => offer.username === username)
          : [];
        setOffers(myOffers);
      })
      .catch((err) => {
        console.error("Error loading offers:", err);
        setError("Unable to load your offers.");
      })
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  if (loading) return <p className="text-center mt-10">Loading your offers...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-amber-700">
        My Offers
      </h2>

      {offers.length === 0 ? (
        <p className="text-center text-gray-500">
          You haven’t created any offers yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="border p-4 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-bold text-lg mb-1 text-amber-700">
                {offer.title}
              </h3>
              <p className="text-gray-700 mb-2">{offer.description}</p>
              <p className="text-sm text-gray-500">
                🏷️ {offer.tags || "No tags"} | ⏰ {offer.duration || "N/A"}
              </p>

              {/* 🔸 Future actions: edit, delete, view handshakes */}
              <div className="flex justify-between mt-3 text-sm text-amber-600">
                <button className="hover:underline">✏️ Edit</button>
                <button className="hover:underline">🗑️ Delete</button>
                <button className="hover:underline">🤝 Handshakes</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOffers;
