import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function Activate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid activation link. No token provided.");
      return;
    }

    // Call activation endpoint
    const activateAccount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/activate/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully! You can now log in.");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Activation failed. Please try again.");
        }
      } catch (error) {
        console.error("Activation error:", error);
        setStatus("error");
        setMessage("Server error. Please try again later.");
      }
    };

    activateAccount();
  }, [token, navigate, API_BASE_URL]);

  return (
    <div style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center", padding: "20px" }}>
      <div
        style={{
          backgroundColor: status === "success" ? "#d1fae5" : status === "error" ? "#fee2e2" : "#f3f4f6",
          border: `2px solid ${status === "success" ? "#10b981" : status === "error" ? "#ef4444" : "#9ca3af"}`,
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        {status === "loading" && (
          <>
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
              Activating your account...
            </h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
              <span className="text-green-600">Email Verified!</span>
            </h1>
            <p className="text-lg text-gray-700 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting to login page in a few seconds...
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600
                 text-white font-semibold py-3 px-6 rounded-xl shadow-lg text-lg transition-all duration-200"
            >
              Go to Login
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
              <span className="text-red-600">Activation Failed</span>
            </h1>
            <p className="text-lg text-gray-700 mb-4">{message}</p>
            <div style={{ marginTop: "30px" }}>
              <button
                onClick={() => navigate("/resend-activation")}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600
                   text-white font-semibold py-3 px-6 rounded-xl shadow-lg text-lg transition-all duration-200"
                style={{ marginBottom: "15px" }}
              >
                Request New Activation Link
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl
                   transition-all duration-200"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Activate;



