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
      background: "rgba(6,8,15,0.95)",
      border: `1px solid ${color}44`,
      borderRadius: 8,
      padding: "5px 10px",
      boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
    }}>
      <span style={{ color, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>
        {Number(payload[0].value).toFixed(3)} {unit}
      </span>
    </div>
  );
};

export default function TabbedChart({ history }) {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  const warnMap = {
    vibration_mms: THR.vibration.warn,
    bearing_temp_c: THR.bearing.warn,
    stator_winding_temp_c: THR.stator.warn,
  };
  const critMap = {
    vibration_mms: THR.vibration.crit,
    bearing_temp_c: THR.bearing.crit,
  };

  return (
    <div className="panel fade-in" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
        {TABS.map((t, i) => (
          <button key={t.key} onClick={() => setActive(i)}
            style={{
              position: "relative",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              cursor: "pointer",
              border: active === i ? `1px solid ${t.color}33` : "1px solid transparent",
              background: active === i ? `${t.color}15` : "transparent",
              color: active === i ? t.color : "#64748b",
              transition: "all 0.2s ease",
            }}
          >
            {t.label}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: tab.color, animation: "blink 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: tab.color, fontVariantNumeric: "tabular-nums" }}>
            {history.length ? fmt(history[history.length - 1]?.[tab.key], 2) : "—"} {tab.unit}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, paddingTop: 12 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${tab.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={tab.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={tab.color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis domain={tab.domain} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip unit={tab.unit} color={tab.color} />} />
            {warnMap[tab.key] && (
              <ReferenceLine y={warnMap[tab.key]} stroke={C.amber} strokeDasharray="5 3"
                label={{ value: "WARN", fill: C.amber, fontSize: 9, position: "insideTopRight" }} />
            )}
            {critMap[tab.key] && (
              <ReferenceLine y={critMap[tab.key]} stroke={C.red} strokeDasharray="5 3"
                label={{ value: "CRIT", fill: C.red, fontSize: 9, position: "insideTopRight" }} />
            )}
            <Area type="monotoneX" dataKey={tab.key} stroke={tab.color} strokeWidth={2}
              fill={`url(#grad-${tab.key})`} dot={false} isAnimationActive={false}
              style={{ filter: `drop-shadow(0 0 4px ${tab.color}66)` }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
