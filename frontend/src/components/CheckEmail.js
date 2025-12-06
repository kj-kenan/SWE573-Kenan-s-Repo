import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function CheckEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "your email";

  return (
    <div style={{ maxWidth: "500px", margin: "60px auto", textAlign: "center", padding: "20px" }}>
      <div style={{ 
        backgroundColor: "#fef3c7", 
        border: "2px solid #f59e0b", 
        borderRadius: "12px", 
        padding: "30px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      }}>
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
          <span className="text-amber-600">Check Your Email</span>
        </h1>
        
        <div style={{ marginTop: "30px", marginBottom: "30px" }}>
          <p className="text-lg text-gray-700 mb-4">
            We've sent an activation link to <strong>{email}</strong>
          </p>
          <p className="text-gray-600 mb-4">
            Please check your inbox and click the activation link to verify your email address.
          </p>
          <p className="text-sm text-gray-500">
            The activation link will expire in 24 hours.
          </p>
        </div>

        <div style={{ marginTop: "30px" }}>
          <button
            onClick={() => navigate("/resend-activation")}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600
               text-white font-semibold py-3 px-6 rounded-xl shadow-lg text-lg transition-all duration-200"
            style={{ marginBottom: "15px" }}
          >
            Didn't receive the email? Resend activation link
          </button>
          
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl
               transition-all duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckEmail;



