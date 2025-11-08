// src/components/Home.js
import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function Home() {
  useEffect(() => {
    const map = L.map("map").setView([41.0082, 28.9784], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.marker([41.0082, 28.9784])
      .addTo(map)
      .bindPopup("<b>🐝 Welcome back to The Hive!</b>")
      .openPopup();
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
          Explore new opportunities and exchange your <b>beellar</b>.
        </p>
      </section>

      <section className="py-12">
        <h2 className="text-4xl font-semibold mb-6"><span className="text-amber-600">Honey Map</span></h2>
        <div
          id="map"
          className="w-4/5 h-96 mx-auto rounded-xl shadow-lg border border-amber-200"
        ></div>
      </section>

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
