import { useState, useEffect, useRef } from "react";
import { C, THR, fmt, getStatus, conditionScore, buildAlerts } from "./config.js";
import MetricCard    from "./components/MetricCard.jsx";
import TabbedChart   from "./components/TabbedChart.jsx";
import Sidebar       from "./components/Sidebar.jsx";
import AnomalyPanel  from "./components/AnomalyPanel.jsx";
import { HealthRadar, PowerBar, EnergyDonut } from "./components/Charts.jsx";

const API_URL  = "http://localhost:8000/api/live-data";
const POLL_MS  = 1000;
const MAX_HIST = 30;

// ── Monitored sensors (with thresholds) ──────────────────────────────────────
const MONITORED = (d) => [
  { label: "Vibration",     value: fmt(d?.vibration_mms, 2),          unit: "mm/s", icon: "📳", thr: THR.vibration, raw: d?.vibration_mms },
  { label: "Bearing Temp",  value: fmt(d?.bearing_temp_c),            unit: "°C",   icon: "🌡", thr: THR.bearing,   raw: d?.bearing_temp_c },
  { label: "Stator Temp",   value: fmt(d?.stator_winding_temp_c),     unit: "°C",   icon: "🌡", thr: THR.stator,    raw: d?.stator_winding_temp_c },
  { label: "Shaft Run-out", value: fmt(d?.shaft_runout_mm, 3),        unit: "mm",   icon: "🔩", thr: THR.shaft,     raw: d?.shaft_runout_mm },
];

// ── Secondary sensors ────────────────────────────────────────────────────────
const SECONDARY = (d) => [
  { label: "Reactive Power",    value: fmt(d?.reactive_power_mvar),       unit: "MVAR", icon: "⚡" },
  { label: "Frequency",         value: fmt(d?.frequency_hz, 2),           unit: "Hz",   icon: "〰" },
  { label: "Wicket Gate",       value: fmt(d?.wicket_gate_opening_pct),   unit: "%",    icon: "⚙" },
  { label: "Gov. Oil Pressure", value: fmt(d?.governor_oil_pressure_bar), unit: "bar",  icon: "🛢" },
  { label: "Draft Tube Press.", value: fmt(d?.draft_tube_pressure_bar,2), unit: "bar",  icon: "🌊" },
  { label: "Cooling Flow",     value: fmt(d?.cooling_water_flow_ls),     unit: "L/s",  icon: "❄" },
  { label: "Air Gap",          value: fmt(d?.air_gap_mm),                unit: "mm",   icon: "📏" },
];

