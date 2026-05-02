import { useState, useEffect, useRef } from "react";
import { Layout, Menu, Tag, Space, Spin, Typography, Badge, Flex } from "antd";
import {
  DashboardOutlined,
  ControlOutlined,
  AlertOutlined,
  BarChartOutlined,
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
import AnalyticsCharts  from "./components/Charts.jsx";
import StatusStrip      from "./components/StatusStrip.jsx";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: "dashboard",  label: "Dashboard",     icon: <DashboardOutlined /> },
  { key: "scada",      label: "SCADA Control", icon: <ControlOutlined /> },
  { key: "ai-alerts",  label: "AI & Alerts",   icon: <AlertOutlined /> },
  { key: "analytics",  label: "Analytics",     icon: <BarChartOutlined /> },
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
  const [latest,  setLatest]  = useState(null);
  const [history, setHistory] = useState([]);
  const [status,  setStatus]  = useState("connecting");
  const [lastTs,  setLastTs]  = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
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
            Hydraulic Turbine
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

              <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, marginTop: 24 }}>
                <KPIPanel latest={latest} score={score} />
                <div>
                  <SectionDivider title="Secondary Sensors" color={C.teal} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    {SECONDARY(latest).map(c => (
                      <MetricCard key={c.label} {...c} status="normal" compact />
                    ))}
                  </div>
                </div>
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
              <GateControlPanel />
              <div style={{ marginTop: 24 }}>
                <SectionDivider title="System Response Trends" color={C.secondary} />
                <TabbedChart history={history} />
              </div>
            </div>
          )}

          {/* ─── AI & ALERTS ──────────────────────────────────────────── */}
          {activePage === "ai-alerts" && (
            <div className="fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20, marginBottom: 24 }}>
                <AnomalyPanel mlInsights={ml} />
                <DiagnosticPanel diagnosis={ml?.diagnosis} actionRequired={ml?.action_required} />
              </div>
              <AlertsPanel alerts={alerts} mlInsights={ml} />
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
