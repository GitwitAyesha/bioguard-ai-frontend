import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, getRole, logout } from "../utils/auth_utils";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const role = getRole();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">⬡</span>
        <span className="brand-text">BIOGUARD <em>AI</em></span>
      </Link>

      <div className="navbar-actions">
        {loggedIn ? (
          <>
            {role === "admin" && (
              <Link to="/admin" className="btn-ghost nav-btn">Dashboard</Link>
            )}
            <button className="btn-secondary nav-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-ghost nav-btn">Sign In</Link>
            <Link to="/signup" className="btn-primary nav-btn">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}