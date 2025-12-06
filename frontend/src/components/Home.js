import React, { useEffect, useCallback, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import MapFilters from "./MapFilters";
import offerIcon from "../assets/offer.png";
import needIcon from "../assets/need.png";
import userLocationIcon from "../location.svg";

function Home() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const distanceCircleRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    tag: null,
    distance: null,
    minDate: null,
    maxDate: null,
  });
  const [appliedFilters, setAppliedFilters] = useState({
    tag: null,
    distance: null,
    minDate: null,
    maxDate: null,
  });

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  const handleCreateClick = () => navigate("/create");

  // Get user's current location automatically
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by your browser.");
      // Fallback to default location
      if (mapRef.current) {
        mapRef.current.setView([41.085339, 29.045607], 15);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Recenter map on user location if map exists
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          addUserLocationMarker(latitude, longitude);
          // Don't draw circle initially - only when filters are applied
        }
      },
      (error) => {
        console.warn("Error getting location:", error);
        // Fallback to default location with warning
        if (mapRef.current) {
          mapRef.current.setView([41.085339, 29.045607], 15);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Add user location marker
  const addUserLocationMarker = useCallback((lat, lng) => {
    if (!mapRef.current) return;

    // Remove existing user marker if any
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }

    // Create user location icon (larger and distinctive)
    const userIcon = L.icon({
      iconUrl: userLocationIcon,
      iconSize: [40, 40], // Customizable size
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
      className: 'user-location-marker',
    });

    // Add user location marker
    userMarkerRef.current = L.marker([lat, lng], {
      icon: userIcon,
      zIndexOffset: 1000, // Ensure it appears above other markers
    })
      .addTo(mapRef.current)
      .bindPopup("<b>You are here</b>");
  }, []);

  // Update distance circle radius
  const updateDistanceCircle = useCallback((lat, lng, radiusKm) => {
    if (!mapRef.current || !lat || !lng) return;

    // Remove existing circle if any
    if (distanceCircleRef.current) {
      mapRef.current.removeLayer(distanceCircleRef.current);
    }

    // Convert km to meters (Leaflet circle uses meters)
    const radiusMeters = radiusKm * 1000;

    // Create circle with semi-transparent styling
    distanceCircleRef.current = L.circle([lat, lng], {
      radius: radiusMeters,
      fillColor: '#fbbf24',
      fillOpacity: 0.15,
      color: '#f59e0b',
      weight: 2,
      opacity: 0.5,
    }).addTo(mapRef.current);
  }, []);

  // Handle distance change (for circle preview while dragging slider)
  const handleDistanceChange = useCallback((newDistance) => {
    if (userLocation) {
      updateDistanceCircle(userLocation.lat, userLocation.lng, newDistance);
    }
  }, [userLocation, updateDistanceCircle]);

  // Secure handshake function
  const sendHandshake = useCallback(
    async (offerId) => {
      const token = localStorage.getItem("access");
      if (!token) {
        alert("Please log in first.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/handshakes/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ offer: offerId, hours: 1 }),
        });

        if (response.ok) {
          alert("Handshake request sent successfully.");
          // Reload markers to update map
          if (mapRef.current) {
            loadMarkers();
          }
        } else {
          const err = await response.json();
          let errorMsg = "Request failed";
          if (err.detail) {
            errorMsg = err.detail;
          } else if (err.error) {
            errorMsg = err.error;
          } else if (Array.isArray(err.non_field_errors)) {
            errorMsg = err.non_field_errors.join(", ");
          }
          alert("Error: " + errorMsg);
        }
      } catch (err) {
        console.error("Network error:", err);
        alert("Network error: " + err.message);
      }
    },
    [API_BASE_URL]
  );

  // Load and display markers with filtering
  const loadMarkers = useCallback(() => {
    if (!mapRef.current) {
      console.log("Map not ready, skipping marker load");
      return;
    }

    console.log("Loading markers with applied filters:", appliedFilters);

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    const token = localStorage.getItem("access");
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Build query parameters using appliedFilters (not current filters)
    const params = new URLSearchParams();
    if (appliedFilters.tag) params.append("tag", appliedFilters.tag);
    if (appliedFilters.minDate) params.append("min_date", appliedFilters.minDate);
    if (appliedFilters.maxDate) params.append("max_date", appliedFilters.maxDate);
    if (appliedFilters.distance && userLocation) {
      params.append("distance", appliedFilters.distance);
      params.append("lat", userLocation.lat);
      params.append("lng", userLocation.lng);
    }

    const queryString = params.toString();
    const offersUrl = `${API_BASE_URL}/api/offers/${queryString ? `?${queryString}` : ""}`;
    const requestsUrl = `${API_BASE_URL}/api/requests/${queryString ? `?${queryString}` : ""}`;

    const iconConfig = (url) =>
      L.icon({
        iconUrl: url,
        iconSize: [70, 70],
        iconAnchor: [35, 70],
        popupAnchor: [0, -70],
        className: 'fuzzy-marker',
      });

    const offerMarker = iconConfig(offerIcon);
    const needMarker = iconConfig(needIcon);

    const buttonStyle = `
      background:#fbbf24;
      color:white;
      padding:6px 10px;
      border:none;
      border-radius:8px;
      cursor:pointer;
    `;

    // Load offers
    console.log("Fetching offers from:", offersUrl);
    fetch(offersUrl, { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((offers) => {
        console.log("Loaded offers:", offers?.length || 0);
        if (Array.isArray(offers)) {
          offers.forEach((offer) => {
            const lat = offer.fuzzy_lat !== undefined ? offer.fuzzy_lat : offer.latitude;
            const lng = offer.fuzzy_lng !== undefined ? offer.fuzzy_lng : offer.longitude;
            
            if (lat && lng) {
              const popupContent = `
                <b>${offer.title}</b><br>
                ${offer.description || ""}<br><br>
                <button id="handshake-${offer.id}" style="${buttonStyle}">
                  Send Handshake
                </button>
              `;

              const marker = L.marker([lat, lng], {
                icon: offerMarker,
                opacity: 0.57,
              })
                .addTo(mapRef.current)
                .bindPopup(popupContent);

              marker.on("popupopen", () => {
                const btn = document.getElementById(`handshake-${offer.id}`);
                if (btn) btn.onclick = () => sendHandshake(offer.id);
              });

              marker.on("popupclose", () => {
                const btn = document.getElementById(`handshake-${offer.id}`);
                if (btn) btn.onclick = null;
              });

              markersRef.current.push(marker);
            }
          });
        }
      })
      .catch((err) => console.error("Offer fetch error:", err));

    // Load requests
    console.log("Fetching requests from:", requestsUrl);
    fetch(requestsUrl, { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((requests) => {
        console.log("Loaded requests:", requests?.length || 0);
        if (Array.isArray(requests)) {
          requests.forEach((req) => {
            const lat = req.fuzzy_lat !== undefined ? req.fuzzy_lat : req.latitude;
            const lng = req.fuzzy_lng !== undefined ? req.fuzzy_lng : req.longitude;
            
            if (lat && lng) {
              const marker = L.marker([lat, lng], {
                icon: needMarker,
                opacity: 0.57,
              })
                .addTo(mapRef.current)
                .bindPopup(`<b>${req.title}</b><br>${req.description || ""}`);

              markersRef.current.push(marker);
            }
          });
        }
      })
      .catch((err) => console.error("Request fetch error:", err));
  }, [API_BASE_URL, appliedFilters, userLocation, sendHandshake]);

  // Handle filter changes - only called when Apply button is clicked
  const handleFilterChange = useCallback((newFilters) => {
    setAppliedFilters(newFilters);
    // Update circle radius if distance filter is applied
    if (newFilters.distance && userLocation) {
      updateDistanceCircle(userLocation.lat, userLocation.lng, newFilters.distance);
    } else if (!newFilters.distance && userLocation) {
      // Remove circle if distance filter is cleared
      if (distanceCircleRef.current) {
        mapRef.current?.removeLayer(distanceCircleRef.current);
        distanceCircleRef.current = null;
      }
    }
  }, [userLocation, updateDistanceCircle]);

  // Initialize map and automatically get user location
  useEffect(() => {
    const map = L.map("map", {
      minZoom: 12,
      maxZoom: 17,
    }).setView([41.085339, 29.045607], 15);

    L.tileLayer(
      `https://api.maptiler.com/maps/pastel/256/{z}/{x}/{y}.png?key=GpfLIUr8LS7XQvnlcAnU`,
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors | © <a href="https://www.maptiler.com/">MapTiler</a>',
      }
    ).addTo(map);

    mapRef.current = map;

    // Automatically get user location when map loads
    getUserLocation();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [getUserLocation]);

  // Load markers when appliedFilters change, userLocation changes, or map is ready
  useEffect(() => {
    if (mapRef.current) {
      // Small delay to ensure map is fully initialized
      const timer = setTimeout(() => {
        loadMarkers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loadMarkers, userLocation]);

  // Add user location marker if available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      addUserLocationMarker(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, addUserLocationMarker]);

  const tags = ["Cooking", "Tutoring", "Storytelling", "Companionship", "Errands"];

  return (
    <div className="text-center bg-yellow-50 min-h-screen">
      <style>{`
        .leaflet-marker-icon {
          opacity: 0.57 !important;
        }
        .leaflet-marker-icon:hover {
          opacity: 0.57 !important;
        }
        .leaflet-marker-icon.fuzzy-marker {
          opacity: 0.57 !important;
        }
        .leaflet-marker-icon.fuzzy-marker:hover {
          opacity: 0.57 !important;
        }
        .leaflet-marker-icon.user-location-marker {
          opacity: 1 !important;
        }
        .leaflet-popup-content-wrapper .leaflet-popup-content {
          opacity: 1 !important;
        }
      `}</style>
      <section className="py-20 bg-gradient-to-b from-amber-100 to-yellow-50">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
          Welcome back, <span className="text-amber-600">Bee</span>
        </h1>
        <p className="text-gray-600 mb-6">
          Explore new opportunities and exchange your <b>beellars</b>.
        </p>
      </section>

      <button
        onClick={handleCreateClick}
        className="mb-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600
                   text-white font-semibold py-4 px-8 rounded-xl shadow-lg text-xl transition-all duration-200"
      >
        Create Post
      </button>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-semibold mb-6 text-amber-600">Honey Map</h2>
          
          {/* Filter Controls */}
          <div className="mb-4">
            <MapFilters 
              onFilterChange={handleFilterChange}
              onDistanceChange={handleDistanceChange}
              userLocation={userLocation}
            />
          </div>

          {/* Location status (optional - can be removed if not needed) */}
          {!userLocation && (
            <div className="mb-4 text-center">
              <p className="text-sm text-amber-600">
                ⚠️ Location access denied. Map showing default view.
              </p>
            </div>
          )}

          {/* Map */}
          <div
            id="map"
            className="w-full h-96 mx-auto rounded-xl shadow-lg border border-amber-200"
          ></div>
        </div>
      </section>

      <section className="py-12 bg-amber-100/50">
        <h3 className="text-2xl font-semibold mb-4">Explore by Tag</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-amber-300 hover:bg-amber-500 text-gray-800 font-medium px-4 py-2 rounded-full cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
