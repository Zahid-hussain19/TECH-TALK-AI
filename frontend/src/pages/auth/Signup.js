import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------- SIGNUP ----------------
  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE}/signup`, {
        name,
        email,
        password
      });

      if (res.data.error) {
        alert("Signup Error: " + res.data.error);
        return;
      }

      setIsSubmitted(true);
      const synth = window.speechSynthesis;
      const utterThis = new SpeechSynthesisUtterance("Please verify your email");
      synth.speak(utterThis);

    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert(err.response.data.detail);
      } else {
        alert("Signup failed ❌");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="auth-container">
    <div className="auth-card glass">
      
      {!isSubmitted ? (
        <>
          <h2>Create Account ✨</h2>

          <form onSubmit={handleSignup}>
            <input type="text" placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />

            <button className="primary-btn safe-btn" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Sign Up"}
            </button>
          </form>

          <p style={{marginTop: "20px"}}>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>
        </>
      ) : (
        <div style={{padding: "20px"}}>
          <h2 style={{color: "#00ff9d", marginBottom: "15px"}}>Verification Sent 📩</h2>
          <p style={{color: "#cbd5e1", lineHeight: "1.6", marginBottom: "25px"}}>
            We sent a secure activation link to <strong>{email}</strong>. 
            Please check your inbox right now and verify your identity before signing in.
          </p>
          <button className="primary-btn glow-btn" onClick={async () => {
            try {
              const checkRes = await axios.get(`${API_BASE}/check-verified/${email}`);
              if (checkRes.data && checkRes.data.is_verified) {
                 localStorage.setItem("user", JSON.stringify({ email: email, name: checkRes.data.name || name, isAuthenticated: true }));
                 navigate("/dashboard");
              } else {
                 alert("⚠️ Backend says: Not verified yet! Please ensure you clicked the link in your inbox.");
              }
            } catch (err) {
              alert("Server connection failed.");
            }
          }}>
            I Have Verified My Email
          </button>
        </div>
      )}

    </div>
  </div>
);
};

export default Signup;