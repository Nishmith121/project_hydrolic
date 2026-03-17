// ── Palette (Blue-Green Oceanic) ─────────────────────────────────────────────
export const C = {
  primary:  "#10b981",   // Emerald green — main accent
  secondary:"#06b6d4",   // Cyan
  blue:     "#3b82f6",
  teal:     "#14b8a6",
  emerald:  "#34d399",
  aqua:     "#22d3ee",
  sky:      "#38bdf8",
  mint:     "#6ee7b7",
  green:    "#22c55e",
  amber:    "#f59e0b",
  red:      "#ef4444",
  purple:   "#a78bfa",
  pink:     "#f472b6",
};

// ── Thresholds ────────────────────────────────────────────────────────────────
export const THR = {
  vibration: { warn: 3.8,  crit: 4.2  },
  bearing:   { warn: 65.5, crit: 66.0 },
  stator:    { warn: 86.0, crit: 87.0 },
  shaft:     { warn: 0.18, crit: 0.20 },
};

// ── Chart tab definitions ─────────────────────────────────────────────────────
export const TABS = [
  { key: "vibration_mms",       label: "Vibration",    unit: "mm/s", color: C.amber,    domain: [1.5, 5] },
  { key: "active_power_mw",     label: "Power",        unit: "MW",   color: C.primary,  domain: [100, 140] },
  { key: "bearing_temp_c",      label: "Bearing Temp", unit: "°C",   color: C.purple,   domain: [62, 68] },
  { key: "water_flow_rate_m3s", label: "Flow Rate",    unit: "m³/s", color: C.aqua,     domain: [75, 95] },
  { key: "frequency_hz",        label: "Frequency",    unit: "Hz",   color: C.sky,      domain: [49.5, 50.5] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
export const fmt = (v, d = 1) => (v != null ? Number(v).toFixed(d) : "—");

export function getStatus(value, thr) {
  if (!thr || value == null) return "normal";
  if (value >= thr.crit) return "critical";
  if (value >= thr.warn) return "warning";
  return "normal";
}

export function statusColor(s) {
  return { normal: C.primary, warning: C.amber, critical: C.red }[s] ?? C.primary;
}

export function conditionScore(d) {
  if (!d) return 98;
  let s = 100;
  if (d.vibration_mms   > THR.vibration.crit) s -= 18;
  else if (d.vibration_mms > THR.vibration.warn) s -= 8;
  if (d.bearing_temp_c  > THR.bearing.crit)   s -= 14;
  else if (d.bearing_temp_c > THR.bearing.warn) s -= 6;
  if (d.stator_winding_temp_c > THR.stator.warn) s -= 6;
  if (d.shaft_runout_mm > THR.shaft.warn)      s -= 5;
  return Math.max(0, s);
}

export function buildAlerts(d) {
  if (!d) return [];
  const a = [];
  const add = (level, title, desc, icon) => a.push({ level, title, desc, icon });
  if (d.vibration_mms > THR.vibration.crit)
    add("critical", "Excess Vibration",    `${fmt(d.vibration_mms,2)} mm/s — Critical`, "📳");
  else if (d.vibration_mms > THR.vibration.warn)
    add("warning",  "High Vibration",      `${fmt(d.vibration_mms,2)} mm/s — Warning`,  "📳");
  if (d.bearing_temp_c > THR.bearing.warn)
    add(d.bearing_temp_c > THR.bearing.crit ? "critical" : "warning",
        "Bearing Temperature", `${fmt(d.bearing_temp_c)} °C`, "🌡");
  if (d.stator_winding_temp_c > THR.stator.warn)
    add("warning",  "Stator Winding Temp", `${fmt(d.stator_winding_temp_c)} °C`, "⚡");
  if (d.shaft_runout_mm > THR.shaft.warn)
    add("warning",  "Shaft Run-out",       `${fmt(d.shaft_runout_mm,3)} mm`, "🔩");
  if (!a.length) add("ok", "All Systems Normal", "No anomalies detected", "✅");
  return a;
}

export function buildRadar(d) {
  if (!d) return [
    { subject: "Power",      value: 0 },
    { subject: "Flow",       value: 0 },
    { subject: "Stability",  value: 0 },
    { subject: "Thermal",    value: 0 },
    { subject: "Mechanical", value: 0 },
  ];
  return [
    { subject: "Power",      value: Math.min(100, (d.active_power_mw / 140) * 100) },
    { subject: "Flow",       value: Math.min(100, (d.water_flow_rate_m3s / 90) * 100) },
    { subject: "Stability",  value: Math.max(0, 100 - ((d.vibration_mms - 2) / 3) * 100) },
    { subject: "Thermal",    value: Math.max(0, 100 - ((d.bearing_temp_c - 60) / 10) * 100) },
    { subject: "Mechanical", value: Math.max(0, 100 - (d.shaft_runout_mm / 0.25) * 100) },
  ];
}

export function buildDonut(d) {
  if (!d) return [
    { name: "Active",    value: 120 },
    { name: "Reactive",  value: 15 },
    { name: "Auxiliary", value: 8 },
    { name: "Losses",    value: 4 },
  ];
  return [
    { name: "Active",    value: Math.abs(d.active_power_mw) },
    { name: "Reactive",  value: Math.abs(d.reactive_power_mvar) },
    { name: "Auxiliary", value: +(d.cooling_water_flow_ls * 0.5).toFixed(1) },
    { name: "Losses",    value: +(d.active_power_mw * 0.03).toFixed(1) },
  ];
}