// ── Section Header ───────────────────────────────────────────────────────────
function Section({ title, color = C.cyan, children }) {
  return (
    <div className="section">
      <div className="section-head">
        <div className="section-dot" style={{ background: color }} />
        <span className="section-label">{title}</span>
        <div className="section-line" />
      </div>
      {children}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [latest,  setLatest]  = useState(null);
  const [history, setHistory] = useState([]);
  const [status,  setStatus]  = useState("connecting");
  const [lastTs,  setLastTs]  = useState(null);
  const tick = useRef(0);

  useEffect(() => {
    let live = true;
    async function poll() {
      try {
        const r = await fetch(API_URL);
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!live) return;
        tick.current++;
        setLatest(d);
        setStatus("live");
        setLastTs(new Date().toLocaleTimeString());
        setHistory(prev => {
          const next = [...prev, { ...d, t: tick.current }];
          return next.length > MAX_HIST ? next.slice(-MAX_HIST) : next;
        });
      } catch { if (live) setStatus("error"); }
    }
    poll();
    const id = setInterval(poll, POLL_MS);
    return () => { live = false; clearInterval(id); };
  }, []);

  // ── Loading ──
  if (status === "connecting") {
    return (
      <div className="loading-screen">
        <div className="spinner-wrap">
          <div className="spinner-a" />
          <div className="spinner-b" />
        </div>
        <p className="loading-text">Connecting to Turbine…</p>
      </div>
    );
  }

  const score  = conditionScore(latest);
  const alerts = buildAlerts(latest);
  const ml     = latest?.ml_insights;

  return (
    <div className="shell">

      {/* ═══ TOP BAR ══════════════════════════════════════════════════════ */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-icon">⚡</div>
          <div>
            <p className="topbar-title">Hydraulic Turbine</p>
            <p className="topbar-sub">Digital Twin Dashboard</p>
          </div>
        </div>

        <div className="topbar-spacer" />

        {status === "error" ? (
          <span className="pill pill-crit">⚠ API Offline</span>
        ) : (
          <div className="topbar-live"><span className="dot-live" /> LIVE · {lastTs}</div>
        )}

        {ml && !ml.error && (
          <span className={`pill ${ml.is_anomaly ? "pill-crit" : "pill-ok"}`}>
            {ml.is_anomaly ? "🚨 ANOMALY" : "✓ HEALTHY"}
          </span>
        )}

        <span className={`pill ${score >= 90 ? "pill-ok" : score >= 75 ? "pill-warn" : "pill-crit"}`}>
          Score {score}/100
        </span>

        <span className="pill pill-muted">turbine_01</span>
      </header>

      {/* ═══ PAGE ═════════════════════════════════════════════════════════ */}
      <main className="page">

        {/* ─── Quick Stats Strip ──────────────────────────────────────── */}
        <div className="status-strip fade-in">
          <div className="status-cell">
            <div className="status-cell-icon" style={{ background: `${C.cyan}18` }}>⚡</div>
            <div>
              <p className="status-cell-label">Active Power</p>
              <p className="status-cell-value" style={{ color: C.cyan }}>
                {fmt(latest?.active_power_mw)}<span className="status-cell-unit">MW</span>
              </p>
            </div>
          </div>
          <div className="status-cell">
            <div className="status-cell-icon" style={{ background: `${C.blue}18` }}>🔄</div>
            <div>
              <p className="status-cell-label">Speed</p>
              <p className="status-cell-value" style={{ color: C.blue }}>
                {fmt(latest?.rotational_speed_rpm, 0)}<span className="status-cell-unit">RPM</span>
              </p>
            </div>
          </div>
          <div className="status-cell">
            <div className="status-cell-icon" style={{ background: `${C.teal}18` }}>💧</div>
            <div>
              <p className="status-cell-label">Flow Rate</p>
              <p className="status-cell-value" style={{ color: C.teal }}>
                {fmt(latest?.water_flow_rate_m3s)}<span className="status-cell-unit">m³/s</span>
              </p>
            </div>
          </div>
          <div className="status-cell">
            <div className="status-cell-icon" style={{ background: `${C.purple}18` }}>⬆</div>
            <div>
              <p className="status-cell-label">Net Head</p>
              <p className="status-cell-value" style={{ color: C.purple }}>
                {fmt(latest?.net_head_m)}<span className="status-cell-unit">m</span>
              </p>
            </div>
          </div>
          <div className="status-cell">
            <div className="status-cell-icon" style={{ background: `${C.amber}18` }}>〰</div>
            <div>
              <p className="status-cell-label">Frequency</p>
              <p className="status-cell-value" style={{ color: C.amber }}>
                {fmt(latest?.frequency_hz, 2)}<span className="status-cell-unit">Hz</span>
              </p>
            </div>
          </div>
        </div>

        {/* ─── ML Anomaly Detection ───────────────────────────────────── */}
        <Section title="Anomaly Detection" color={ml?.is_anomaly ? C.red : C.green}>
          <AnomalyPanel mlInsights={ml} />
        </Section>

        {/* ─── Monitored Parameters ───────────────────────────────────── */}
        <Section title="Monitored Parameters" color={C.amber}>
          <div className="layout-four-col">
            {MONITORED(latest).map(c => (
              <MetricCard key={c.label} {...c} status={c.thr ? getStatus(c.raw, c.thr) : "normal"} />
            ))}
          </div>
        </Section>

        {/* ─── Trend Analysis + Alerts ────────────────────────────────── */}
        <Section title="Trend Analysis & Alerts" color={C.cyan}>
          <div className="layout-two-col">
            <TabbedChart history={history} />
            <Sidebar alerts={alerts} latest={latest} score={score} mlInsights={ml} />
          </div>
        </Section>

        {/* ─── Secondary Sensors ──────────────────────────────────────── */}
        <Section title="Secondary Sensors" color={C.teal}>
          <div className="layout-auto-fill">
            {SECONDARY(latest).map(c => (
              <MetricCard key={c.label} {...c} status="normal" compact />
            ))}
          </div>
        </Section>

        {/* ─── Analytics ──────────────────────────────────────────────── */}
        <Section title="Analytics" color={C.purple}>
          <div className="layout-three-col">
            <HealthRadar  data={latest} />
            <PowerBar     history={history} />
            <EnergyDonut  data={latest} />
          </div>
        </Section>

      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="app-footer">
        Virtual Hydraulic Turbine · Digital Twin · Real-time Monitoring
      </footer>
    </div>
  );
}
