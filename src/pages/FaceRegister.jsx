import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CameraCapture from "../components/CameraCapture";
import "./AuthPage.css";

export default function FaceRegister() {
  const navigate = useNavigate();
  const [faceImage, setFaceImage] = useState(null);
  const [error, setError] = useState("");

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-orb" /></div>

      <div className="auth-card fade-up" style={{ maxWidth: "500px" }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">⬡</span>
          <span className="auth-logo-text">BIOGUARD <em>AI</em></span>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Register your face for secure login</p>

        <div className="face-step">
          <CameraCapture onCapture={setFaceImage} onError={setError} />
        </div>

        {error && <p className="error-msg" style={{ textAlign: "center" }}>{error}</p>}

        <div className="signup-bottom">
          <div className="signup-actions">
            <Link to="/signup" className="btn-ghost back-btn">← Back</Link>
            <button
              className="btn-primary"
              style={{ width: "auto", padding: "12px 24px" }}
              disabled={!faceImage}
              onClick={() => navigate("/signup")}
            >
              + Create Account
            </button>
          </div>
          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}