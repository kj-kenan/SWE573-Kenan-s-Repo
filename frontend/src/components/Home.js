import React, { useEffect, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import offerIcon from "../assets/offer.png";
import needIcon from "../assets/need.png";

function Home() {
  const navigate = useNavigate();

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  const handleCreateClick = () => navigate("/create");

  // --- Secure handshake function ---
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
        } else {
          const err = await response.json();
          alert("Error: " + (err.detail || err.error || "Request failed"));
        }
      } catch (err) {
        alert("Network error: " + err.message);
      }
    },
    [API_BASE_URL]
  );

  useEffect(() => {
    const map = L.map("map").setView([41.085339, 29.045607], 15);

    L.tileLayer(
      `https://api.maptiler.com/maps/pastel/256/{z}/{x}/{y}.png?key=GpfLIUr8LS7XQvnlcAnU`,
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors | © <a href="https://www.maptiler.com/">MapTiler</a>',
      }
    ).addTo(map);

    const iconConfig = (url) =>
      L.icon({
        iconUrl: url,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
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

    // --- Load offers ---
    fetch(`${API_BASE_URL}/api/offers/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    })
      .then((res) => res.json())
      .then((offers) => {
        if (Array.isArray(offers)) {
          offers.forEach((offer) => {
            if (offer.latitude && offer.longitude) {
              const popupContent = `
                <b>${offer.title}</b><br>
                ${offer.description || ""}<br><br>
                <button id="handshake-${offer.id}" style="${buttonStyle}">
                  Send Handshake
                </button>
              `;

              const marker = L.marker([offer.latitude, offer.longitude], {
                icon: offerMarker,
              })
                .addTo(map)
                .bindPopup(popupContent);

              marker.on("popupopen", () => {
                const btn = document.getElementById(`handshake-${offer.id}`);
                if (btn) btn.onclick = () => sendHandshake(offer.id);
              });

              marker.on("popupclose", () => {
                const btn = document.getElementById(`handshake-${offer.id}`);
                if (btn) btn.onclick = null;
              });
            }
          });
        } else {
          console.error("Unexpected offer data:", offers);
        }
      })
      .catch((err) => console.error("Offer fetch error:", err));

    // --- Load requests ---
    fetch(`${API_BASE_URL}/api/requests/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    })
      .then((res) => res.json())
      .then((requests) => {
        if (Array.isArray(requests)) {
          requests.forEach((req) => {
            if (req.latitude && req.longitude) {
              L.marker([req.latitude, req.longitude], { icon: needMarker })
                .addTo(map)
                .bindPopup(`<b>${req.title}</b><br>${req.description || ""}`);
            }
          });
        } else {
          console.error("Unexpected request data:", requests);
        }
      })
      .catch((err) => console.error("Request fetch error:", err));

    return () => map.remove();
  }, [API_BASE_URL, sendHandshake]);

  const tags = ["Cooking", "Tutoring", "Storytelling", "Companionship", "Errands"];

  return (
    <div className="text-center bg-yellow-50 min-h-screen">
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

      <section className="py-12">
        <h2 className="text-4xl font-semibold mb-6 text-amber-600">Honey Map</h2>
        <div
          id="map"
          className="w-4/5 h-96 mx-auto rounded-xl shadow-lg border border-amber-200"
        ></div>
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
