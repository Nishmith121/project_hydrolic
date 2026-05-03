import { useState, useEffect, useRef } from "react";
import { Layout, Menu, Tag, Space, Spin, Typography, Badge, Flex } from "antd";
import {
  DashboardOutlined,
  ControlOutlined,
  AlertOutlined,
  BarChartOutlined,
  BulbOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { C, THR, fmt, getStatus, conditionScore, buildAlerts } from "./config.js";
import { palette } from "./theme.js";
import MetricCard       from "./components/MetricCard.jsx";
import TabbedChart      from "./components/TabbedChart.jsx";
import AnomalyPanel     from "./components/AnomalyPanel.jsx";
import GateControlPanel from "./components/GateControlPanel.jsx";
import AlertsPanel      from "./components/AlertsPanel.jsx";
import KPIPanel         from "./components/KPIPanel.jsx";
import SidebarLeft      from "./components/SidebarLeft.jsx";
import DiagnosticPanel  from "./components/DiagnosticPanel.jsx";
import AiAlertsPage     from "./components/AiAlertsPage.jsx";
import AiRecommendationsPage from "./components/AiRecommendationsPage.jsx";
import AnalyticsCharts  from "./components/Charts.jsx";
import StatusStrip      from "./components/StatusStrip.jsx";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: "dashboard",  label: "Dashboard",          icon: <DashboardOutlined /> },
  { key: "scada",      label: "SCADA Control",      icon: <ControlOutlined /> },
  { key: "ai-alerts",  label: "AI & Alerts",        icon: <AlertOutlined /> },
  { key: "ai-reco",    label: "AI Recommendations", icon: <BulbOutlined /> },
  { key: "analytics",  label: "Analytics",          icon: <BarChartOutlined /> },
];

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

// ── Section divider ──────────────────────────────────────────────────────────
function SectionDivider({ title, color = C.primary }) {
  return (
    <div className="section-divider">
      <div className="section-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="section-label">{title}</span>
      <div className="section-line" />
    </div>
  );
}

