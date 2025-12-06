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
import profileIcon from "./assets/profile.svg";
import forumIcon from "./assets/forum.svg";
import inboxIcon from "./assets/inbox.svg";
import logoutIcon from "./assets/logout.svg"; 
//import MyOffers from "./components/MyOffers";
import CommunityServices from "./components/CommunityServices";
import OfferDetail from "./components/OfferDetail";
import RequestDetail from "./components/RequestDetail";
import EditOffer from "./components/EditOffer";
import EditRequest from "./components/EditRequest";
import HandshakesList from "./components/HandshakesList";
import Forum from "./components/Forum";
import PublicProfile from "./components/PublicProfile";
import Inbox from "./components/Inbox";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

function Navbar({ onLogout }) {
  const location = useLocation();
  const isLoggedIn = Boolean(localStorage.getItem("access"));

  if (
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/activate/") ||
    location.pathname === "/check-email" ||
    location.pathname === "/resend-activation" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password/")
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

        {/* Offers & Requests */}
        <Link
          to="/offers"
          className={`hover:text-amber-800 flex items-center gap-1 transition-colors ${
            location.pathname.startsWith("/offers") || location.pathname.startsWith("/requests") ? "font-bold" : ""
          }`}
        >
          <img
            src={offersIcon}
            alt="Offers & Requests"
            className="w-6 h-6"
            style={{ filter: "invert(12%) sepia(15%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
          />
          <span>Offers & Requests</span>
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
          to="/inbox"
          className="hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <img
            src={inboxIcon}
            alt="Inbox"
            className="w-6 h-6"
            style={{ filter: "invert(12%) sepia(15%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
          />
          <span>Inbox</span>
        </Link>

        <Link
          to="/forum"
          className="hover:text-amber-800 flex items-center gap-1 transition-colors"
        >
          <img
            src={forumIcon}
            alt="Forum"
            className="w-6 h-6"
            style={{ filter: "invert(12%) sepia(15%) saturate(900%) hue-rotate(10deg) brightness(60%) contrast(90%)" }}
          />
          <span>Forum</span>
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile" element={<ProfileList />} />
          <Route path="/profile/:userId" element={<ProfileList />} />
          <Route path="/create" element={<CreateService />} />
          <Route path="/offers" element={<CommunityServices />} />
          <Route path="/offers/all" element={<CommunityServices />} />
          <Route path="/offers/my" element={<CommunityServices />} />
          <Route path="/requests/all" element={<CommunityServices />} />
          <Route path="/requests/my" element={<CommunityServices />} />
          <Route path="/offers/:id" element={<OfferDetail />} />
          <Route path="/offers/:id/edit" element={<EditOffer />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/requests/:id/edit" element={<EditRequest />} />
          <Route path="/handshakes" element={<HandshakesList />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:topicId" element={<Forum />} />
          <Route path="/profile/:id" element={<PublicProfile />} />
          <Route path="/inbox" element={<Inbox />} />
        </Routes>
      </main>

      <footer className="bg-gradient-to-r from-amber-400 to-yellow-300 text-center py-3">
        <p>© 2025 The Hive</p>
      </footer>
    </div>
  );
}

export default App;
