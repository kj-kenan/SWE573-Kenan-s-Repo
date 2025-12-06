import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    if (!email || !email.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/password-reset-request/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          data.message ||
            "If an account with that email exists, a password reset email has been sent."
        );
        setEmail(""); // Clear email for privacy
      } else {
        setError(data.error || "Failed to send password reset email.");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-yellow-50 flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-amber-200">
        <h1 className="text-3xl font-bold text-center text-amber-700 mb-2">
          Forgot Password
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-amber-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 
                       text-white font-semibold py-3 px-6 rounded-xl shadow-lg text-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-amber-600 hover:text-amber-800 font-semibold transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

