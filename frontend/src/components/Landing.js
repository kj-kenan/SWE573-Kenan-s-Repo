// src/components/Landing.js
import React from "react";
import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-yellow-100 to-amber-100 text-center font-nunito">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-4">
        Share your <span className="text-amber-600">beellar</span>, not your dollars.
      </h1>
      <p className="text-lg text-gray-600 max-w-md mb-8">
        Join The Hive — a community built on kindness and cooperation.
      </p>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="bg-gradient-to-r from-orange-400 to-amber-500 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:scale-105 transition-transform"
        >
          Register
        </Link>
      </div>
    </div>
  );
}

export default Landing;
