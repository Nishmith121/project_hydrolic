import { useState, useEffect, useRef } from "react";
import { C, THR, fmt, getStatus, statusColor, conditionScore, buildAlerts } from "./config.js";
import MetricCard   from "./components/MetricCard.jsx";
import TabbedChart  from "./components/TabbedChart.jsx";
import Sidebar      from "./components/Sidebar.jsx";
import { HealthRadar, PowerBar, EnergyDonut } from "./components/Charts.jsx";

const API_URL   = "http://localhost:8000/api/live-data";
const POLL_MS   = 1000;
const MAX_HIST  = 30;

// ── Sensor card config ────────────────────────────────────────────────────────
const CARDS = (d) => [
  { label: "Active Power",     value: fmt(d?.active_power_mw),            unit: "MW",   icon: "⚡", thr: null },
  { label: "Rotational Speed", value: fmt(d?.rotational_speed_rpm, 0),    unit: "RPM",  icon: "🔄", thr: null },
  { label: "Flow Rate",        value: fmt(d?.water_flow_rate_m3s),        unit: "m³/s", icon: "💧", thr: null },
  { label: "Net Head",         value: fmt(d?.net_head_m),                 unit: "m",    icon: "⬆", thr: null },
  { label: "Vibration",        value: fmt(d?.vibration_mms, 2),           unit: "mm/s", icon: "📳", thr: THR.vibration, raw: d?.vibration_mms },
  { label: "Bearing Temp",     value: fmt(d?.bearing_temp_c),             unit: "°C",   icon: "🌡", thr: THR.bearing,   raw: d?.bearing_temp_c },
  { label: "Stator Temp",      value: fmt(d?.stator_winding_temp_c),      unit: "°C",   icon: "🌡", thr: THR.stator,    raw: d?.stator_winding_temp_c },
  { label: "Gov. Oil Pressure",value: fmt(d?.governor_oil_pressure_bar),  unit: "bar",  icon: "🛢", thr: null },
  { label: "Draft Tube Press.", value: fmt(d?.draft_tube_pressure_bar, 2),unit: "bar",  icon: "🌊", thr: null },
  { label: "Cooling Flow",     value: fmt(d?.cooling_water_flow_ls),      unit: "L/s",  icon: "❄", thr: null },
  { label: "Shaft Run-out",    value: fmt(d?.shaft_runout_mm, 3),         unit: "mm",   icon: "🔩", thr: THR.shaft,     raw: d?.shaft_runout_mm },
  { label: "Air Gap",          value: fmt(d?.air_gap_mm),                 unit: "mm",   icon: "📏", thr: null },
];

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

  // Loading splash
  if (status === "connecting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5"
        style={{ background: "#080d1a" }}>
        <div className="relative w-16 h-16">
          <div className="spin-fast absolute inset-0 rounded-full border-[3px] border-transparent"
            style={{ borderTopColor: C.cyan }} />
          <div className="spin-rev  absolute inset-2 rounded-full border-[3px] border-transparent"
            style={{ borderTopColor: C.amber }} />
        </div>
        <p className="text-sm tracking-widest uppercase" style={{ color: C.cyan }}>
          Connecting to Turbine…
        </p>
      </div>
    );
  }

  const score  = conditionScore(latest);
  const alerts = buildAlerts(latest);
  const cards  = CARDS(latest);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#080d1a", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3"
        style={{
          background: "rgba(8,13,26,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid #1a2540",
          boxShadow: `0 1px 0 ${C.cyan}22`,
        }}>

        {/* Logo mark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold"
            style={{ background: `linear-gradient(135deg,${C.cyan},#6366f1)`, boxShadow: `0 0 18px ${C.cyan}55` }}>
            ⚡
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">Virtual Hydraulic Turbine</p>
            <p className="text-xs" style={{ color: `${C.cyan}cc` }}>Digital Twin · Predictive Maintenance</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status badge */}
        {status === "error" ? (
          <span className="text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: "#3b0a0a", color: C.red, border: `1px solid ${C.red}44` }}>
            ⚠ API Unreachable
          </span>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            LIVE · {lastTs}
          </div>
        )}

        {/* Score pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: score >= 90 ? "#071a10" : score >= 75 ? "#2d1e06" : "#3b0a0a",
            color:  score >= 90 ? C.green : score >= 75 ? C.amber : C.red,
            border: `1px solid ${score >= 90 ? C.green : score >= 75 ? C.amber : C.red}44`,
          }}>
          <span>Condition</span>
          <span style={{ fontSize: 15 }}>{score}</span>
          <span className="text-slate-500 font-normal">/ 100</span>
        </div>

        <span className="text-xs px-3 py-1 rounded-full text-slate-400"
          style={{ background: "#0d1429", border: "1px solid #1a2540" }}>
          turbine_01 · Kaplan
        </span>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main className="flex-1 px-5 py-5 max-w-screen-2xl mx-auto w-full space-y-5">

        {/* Row 1: Tabbed Chart + Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
          <TabbedChart history={history} />
          <Sidebar alerts={alerts} latest={latest} score={score} />
        </div>

        {/* Row 2: Radar + Bar + Donut */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <HealthRadar  data={latest} />
          <PowerBar     history={history} />
          <EnergyDonut  data={latest} />
        </div>

        {/* Row 3: Sensor KPI cards */}
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
            <span className="w-4 h-px" style={{ background: C.cyan }} />
            Real-time Sensor Metrics
            <span className="flex-1 h-px" style={{ background: "linear-gradient(90deg,#1a2540,transparent)" }} />
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {cards.map((c) => (
              <MetricCard
                key={c.label}
                label={c.label}
                value={c.value}
                unit={c.unit}
                icon={c.icon}
                status={c.thr ? getStatus(c.raw, c.thr) : "normal"}
              />
            ))}
          </div>
        </div>

      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="py-3 text-center text-xs text-slate-700 border-t border-slate-900">
        Virtual Hydraulic Turbine · Phase 4 Dashboard · Polling {API_URL} every {POLL_MS}ms
      </footer>
    </div>
  );
}
