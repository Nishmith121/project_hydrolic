import { C, statusColor } from "../config.js";

export default function MetricCard({ label, value, unit, icon, status = "normal", compact = false }) {
  const color = statusColor(status);

  return (
    <div className={`card ${compact ? "card-sm" : ""}`}
      style={status !== "normal" ? { borderColor: `${color}44` } : undefined}>

      {/* Accent top line */}
      <div className="card-accent-top" style={{ background: `${color}44` }} />

      {/* Header: label + dot */}
      <div className="mc-header">
        <span className="mc-label">
          <span className="mc-label-icon">{icon}</span>
          {label}
        </span>
        <span className="mc-dot" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      </div>

      {/* Value */}
      <div>
        <span className={`mc-value ${compact ? "mc-value-sm" : ""}`} style={{ color }}>
          {value}
        </span>
        <span className="mc-unit">{unit}</span>
      </div>

      {/* Status badge */}
      {status !== "normal" && (
        <div className="mc-badge" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
          <span style={{
            width: 4, height: 4, borderRadius: "50%",
            background: color, display: "inline-block",
            animation: "blink 1.5s ease-in-out infinite"
          }} />
          {status}
        </div>
      )}
    </div>
  );
}
