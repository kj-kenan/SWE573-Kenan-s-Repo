import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import TagSelector from "./TagSelector";
import userLocationIcon from "../location.svg";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to handle map clicks for location selection
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
}

// Component to update map view when coordinates change
function MapUpdater({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

function CreateService() {
  const [serviceType, setServiceType] = useState("offer"); // "offer" | "request"

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    latitude: "",
    longitude: "",
    max_participants: 1,
  });

  const [selectedTags, setSelectedTags] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [locationSource, setLocationSource] = useState(null); // "gps", "network", "manual", or null
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState(null);
  const bestPositionRef = useRef(null);
  const bestAccuracyRef = useRef(Infinity);
  const [userBalance, setUserBalance] = useState(null);

  // ✅ environment değişkeni + fallback
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  // Fetch user balance on mount
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      fetch(`${API_BASE_URL}/api/profiles/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((profile) => {
          setUserBalance(profile.timebank_balance || 0);
        })
        .catch((err) => console.error("Error fetching user balance:", err));
    }
  }, [API_BASE_URL]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setIsError(true);
      setMessage("Location is not supported by your browser.");
      return;
    }
    
    // Stop any existing watch
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
    }
    
    setIsGettingLocation(true);
    setMessage("Acquiring GPS signal...");
    setIsError(false);
    
    const options = {
      enableHighAccuracy: true, // Request GPS, not network
      timeout: 45000, // 45 seconds to allow GPS to lock
      maximumAge: 0 // Never use cached location
    };
    
    bestAccuracyRef.current = Infinity;
    bestPositionRef.current = null;
    let attempts = 0;
    const maxAttempts = 30; // Check up to 30 times over 45 seconds
    
    // Use watchPosition to get multiple readings and wait for GPS
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        attempts++;
        const { latitude, longitude, accuracy } = pos.coords;
        const accuracyMeters = accuracy ? Math.round(accuracy) : Infinity;
        
        // Track the best (most accurate) position we've received
        if (accuracyMeters < bestAccuracyRef.current) {
          bestAccuracyRef.current = accuracyMeters;
          bestPositionRef.current = pos;
          
          // Update UI with current best reading
          setFormData((p) => ({
            ...p,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          }));
          
          // Determine source based on accuracy
          let source = "network";
          if (accuracyMeters < 100) {
            source = accuracyMeters < 20 ? "gps" : "network";
          }
          
          let statusMsg = "";
          if (accuracyMeters > 1000) {
            // Very poor accuracy - likely IP-based, stop early
            statusMsg = `Location accuracy very poor (±${(accuracyMeters/1000).toFixed(1)}km). Stopping...`;
          } else if (accuracyMeters > 100) {
            statusMsg = `Acquiring GPS signal... (±${accuracyMeters}m)`;
          } else if (accuracyMeters > 50) {
            statusMsg = `Improving accuracy... (±${accuracyMeters}m)`;
          } else {
            statusMsg = `GPS locked! (±${accuracyMeters}m)`;
          }
          
          setMessage(statusMsg);
          setLocationSource(source);
          setLocationAccuracy(accuracyMeters);
          setShowMapPreview(true);
        }
        
        // If accuracy is very poor (>1000m), it's likely IP-based - stop early and let user manually set
        if (accuracyMeters > 1000) {
          navigator.geolocation.clearWatch(watchId);
          setLocationWatchId(null);
          setIsGettingLocation(false);
          
          setLocationSource("network");
          setMessage(`⚠️ Automatic location is very inaccurate (±${(accuracyMeters/1000).toFixed(1)}km). Please click on the map below to set your exact location.`);
          
          return;
        }
        
        // If we get a good GPS reading (< 30m for GPS, or < 50m for network), stop watching
        // But wait a bit longer if we're still improving to get the best possible reading
        const isGoodGPS = accuracyMeters < 20;
        const isAcceptableNetwork = accuracyMeters >= 20 && accuracyMeters < 50;
        
        if (isGoodGPS) {
          // For GPS, stop immediately once we get good accuracy
          navigator.geolocation.clearWatch(watchId);
          setLocationWatchId(null);
          setIsGettingLocation(false);
          
          setLocationSource("gps");
          setMessage(`Location captured! Accuracy: ±${accuracyMeters}m. Please verify on the map below.`);
          
          return;
        } else if (isAcceptableNetwork && attempts > 10) {
          // For network-based, wait for at least 10 readings to ensure we have the best possible
          // Only stop if accuracy hasn't improved in the last few readings
          navigator.geolocation.clearWatch(watchId);
          setLocationWatchId(null);
          setIsGettingLocation(false);
          
          setLocationSource("network");
          setMessage(`Location captured! Accuracy: ±${accuracyMeters}m. Please verify on the map below.`);
          
          return;
        }
        
        // If we've tried many times without good accuracy, use the best we have
        if (attempts >= maxAttempts) {
          navigator.geolocation.clearWatch(watchId);
          setLocationWatchId(null);
          setIsGettingLocation(false);
          
          if (bestPositionRef.current) {
            const finalAccuracy = Math.round(bestPositionRef.current.coords.accuracy);
            const finalSource = finalAccuracy < 20 ? "gps" : "network";
            
            setLocationSource(finalSource);
            setLocationAccuracy(finalAccuracy);
            
            let finalMsg = `Location captured. Accuracy: ±${finalAccuracy}m`;
            if (finalAccuracy > 100) {
              finalMsg += ". ⚠️ Location may be inaccurate. Please verify and adjust on the map if needed.";
            } else {
              finalMsg += ". Please verify the location on the map below.";
            }
            
            setMessage(finalMsg);
          }
        }
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        setLocationWatchId(null);
        setIsGettingLocation(false);
        setIsError(true);
        
        let errorMsg = "Could not get location.";
        if (error.code === 1) {
          errorMsg = "Location permission denied. Please enable location access in your browser settings.";
        } else if (error.code === 2) {
          errorMsg = "Location unavailable. Please check your device's location settings.";
        } else if (error.code === 3) {
          errorMsg = "Location request timed out. Please try again.";
        }
        setMessage(errorMsg);
        setShowMapPreview(false);
      },
      options
    );
    
    setLocationWatchId(watchId);
    
    // Fallback: stop watching after timeout even if no good reading
    setTimeout(() => {
      // Check if watch is still active by verifying state
      navigator.geolocation.clearWatch(watchId);
      
      // Only update if we're still in "getting location" state (watch wasn't already cleared)
      setIsGettingLocation((prev) => {
        if (prev) {
          setLocationWatchId(null);
          
          if (bestPositionRef.current && bestAccuracyRef.current < Infinity) {
            const finalAccuracy = Math.round(bestPositionRef.current.coords.accuracy);
            const finalSource = finalAccuracy < 20 ? "gps" : "network";
            
            setLocationSource(finalSource);
            setLocationAccuracy(finalAccuracy);
            
            let finalMsg = "";
            if (finalAccuracy > 1000) {
              finalMsg = `⚠️ Automatic location is very inaccurate (±${(finalAccuracy/1000).toFixed(1)}km - IP-based). Please click on the map below to set your exact location.`;
            } else if (finalAccuracy > 100) {
              finalMsg = `Location captured. Accuracy: ±${finalAccuracy}m. ⚠️ Location may be inaccurate - please verify and adjust on map.`;
            } else {
              finalMsg = `Location captured. Accuracy: ±${finalAccuracy}m. Please verify on the map below.`;
            }
            setMessage(finalMsg);
          }
          return false;
        }
        return prev;
      });
    }, 45000); // 45 second total timeout
  };

  const handleMapLocationSelect = (lat, lng) => {
    setFormData((p) => ({
      ...p,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    setLocationSource("manual");
    setLocationAccuracy(null);
    setMessage(`Location set manually: ${lat.toFixed(6)}, ${lng.toFixed(6)}. Click on the map again to adjust.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    // Check if user is logged in
    const token = localStorage.getItem("access");
    if (!token) {
      setIsError(true);
      setMessage("Please log in to create a post.");
      return;
    }

    // Check user balance for requests
    if (serviceType === "request" && userBalance !== null && userBalance <= 0) {
      setIsError(true);
      setMessage("❌ You need at least 1 Beellar to post a request. Provide services to earn Beellars!");
      return;
    }

    // ✅ localhost yerine env tabanlı endpoint
    const endpoint =
      serviceType === "offer"
        ? `${API_BASE_URL}/api/offers/`
        : `${API_BASE_URL}/api/requests/`;

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
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setIsError(false);
        setMessage(`Your ${serviceType} was posted successfully!`);
        // reset form
        setFormData({
          title: "",
          description: "",
          duration: "",
          latitude: "",
          longitude: "",
          max_participants: 1,
        });
        setSelectedTags([]);
        setAvailableSlots([]);
        setShowMapPreview(false);
        setLocationSource(null);
        setLocationAccuracy(null);
      } else {
        setIsError(true);
        setMessage(data.detail || data.error || "Something went wrong.");
      }
    } catch (err) {
      setIsError(true);
      setMessage("Server connection error.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-amber-200 flex items-center justify-center py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg border border-amber-200">
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-3xl font-bold text-center mb-6 text-amber-700">
            {serviceType === "offer" ? "Create an Offer" : "Create a Request"}
          </h2>

          <div className="flex justify-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => setServiceType("offer")}
              className={`px-4 py-2 rounded font-semibold transition ${
                serviceType === "offer"
                  ? "bg-amber-500 text-white shadow"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Offer
            </button>
            <button
              type="button"
              onClick={() => setServiceType("request")}
              className={`px-4 py-2 rounded font-semibold transition ${
                serviceType === "request"
                  ? "bg-amber-500 text-white shadow"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Request
            </button>
          </div>

          {/* Warning for users with 0 beellars trying to post requests */}
          {serviceType === "request" && userBalance !== null && userBalance <= 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ You need at least 1 Beellar to post a request. Post an offer or provide services to earn Beellars!
              </p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleChange}
              required
              onInvalid={(e) => e.target.setCustomValidity('Please fill in the title field')}
              onInput={(e) => e.target.setCustomValidity('')}
              className="block w-full mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              required
              onInvalid={(e) => e.target.setCustomValidity('Please fill in the description field')}
              onInput={(e) => e.target.setCustomValidity('')}
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
              onInvalid={(e) => e.target.setCustomValidity('Please fill in the duration field')}
              onInput={(e) => e.target.setCustomValidity('')}
              className="block w-full mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            {/* Maximum Participants - Only for Offers */}
            {serviceType === "offer" && (
              <div className="mb-3">
                <label className="block text-sm font-semibold text-amber-700 mb-2">
                  Maximum Participants
                </label>
                <input
                  type="number"
                  name="max_participants"
                  min="1"
                  value={formData.max_participants}
                  onChange={handleChange}
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please fill in the maximum participants field')}
                  onInput={(e) => e.target.setCustomValidity('')}
                  className="block w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-xs text-gray-600 mt-1">
                  How many people can participate in this offer? (Default: 1)
                </p>
              </div>
            )}

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

            <div className="mb-4">
              <label className="block text-sm font-semibold text-amber-700 mb-2">
                Location Coordinates
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  placeholder="Latitude"
                  value={formData.latitude}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value && formData.longitude) {
                      setShowMapPreview(true);
                      setLocationSource("manual");
                    }
                  }}
                  className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  placeholder="Longitude"
                  value={formData.longitude}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value && formData.latitude) {
                      setShowMapPreview(true);
                      setLocationSource("manual");
                    }
                  }}
                  className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={isGettingLocation}
                  className={`p-3 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 font-semibold transition ${
                    isGettingLocation ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isGettingLocation ? "🔄 Getting GPS..." : "📍 Use my location"}
                </button>
              </div>
              
              {/* Map Preview */}
              {showMapPreview && formData.latitude && formData.longitude && (
                <div className="mb-2">
                  {locationAccuracy !== null && locationAccuracy > 1000 ? (
                    <div className="mb-2 p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
                      <p className="text-sm font-semibold text-orange-800 mb-1">
                        ⚠️ Automatic location is very inaccurate
                      </p>
                      <p className="text-xs text-orange-700">
                        Please <strong>click on the map below</strong> to set your exact location. This is common on desktop computers without GPS.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mb-1">
                      Click on the map to adjust your location if needed:
                    </p>
                  )}
                  <div className={`h-64 border-2 rounded-lg overflow-hidden ${
                    locationAccuracy !== null && locationAccuracy > 1000 
                      ? "border-orange-400 ring-2 ring-orange-200" 
                      : "border-amber-300"
                  }`}>
                    <MapContainer
                      key={`${formData.latitude}-${formData.longitude}`}
                      center={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors | © <a href="https://www.maptiler.com/">MapTiler</a>'
                        url="https://api.maptiler.com/maps/pastel/256/{z}/{x}/{y}.png?key=GpfLIUr8LS7XQvnlcAnU"
                      />
                      <Marker
                        position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                        icon={L.icon({
                          iconUrl: userLocationIcon,
                          iconSize: [40, 40],
                          iconAnchor: [20, 20],
                          popupAnchor: [0, -20],
                        })}
                      />
                      <MapClickHandler onLocationSelect={handleMapLocationSelect} />
                      <MapUpdater center={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} />
                    </MapContainer>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-600">
                Your exact coordinates are stored. On maps, a 100-200m privacy offset is applied to protect your location.
              </p>
            </div>

            <button
              type="submit"
              disabled={serviceType === "request" && userBalance !== null && userBalance <= 0}
              className={`w-full py-3 rounded font-semibold shadow transition ${
                serviceType === "request" && userBalance !== null && userBalance <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              Post {serviceType === "offer" ? "Offer" : "Request"}
            </button>
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

export default CreateService;
