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
import Register from "./components/Register";
import Login from "./components/Login";
import CheckEmail from "./components/CheckEmail";
import Activate from "./components/Activate";
import ResendActivation from "./components/ResendActivation";
import ProfileList from "./components/ProfileList";
import CreateService from "./components/CreateService";
//import ServiceMap from "./components/ServiceMap";
import thehiveicon from "./assets/thehive.png";
import homeIcon from "./assets/home.svg";
import offersIcon from "./assets/offers.svg";
import timebankIcon from "./assets/timebank.svg";
import profileIcon from "./assets/profile.svg";
import settingsIcon from "./assets/settings.svg";
import logoutIcon from "./assets/logout.svg"; 
//import MyOffers from "./components/MyOffers";
import OffersList from "./components/OfferList";
import TimeBank from "./components/TimeBank";
import OfferDetail from "./components/OfferDetail";
import RequestDetail from "./components/RequestDetail";
import EditOffer from "./components/EditOffer";
import EditRequest from "./components/EditRequest";
import HandshakesList from "./components/HandshakesList";

function Navbar({ onLogout }) {
  const location = useLocation();
  const [showOffersMenu, setShowOffersMenu] = React.useState(false);
  const isLoggedIn = Boolean(localStorage.getItem("access"));

  if (
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/activate/") ||
    location.pathname === "/check-email" ||
    location.pathname === "/resend-activation"
  )
    return null;

  return (
    <header className="flex justify-between items-center bg-gradient-to-r from-amber-400 to-orange-500 shadow-md px-10 py-4">
      {/* Logo and The Hive*/}
      <div className="flex items-center gap-2">
        <img
          src={thehiveicon}
          alt="The Hive"
          className="w-8 h-8 object-contain"
          draggable="false"
        />
        <span className="text-2xl font-bold text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] tracking-wide">
          The Hive
        </span>
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-end gap-6 text-lg font-semibold text-amber-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
        <Link
          to="/home"
          className="hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <img
            src={homeIcon}
            alt="Home"
            className="w-6 h-6"
            style={{ filter: "invert(12%) sepia(25%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
          />
          <span>Home</span>
        </Link>

        {/* Offers & Requests Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOffersMenu(!showOffersMenu)}
            className="hover:text-amber-800 flex items-center gap-1 transition-colors"
            onBlur={() => setTimeout(() => setShowOffersMenu(false), 200)}
          >
            <img
              src={offersIcon}
              alt="Offers"
              className="w-6 h-6"
              style={{ filter: "invert(12%) sepia(15%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
            />
            <span>Offers & Requests</span>
            <span className="text-xs ml-1">▼</span>
          </button>
          {/* Dropdown Menu */}
          {showOffersMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border border-amber-200">
              <div className="py-2">
                <Link
                  to="/offers/all"
                  onClick={() => setShowOffersMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                >
                  All Offers
                </Link>
                {isLoggedIn && (
                  <Link
                    to="/offers/my"
                    onClick={() => setShowOffersMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                  >
                    My Offers
                  </Link>
                )}
                <Link
                  to="/requests/all"
                  onClick={() => setShowOffersMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 border-t border-amber-100"
                >
                  All Requests
                </Link>
                {isLoggedIn && (
                  <Link
                    to="/requests/my"
                    onClick={() => setShowOffersMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                  >
                    My Requests
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <Link
          to="/timebank"
          className="hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <img
            src={timebankIcon}
            alt="TimeBank"
            className="w-6 h-6"
            style={{ filter: "invert(12%) sepia(15%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
          />
          <span>TimeBank</span>
        </Link>

        <Link
          to="/profile"
          className="hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <img
            src={profileIcon}
            alt="Profile"
            className="w-6 h-6"
            style={{ filter: "invert(12%) sepia(15%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
          />
          <span>Profile</span>
        </Link>

        <Link
          to="/settings"
          className="hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <img
            src={settingsIcon}
            alt="Settings"
            className="w-6 h-6"
            style={{ filter: "invert(12%) sepia(15%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
          />
          <span>Settings</span>
        </Link>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <img
            src={logoutIcon}
            alt="Logout"
            className="w-6 h-6"
            style={{ filter: "invert(12%) sepia(15%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
          />
          <span>Logout</span>
        </button>
      </nav>
    </header>
  );
}

function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-yellow-50 text-gray-800 font-nunito">
      <Navbar onLogout={handleLogout} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/activate/:token" element={<Activate />} />
          <Route path="/resend-activation" element={<ResendActivation />} />
          <Route path="/profile" element={<ProfileList />} />
          <Route path="/profile/:userId" element={<ProfileList />} />
          <Route path="/create" element={<CreateService />} />
          <Route path="/offers" element={<OffersList defaultTab="offers" defaultSubTab="all" />} />
          <Route path="/offers/all" element={<OffersList defaultTab="offers" defaultSubTab="all" />} />
          <Route path="/offers/my" element={<OffersList defaultTab="offers" defaultSubTab="my" />} />
          <Route path="/requests/all" element={<OffersList defaultTab="requests" defaultSubTab="all" />} />
          <Route path="/requests/my" element={<OffersList defaultTab="requests" defaultSubTab="my" />} />
          <Route path="/offers/:id" element={<OfferDetail />} />
          <Route path="/offers/:id/edit" element={<EditOffer />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/requests/:id/edit" element={<EditRequest />} />
          <Route path="/handshakes" element={<HandshakesList />} />
          <Route path="/settings" element={<h1 className="text-center mt-20 text-3xl">Settings Page</h1>}/>
          <Route path="/timebank" element={<TimeBank/>}/>
        </Routes>
      </main>

      <footer className="bg-gradient-to-r from-amber-400 to-yellow-300 text-center py-3">
        <p>© 2025 The Hive</p>
      </footer>
    </div>
  );
}

export default App;
