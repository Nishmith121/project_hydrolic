import { useMemo } from "react";
import { Card, Flex, Typography } from "antd";
import { Line, Column, Pie } from "@ant-design/charts";
import { C, buildRadar, buildDonut, fmt } from "../config.js";

const { Text } = Typography;

// ── Equipment Health Radar (using Line in polar coords workaround) ─────────
function HealthRadar({ data }) {
  const rd = buildRadar(data);

  /* Build a simple SVG radar since @ant-design/charts Radar is broken in v2 */
  const cx = 110, cy = 110, maxR = 85;
  const axes = rd.map((d, i) => {
    const angle = (Math.PI * 2 * i) / rd.length - Math.PI / 2;
    return { ...d, angle };
  });

  const polyPoints = axes.map(a => {
    const r = (a.value / 100) * maxR;
    return `${cx + r * Math.cos(a.angle)},${cy + r * Math.sin(a.angle)}`;
  }).join(" ");

  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
        <div>
          <Text strong style={{ fontSize: 14, color: "#e8f4f8", display: "block" }}>Equipment Health Score</Text>
          <Text style={{ fontSize: 11, color: "#4a7a92" }}>Multi-dimensional analysis</Text>
        </div>
      </Flex>
      <svg width="220" height="220" viewBox="0 0 220 220" style={{ display: "block", margin: "0 auto" }}>
        {/* Grid rings */}
        {gridLevels.map(lv => {
          const r = (lv / 100) * maxR;
          const pts = axes.map(a => `${cx + r * Math.cos(a.angle)},${cy + r * Math.sin(a.angle)}`).join(" ");
          return <polygon key={lv} points={pts} fill="none" stroke="#164260" strokeWidth="0.7" />;
        })}
        {/* Axis lines */}
        {axes.map((a, i) => (
          <line key={i} x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(a.angle)} y2={cy + maxR * Math.sin(a.angle)}
            stroke="#164260" strokeWidth="0.7" />
        ))}
        {/* Data polygon */}
        <polygon points={polyPoints} fill={`${C.secondary}30`} stroke={C.secondary} strokeWidth="2" />
        {/* Data points */}
        {axes.map((a, i) => {
          const r = (a.value / 100) * maxR;
          return <circle key={i} cx={cx + r * Math.cos(a.angle)} cy={cy + r * Math.sin(a.angle)}
            r="4" fill={C.secondary} stroke="#0b2236" strokeWidth="1.5" />;
        })}
        {/* Labels */}
        {axes.map((a, i) => {
          const r = maxR + 16;
          const lx = cx + r * Math.cos(a.angle);
          const ly = cy + r * Math.sin(a.angle);
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              fill="#6a9bb5" fontSize="10" fontWeight="600">
              {a.subject}
            </text>
          );
        })}
        {/* Value labels on data points */}
        {axes.map((a, i) => {
          const r = (a.value / 100) * maxR + 12;
          const lx = cx + r * Math.cos(a.angle);
          const ly = cy + r * Math.sin(a.angle);
          return (
            <text key={`v-${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              fill={C.secondary} fontSize="9" fontWeight="700">
              {a.value.toFixed(1)}
            </text>
          );
        })}
      </svg>
    </Card>
  );
}

// ── Hourly Production Rate (Bar Chart) ─────────────────────────────────────
function PowerBar({ history }) {
  const chartData = useMemo(() => {
    const slice = history.slice(-12);
    return slice.map((d, i) => ({
      index: String(i + 1),
      power: +(d.active_power_mw ?? 0).toFixed(1),
    }));
  }, [history]);

  const config = {
    data: chartData,
    xField: "index",
    yField: "power",
    height: 220,
    style: {
      fill: (datum, i) => i === chartData.length - 1 ? C.primary : C.amber,
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
    scale: { y: { domain: [80, 140] } },
    axis: {
      x: { label: false, line: false, tick: false },
      y: {
        label: { style: { fill: "#4a7a92", fontSize: 10 } },
        grid: { style: { stroke: "#164260", strokeDasharray: "3 3" } },
        line: false, tick: false,
      },
    },
    tooltip: {
      channel: "y",
      valueFormatter: (v) => `${Number(v).toFixed(1)} MW`,
    },
    theme: { view: { viewFill: "transparent" } },
  };

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
        <div>
          <Text strong style={{ fontSize: 14, color: "#e8f4f8", display: "block" }}>Hourly Production Rate</Text>
          <Text style={{ fontSize: 11, color: "#4a7a92" }}>Last 6 hours comparison</Text>
        </div>
      </Flex>
      {chartData.length >= 2 ? (
        <Column {...config} />
      ) : (
        <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#6a9bb5" }}>
          Collecting data…
        </div>
      )}
    </Card>
  );
}

// ── Energy Distribution Donut ──────────────────────────────────────────────
function EnergyDonut({ data }) {
  const dd = buildDonut(data);
  const total = dd.reduce((s, d) => s + d.value, 0);
  const COLORS = ["#f59e0b", "#ef4444", "#10b981", "#06b6d4"];

  /* Build an SVG donut since the Pie chart annotations are unreliable in v2 */
  const size = 220;
  const ctr = size / 2;
  const outerR = 90;
  const innerR = 58;

  let cumAngle = -90;
  const arcs = dd.map((d, i) => {
    const pct = d.value / total;
    const startAngle = cumAngle;
    const sweep = pct * 360;
    cumAngle += sweep;
    return { ...d, pct, startAngle, sweep, color: COLORS[i] || C.primary };
  });

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const rad = (a) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(startAngle));
    const y1 = cy + r * Math.sin(rad(startAngle));
    const x2 = cx + r * Math.cos(rad(endAngle));
    const y2 = cy + r * Math.sin(rad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
        <div>
          <Text strong style={{ fontSize: 14, color: "#e8f4f8", display: "block" }}>Energy Distribution</Text>
          <Text style={{ fontSize: 11, color: "#4a7a92" }}>Current consumption breakdown</Text>
        </div>
      </Flex>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto" }}>
        {arcs.map((arc, i) => {
          const endAngle = arc.startAngle + arc.sweep - 0.5;
          const midAngle = arc.startAngle + arc.sweep / 2;
          const rad = (a) => (a * Math.PI) / 180;
          const labelR = (outerR + innerR) / 2 + 18;
          const lx = ctr + labelR * Math.cos(rad(midAngle));
          const ly = ctr + labelR * Math.sin(rad(midAngle));
          const pctText = `${(arc.pct * 100).toFixed(0)}%`;
          return (
            <g key={i}>
              {/* Outer arc */}
              <path d={describeArc(ctr, ctr, outerR, arc.startAngle, endAngle)} fill="none" stroke={arc.color} strokeWidth={outerR - innerR} strokeLinecap="butt" />
              {/* Percentage label */}
              {arc.pct > 0.06 && (
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
                  fill={arc.color} fontSize="12" fontWeight="700">{pctText}</text>
              )}
            </g>
          );
        })}
        {/* Inner circle (hole) */}
        <circle cx={ctr} cy={ctr} r={innerR - 1} fill="#0b2236" />
        {/* Center text */}
        <text x={ctr} y={ctr - 6} textAnchor="middle" dominantBaseline="central"
          fill="#e8f4f8" fontSize="22" fontWeight="800">{fmt(total, 0)}</text>
        <text x={ctr} y={ctr + 14} textAnchor="middle" dominantBaseline="central"
          fill="#6a9bb5" fontSize="10">kW Total</text>
      </svg>
      {/* Legend */}
      <Flex justify="center" gap={16} style={{ marginTop: 8 }}>
        {arcs.map((a, i) => (
          <Flex key={i} align="center" gap={5}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, display: "inline-block" }} />
            <Text style={{ fontSize: 10, color: "#a3c4d4" }}>{a.name}</Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export default function AnalyticsCharts({ latest, history }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      <HealthRadar data={latest} />
      <PowerBar history={history} />
      <EnergyDonut data={latest} />
    </div>
  );
}
