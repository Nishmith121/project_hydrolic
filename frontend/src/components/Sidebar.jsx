import { C } from "../config.js";

// ── Alert Item ───────────────────────────────────────────────────────────────
const LEVEL = {
  critical: { bg: "rgba(239,68,68,0.08)", border: C.red,   color: C.red   },
  warning:  { bg: "rgba(245,158,11,0.08)", border: C.amber, color: C.amber },
  ok:       { bg: "rgba(34,197,94,0.08)",  border: C.green, color: C.green },
};

function AlertItem({ alert }) {
  const s = LEVEL[alert.level] ?? LEVEL.ok;
  return (
    <div className="alert-row" style={{ background: s.bg, borderColor: `${s.border}22` }}>
      <div className="alert-icon-wrap" style={{ background: `${s.border}15` }}>
        <span>{alert.icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="alert-title" style={{ color: s.color }}>{alert.title}</p>
        <p className="alert-desc">{alert.desc}</p>
      </div>
      {alert.level !== "ok" && (
        <span className="alert-pulse" style={{ background: s.border, boxShadow: `0 0 4px ${s.border}` }} />
      )}
    </div>
  );
}

// ── Circle KPI ───────────────────────────────────────────────────────────────
function CircleKpi({ label, value, max = 100, unit, color }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(1, value / max) * circ;
  return (
    <div className="ckpi">
      <div className="ckpi-ring">
        <svg width="40" height="40" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="20" cy="20" r={r} fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3"
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 3px ${color})`, transition: "stroke-dasharray 0.6s ease" }} />
        </svg>
        <span className="ckpi-pct" style={{ color }}>{Math.round((value / max) * 100)}%</span>
      </div>
      <div>
        <p className="ckpi-label">{label}</p>
        <p className="ckpi-value" style={{ color: "white" }}>
          {Number(value).toFixed(1)} <span className="ckpi-unit">{unit}</span>
        </p>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ alerts, latest, score, mlInsights }) {
  const mlAlert = mlInsights && !mlInsights.error
    ? {
        level: mlInsights.is_anomaly ? "critical" : "ok",
        title: mlInsights.is_anomaly ? "ML: Anomaly Detected" : "ML: System Healthy",
        desc: `Score: ${(mlInsights.anomaly_score ?? 0).toFixed(3)}`,
        icon: mlInsights.is_anomaly ? "🚨" : "🤖",
      }
    : null;

  const allAlerts = mlAlert ? [mlAlert, ...alerts] : alerts;
  const activeCount = allAlerts.filter(a => a.level !== "ok").length;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Alerts Panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Live Alerts</span>
          <span className={`pill ${activeCount ? "pill-crit" : "pill-ok"}`}>
            {activeCount ? `${activeCount} active` : "✓ clear"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {allAlerts.map((a, i) => <AlertItem key={i} alert={a} />)}
        </div>
      </div>

      {/* KPI Panel */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Efficiency KPIs</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <CircleKpi label="Condition Score" value={score} max={100} unit="/ 100"
            color={score >= 90 ? C.green : score >= 75 ? C.amber : C.red} />
          <CircleKpi label="Active Power" value={latest?.active_power_mw ?? 0} max={140} unit="MW"
            color={C.cyan} />
          <CircleKpi label="Water Flow" value={latest?.water_flow_rate_m3s ?? 0} max={90} unit="m³/s"
            color={C.teal} />

          {/* Frequency bar */}
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#64748b" }}>Grid Frequency</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.purple, fontVariantNumeric: "tabular-nums" }}>
                {latest ? Number(latest.frequency_hz).toFixed(2) : "—"} Hz
              </span>
            </div>
            <div style={{ width: "100%", height: 4, borderRadius: 2, background: "#1e293b" }}>
              <div style={{
                height: 4, borderRadius: 2, transition: "width 0.5s ease",
                width: `${latest ? Math.min(100, ((latest.frequency_hz - 49.5) / 1.0) * 100) : 50}%`,
                background: C.purple,
                boxShadow: `0 0 4px ${C.purple}`,
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
