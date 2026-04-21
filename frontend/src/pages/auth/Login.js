import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import axios from "axios";
// 🔥 FIREBASE
import { auth, provider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [pendingGoogleName, setPendingGoogleName] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // ---------------- EMAIL LOGIN ----------------
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_BASE}/login`, {
        email,
        password
      });

      if (res.data.error) {
        alert("Login Error: " + res.data.error);
        return;
      }

      const userData = {
        email: email,
        isAuthenticated: true,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Invalid credentials ❌");
    }
  };

  // ---------------- GOOGLE LOGIN ----------------

const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Send Google user details to Postgres backend to save
    const res = await axios.post(`${API_BASE}/google-login`, {
      email: user.email,
      name: user.displayName || "Google User",
    });

    if (res.data.error) {
       alert("Google Login Error: " + res.data.error);
       return;
    }

    if (res.data.must_verify) {
       setSubmittedEmail(user.email);
       setPendingGoogleName(user.displayName || "Google User");
       setIsSubmitted(true);
    } else {
       localStorage.setItem("user", JSON.stringify({ email: user.email, name: user.displayName }));
       navigate("/dashboard");
    }

  } catch (error) {
    console.log("Google error:", error);
    if (error.code === 'auth/cancelled-popup-request') {
       // Ignore or show friendly message
       console.log("Popup closed before finishing login");
    } else if (error.code === 'auth/popup-closed-by-user') {
       console.log("Popup closed");
    } else {
       alert(error.message);
    }
  }
};

  return (
  <div className="auth-container">
    <div className="auth-card glow">
      {!isSubmitted ? (
        <>
          <h2>Hi, Welcome Back 👋</h2>

          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />

            <button className="primary-btn">Login</button>
          </form>

          <p>
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")}>Signup</span>
          </p>

          <div className="divider">OR</div>

          <button className="google-btn glow-btn" onClick={handleGoogleLogin}>
            Continue with Google 🚀
          </button>

          <div style={{marginTop: "20px"}}>
             <span style={{color: "#8892b0", cursor: "pointer", textDecoration: "underline", fontSize: "14px"}} onClick={() => navigate("/guest-setup")}>
                Continue as Guest (Sandbox Mode)
             </span>
          </div>
        </>
      ) : (
        <div style={{padding: "20px"}}>
          <h2 style={{color: "#00ff9d", marginBottom: "15px"}}>Verification Sent 📩</h2>
          <p style={{color: "#cbd5e1", lineHeight: "1.6", marginBottom: "25px"}}>
            We sent a secure activation link to <strong>{submittedEmail}</strong>. 
            Please check your inbox right now and verify your identity before signing in.
          </p>
          <button className="primary-btn glow-btn" onClick={async () => {
            try {
              const checkRes = await axios.get(`${API_BASE}/check-verified/${submittedEmail}`);
              if (checkRes.data && checkRes.data.is_verified) {
                 localStorage.setItem("user", JSON.stringify({ email: submittedEmail, name: checkRes.data.name || pendingGoogleName, isAuthenticated: true }));
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

export default Login;