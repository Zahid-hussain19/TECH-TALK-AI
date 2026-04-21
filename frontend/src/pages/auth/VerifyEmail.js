import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE}/verify/${token}`);
        const data = await res.json();

        if (res.status === 200) {
          alert("Email verified ✅");
          navigate("/login");
        } else {
          alert("Verification failed ❌");
        }
      } catch {
        alert("Server error ❌");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Verifying your email...</h2>
    </div>
  );
}