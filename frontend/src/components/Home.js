// src/components/Home.js
import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import offerIcon from "../assets/offer.png";
import needIcon from "../assets/need.png";

function Home() {
  const navigate = useNavigate();

  const handleCreateClick = () => {
    navigate("/create");
  };

  useEffect(() => {
    // 🌍 Harita oluştur
    const map = L.map("map").setView([41.0082, 28.9784], 12);

    // 🍯 Pastel MapTiler tile layer
    L.tileLayer(
      `https://api.maptiler.com/maps/pastel/256/{z}/{x}/{y}.png?key=GpfLIUr8LS7XQvnlcAnU`,
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors | Map data © <a href="https://www.maptiler.com/">MapTiler</a>',
      }
    ).addTo(map);

    // 🧈 Özel marker ikonları
    const offerMarker = L.icon({
      iconUrl: offerIcon,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    const needMarker = L.icon({
      iconUrl: needIcon,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    // 🐝 Offers çek
    fetch("http://127.0.0.1:8000/api/offers/")
      .then((res) => res.json())
      .then((offers) => {
        offers.forEach((offer) => {
          if (offer.latitude && offer.longitude) {
            L.marker([offer.latitude, offer.longitude], { icon: offerMarker })
              .addTo(map)
              .bindPopup(`<b>🍯 ${offer.title}</b><br>${offer.description || ""}`);
          }
        });
      })
      .catch((err) => console.error("Offer fetch error:", err));

    // 💬 Needs çek
    fetch("http://127.0.0.1:8000/api/requests/")
      .then((res) => res.json())
      .then((requests) => {
        requests.forEach((req) => {
          if (req.latitude && req.longitude) {
            L.marker([req.latitude, req.longitude], { icon: needMarker })
              .addTo(map)
              .bindPopup(`<b>💬 ${req.title}</b><br>${req.description || ""}`);
          }
        });
      })
      .catch((err) => console.error("Request fetch error:", err));

    // 🧹 Temizlik
    return () => map.remove();
  }, []);

  const tags = ["Cooking", "Tutoring", "Storytelling", "Companionship", "Errands"];

  return (
    <div className="text-center bg-yellow-50 min-h-screen">
      <section className="py-20 bg-gradient-to-b from-amber-100 to-yellow-50">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
          Welcome back, <span className="text-amber-600">Bee!</span>
        </h1>
        <p className="text-gray-600 mb-6">
          Explore new opportunities and exchange your <b>beellars</b>.
        </p>
      </section>

      {/* 🧭 Create Post Button */}
      <button
        onClick={handleCreateClick}
        className="mb-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600
                   text-white font-semibold py-4 px-8 rounded-xl shadow-lg text-xl transition-all duration-200"
      >
        Create Post
      </button>

      {/* 🗺️ Honey Map */}
      <section className="py-12">
        <h2 className="text-4xl font-semibold mb-6">
          <span className="text-amber-600">Honey Map</span>
        </h2>
        <div
          id="map"
          className="w-4/5 h-96 mx-auto rounded-xl shadow-lg border border-amber-200"
        ></div>
      </section>

      {/* 🍯 Tags */}
      <section className="py-12 bg-amber-100/50">
        <h3 className="text-2xl font-semibold mb-4">Explore by Tag:</h3>
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
