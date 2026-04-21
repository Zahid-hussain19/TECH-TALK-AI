import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleSetPassword = async () => {
    const user = JSON.parse(localStorage.getItem("tempUser"));

    const res = await fetch(`${API_BASE}/set-password`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        email: user.email,
        password: password,
      }),
    });

    const data = await res.json();

    localStorage.setItem("user", JSON.stringify(data));
    navigate("/interview");
  };

  return (
    <div className="auth-page">
      <div className="card glow">
        <h2>Set Password 🔐</h2>
        <input
          type="password"
          placeholder="New Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="primary" onClick={handleSetPassword}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default SetPassword;