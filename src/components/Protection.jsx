import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin12") {
      localStorage.setItem("adminAuth", "true");
      navigate("/admin");   // or "/manage-questions" – your choice
    } else {
      setError("❌ Invalid username or password");
    }
  };

  return (
    <div className="page-card" style={{ maxWidth: "400px", marginTop: "80px" }}>
      <h2>🔐 Admin Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && (
        <p style={{ color: "#dc3545", marginTop: "12px", textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default AdminLogin;