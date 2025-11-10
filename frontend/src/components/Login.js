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

    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        setMessage(`Welcome, ${username}!`);
        navigate("/home");
      } else {
        setMessage(data.detail || "Invalid credentials.");
      }
    } catch (error) {
      setMessage("Server error. Please try again.");
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
