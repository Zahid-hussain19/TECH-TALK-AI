import React, { useState } from "react";

export default function ResumeUploader({ onUpload }) {

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleDrop = (e) => {
    e.preventDefault();
    setFile(e.dataTransfer.files[0]);
  };

  const upload = async () => {

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      setProgress((e.loaded / e.total) * 100);
    };

    xhr.onload = () => {
      const res = JSON.parse(xhr.response);
      onUpload(res.questions);
    };

    xhr.open("POST", "http://127.0.0.1:8000/upload_resume");
    xhr.send(formData);
  };

  return (
    <div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed #00c8ff",
          padding: "30px",
          borderRadius: "10px",
          textAlign: "center"
        }}
      >
        Drag & Drop Resume Here
      </div>

      {file && (
        <p>Selected: {file.name}</p>
      )}

      {progress > 0 && (
        <div style={{
          width: "100%",
          height: "10px",
          background: "#1f2937",
          borderRadius: "5px",
          marginTop: "10px"
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: "#00c8ff"
          }} />
        </div>
      )}

      <button onClick={upload}>
        Upload
      </button>

    </div>
  );
}