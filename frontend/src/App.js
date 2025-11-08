// src/App.js
import React from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Landing from "./components/Landing";
import Home from "./components/Home";
import OffersList from "./components/OffersList";
import Register from "./components/Register";
import Login from "./components/Login";
import ProfileList from "./components/ProfileList";

/* 🐝 Navbar Component
   - Hidden on Landing ("/")
   - Visible for authenticated pages
*/
function Navbar({ onLogout }) {
  const location = useLocation();

  // Hide Navbar on the Landing page
  if (location.pathname === "/") return null;

  return (
    <header className="flex justify-between items-center bg-gradient-to-r from-amber-400 to-orange-500 shadow-md px-10 py-4">
      <div className="text-2xl font-bold">🐝 The Hive</div>
      <nav className="space-x-6 text-lg font-semibold">
        <Link to="/home" className="hover:text-orange-800">
          🏠 Home
        </Link>
        <Link to="/offers" className="hover:text-orange-800">
          📬 My Offers & Needs
        </Link>
        <Link to="/timebank" className="hover:text-orange-800">
          🍯 TimeBank
        </Link>
        <Link to="/profile" className="hover:text-orange-800">
          👤 Profile
        </Link>
        <Link to="/settings" className="hover:text-orange-800">
          ⚙️ Settings
        </Link>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="text-red-700 font-semibold hover:text-red-900"
        >
          🚪 Log out
        </button>
      </nav>
    </header>
  );
}

/* 🐝 Main App Component
   - Defines global routes and layout
   - Controls logout logic and routing
*/
function App() {
  const navigate = useNavigate();

  // Clear stored tokens and redirect to landing page
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-yellow-50 text-gray-800 font-nunito">
      {/* Navbar appears on all routes except Landing */}
      <Navbar onLogout={handleLogout} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/offers" element={<OffersList />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProfileList />} />
          <Route
            path="/settings"
            element={
              <h1 className="text-center mt-20 text-3xl">⚙️ Settings Page</h1>
            }
          />
          <Route
            path="/timebank"
            element={
              <h1 className="text-center mt-20 text-3xl">🍯 TimeBank Page</h1>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-amber-400 to-yellow-300 text-center py-3">
        <p>© 2025 The Hive | Built with ❤️ using React + Django</p>
      </footer>
    </div>
  );
}

export default App;
