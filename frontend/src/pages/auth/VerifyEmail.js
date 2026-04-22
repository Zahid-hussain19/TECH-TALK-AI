import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE}/verify-email?token=${token}`);
        const data = await res.json();

        if (res.status === 200) {
          alert("Email verified ✅");
          navigate("/login");
        } else {
          alert("Verification failed ❌: " + (data.detail || "Invalid token"));
        }
      } catch {
        alert("Server error ❌");
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px", color: "white" }}>
      <h2>Verifying your email...</h2>
    </div>
  );
}