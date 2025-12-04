import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://swe573-kenan-s-repo.onrender.com";

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(""); // önceki hatayı temizle

    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      // content-type kontrolü: JSON değilse hata fırlat
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Unexpected response type: ${contentType}`);
      }

      const data = await response.json();

      if (response.ok && data.access && data.refresh) {
        // ✅ Token'ları kaydet
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        setMessage(`Welcome, ${username}!`);
        navigate("/home");
      } else {
        // Check if email is not verified
        if (response.status === 403 && data.error === "email_not_verified") {
          setMessage(data.message || "Please verify your email address before logging in.");
          // Redirect to resend activation page after showing message
          setTimeout(() => {
            navigate("/resend-activation", { 
              state: { 
                message: data.message || "Please verify your email address before logging in.",
                username: username
              } 
            });
          }, 2000);
        } else {
          // login başarısız
          setMessage(data.detail || data.error || "Invalid credentials. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Server error. Please try again later.");
    }
  };

  return (
    <div
      style={{ maxWidth: "400px", margin: "40px auto", textAlign: "center" }}
    >
      <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
        <span className="text-amber-600">Login</span>
      </h1>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600
             text-white font-semibold py-3 px-6 rounded-xl shadow-lg text-lg transition-all duration-200"
        >
          Login
        </button>
      </form>

      {message && (
        <p className="mt-4 text-red-600 font-medium">{message}</p>
      )}

      {/* 🔸 Register yönlendirmesi */}
      <p className="mt-6 text-gray-600 text-sm">
        Don’t have an account?{" "}
        <button
          onClick={() => navigate("/register")}
          className="text-amber-600 font-semibold hover:text-orange-500 transition-colors duration-200"
        >
          Register here
        </button>
      </p>
    </div>
  );
}

export default Login;
