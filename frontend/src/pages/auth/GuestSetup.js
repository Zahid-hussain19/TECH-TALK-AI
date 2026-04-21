import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const GuestSetup = () => {
  const navigate = useNavigate();
  const [branch, setBranch] = useState("");
  const [domain, setDomain] = useState("");
  const [language, setLanguage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startGuestSession = async () => {
    if (!branch || !domain || !language) {
      alert("Please fill all fields!");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate-guest-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch, domain, language })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Save questions and flag user as guest
      localStorage.setItem("questions", JSON.stringify(data.questions));
      localStorage.setItem("isGuest", "true");

      navigate("/interview");

    } catch (err) {
      alert("Error building guest interview: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container layout-v2">
      <div className="auth-card glass animate-slide-up" style={{ padding: "40px" }}>
        <h2>Guest Sandbox 🧪</h2>
        <p style={{ color: "#cbd5e1", marginBottom: "30px" }}>Select your technical parameters to instantly generate a sandbox interview.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <select value={branch} onChange={(e) => setBranch(e.target.value)} style={{ padding: "12px", borderRadius: "8px", background: "#0f172a", color: "#fff", border: "1px solid #334155" }}>
            <option value="" disabled>Select Branch</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
          </select>

          <select value={domain} onChange={(e) => setDomain(e.target.value)} style={{ padding: "12px", borderRadius: "8px", background: "#0f172a", color: "#fff", border: "1px solid #334155" }}>
            <option value="" disabled>Select Core Domain</option>
            <option value="Web Development">Web Development</option>
            <option value="Data Science & ML">Data Science & ML</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Cloud Computing">Cloud Computing</option>
            <option value="Core Hardware/Networking">Core Hardware/Networking</option>
          </select>

          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: "12px", borderRadius: "8px", background: "#0f172a", color: "#fff", border: "1px solid #334155" }}>
            <option value="" disabled>Select Language</option>
            <option value="Python">Python</option>
            <option value="JavaScript / Node.js">JavaScript / Node.js</option>
            <option value="Java">Java</option>
            <option value="C++">C++</option>
            <option value="C#">C#</option>
          </select>

          <button className="primary-btn glow-btn" onClick={startGuestSession} disabled={isLoading} style={{ marginTop: "20px" }}>
            {isLoading ? "Generating Intelligent Engine..." : "Start Instant Interview"}
          </button>
          
          <span style={{ color: "#8892b0", cursor: "pointer", marginTop: "15px", fontSize: "14px", textDecoration: "underline" }} onClick={() => navigate("/login")}>
            Cancel and Return
          </span>

        </div>
      </div>
    </div>
  );
};

export default GuestSetup;
