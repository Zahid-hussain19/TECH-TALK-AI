import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const ResumePage = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ FILE VALIDATION
  const validateFile = (file) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/png",
      "image/jpeg",
      "image/jpg"
    ];

    if (!allowedTypes.includes(file.type)) {
      return "❌ Only PDF, DOCX, or Image files allowed";
    }

    if (file.size > 5 * 1024 * 1024) {
      return "❌ File size should be less than 5MB";
    }

    return "";
  };

  // 📂 FILE SELECT
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    const validationError = validateFile(selected);

    if (validationError) {
      setError(validationError);
      setFile(null);
    } else {
      setError("");
      setFile(selected);
    }
  };

  // 🚀 UPLOAD
 const handleUpload = async () => {
  if (!file) {
    alert("Please select a file first");
    return;
  }
  const formData = new FormData();
  formData.append("file", file);

  // 🔥 PARSE RESUME
  const res = await fetch(`${API_BASE}/parse-resume`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    alert("Backend error ❌");
    return;
  }

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  // 🔥 GENERATE QUESTIONS
  const qRes = await fetch(`${API_BASE}/generate-questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      skills: data.skills,
    }),
  });

  const qData = await qRes.json();

  if (qData.error) {
    alert(qData.error);
    return;
  }

  // 🔥 SAVE QUESTIONS
  localStorage.setItem("questions", JSON.stringify(qData.questions));

  // 🔥 MOVE TO INTERVIEW
  navigate("/interview");
};
  // 🔄 CLEAR FILE
  const handleClear = () => {
    setFile(null);
    setError("");
  };

  return (
    <div className="resume-container">
      <div className="resume-card">
        <h2>Upload Your Resume 🚀</h2>
        <p>AI will analyze and start your interview</p>

        {/* DROP AREA */}
        <label className="drop-box">
          <input type="file" onChange={handleFileChange} hidden />
          {file ? (
            <span className="file-name">{file.name}</span>
          ) : (
            <span>Drag & Drop or Click to Upload</span>
          )}
        </label>

        {/* ERROR */}
        {error && <div className="error">{error}</div>}

        {/* BUTTONS */}
        <div className="btn-group">
          <button className="upload-btn" onClick={handleUpload}>
            Upload Resume
          </button>

          {file && (
            <button className="clear-btn" onClick={handleClear}>
              Re-upload
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumePage;