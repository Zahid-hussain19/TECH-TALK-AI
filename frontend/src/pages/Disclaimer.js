import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../App.css";

const Disclaimer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [agreed, setAgreed] = useState(false);

  const startInterview = () => {
    if (!agreed) {
      alert("Please agree to the terms to proceed.");
      return;
    }

    const msg = new SpeechSynthesisUtterance(
      "Secure connection established. Entering AI Interview Room."
    );
    msg.rate = 1.1;
    window.speechSynthesis.speak(msg);

    // Give speech time to start before navigating
    setTimeout(() => {
      navigate("/interview", { state: location.state });
    }, 1500);
  };

  return (
    <div className="disclaimer-container">
      <div className="disclaimer-card glass">
        <div className="security-icon-wrapper">
          <svg className="security-shield" viewBox="0 0 24 24" fill="none" stroke="url(#blue-glow)" strokeWidth="1.5">
            <defs>
              <linearGradient id="blue-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00c8ff" />
                <stop offset="100%" stopColor="#0077ff" />
              </linearGradient>
            </defs>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="glow-text disclaimer-title">Compliance Check</h2>
        <p className="disclaimer-subtitle">
          Please review the guidelines before stepping into the virtual
          interview room. The AI pipeline will evaluate your responses.
        </p>

        <ul className="disclaimer-list">
          <li>
            <div className="bullet-glow"></div> Sit in a quiet, well-lit environment. Vision AI continuously scans your expressions.
          </li>
          <li>
            <div className="bullet-glow"></div> Use a high-quality microphone for optimal Semantic NLP analysis.
          </li>
          <li>
            <div className="bullet-glow"></div> Erratic head movements or suspicious background noise will securely flag your report.
          </li>
          <li>
            <div className="bullet-glow"></div> Speak clearly. Say "Skip" to instantly pass on difficult questions and adjust dynamic difficulty.
          </li>
        </ul>

        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="checkmark-text">
            I verify my environment and consent to the recording.
          </span>
        </label>

        <button
          className={`primary-btn disclaimer-btn ${agreed ? "glow-btn" : "btn-disabled"}`}
          onClick={startInterview}
          disabled={!agreed}
        >
          {agreed ? "Initialize Secure Session" : "Awaiting Consent..."}
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;