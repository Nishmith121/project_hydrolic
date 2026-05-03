import { useState, useMemo } from "react";
import { Card, Segmented, Flex, Typography } from "antd";
import { Line } from "@ant-design/charts";
import { C, TABS, THR, fmt } from "../config.js";

const { Text } = Typography;

/* ─── Multi-series overlay definitions ─────────────────────────────────── */
const SERIES = [
  { key: "bearing_temp_c",        label: "Temperature", color: "#f59e0b", unit: "°C" },
  { key: "vibration_mms",         label: "Vibration",   color: "#3b82f6", unit: "mm/s" },
  { key: "draft_tube_pressure_bar", label: "Pressure",  color: "#10b981", unit: "bar" },
];

export default function TabbedChart({ history }) {
  const [mode, setMode] = useState("multi");          // "multi" | tab index
  const [activeTab, setActiveTab] = useState(0);

  /* ── Multi-series data (all 3 overlaid) ──────────────────────────────── */
  const multiData = useMemo(() => {
    const rows = [];
    history.forEach((pt) => {
      SERIES.forEach((s) => {
        rows.push({
          time: String(pt.t),
          value: pt[s.key] ?? 0,
          series: s.label,
        });
      });
    });
    return rows;
  }, [history]);

  /* ── Single-series data (for tab mode) ───────────────────────────────── */
  const tab = TABS[activeTab];
  const singleData = useMemo(() =>
    history.map((pt) => ({
      time: String(pt.t),
      value: pt[tab.key] ?? 0,
    })),
  [history, tab.key]);

  /* ── Multi-series chart config ───────────────────────────────────────── */
  const multiConfig = {
    data: multiData,
    xField: "time",
    yField: "value",
    seriesField: "series",
    colorField: "series",
    smooth: true,
    animation: false,
    height: 300,
    style: { lineWidth: 2.5 },
    scale: {
      color: {
        domain: SERIES.map(s => s.label),
        range:  SERIES.map(s => s.color),
      },
    },
    axis: {
      x: { label: false, line: false, tick: false },
      y: {
        label: { style: { fill: "#4a7a92", fontSize: 10 } },
        grid: { style: { stroke: "#164260", strokeDasharray: "3 3" } },
        line: false, tick: false,
      },
    },
    legend: {
      color: {
        position: "bottom",
        itemLabelFill: "#a3c4d4",
        itemLabelFontSize: 12,
        itemMarkerFill: (_, i) => SERIES[i]?.color || "#10b981",
      },
    },
    tooltip: {
      channel: "y",
      valueFormatter: (v) => Number(v).toFixed(2),
    },
    theme: { view: { viewFill: "transparent" } },
  };

  /* ── Single-series chart config ──────────────────────────────────────── */
  const singleConfig = {
    data: singleData,
    xField: "time",
    yField: "value",
    smooth: true,
    animation: false,
    height: 300,
    style: { stroke: tab.color, lineWidth: 2.5 },
    point: { size: 3, shape: "circle", style: { fill: tab.color } },
    scale: { y: { domain: tab.domain } },
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
      valueFormatter: (v) => `${Number(v).toFixed(3)} ${tab.unit}`,
    },
    theme: { view: { viewFill: "transparent" } },
  };

  const isMulti = mode === "multi";

  return (
    <Card
      className="chart-panel"
      style={{ borderColor: isMulti ? `${C.secondary}25` : `${tab.color}25` }}
      styles={{ body: { padding: "16px 16px 8px" } }}
    >
      {/* Tab bar */}
      <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
        <Segmented
          options={[
            {
              value: "multi",
              label: (
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  All Sensors
                </span>
              ),
            },
            ...TABS.map((t, i) => ({
              value: i,
              label: (
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {t.label}
                </span>
              ),
            })),
          ]}
          value={mode}
          onChange={(val) => {
            if (val === "multi") { setMode("multi"); }
            else { setMode(val); setActiveTab(val); }
          }}
          size="small"
        />

        {!isMulti && (
          <Flex align="center" gap={8}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: tab.color, display: "inline-block",
              animation: "pulse-dot 2s ease-in-out infinite",
            }} />
            <Text style={{
              fontFamily: "monospace", fontSize: 13, fontWeight: 700,
              color: tab.color, fontVariantNumeric: "tabular-nums",
            }}>
              {history.length ? fmt(history[history.length - 1]?.[tab.key], 2) : "—"} {tab.unit}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Chart */}
      {history.length >= 2 ? (
        isMulti
          ? <Line {...multiConfig} />
          : <Line {...singleConfig} />
      ) : (
        <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#6a9bb5" }}>
          Collecting telemetry data…
        </div>
      )}
    </Card>
  );
}
