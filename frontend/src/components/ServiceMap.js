import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Marker icon düzeltmesi (Leaflet varsayılan yolu kullanmazsa)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function ServiceMap() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/offers/")
      .then((res) => res.json())
      .then((data) => setOffers(data))
      .catch((err) => console.error("Failed to fetch offers:", err));
  }, []);

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-amber-700 my-6">🗺️ Service Map</h2>
      <div className="w-full max-w-5xl h-[600px] border border-amber-300 rounded-2xl shadow">
        <MapContainer
          center={[41.0082, 28.9784]} // İstanbul default
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {offers.map(
            (offer, i) =>
              offer.latitude &&
              offer.longitude && (
                <Marker
                  key={i}
                  position={[offer.latitude, offer.longitude]}
                >
                  <Popup>
                    <strong>{offer.title}</strong>
                    <br />
                    {offer.description}
                  </Popup>
                </Marker>
              )
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default ServiceMap;
