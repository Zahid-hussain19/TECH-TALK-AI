import React from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🎉 Welcome to TechTalk AI</h2>

        <p style={{marginTop:"10px", color:"#ccc"}}>
          We’ve sent a confirmation email to your inbox 📩
        </p>

        <button
          className="primary-btn"
          onClick={() => navigate("/resume")}
        >
          Upload Resume 🚀
        </button>
      </div>
    </div>
  );
};

export default Welcome;