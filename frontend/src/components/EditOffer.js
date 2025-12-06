import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TagSelector from "./TagSelector";

function EditOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    latitude: "",
    longitude: "",
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  // Load existing offer data
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setIsError(true);
      setMessage("Please log in to edit an offer.");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/offers/${id}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load offer");
        }
        return res.json();
      })
      .then((data) => {
        // Populate form with existing data
        setFormData({
          title: data.title || "",
          description: data.description || "",
          duration: data.duration || "",
          latitude: data.latitude ? data.latitude.toString() : "",
          longitude: data.longitude ? data.longitude.toString() : "",
        });

        // Parse tags
        if (data.tags) {
          const tagsArray = data.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
          setSelectedTags(tagsArray);
        }

        // Parse available slots
        if (data.available_slots) {
          try {
            const slots = JSON.parse(data.available_slots);
            setAvailableSlots(Array.isArray(slots) ? slots : []);
          } catch (e) {
            setAvailableSlots([]);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        setIsError(true);
        setMessage("Failed to load offer. You may not have permission to edit this offer.");
        setLoading(false);
        console.error("Error:", err);
      });
  }, [id, API_BASE_URL]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setIsError(true);
      setMessage("Location is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData((p) => ({
          ...p,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setIsError(false);
        setMessage("Location captured.");
      },
      () => {
        setIsError(true);
        setMessage("Could not get location permission.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    const token = localStorage.getItem("access");
    if (!token) {
      setIsError(true);
      setMessage("Please log in to edit an offer.");
      return;
    }

    // Format available slots as JSON array for backend
    const validSlots = availableSlots
      .filter((slot) => slot.date && slot.time)
      .map((slot) => ({ date: slot.date, time: slot.time }));

    const payload = {
      ...formData,
      tags: selectedTags.join(", "),
      available_slots: validSlots.length > 0 ? JSON.stringify(validSlots) : null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/offers/${id}/edit/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsError(false);
        setMessage("Offer updated successfully! Redirecting...");
        setTimeout(() => {
          navigate(`/offers/${id}`);
        }, 1500);
      } else {
        setIsError(true);
        setMessage(data.detail || data.error || "Something went wrong.");
      }
    } catch (err) {
      setIsError(true);
      setMessage("Server connection error.");
      console.error("Error updating offer:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 flex items-center justify-center">
        <p className="text-xl">Loading offer...</p>
      </div>
    );
  }

  if (isError && message.includes("permission")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{message}</p>
          <button
            onClick={() => navigate(`/offers/${id}`)}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Back to Offer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 flex items-center justify-center py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg border border-amber-200">
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-3xl font-bold text-center mb-6 text-amber-700">
            Edit Offer
          </h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleChange}
              required
              className="block w-full mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="block w-full mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <input
              type="text"
              name="duration"
              placeholder="Duration (e.g. 1 hour)"
              value={formData.duration}
              onChange={handleChange}
              required
              className="block w-full mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            {/* Available Dates and Times */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-amber-700 mb-2">
                Available Dates and Times
              </label>
              {availableSlots.map((slot, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={slot.date}
                    onChange={(e) => {
                      const newSlots = [...availableSlots];
                      newSlots[index].date = e.target.value;
                      setAvailableSlots(newSlots);
                    }}
                    className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <input
                    type="time"
                    value={slot.time}
                    onChange={(e) => {
                      const newSlots = [...availableSlots];
                      newSlots[index].time = e.target.value;
                      setAvailableSlots(newSlots);
                    }}
                    className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAvailableSlots(availableSlots.filter((_, i) => i !== index));
                    }}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setAvailableSlots([...availableSlots, { date: "", time: "" }]);
                }}
                className="w-full py-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded font-semibold text-amber-700"
              >
                + Add Date & Time Slot
              </button>
            </div>

            <TagSelector
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input
                type="number"
                step="any"
                name="latitude"
                placeholder="Latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                type="number"
                step="any"
                name="longitude"
                placeholder="Longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="p-3 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 font-semibold"
              >
                Use my location
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/offers/${id}`)}
                className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-semibold shadow"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold shadow"
              >
                Update Offer
              </button>
            </div>
          </form>

          {message && (
            <p
              className={`mt-4 text-center ${
                isError ? "text-red-600" : "text-green-700"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-b-2xl" />
      </div>
    </div>
  );
}

export default EditOffer;