// ── Inline Logo SVG ──────────────────────────────────────────────────────────
function TurbineLogo() {
  return (
    <div className="topbar-logo">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#071a2b"/>
        <rect x="1" y="1" width="46" height="46" rx="11" fill="none" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.5"/>
        <g transform="translate(24, 24)">
          <path d="M0 0 L-3 -16 Q0 -20 3 -16 Z" fill="url(#logoGrad)" opacity="0.9"/>
          <path d="M0 0 L14 -8 Q18 -5 12 -4 Z" fill="url(#logoGrad)" opacity="0.8"/>
          <path d="M0 0 L10 13 Q12 17 7 13 Z" fill="url(#logoGrad)" opacity="0.7"/>
          <path d="M0 0 L-10 13 Q-12 17 -7 13 Z" fill="url(#logoGrad)" opacity="0.7"/>
          <path d="M0 0 L-14 -8 Q-18 -5 -12 -4 Z" fill="url(#logoGrad)" opacity="0.8"/>
        </g>
        <g fill="none" stroke="#10b981" strokeWidth="1" strokeLinecap="round" opacity="0.35">
          <path d="M10 16 Q16 10 24 8 Q32 10 38 16"/>
          <path d="M38 34 Q32 40 24 42 Q16 40 10 34"/>
        </g>
        <circle cx="24" cy="24" r="5" fill="#071a2b" stroke="url(#logoGrad)" strokeWidth="1.5"/>
        <circle cx="24" cy="24" r="2.5" fill="#0b2236" stroke="#10b981" strokeWidth="0.8" opacity="0.8"/>
        <path d="M23 21 L25.5 23.5 L23.5 23.5 L26 27 L23.5 24.5 L25.5 24.5 Z" fill="#10b981" opacity="0.95"/>
        <circle cx="24" cy="24" r="1" fill="#ffffff" opacity="0.7"/>
      </svg>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [latest,  setLatest]  = useState(null);
  const [history, setHistory] = useState([]);
  const [status,  setStatus]  = useState("idle");
  const [lastTs,  setLastTs]  = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const tick = useRef(0);

  useEffect(() => {
    if (!isConnected) return;
    let live = true;
    setStatus("connecting");
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
  }, [isConnected]);

  // ── Welcome / Connect Screen ──
  if (!isConnected) {
    return (
      <div className="loading-screen" style={{ background: "linear-gradient(160deg, #071a2b 0%, #0a2a3a 40%, #082a28 100%)" }}>
        {/* Faint background grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "radial-gradient(circle, #10b981 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

        <div className="fade-in" style={{
          position: "relative", width: 520, maxWidth: "90vw",
          border: "1.5px solid #06b6d4", borderRadius: 20,
          background: "rgba(11, 34, 54, 0.85)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
          padding: "48px 44px", textAlign: "center",
        }}>
          {/* Glow border corners */}
          <div style={{ position: "absolute", top: -1, left: -1, right: -1, height: 2, background: "linear-gradient(90deg, transparent, #06b6d4, transparent)", borderRadius: "20px 20px 0 0" }} />
          <div style={{ position: "absolute", bottom: -1, left: -1, right: -1, height: 2, background: "linear-gradient(90deg, transparent, #06b6d4, transparent)", borderRadius: "0 0 20px 20px" }} />

          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#e8f4f8", marginBottom: 28, letterSpacing: -0.5 }}>
            Welcome to <span style={{ color: "#06b6d4" }}>HYDRO</span>
          </h1>

          <p style={{ color: "#6a9bb5", fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
            HYDRO is designed to connect with real-time hydraulic turbine
            machines to analyze operational data using AI.
          </p>
          <p style={{ color: "#6a9bb5", fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
            Since live factory machines are not available during this demo,
            the app runs in <strong style={{ color: "#e8f4f8" }}>Simulation Mode</strong> by default.
          </p>
          <p style={{ color: "#6a9bb5", fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
            In this mode, the system generates realistic, real-time machine
            data and processes it through the same AI model and pipeline
            used for real-world deployments.
          </p>
          <p style={{ color: "#6a9bb5", fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
            This allows you to experience the full functionality of
            HYDRO exactly as it would work in a live factory environment.
          </p>

          <button
            onClick={() => setIsConnected(true)}
            style={{
              width: "100%", padding: "16px 0",
              border: "1.5px solid #06b6d4",
              borderRadius: 12,
              background: "transparent",
              color: "#06b6d4",
              fontSize: 16, fontWeight: 700,
              letterSpacing: 2, textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 0 20px rgba(6, 182, 212, 0.15)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,0.12)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(6,182,212,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "0 0 20px rgba(6,182,212,0.15)"; }}
          >
            Connect Model
          </button>
        </div>
      </div>
    );
  }

  // ── Loading (brief state while first poll completes) ──
  if (status === "connecting" || status === "idle") {
    return (
      <div className="loading-screen">
        <Spin size="large" />
        <Text style={{ color: C.primary, fontSize: 12, letterSpacing: 3, textTransform: "uppercase" }}>
          Connecting to Turbine…
        </Text>
      </div>
    );
  }

  const score  = conditionScore(latest);
  const alerts = buildAlerts(latest);
  const ml     = latest?.ml_insights;
  const isAnomaly = ml?.is_anomaly;

  return (
    <Layout style={{ minHeight: "100vh" }}>

      {/* ═══ HEADER ════════════════════════════════════════════════════════ */}
      <Header style={{
        display: "flex", alignItems: "center", gap: 24, padding: "0 24px",
        zIndex: 50, height: 64,
      }}>
        {/* Brand */}
        <Flex align="center" gap={12} style={{ width: 220 }}>
          <TurbineLogo />
          <Text strong style={{ fontSize: 17, color: "#e8f4f8", letterSpacing: -0.3 }}>
            HYDRO
          </Text>
        </Flex>

        {/* Navigation */}
        <Menu
          mode="horizontal"
          theme="dark"
          selectedKeys={[activePage]}
          onClick={({ key }) => setActivePage(key)}
          items={NAV_ITEMS}
          className="topbar-menu"
          style={{
            flex: 1, background: "transparent", borderBottom: "none",
            fontSize: 13, fontWeight: 500,
          }}
        />

        {/* Status Indicators */}
        <Flex align="center" gap={12}>
          {status === "error" ? (
            <Tag color="error" style={{ margin: 0 }}>⚠ API Offline</Tag>
          ) : (
            <Flex align="center" gap={6}>
              <span className="dot-live" />
              <Text style={{ color: palette.textGray, fontSize: 12 }}>LIVE · {lastTs}</Text>
            </Flex>
          )}
          {ml && !ml.error && (
            <Tag color={isAnomaly ? "error" : "success"} style={{ margin: 0, fontWeight: 600 }}>
              {isAnomaly ? "🚨 ANOMALY" : "✓ HEALTHY"}
            </Tag>
          )}
          <Tag color={score >= 90 ? "success" : score >= 75 ? "warning" : "error"} style={{ margin: 0, fontWeight: 600 }}>
            Score {score}/100
          </Tag>
          <Tag icon={<UserOutlined />} style={{ margin: 0, background: palette.bgCard, borderColor: palette.border, color: palette.textMuted }}>
            turbine_01
          </Tag>
        </Flex>
      </Header>

      {/* ═══ BODY ══════════════════════════════════════════════════════════ */}
      <Layout>
        <Sider width={260} style={{ overflow: "auto", height: "calc(100vh - 64px)" }}>
          <SidebarLeft />
        </Sider>

        <Content style={{ padding: 24, overflow: "auto", height: "calc(100vh - 64px)" }}>

          {/* ─── DASHBOARD ────────────────────────────────────────────── */}
          {activePage === "dashboard" && (
            <div className="fade-in">
              <StatusStrip latest={latest} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginTop: 24 }}>
                <div>
                  <SectionDivider title="Secondary Sensors" color={C.teal} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    {SECONDARY(latest).map(c => (
                      <MetricCard key={c.label} {...c} status="normal" compact />
                    ))}
                  </div>
                </div>
                <KPIPanel latest={latest} score={score} />
              </div>

              <div style={{ marginTop: 24 }}>
                <SectionDivider title="Monitored Parameters" color={C.amber} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                  {MONITORED(latest).map(c => (
                    <MetricCard key={c.label} {...c} status={c.thr ? getStatus(c.raw, c.thr) : "normal"} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── SCADA CONTROL ────────────────────────────────────────── */}
          {activePage === "scada" && (
            <div className="fade-in">
              <GateControlPanel latest={latest} />
              <div style={{ marginTop: 24 }}>
                <SectionDivider title="System Response Trends" color={C.secondary} />
                <TabbedChart history={history} />
              </div>
            </div>
          )}

          {/* ─── AI & ALERTS ──────────────────────────────────────────── */}
          {activePage === "ai-alerts" && (
            <div className="fade-in" style={{ height: "100%" }}>
              <AiAlertsPage alerts={alerts} mlInsights={ml} history={history} />
            </div>
          )}

          {/* ─── AI RECOMMENDATIONS ──────────────────────────────────── */}
          {activePage === "ai-reco" && (
            <div className="fade-in">
              <AiRecommendationsPage mlInsights={ml} latest={latest} history={history} />
            </div>
          )}

          {/* ─── ANALYTICS ────────────────────────────────────────────── */}
          {activePage === "analytics" && (
            <div className="fade-in">
              <SectionDivider title="Live Telemetry Trends" color={C.secondary} />
              <TabbedChart history={history} />
              <div style={{ marginTop: 24 }}>
                <SectionDivider title="Deep Analytics" color={C.purple} />
                <AnalyticsCharts latest={latest} history={history} />
              </div>
            </div>
          )}

        </Content>
      </Layout>
    </Layout>
  );
}
