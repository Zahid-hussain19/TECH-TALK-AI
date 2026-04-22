import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import Welcome from "./pages/Welcome";

// Pages
import Login from "./pages/auth/Login";
import GuestSetup from "./pages/auth/GuestSetup";
import Signup from "./pages/auth/Signup";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Disclaimer from "./pages/Disclaimer";
import Interview from "./pages/InterviewRoom";

// ---------------- NAVBAR ----------------
const Navbar = ({ toggleTheme, theme }) => {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <div className="logo" onClick={() => navigate("/")}>
        TechTalk AI
      </div>

      <div className="nav-items">
        <span onClick={() => navigate("/")}>Home</span>
        <span onClick={() => navigate("/login")}>Login</span>
        <span onClick={() => navigate("/signup")}>Sign Up</span>

        {/* 🌙 DARK MODE BUTTON */}
        <div className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀️" : "🌑"}
        </div>
      </div>
    </div>
  );
};

// ---------------- HOME PAGE ----------------
const Home = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="home-container">
      <div className="hero">
        <h1>
          Ace Your Job Interview with <span className="highlight">TechTalk AI</span>
        </h1>

        <p>
          AI powered technical interview simulator. Practice real interview
          questions with voice AI.
        </p>

        <button className="hero-btn glow-btn" onClick={handleStart}>
          Start Interview 🚀
        </button>

        {/* TECHY DIVIDER */}
        <div className="techy-divider">
          <div className="techy-pulse"></div>
          <div className="techy-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="techy-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="features">
        <div className="feature-card">
          <h3>AI Interviewer</h3>
          <p>Questions based on your resume</p>
        </div>

        <div className="feature-card">
          <h3>Emotion Detection</h3>
          <p>Analyze confidence & stress</p>
        </div>

        <div className="feature-card">
          <h3>Instant Feedback</h3>
          <p>Get performance analysis</p>
        </div>
      </div>
    </div>
  );
};

// ---------------- MAIN APP ----------------
function AppWrapper() {
  const [theme, setTheme] = useState("dark");

  const location = useLocation(); // 🔥 ADD THIS

  // 🔥 APPLY THEME TO BODY
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      {/* 🔥 ONLY CHANGE: CONDITIONAL NAVBAR */}
      {!["/login", "/signup", "/verify-email", "/dashboard", "/interview", "/disclaimer", "/guest-setup"].includes(location.pathname) && (
          <Navbar toggleTheme={toggleTheme} theme={theme} />
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/guest-setup" element={<GuestSetup />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/interview" element={<Interview />} />
      </Routes>
    </>
  );
}

// ---------------- ROOT ----------------
function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;