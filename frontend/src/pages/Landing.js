import React from "react";
import "../App.css";

export default function Landing() {

  const goLogin = () => {
    window.location = "/login";
  };

  const goSignup = () => {
    window.location = "/signup";
  };

  const startInterview = () => {
    window.location = "/login";
  };

  return (
    <div>

      {/* NAVBAR */}
      <div className="navbar">

        <div className="logo">
          TechTalk AI
        </div>

        <div className="nav-items">
          <span
            className="active"
            onClick={goLogin}
          >
            Login
          </span>

          <span onClick={goSignup}>
            Sign Up
          </span>
        </div>

      </div>


      {/* HERO SECTION */}
      <div className="hero">

        <h1>
          Ace Your Job Interview with
        </h1>

        <h1 className="highlight">
          TechTalk AI
        </h1>

        <p>
          AI powered technical interview simulator <br />
          Practice real interview questions with voice AI
        </p>

        <button
          className="hero-btn"
          onClick={startInterview}
        >
          Start Interview
        </button>

      </div>


      {/* FEATURES */}
      <div className="features">

        <div className="feature-card">
          <h3>AI Interviewer</h3>
          <p>
            Our AI asks technical interview questions based on your resume.
          </p>
        </div>

        <div className="feature-card">
          <h3>Emotion Detection</h3>
          <p>
            Analyze confidence, stress and facial expressions during interview.
          </p>
        </div>

        <div className="feature-card">
          <h3>Instant Feedback</h3>
          <p>
            Receive performance analysis and evaluation after the interview.
          </p>
        </div>

      </div>


      {/* FOOTER */}
      <div style={{
        textAlign: "center",
        marginTop: "60px",
        paddingBottom: "20px",
        color: "#64748b"
      }}>
        © 2026 TechTalk AI – Intelligent Interview Preparation Platform
      </div>

    </div>
  );
}