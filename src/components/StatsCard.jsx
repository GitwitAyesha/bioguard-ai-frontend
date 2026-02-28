import "./StatsCard.css";

export default function StatsCard({ label, value, icon, color = "accent" }) {
  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-value">{value ?? "—"}</div>
      <div className="stats-label">{label}</div>
    </div>
  );
}