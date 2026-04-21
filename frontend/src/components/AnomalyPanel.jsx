import { C } from "../config.js";

function Gauge({ score }) {
  const pct = Math.max(0, Math.min(100, ((score + 0.5) / 0.7) * 100));
  const color = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.red;
  const r = 44;
  const circ = Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="anomaly-gauge-wrap">
      <svg width="110" height="65" viewBox="0 0 110 65">
        <path d="M 6 60 A 44 44 0 0 1 104 60" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
        <path d="M 6 60 A 44 44 0 0 1 104 60" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "all 0.8s ease", filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <span style={{ marginTop: -16, fontSize: 18, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
        {score.toFixed(3)}
      </span>
      <span style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>anomaly score</span>
    </div>
  );
}

export default function AnomalyPanel({ mlInsights }) {
  if (!mlInsights) {
    return (
      <div className="panel fade-in" style={{ display: "grid", placeItems: "center", minHeight: 120 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 24, marginBottom: 4 }}>⏳</p>
          <p style={{ fontSize: 12, color: "#64748b" }}>ML model not loaded</p>
        </div>
      </div>
    );
  }

  if (mlInsights.error) {
    return (
      <div className="panel fade-in">
        <div className="anomaly-status-box" style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}20` }}>
          <span>⚠️</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.amber }}>Prediction Error</p>
            <p style={{ fontSize: 10, color: "#64748b" }}>{mlInsights.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const isAnomaly = mlInsights.is_anomaly;
  const score = mlInsights.anomaly_score ?? 0;
  const msg = mlInsights.status_message ?? "Unknown";
  const accent = isAnomaly ? C.red : C.green;
  const bg = isAnomaly ? "rgba(239,68,68,0.06)" : "rgba(34,197,94,0.06)";
  const pct = Math.max(0, Math.min(100, ((score + 0.5) / 0.7) * 100));

  return (
    <div className="panel fade-in" style={{ borderColor: `${accent}30` }}>

      {/* Header */}
      <div className="panel-header">
        <span className="panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>🤖</span> Isolation Forest Model
        </span>
        <span className={`pill ${isAnomaly ? "pill-crit" : "pill-ok"}`}>
          {isAnomaly ? "⚠ ANOMALY DETECTED" : "✓ SYSTEM NORMAL"}
        </span>
      </div>

      {/* Grid: Gauge + Details */}
      <div className="anomaly-grid">
        <Gauge score={score} />

        <div className="anomaly-details">
          {/* Status box */}
          <div className="anomaly-status-box" style={{ background: bg, border: `1px solid ${accent}18`, borderRadius: 10 }}>
            <span style={{ fontSize: 18 }}>{isAnomaly ? "🚨" : "🛡️"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: accent, lineHeight: 1.2 }}>{msg}</p>
              <p style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                {isAnomaly ? "Operating outside learned patterns" : "All parameters within normal bounds"}
              </p>
            </div>
            {isAnomaly && <span className="alert-pulse" style={{ background: C.red, boxShadow: `0 0 6px ${C.red}` }} />}
          </div>

          {/* Confidence */}
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#64748b" }}>Health Confidence</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>{pct.toFixed(1)}%</span>
            </div>
            <div className="anomaly-bar-track">
              <div className="anomaly-bar-fill" style={{ width: `${pct}%`, boxShadow: `0 0 4px ${accent}55` }} />
            </div>
          </div>

          <p style={{ fontSize: 9, color: "#475569" }}>
            15 features · Isolation Forest · Real-time inference
          </p>
        </div>
      </div>
    </div>
  );
}
