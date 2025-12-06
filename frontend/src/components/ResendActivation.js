import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function ResendActivation() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill email if provided via location state
  React.useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!email && !username) {
      setMessage("Please provide either an email address or username");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-activation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(email && { email: email.trim() }),
          ...(username && { username: username.trim() }),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageType("success");
        setMessage(
          data.already_verified
            ? "Your email is already verified. You can log in now."
            : data.message || "Activation email has been sent. Please check your inbox."
        );
      } else {
        setMessageType("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Resend activation error:", error);
      setMessageType("error");
      setMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "60px auto", textAlign: "center", padding: "20px" }}>
      <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
        <span className="text-amber-600">Resend Activation Email</span>
      </h1>

      <p className="text-gray-600 mb-6">
        Enter your email address or username to receive a new activation link.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <p className="text-gray-500 text-sm mb-4">or</p>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600
             text-white font-semibold py-3 px-6 rounded-xl shadow-lg text-lg transition-all duration-200
             disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Resend Activation Email"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            messageType === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl
             transition-all duration-200"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default ResendActivation;



