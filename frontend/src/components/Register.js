import React, { useState } from "react";

function Register() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Form gönderildiğinde çalışacak fonksiyon
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
          email: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message); // Başarılı kayıt mesajı
      } else {
        setMessage(data.error || "Something went wrong.");
      }
    } catch (error) {
      setMessage("Server error. Please try again.");
    }
  };

  // Sayfanın görünümü
  return (
    <div style={{ maxWidth: "400px", margin: "40px auto", textAlign: "center" }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          Register
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "20px", color: "green" }}>{message}</p>
      )}
    </div>
  );
}

export default Register;
