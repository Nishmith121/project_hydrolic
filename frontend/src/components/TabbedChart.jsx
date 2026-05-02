import { useState } from "react";
import { Card, Segmented, Flex, Typography } from "antd";
import { Area } from "@ant-design/charts";
import { C, TABS, THR, fmt } from "../config.js";

const { Text } = Typography;

export default function TabbedChart({ history }) {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  const chartData = history.map((point) => ({
    time: point.t,
    value: point[tab.key] ?? 0,
  }));

  const warnMap = {
    vibration_mms: THR.vibration.warn,
    bearing_temp_c: THR.bearing.warn,
    stator_winding_temp_c: THR.stator.warn,
  };
  const critMap = {
    vibration_mms: THR.vibration.crit,
    bearing_temp_c: THR.bearing.crit,
  };

  const annotations = [];
  if (warnMap[tab.key]) {
    annotations.push({
      type: "line",
      yField: warnMap[tab.key],
      style: { stroke: C.amber, strokeOpacity: 0.6, lineDash: [5, 3] },
    });
  }
  if (critMap[tab.key]) {
    annotations.push({
      type: "line",
      yField: critMap[tab.key],
      style: { stroke: C.red, strokeOpacity: 0.6, lineDash: [5, 3] },
    });
  }

  const config = {
    data: chartData,
    xField: "time",
    yField: "value",
    smooth: true,
    animation: false,
    height: 240,
    style: {
      fill: `linear-gradient(-90deg, ${tab.color}00 0%, ${tab.color}30 100%)`,
      stroke: tab.color,
      strokeWidth: 2,
    },
    line: {
      style: {
        stroke: tab.color,
        strokeWidth: 2,
      },
    },
    axis: {
      x: { label: false, line: false, tick: false },
      y: {
        domain: tab.domain,
        label: { style: { fill: "#4a7a92", fontSize: 10 } },
        grid: { style: { stroke: "#164260", strokeDasharray: "3 3" } },
        line: false,
        tick: false,
      },
    },
    tooltip: {
      channel: "y",
      valueFormatter: (v) => `${Number(v).toFixed(3)} ${tab.unit}`,
    },
    theme: {
      view: { viewFill: "transparent" },
    },
    annotations,
  };

  return (
    <Card
      className="chart-panel"
      style={{ borderColor: `${tab.color}25` }}
      styles={{ body: { padding: "16px 16px 8px" } }}
    >
      {/* Tab bar */}
      <Flex align="center" justify="space-between" style={{ marginBottom: 14 }}>
        <Segmented
          options={TABS.map((t, i) => ({
            value: i,
            label: (
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {t.label}
              </span>
            ),
          }))}
          value={active}
          onChange={setActive}
          size="small"
        />

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
      </Flex>

      {/* Chart */}
      <Area {...config} />
    </Card>
  );
}
