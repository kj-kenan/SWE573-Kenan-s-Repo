import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    
 

    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/", {
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
        // Save tokens in localStorage
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
    <div style={{ maxWidth: "400px", margin: "40px auto", textAlign: "center" }}>
      <h2>Login</h2>
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
        <button type="submit" style={{ width: "100%", padding: "8px" }}>
          Login
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "20px", color: "green" }}>{message}</p>
      )}
    </div>
  );
}

export default Login;
