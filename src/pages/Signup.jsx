import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/api";
import CameraCapture from "../components/CameraCapture";
import "./AuthPage.css";

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState("info"); // info | face | done
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [faceImage, setFaceImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInfo = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { setError("Please fill all fields"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setStep("face");
  };

  const handleSignup = async () => {
    if (!faceImage) { setError("Please capture your face photo"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await signup(name, email, password, faceImage);

      if (res.message || res.user_id) {
        setStep("done");
      } else {
        setError(res.error || "Signup failed. Please try again.");
      }
    } catch {
      setError("Network error. Is the backend running?");
    }
    setLoading(false);
  };

  if (step === "done") {
    return (
      <div className="auth-page">
        <div className="auth-bg"><div className="auth-orb" /></div>
        <div className="auth-card fade-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "20px" }}>✓</div>
          <h1 className="auth-title">Account Created!</h1>
          <p className="auth-sub" style={{ marginBottom: "32px" }}>
            Your account has been successfully registered with facial recognition.
          </p>
          <button className="btn-primary" onClick={() => navigate("/login")}>
            Continue to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb" />
        <div className="grid-overlay" />
      </div>

      <div className="auth-card fade-up" style={{ maxWidth: step === "face" ? "500px" : "440px" }}>
        <div className="auth-logo">
          <span className="auth-logo-icon">⬡</span>
          <span className="auth-logo-text">BIOGUARD <em>AI</em></span>
        </div>

        {step === "info" ? (
          <>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-sub">Set up your credentials first</p>

            <form onSubmit={handleInfo} className="auth-form">
              <div className="form-group">
                <label className="label">Full Name</label>
                <input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Password</label>
                <input type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Confirm Password</label>
                <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>

              {error && <p className="error-msg">{error}</p>}

              <button type="submit" className="btn-primary auth-submit">
                Next: Register Face →
              </button>
            </form>

            <p className="auth-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Register Your Face</h1>
            <p className="auth-sub">Register your face for secure login</p>

            <div className="face-step">
              <CameraCapture onCapture={setFaceImage} onError={setError} />
            </div>

            {error && <p className="error-msg" style={{ textAlign: "center" }}>{error}</p>}

            <div className="signup-bottom">
              <div className="signup-actions">
                <button className="btn-ghost back-btn" onClick={() => { setStep("info"); setFaceImage(null); }}>
                  ← Back
                </button>
                <button
                  className="btn-primary"
                  style={{ width: "auto", padding: "12px 24px" }}
                  onClick={handleSignup}
                  disabled={loading || !faceImage}
                >
                  {loading ? <span className="spinner" /> : "+ Create Account"}
                </button>
              </div>
              <p className="auth-link">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}