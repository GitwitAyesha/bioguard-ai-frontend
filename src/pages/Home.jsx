import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Home.css";

const features = [
  {
    icon: "◈",
    title: "Sign Up",
    desc: "Register your face during signup for secure biometric authentication",
    color: "accent",
  },
  {
    icon: "◉",
    title: "Face Verify",
    desc: "Login with liveness detection to confirm your real-time presence",
    color: "green",
  },
  {
    icon: "◎",
    title: "OTP Backup",
    desc: "Email verification kicks in for suspicious activities",
    color: "warn",
  },
  {
    icon: "◍",
    title: "Monitoring",
    desc: "All activities logged and monitored in real-time dashboard",
    color: "accent",
  },
];

export default function Home() {
  return (
    <div className="home">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb-1" />
          <div className="hero-orb orb-2" />
          <div className="grid-overlay" />
        </div>

        <div className="hero-content">
          <div className="hero-badge fade-up">
            <span className="badge-dot" />
            Advanced Biometric Security
          </div>

          <h1 className="hero-title fade-up fade-up-delay-1">
            Next-Generation<br />
            <span className="text-accent">Biometric</span> Authentication
          </h1>

          <p className="hero-sub fade-up fade-up-delay-2">
            Secure Login with Facial Recognition
          </p>

          <p className="hero-desc fade-up fade-up-delay-3">
            Experience seamless, secure authentication powered by advanced facial
            recognition and real-time liveness detection technology.
          </p>

          <div className="hero-actions fade-up fade-up-delay-4">
            <Link to="/signup" className="btn-primary hero-btn">
              Create Account →
            </Link>
            <Link to="/login" className="btn-ghost hero-btn">
              Sign In
            </Link>
          </div>

          <div className="admin-demo fade-up fade-up-delay-4">
            <div className="demo-label">Admin Demo Credentials</div>
            <div className="demo-creds">
              <span>Email: <code>admin@admin.com</code></span>
              <span className="demo-sep">|</span>
              <span>Password: <code>admin123</code></span>
            </div>
          </div>
        </div>

        {/* Floating visual */}
        <div className="hero-visual fade-up fade-up-delay-2">
          <div className="face-scan-box">
            <div className="fsb-corner tl" /><div className="fsb-corner tr" />
            <div className="fsb-corner bl" /><div className="fsb-corner br" />
            <div className="fsb-scan" />
            <div className="fsb-content">
              <div className="fsb-face">
                <div className="fsb-eye left" />
                <div className="fsb-eye right" />
                <div className="fsb-mouth" />
              </div>
              <div className="fsb-oval" />
            </div>
            <div className="fsb-status">
              <span className="status-dot" />
              LIVE · VERIFIED
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="how-header">
          <h2 className="how-title">How It Works</h2>
          <p className="how-subtitle">
            Our multi-layered security system ensures your account stays protected
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className={`feature-card feature-card--${f.color}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-brand">
          <span className="brand-icon">⬡</span> BIOGUARD <em>AI</em>
        </div>
        <p className="footer-text">
          Biometric Authentication System · Built with facial recognition technology
        </p>
      </footer>
    </div>
  );
}