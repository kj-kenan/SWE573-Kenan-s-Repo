import React, { useEffect, useState } from "react";

function OffersList() {
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("offers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Environment variable + fallback
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [offersRes, requestsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/offers/`),
          fetch(`${API_BASE_URL}/api/requests/`),
        ]);

        if (!offersRes.ok || !requestsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const offersData = await offersRes.json();
        const requestsData = await requestsRes.json();

        setOffers(offersData);
        setRequests(requestsData);
      } catch (err) {
        setError("Unable to fetch offers/requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  if (loading) return <p className="text-center mt-10">Loading services...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  const currentList = activeTab === "offers" ? offers : requests;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-amber-700">
        Community Services
      </h2>

      <div className="flex justify-center mb-6 gap-4">
        <button
          onClick={() => setActiveTab("offers")}
          className={`px-4 py-2 rounded font-semibold transition ${
            activeTab === "offers"
              ? "bg-amber-500 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Offers
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded font-semibold transition ${
            activeTab === "requests"
              ? "bg-amber-500 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Requests
        </button>
      </div>

      {currentList.length === 0 ? (
        <p className="text-center text-gray-500">
          No {activeTab} available yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {currentList.map((item) => (
            <div
              key={item.id}
              className="border p-4 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-bold text-lg mb-1 text-amber-700">
                {item.title}
              </h3>
              <p className="text-gray-700 mb-2">{item.description}</p>
              <p className="text-sm text-gray-500">
                🏷️ {item.category} | ⏰ {item.duration}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OffersList;
