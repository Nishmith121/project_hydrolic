import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { C, buildRadar, buildDonut, fmt } from "../config.js";

const DONUT_COLORS = [C.cyan, C.amber, C.purple, C.red];

// ── Radar ─────────────────────────────────────────────────────────────────────
export function HealthRadar({ data }) {
  const rd = buildRadar(data);
  return (
    <div className="panel fade-in">
      <div className="panel-header" style={{ marginBottom: 8 }}>
        <span className="panel-title">Equipment Health</span>
        <span style={{ fontSize: 9, color: "#64748b" }}>Multi-dimensional</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={rd} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke={C.cyan} fill={C.cyan} fillOpacity={0.15} strokeWidth={2}
            style={{ filter: `drop-shadow(0 0 4px ${C.cyan})` }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
export function PowerBar({ history }) {
  const slice = history.slice(-12);
  return (
    <div className="panel fade-in">
      <div className="panel-header" style={{ marginBottom: 8 }}>
        <span className="panel-title">Power History</span>
        <span style={{ fontSize: 9, color: "#64748b" }}>Last 12 readings</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={slice} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="t" hide />
          <YAxis domain={[100, 140]} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: `${C.amber}08` }}
            content={({ active, payload }) => active && payload?.length ? (
              <div style={{ background: "rgba(6,8,15,0.95)", border: `1px solid ${C.amber}44`, borderRadius: 6, padding: "4px 10px" }}>
                <span style={{ color: C.amber, fontFamily: "monospace", fontSize: 12 }}>
                  {fmt(payload[0].value)} MW
                </span>
              </div>
            ) : null}
          />
          <Bar dataKey="active_power_mw" radius={[3, 3, 0, 0]}>
            {slice.map((_, i) => (
              <Cell key={i}
                fill={i === slice.length - 1 ? C.cyan : C.amber}
                style={{ filter: `drop-shadow(0 0 3px ${i === slice.length - 1 ? C.cyan : C.amber})` }} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Donut ─────────────────────────────────────────────────────────────────────
const DonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.08 ? (
    <text x={x} y={y} fill="#94a3b8" textAnchor="middle" dominantBaseline="central" fontSize={9}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export function EnergyDonut({ data }) {
  const dd = buildDonut(data);
  const total = dd.reduce((s, d) => s + d.value, 0);
  return (
    <div className="panel fade-in">
      <div className="panel-header" style={{ marginBottom: 8 }}>
        <span className="panel-title">Energy Distribution</span>
        <span style={{ fontSize: 9, color: "#64748b" }}>Current</span>
      </div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={dd} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
              dataKey="value" labelLine={false} label={DonutLabel} strokeWidth={0}>
              {dd.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i]}
                  style={{ filter: `drop-shadow(0 0 4px ${DONUT_COLORS[i]}66)` }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.cyan, fontVariantNumeric: "tabular-nums" }}>
            {fmt(total, 0)}
          </span>
          <span style={{ fontSize: 10, color: "#64748b" }}>MW Total</span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 4 }}>
        {dd.map((d, i) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: DONUT_COLORS[i] }} />
            <span style={{ fontSize: 10, color: "#94a3b8" }}>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
