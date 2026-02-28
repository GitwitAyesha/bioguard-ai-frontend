import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminStats, getAdminLogs } from "../services/api";
import { logout } from "../utils/auth_utils";
import StatsCard from "../components/StatsCard";
import "./AdminDashboard.css";

// Simple mini chart using SVG
function LineChart({ data, color = "#00c8ff", height = 120 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100 / (data.length - 1 || 1);
  const points = data.map((d, i) => ({
    x: i * w,
    y: height - (d.value / max) * (height - 20) - 4,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 100 ${height}`} className="line-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

const getLast7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
};

const formatTime = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const statusColor = (s) => {
  s = (s || "").toLowerCase();
  if (s.includes("success")) return "success";
  if (s.includes("fail") || s.includes("invalid")) return "danger";
  if (s.includes("otp") || s.includes("suspicious")) return "warn";
  return "dim";
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [s, l] = await Promise.all([getAdminStats(), getAdminLogs()]);
      setStats(s);
      // logs is an object keyed by log_id
      const arr = Object.values(l || {}).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setLogs(arr);
    } catch {}
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Build chart data from logs
  const days = getLast7Days();
  const dayKeys = days.map((d) => d.replace(",", ""));

  const buildSeries = (filterFn) =>
    days.map((day) => ({
      label: day,
      value: logs.filter((l) => {
        const ld = formatTime(l.timestamp).split(",")[0];
        return ld === day && filterFn(l);
      }).length,
    }));

  const authSeries = buildSeries(() => true);
  const successSeries = buildSeries((l) => (l.status || "").toLowerCase().includes("success"));
  const otpSeries = buildSeries((l) => (l.event_type || "").toLowerCase().includes("otp"));

  const filteredLogs = logs.filter((l) => {
    if (tab === "all") return true;
    if (tab === "success") return (l.status || "").toLowerCase().includes("success");
    if (tab === "failed") return (l.status || "").toLowerCase().includes("fail");
    if (tab === "otp") return (l.event_type || "").toLowerCase().includes("otp");
    return true;
  });

  // Count stats
  const successCount = logs.filter((l) => (l.status || "").toLowerCase().includes("success")).length;
  const failedCount = logs.filter((l) => (l.status || "").toLowerCase().includes("fail")).length;
  const otpCount = logs.filter((l) => (l.event_type || "").toLowerCase().includes("otp")).length;
  const suspiciousCount = logs.filter((l) =>
    (l.status || "").toLowerCase().includes("suspicious") ||
    (l.event_type || "").toLowerCase().includes("suspicious") ||
    (l.status || "").toLowerCase() === "otp_required"
  ).length;

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span>⬡</span>
          <span>BIOGUARD <em>AI</em></span>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-item active">
            <span>▦</span> Dashboard
          </button>
          <button className="sidebar-item">
            <span>◈</span> Users
          </button>
          <button className="sidebar-item">
            <span>≡</span> Logs
          </button>
          <button className="sidebar-item">
            <span>◎</span> Settings
          </button>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          ↩ Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Security Dashboard</h1>
            <p className="admin-sub">Real-time biometric authentication monitoring</p>
          </div>
          <div className="admin-header-right">
            <div className="live-badge">
              <span className="live-dot" />
              LIVE
            </div>
            <button className="btn-ghost refresh-btn" onClick={fetchData}>↻ Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" style={{ width: "32px", height: "32px" }} />
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="stats-grid">
              <StatsCard label="Total Users" value={stats?.total_users ?? 0} icon="👥" color="accent" />
              <StatsCard label="Successful Logins" value={successCount} icon="✓" color="green" />
              <StatsCard label="Failed Attempts" value={failedCount} icon="✗" color="danger" />
              <StatsCard label="Suspicious Events" value={suspiciousCount} icon="⚠" color="warn" />
              <StatsCard label="Locked Accounts" value={stats?.locked_accounts ?? 0} icon="🔒" color="danger" />
              <StatsCard label="OTPs Sent" value={otpCount} icon="✉" color="warn" />
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Authentication Trends</h3>
                  <p className="chart-sub">Last 7 Days</p>
                </div>
                <div className="chart-body">
                  <div className="chart-wrap">
                    <LineChart data={authSeries} color="#00c8ff" />
                    <LineChart data={successSeries} color="#00ff9d" />
                    <LineChart data={otpSeries} color="#ffb800" />
                  </div>
                  <div className="chart-x-labels">
                    {days.map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-dot" style={{ background: "#00c8ff" }} />Auth Logs</span>
                  <span className="legend-item"><span className="legend-dot" style={{ background: "#00ff9d" }} />Successful</span>
                  <span className="legend-item"><span className="legend-dot" style={{ background: "#ffb800" }} />OTP Events</span>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3 className="chart-title">Event Distribution</h3>
                  <p className="chart-sub">Authentication outcomes</p>
                </div>
                <div className="event-dist">
                  {[
                    { label: "Signups", count: logs.filter((l) => (l.event_type || "").toLowerCase().includes("signup")).length, color: "#00c8ff" },
                    { label: "Logins", count: logs.filter((l) => (l.event_type || "").toLowerCase() === "login").length, color: "#00ff9d" },
                    { label: "OTP", count: otpCount, color: "#ffb800" },
                    { label: "Failed", count: failedCount, color: "#ff3b5c" },
                  ].map((item) => {
                    const pct = logs.length > 0 ? Math.round((item.count / logs.length) * 100) : 0;
                    return (
                      <div key={item.label} className="dist-row">
                        <span className="dist-label">{item.label}</span>
                        <div className="dist-bar-wrap">
                          <div className="dist-bar" style={{ width: `${pct}%`, background: item.color }} />
                        </div>
                        <span className="dist-pct">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="logs-card">
              <div className="logs-header">
                <h3 className="chart-title">Authentication Logs</h3>
                <div className="logs-tabs">
                  {["all", "success", "failed", "otp"].map((t) => (
                    <button
                      key={t}
                      className={`log-tab ${tab === t ? "active" : ""}`}
                      onClick={() => setTab(t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="logs-table-wrap">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>User</th>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="logs-empty">No logs found</td>
                      </tr>
                    ) : (
                      filteredLogs.map((log, i) => (
                        <tr key={log.id || i} className="log-row">
                          <td className="log-time">{formatTime(log.timestamp)}</td>
                          <td className="log-user">{log.email || log.user_id || "—"}</td>
                          <td className="log-event">{log.event_type || "—"}</td>
                          <td>
                            <span className={`log-badge log-badge--${statusColor(log.status)}`}>
                              {log.status || "—"}
                            </span>
                          </td>
                          <td className="log-details">{log.details || log.description || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}