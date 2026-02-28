import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, sendOtp, verifyOtp } from "../services/api";
import { saveAuth } from "../utils/auth_utils";
import CameraCapture from "../components/CameraCapture";
import "./AuthPage.css";
import "./Login.css";

const ADMIN_EMAIL  = "admin@admin.com";
const MAX_ATTEMPTS = 3;
const OTP_SECONDS  = 5 * 60; // 5 minutes

export default function Login() {
  const navigate = useNavigate();

  // steps: "credentials" | "face" | "otp" | "success" | "failed"
  const [step,      setStep]      = useState("credentials");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [faceImage, setFaceImage] = useState(null);
  const [otpDigits, setOtpDigits] = useState(["","","","","",""]);
  const [userId,    setUserId]    = useState("");
  const [error,     setError]     = useState("");
  const [otpFeedback, setOtpFeedback] = useState(""); // specific OTP feedback
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);

  // Session-only attempt counter — resets when user navigates away
  const [attempts, setAttempts] = useState(0);
  const attemptsRef = useRef(0);

  // OTP countdown timer
  const [countdown, setCountdown] = useState(OTP_SECONDS);
  const timerRef = useRef(null);
  const otpInputs = useRef([]);

  // Reset session counter on mount/unmount
  useEffect(() => {
    attemptsRef.current = 0;
    setAttempts(0);
    return () => { attemptsRef.current = 0; };
  }, []);

  // Start countdown whenever OTP step is entered
  useEffect(() => {
    if (step === "otp") {
      setCountdown(OTP_SECONDS);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  // Format countdown as MM:SS
  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const isExpired = countdown === 0;

  // ── STEP 1: Credentials ──────────────────────────────────────────────────
  const handleCredentials = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);

    try {
      if (email.trim().toLowerCase() === ADMIN_EMAIL) {
        const res = await login(email, password, null);
        if (res.token) { saveAuth(res.token, res.role); navigate("/admin"); }
        else setError("Invalid admin credentials.");
        setLoading(false);
        return;
      }

      const res = await login(email, password, null);

      if (res.status === "credentials_ok") {
        setStep("face");
      } else if (res._status === 401 || res.error) {
        const newAttempts = attemptsRef.current + 1;
        attemptsRef.current = newAttempts;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const uid = res.user_id;
          if (uid) { await sendOtp(uid, email); setUserId(uid); }
          setStep("otp");
        } else {
          const left = MAX_ATTEMPTS - newAttempts;
          setError(`Incorrect password. ${left} attempt${left !== 1 ? "s" : ""} remaining.`);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Is the backend running?");
    }
    setLoading(false);
  };

  // ── STEP 2: Face Capture ─────────────────────────────────────────────────
  const handleFaceLogin = async () => {
    if (!faceImage) { setError("Please capture your face photo first."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await login(email, password, faceImage);
      if (res.token) {
        saveAuth(res.token, res.role);
        setStep("success");
      } else if (res.status === "otp_required") {
        setUserId(res.user_id || "");
        setStep("otp");
      } else {
        setStep("failed");
      }
    } catch {
      setError("Network error. Is the backend running?");
    }
    setLoading(false);
  };

  // ── STEP 3: OTP ──────────────────────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[i] = val;
    setOtpDigits(next);
    if (val && i < 5) otpInputs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0)
      otpInputs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtpDigits(text.split(""));
      otpInputs.current[5]?.focus();
    }
  };

  const handleOtpVerify = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6)  { setOtpFeedback("Please enter the full 6-digit code."); return; }
    if (!userId)         { setOtpFeedback("Session expired. Please start again."); return; }
    if (isExpired)       { setOtpFeedback("This OTP has expired. Please request a new one."); return; }

    setLoading(true);
    setOtpFeedback("");

    try {
      const res = await verifyOtp(userId, otp);
      if (res.token) {
        saveAuth(res.token, res.role);
        attemptsRef.current = 0;
        setStep("success");
      } else {
        // Specific feedback for invalid OTP
        setOtpFeedback("Incorrect code. Please check your email and try again.");
        // Clear the digits so user can re-enter
        setOtpDigits(["","","","","",""]);
        setTimeout(() => otpInputs.current[0]?.focus(), 50);
      }
    } catch {
      setOtpFeedback("Network error. Please try again.");
    }
    setLoading(false);
  };

  // Resend OTP
  const handleResend = async () => {
    if (!userId || !email) return;
    setResending(true);
    setOtpFeedback("");
    setOtpDigits(["","","","","",""]);
    try {
      await sendOtp(userId, email);
      setCountdown(OTP_SECONDS);
      // Restart the timer
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); return 0; }
          return prev - 1;
        });
      }, 1000);
      setOtpFeedback("✓ A new code has been sent to your email.");
      setTimeout(() => otpInputs.current[0]?.focus(), 50);
    } catch {
      setOtpFeedback("Failed to resend. Please try again.");
    }
    setResending(false);
  };

  // Reset back to credentials
  const resetToLogin = () => {
    setStep("credentials");
    setFaceImage(null);
    setOtpDigits(["","","","","",""]);
    setError("");
    setOtpFeedback("");
    attemptsRef.current = 0;
    setAttempts(0);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb" />
        <div className="grid-overlay" />
      </div>

      <div className="auth-card fade-up">

        {(step === "credentials" || step === "face" || step === "otp") && (
          <div className="auth-logo">
            <span className="auth-logo-icon">⬡</span>
            <span className="auth-logo-text">BIOGUARD <em>AI</em></span>
          </div>
        )}

        {/* ── CREDENTIALS ── */}
        {step === "credentials" && (
          <>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-sub">Sign in to your account</p>

            <form onSubmit={handleCredentials} className="auth-form">
              <div className="form-group">
                <label className="label">Email</label>
                <input type="email" placeholder="Enter your email"
                  value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="label">Password</label>
                <input type="password" placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {attempts > 0 && (
                <div className="attempt-bar">
                  {[1,2,3].map(i => (
                    <div key={i} className={`attempt-dot ${i <= attempts ? "used" : ""}`} />
                  ))}
                  <span className="attempt-label">
                    {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} left before OTP
                  </span>
                </div>
              )}

              {error && <p className="error-msg">{error}</p>}

              <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : "Continue →"}
              </button>
            </form>

            <p className="auth-link">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </>
        )}

        {/* ── FACE CAPTURE ── */}
        {step === "face" && (
          <>
            <h1 className="auth-title">Face Verification</h1>
            <p className="auth-sub">Look at the camera to verify your identity</p>
            <div className="face-step">
              <CameraCapture onCapture={setFaceImage} onError={setError} />
            </div>
            {error && <p className="error-msg" style={{ textAlign:"center" }}>{error}</p>}
            <div className="auth-actions-row">
              <button className="btn-ghost back-btn"
                onClick={() => { setStep("credentials"); setFaceImage(null); setError(""); }}>
                ← Back
              </button>
              <button className="btn-primary" style={{ width:"auto", padding:"12px 28px" }}
                onClick={handleFaceLogin} disabled={loading || !faceImage}>
                {loading ? <span className="spinner" /> : "Sign In →"}
              </button>
            </div>
          </>
        )}

        {/* ── OTP ── */}
        {step === "otp" && (
          <>
            <div className="otp-icon-lg">✉</div>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-sub">A 6-digit verification code was sent to:</p>
            <p className="otp-email-highlight">{email}</p>

            {/* Countdown timer */}
            <div className={`otp-timer ${isExpired ? "expired" : countdown <= 60 ? "urgent" : ""}`}>
              {isExpired ? (
                <span>⏱ Code expired</span>
              ) : (
                <span>⏱ Code expires in <strong>{formatTime(countdown)}</strong></span>
              )}
            </div>

            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otpDigits.map((d, i) => (
                <input key={i} ref={(el) => (otpInputs.current[i] = el)}
                  className={`otp-digit ${isExpired ? "expired-input" : ""}`}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  autoFocus={i === 0} disabled={isExpired} />
              ))}
            </div>

            {/* OTP-specific feedback messages */}
            {otpFeedback && (
              <p className={`otp-feedback ${otpFeedback.startsWith("✓") ? "otp-feedback-success" : "otp-feedback-error"}`}>
                {otpFeedback}
              </p>
            )}

            <button className="btn-primary" onClick={handleOtpVerify}
              disabled={loading || otpDigits.join("").length < 6 || isExpired}>
              {loading ? <span className="spinner" /> : "Verify Code →"}
            </button>

            {/* Resend OTP button */}
            <div className="resend-row">
              <span className="resend-label">Didn't receive the code?</span>
              <button className="resend-btn" onClick={handleResend}
                disabled={resending || loading}>
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            </div>

            <p className="auth-link" style={{ marginTop: "12px" }}>
              <Link to="/">← Back to Home</Link>
            </p>
          </>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <div className="result-screen">
            <div className="result-icon success-icon">✓</div>
            <h1 className="result-title success-text">Successfully Logged In!</h1>
            <p className="result-sub">Your identity has been verified successfully.</p>
            <Link to="/" className="btn-primary result-btn">← Go to Home Screen</Link>
          </div>
        )}

        {/* ── FAILED ── */}
        {step === "failed" && (
          <div className="result-screen">
            <div className="result-icon failed-icon">✕</div>
            <h1 className="result-title failed-text">Login Failed</h1>
            <p className="result-sub">We could not verify your identity.</p>
            <div className="guidance-box">
              <p className="guidance-heading">How to try again:</p>
              <ol className="guidance-list">
                <li>Click <strong>Try Again</strong> below to return to the login screen.</li>
                <li>Enter your registered email and the correct password.</li>
                <li>When the camera opens, ensure your face is well-lit and centered in the frame.</li>
                <li>If you still can't log in, an OTP will be sent to your email after 3 failed password attempts.</li>
              </ol>
            </div>
            <div className="result-actions">
              <button className="btn-primary result-btn" onClick={resetToLogin}>↺ Try Again</button>
              <Link to="/" className="btn-ghost result-btn">← Go to Home Screen</Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}