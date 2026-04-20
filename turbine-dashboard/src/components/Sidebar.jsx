import { C } from "../config.js";

const LEVEL_STYLE = {
  critical: { bg: "#3b0a0a", border: C.red,   text: C.red   },
  warning:  { bg: "#2d1e06", border: C.amber, text: C.amber },
  ok:       { bg: "#071a10", border: C.green, text: C.green },
};

// ── Alert item ────────────────────────────────────────────────────────────────
function AlertItem({ alert }) {
  const s = LEVEL_STYLE[alert.level] ?? LEVEL_STYLE.ok;
  return (
    <div
      className="rounded-xl p-3 flex items-start gap-3 transition-all duration-200"
      style={{ background: s.bg, border: `1px solid ${s.border}55`, boxShadow: `0 0 12px ${s.border}11` }}
    >
      <div className="rounded-lg p-1.5 shrink-0" style={{ background: `${s.border}22` }}>
        <span className="text-sm">{alert.icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: s.text }}>{alert.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate tabular-nums">{alert.desc}</p>
      </div>
      {alert.level !== "ok" && (
        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse"
          style={{ background: s.border, boxShadow: `0 0 6px ${s.border}` }} />
      )}
    </div>
  );
}

// ── Circular KPI ──────────────────────────────────────────────────────────────
function CircleKpi({ label, value, max = 100, unit, color }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(1, value / max) * circ;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "#111827", border: `1px solid ${color}33` }}>
      <div className="relative shrink-0 w-12 h-12">
        <svg width="48" height="48" className="-rotate-90 absolute inset-0">
          <circle cx="24" cy="24" r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray 0.6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold tabular-nums" style={{ color }}>{Math.round((value / max) * 100)}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-bold text-white tabular-nums">{Number(value).toFixed(1)} <span className="text-xs text-slate-500 font-normal">{unit}</span></p>
      </div>
    </div>
  );
}

// ── Sidebar (Alerts + KPIs) ───────────────────────────────────────────────────
export default function Sidebar({ alerts, latest, score }) {
  return (
    <div className="flex flex-col gap-4 slide-up">

      {/* Live Alerts panel */}
      <div className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: `linear-gradient(135deg,${C.card},#0a1020)`, border: "1px solid #1a2540" }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-white">Live Alerts</p>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: alerts.filter(a => a.level !== "ok").length ? "#3b0a0a" : "#071a10",
                     color: alerts.filter(a => a.level !== "ok").length ? C.red : C.green,
                     border: `1px solid ${alerts.filter(a => a.level !== "ok").length ? C.red : C.green}44` }}>
            {alerts.filter(a => a.level !== "ok").length || "✓"} Active
          </span>
        </div>
        {alerts.map((a, i) => <AlertItem key={i} alert={a} />)}
      </div>

      {/* Efficiency KPIs */}
      <div className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: `linear-gradient(135deg,${C.card},#0a1020)`, border: "1px solid #1a2540" }}>
        <p className="text-sm font-semibold text-white mb-1">Efficiency KPIs</p>

        <CircleKpi label="Condition Score" value={score} max={100} unit="/ 100"
          color={score >= 90 ? C.green : score >= 75 ? C.amber : C.red} />

        <CircleKpi label="Active Power Output" value={latest?.active_power_mw ?? 0} max={140} unit="MW"
          color={C.cyan} />

        <CircleKpi label="Water Flow Efficiency" value={latest?.water_flow_rate_m3s ?? 0} max={90} unit="m³/s"
          color={C.teal} />

        {/* CO2 / frequency bar */}
        <div className="rounded-xl p-3" style={{ background: "#111827", border: `1px solid ${C.purple}33` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Grid Frequency</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: C.purple }}>
              {latest ? Number(latest.frequency_hz).toFixed(2) : "—"} Hz
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800">
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${latest ? Math.min(100, ((latest.frequency_hz - 49.5) / 1.0) * 100) : 50}%`,
                background: C.purple,
                boxShadow: `0 0 6px ${C.purple}`,
              }} />
          </div>
        </div>
      </div>
    </div>
  );
}
