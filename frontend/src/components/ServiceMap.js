import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Create larger icon for fuzzy location markers
const largerIcon = new Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [70, 70], // Larger for better visibility with fuzzy locations
  iconAnchor: [35, 70], // Adjusted for new size
  popupAnchor: [0, -70], // Adjusted for new size
  shadowSize: [55, 55],
  shadowAnchor: [18, 55],
});

function ServiceMap() {
  const [offers, setOffers] = useState([]);

  // ✅ Environment variable + fallback
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    // Fetch offers from the backend API
    fetch(`${API_BASE_URL}/api/offers/`)
      .then((res) => res.json())
      .then((data) => setOffers(data))
      .catch((err) => console.error("Failed to fetch offers:", err));
  }, [API_BASE_URL]);

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center">
      <style>{`
        .leaflet-marker-icon {
          opacity: 0.57 !important;
        }
        .leaflet-marker-icon:hover {
          opacity: 0.57 !important;
        }
        .leaflet-marker-icon:active {
          opacity: 0.57 !important;
        }
        .leaflet-popup-content-wrapper .leaflet-popup-content {
          opacity: 1 !important;
        }
      `}</style>
      <h2 className="text-3xl font-bold text-amber-700 my-6">🗺️ Service Map</h2>
      <div className="w-full max-w-5xl h-[600px] border border-amber-300 rounded-2xl shadow">
        <MapContainer
          center={[41.0082, 28.9784]} // Default center: Istanbul
          zoom={12}
          minZoom={12}  // Prevent zooming out too much
          maxZoom={17}  // Prevent zooming in to house-level detail
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {offers.map(
            (offer, i) => {
              // Use fuzzy coordinates for map display if available, otherwise fall back to real coordinates
              const lat = offer.fuzzy_lat !== undefined ? offer.fuzzy_lat : offer.latitude;
              const lng = offer.fuzzy_lng !== undefined ? offer.fuzzy_lng : offer.longitude;
              
              return (
                lat &&
                lng && (
                  <Marker 
                    key={i} 
                    position={[lat, lng]} 
                    icon={largerIcon}
                    opacity={0.57}
                  >
                    <Popup>
                      <strong>{offer.title}</strong>
                      <br />
                      {offer.description}
                    </Popup>
                  </Marker>
                )
              );
            }
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default ServiceMap;
