import { useMemo, useRef } from "react";
import { Line, Column } from "@ant-design/charts";

/*
 *  Props expected:
 *    mlInsights  – the ml_insights object from /api/live-data
 *    latest      – latest full telemetry snapshot
 *    history     – array of telemetry snapshots (last 30)
 */
export default function AiRecommendationsPage({ mlInsights, latest, history }) {
  const ml        = mlInsights || {};
  const isAnomaly = ml.is_anomaly;
  const score     = ml.anomaly_score ?? 0;
  const rawDiagnosis = ml.diagnosis;
  const rawAction    = ml.action_required;
  const diagnosis = (!rawDiagnosis || rawDiagnosis === "None") ? "System operating within normal parameters" : rawDiagnosis;
  const action    = (!rawAction || rawAction === "None") ? "Continue monitoring - all systems nominal" : rawAction;

  /* ── Severity label ──────────────────────────────────────────────────── */
  const severity = isAnomaly ? "CRITICAL" : "NORMAL";
  const sevColor = isAnomaly ? "#ef4444" : "#10b981";

  /* ── Derived KPIs ────────────────────────────────────────────────────── */
  const confidence = useMemo(() => {
    if (!ml || ml.error) return 0;
    const raw = Math.max(0, Math.min(1, 1 - Math.abs(score)));
    return +(raw * 100).toFixed(1);
  }, [score, ml]);

  const stability = useMemo(() => {
    if (history.length < 3) return 100;
    const scores = history.slice(-10).map(h => h.vibration_mms ?? 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((s, v) => s + (v - avg) ** 2, 0) / scores.length;
    return +(Math.max(0, 100 - variance * 20)).toFixed(1);
  }, [history]);

  const rollingAvg = useMemo(() => {
    if (history.length === 0) return 0;
    const recent = history.slice(-10);
    const avg = recent.reduce((s, h) => s + (h.vibration_mms ?? 0), 0) / recent.length;
    return +(avg / 15).toFixed(3);
  }, [history]);

  /* ── Anomaly Score Trend chart data ──────────────────────────────────── */
  // Use a stable noise seed per data point instead of Math.random
  const trendData = useMemo(() =>
    history.map((h, i) => ({
      tick: String(h.t),
      score: +((h.vibration_mms ?? 0) / 15).toFixed(3),
    })),
  [history]);

  const trendConfig = {
    data: trendData,
    xField: "tick",
    yField: "score",
    smooth: true,
    animation: false,
    height: 200,
    point: { size: 3, shape: "circle", style: { fill: "#06b6d4" } },
    style: {
      stroke: "#06b6d4",
      lineWidth: 2,
    },
    scale: { y: { domain: [0, 1] } },
    axis: {
      x: { label: { style: { fill: "#4a7a92", fontSize: 9 } }, line: false, tick: false },
      y: {
        label: { style: { fill: "#4a7a92", fontSize: 10 } },
        grid: { style: { stroke: "#164260", strokeDasharray: "3 3" } },
        line: false, tick: false,
      },
    },
    theme: { view: { viewFill: "transparent" } },
  };

  /* ── Sensor Impact bar data ──────────────────────────────────────────── */
  const sensorData = useMemo(() => {
    if (!latest) return [];
    return [
      { sensor: "Vibration",   impact: +((latest.vibration_mms ?? 0) / 5 * 100).toFixed(1) },
      { sensor: "Bearing",     impact: +((latest.bearing_temp_c ?? 0) / 70 * 100).toFixed(1) },
      { sensor: "Stator",      impact: +((latest.stator_winding_temp_c ?? 0) / 90 * 100).toFixed(1) },
      { sensor: "Flow Rate",   impact: +((latest.water_flow_rate_m3s ?? 0) / 90 * 100).toFixed(1) },
      { sensor: "Frequency",   impact: +((latest.frequency_hz ?? 0) / 50.5 * 100).toFixed(1) },
    ];
  }, [latest]);

  const barConfig = {
    data: sensorData,
    xField: "sensor",
    yField: "impact",
    height: 200,
    style: {
      fill: (d) => d.impact > 95 ? "#ef4444" : d.impact > 85 ? "#f59e0b" : "#10b981",
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
    scale: { y: { domain: [0, 120] } },
    axis: {
      x: { label: { style: { fill: "#6a9bb5", fontSize: 10 } }, line: false, tick: false },
      y: {
        label: { style: { fill: "#4a7a92", fontSize: 10 } },
        grid: { style: { stroke: "#164260", strokeDasharray: "3 3" } },
        line: false, tick: false,
      },
    },
    theme: { view: { viewFill: "transparent" } },
  };

  /* ── Gauge SVG helper ────────────────────────────────────────────────── */
  function arcPath(cx, cy, r, startDeg, endDeg) {
    const toRad = d => (d * Math.PI) / 180;
    const sx = cx + r * Math.cos(toRad(startDeg));
    const sy = cy + r * Math.sin(toRad(startDeg));
    const ex = cx + r * Math.cos(toRad(endDeg));
    const ey = cy + r * Math.sin(toRad(endDeg));
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  }

  const gaugeStart = 135;
  const gaugeEnd   = 405;
  const gaugeSpan  = gaugeEnd - gaugeStart;
  const healthPct  = isAnomaly ? 35 : confidence;
  const fillEnd    = gaugeStart + (healthPct / 100) * gaugeSpan;

  return (
    <div className="grid grid-cols-2 gap-5 text-[#e8f4f8] font-sans">

      {/* ═══ TOP-LEFT: AI Diagnostics ═══════════════════════════════════ */}
      <div className="bg-[#0b2236]/90 border border-[#164260] rounded-xl p-6 relative overflow-hidden shadow-lg">
        {/* Top glow bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]" />

        <div className="flex items-center gap-2.5 mb-6">
          <span className="text-amber-500 text-lg">⚙</span>
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#10b981]">AI Diagnostics</h2>
        </div>

        <div className="space-y-5">
          <div>
            <span className="block text-xs font-bold tracking-widest uppercase text-red-500 mb-1.5">Root Cause</span>
            <p className="text-sm text-[#e8f4f8] leading-relaxed">{diagnosis}</p>
          </div>
          <div>
            <span className="block text-xs font-bold tracking-widest uppercase text-[#10b981] mb-1.5">Recommendation</span>
            <p className="text-sm text-[#e8f4f8] leading-relaxed">{action}</p>
          </div>
        </div>
      </div>

      {/* ═══ TOP-RIGHT: System Health ══════════════════════════════════ */}
      <div className="bg-[#0b2236]/90 border border-[#164260] rounded-xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.4)]" />

        <div className="flex items-center gap-2.5 mb-5">
          <span className="text-[#10b981] text-lg">🛡</span>
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#10b981]">System Health</h2>
        </div>

        <div className="flex items-center gap-6">
          {/* Gauge */}
          <div className="flex flex-col items-center shrink-0">
            <svg width="120" height="80" viewBox="0 0 160 100">
              <path d={arcPath(80, 85, 55, gaugeStart, gaugeEnd)} fill="none" stroke="#164260" strokeWidth="10" strokeLinecap="round" />
              <path d={arcPath(80, 85, 55, gaugeStart, fillEnd)} fill="none" stroke={sevColor} strokeWidth="10" strokeLinecap="round"
                style={{ transition: "all 0.4s ease", filter: `drop-shadow(0 0 8px ${sevColor}88)` }} />
            </svg>
            <div className="-mt-8 text-center">
              <span className="block text-[10px] text-[#6a9bb5] tracking-widest uppercase">Severity</span>
              <span className="block text-xl font-black tracking-wider" style={{ color: sevColor }}>{severity}</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-3 flex-1">
            {[
              { label: "Confidence", value: `${confidence}%`, icon: "🛡", color: "#10b981" },
              { label: "Stability",  value: `${stability}%`,  icon: "📊", color: "#10b981" },
              { label: "Rolling Avg", value: `${rollingAvg}`, icon: "📈", color: "#f59e0b" },
            ].map(kpi => (
              <div key={kpi.label} className="bg-[#071a2b]/70 border border-[#164260] rounded-lg p-3 text-center">
                <span className="block text-lg mb-1">{kpi.icon}</span>
                <span className="block text-[9px] text-[#6a9bb5] tracking-widest uppercase mb-0.5">{kpi.label}</span>
                <span className="block text-base font-extrabold" style={{ color: kpi.color, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM-LEFT: Anomaly Score Trend ═════════════════════════ */}
      <div className="bg-[#0b2236]/90 border border-[#164260] rounded-xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#06b6d4] shadow-[0_0_12px_rgba(6,182,212,0.4)]" />

        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-[#06b6d4] text-lg">📈</span>
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#06b6d4]">Anomaly Score Trend</h2>
        </div>

        <div className="bg-[#071a2b]/60 border border-[#164260] rounded-lg p-3">
          {trendData.length >= 2 ? (
            <Line {...trendConfig} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[#6a9bb5] text-sm">
              Collecting data…
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM-RIGHT: Sensor Impact Analysis ════════════════════ */}
      <div className="bg-[#0b2236]/90 border border-[#164260] rounded-xl p-6 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.4)]" />

        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-[#10b981] text-lg">📊</span>
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#10b981]">Sensor Impact Analysis</h2>
        </div>

        {isAnomaly ? (
          <div className="bg-[#071a2b]/60 border border-[#164260] rounded-lg p-3">
            <Column {...barConfig} />
          </div>
        ) : (
          <div className="rounded-xl border-2 border-[#10b981]/40 bg-[#10b981]/10 p-10 flex flex-col items-center justify-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
            <span className="text-4xl">✅</span>
            <span className="text-lg font-extrabold tracking-widest uppercase text-[#10b981]">System Status Normal</span>
          </div>
        )}
      </div>
    </div>
  );
}
