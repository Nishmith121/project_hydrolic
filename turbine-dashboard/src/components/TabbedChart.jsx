import { useState } from "react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { C, TABS, THR, fmt } from "../config.js";

const CustomTooltip = ({ active, payload, unit, color }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,13,26,0.95)",
      border: `1px solid ${color}55`,
      borderRadius: 8,
      padding: "6px 12px",
      boxShadow: `0 0 16px ${color}33`,
    }}>
      <span style={{ color, fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>
        {Number(payload[0].value).toFixed(3)} {unit}
      </span>
    </div>
  );
};

export default function TabbedChart({ history }) {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  // Warn/crit lines per tab
  const warnMap = {
    vibration_mms:   THR.vibration.warn,
    bearing_temp_c:  THR.bearing.warn,
    stator_winding_temp_c: THR.stator.warn,
  };
  const critMap = {
    vibration_mms:   THR.vibration.crit,
    bearing_temp_c:  THR.bearing.crit,
  };

  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden slide-up"
      style={{ background: `linear-gradient(135deg, ${C.card} 0%, #0a1020 100%)`, border: "1px solid #1a2540" }}
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-3 border-b border-slate-800/60">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setActive(i)}
            className="relative px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
            style={{
              background: active === i ? `${t.color}22` : "transparent",
              color: active === i ? t.color : "#64748b",
              border: active === i ? `1px solid ${t.color}44` : "1px solid transparent",
              boxShadow: active === i ? `0 0 12px ${t.color}33` : "none",
              textShadow: active === i ? `0 0 8px ${t.color}` : "none",
            }}
          >
            {t.label}
          </button>
        ))}

        {/* Current value badge */}
        <div className="ml-auto flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full neon-pulse" style={{ background: tab.color }} />
          <span className="font-mono text-sm font-bold" style={{ color: tab.color }}>
            {history.length ? fmt(history[history.length - 1]?.[tab.key], 2) : "—"} {tab.unit}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 py-3">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${tab.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={tab.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={tab.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={tab.domain}
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip unit={tab.unit} color={tab.color} />} />
            {warnMap[tab.key] && (
              <ReferenceLine y={warnMap[tab.key]} stroke={C.amber} strokeDasharray="5 3"
                label={{ value: "WARN", fill: C.amber, fontSize: 9, position: "insideTopRight" }} />
            )}
            {critMap[tab.key] && (
              <ReferenceLine y={critMap[tab.key]} stroke={C.red} strokeDasharray="5 3"
                label={{ value: "CRIT", fill: C.red, fontSize: 9, position: "insideTopRight" }} />
            )}
            <Area
              type="monotoneX"
              dataKey={tab.key}
              stroke={tab.color}
              strokeWidth={2.5}
              fill={`url(#grad-${tab.key})`}
              dot={false}
              isAnimationActive={false}
              style={{ filter: `drop-shadow(0 0 6px ${tab.color}99)` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
