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
    <div className="rounded-2xl p-4 flex flex-col slide-up"
      style={{ background: `linear-gradient(135deg,${C.card},#0a1020)`, border: "1px solid #1a2540" }}>
      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Equipment Health</p>
      <p className="text-xs text-slate-600 mb-2">Multi-dimensional analysis</p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={rd} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke={C.cyan}
            fill={C.cyan}
            fillOpacity={0.18}
            strokeWidth={2}
            style={{ filter: `drop-shadow(0 0 6px ${C.cyan})` }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
export function PowerBar({ history }) {
  const slice = history.slice(-12);
  return (
    <div className="rounded-2xl p-4 flex flex-col slide-up"
      style={{ background: `linear-gradient(135deg,${C.card},#0a1020)`, border: "1px solid #1a2540" }}>
      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Active Power History</p>
      <p className="text-xs text-slate-600 mb-2">Last 12 readings</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={slice} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="t" hide />
          <YAxis domain={[100, 140]} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: `${C.amber}11` }}
            content={({ active, payload }) => active && payload?.length ? (
              <div style={{ background: "#0d1429", border: `1px solid ${C.amber}55`, borderRadius: 6, padding: "4px 10px" }}>
                <span style={{ color: C.amber, fontFamily: "monospace", fontSize: 12 }}>
                  {fmt(payload[0].value)} MW
                </span>
              </div>
            ) : null}
          />
          <Bar dataKey="active_power_mw" radius={[3, 3, 0, 0]}>
            {slice.map((_, i) => (
              <Cell
                key={i}
                fill={i === slice.length - 1 ? C.cyan : C.amber}
                style={{ filter: `drop-shadow(0 0 4px ${i === slice.length - 1 ? C.cyan : C.amber})` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Donut ─────────────────────────────────────────────────────────────────────
const DonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
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
    <div className="rounded-2xl p-4 flex flex-col slide-up"
      style={{ background: `linear-gradient(135deg,${C.card},#0a1020)`, border: "1px solid #1a2540" }}>
      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Energy Distribution</p>
      <p className="text-xs text-slate-600 mb-2">Current consumption</p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={dd}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              labelLine={false}
              label={DonutLabel}
              strokeWidth={0}
            >
              {dd.map((_, i) => (
                <Cell
                  key={i}
                  fill={DONUT_COLORS[i]}
                  style={{ filter: `drop-shadow(0 0 6px ${DONUT_COLORS[i]}88)` }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold tabular-nums" style={{ color: C.cyan }}>
            {fmt(total, 0)}
          </span>
          <span className="text-xs text-slate-500">MW Total</span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-1">
        {dd.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i] }} />
            <span className="text-xs text-slate-400">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
