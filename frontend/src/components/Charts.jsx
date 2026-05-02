import { Card, Flex, Typography } from "antd";
import { Radar, Column, Pie } from "@ant-design/charts";
import { C, buildRadar, buildDonut, fmt } from "../config.js";

const { Text } = Typography;

// ── Health Radar ──────────────────────────────────────────────────────────────
function HealthRadar({ data }) {
  const rd = buildRadar(data);
  const config = {
    data: rd,
    xField: "subject",
    yField: "value",
    height: 220,
    area: {
      style: { fill: `${C.primary}25`, fillOpacity: 0.3 },
    },
    line: {
      style: { stroke: C.primary, strokeWidth: 2 },
    },
    point: {
      style: { fill: C.primary, stroke: C.primary, r: 3 },
    },
    axis: {
      x: { label: { style: { fill: "#6a9bb5", fontSize: 10 } }, grid: true },
      y: { label: false, domain: [0, 100], grid: { style: { stroke: "#164260" } } },
    },
    theme: {
      view: { viewFill: "transparent" },
    },
  };

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
        <Text strong style={{ fontSize: 13, color: "#e8f4f8" }}>Equipment Health</Text>
        <Text style={{ fontSize: 10, color: "#4a7a92" }}>Multi-dimensional</Text>
      </Flex>
      <Radar {...config} />
    </Card>
  );
}

// ── Power Bar Chart ───────────────────────────────────────────────────────────
function PowerBar({ history }) {
  const slice = history.slice(-12);
  const chartData = slice.map((d, i) => ({
    index: i + 1,
    power: d.active_power_mw ?? 0,
    isLatest: i === slice.length - 1,
  }));

  const config = {
    data: chartData,
    xField: "index",
    yField: "power",
    height: 220,
    style: {
      fill: (datum) => datum.isLatest ? C.primary : C.amber,
      radiusTopLeft: 4,
      radiusTopRight: 4,
    },
    axis: {
      x: { label: false, line: false, tick: false },
      y: {
        domain: [100, 140],
        label: { style: { fill: "#4a7a92", fontSize: 10 } },
        grid: { style: { stroke: "#164260", strokeDasharray: "3 3" } },
        line: false, tick: false,
      },
    },
    tooltip: {
      channel: "y",
      valueFormatter: (v) => `${Number(v).toFixed(1)} MW`,
    },
    theme: {
      view: { viewFill: "transparent" },
    },
  };

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
        <Text strong style={{ fontSize: 13, color: "#e8f4f8" }}>Power History</Text>
        <Text style={{ fontSize: 10, color: "#4a7a92" }}>Last 12 readings</Text>
      </Flex>
      <Column {...config} />
    </Card>
  );
}

// ── Energy Donut ──────────────────────────────────────────────────────────────
function EnergyDonut({ data }) {
  const dd = buildDonut(data);
  const total = dd.reduce((s, d) => s + d.value, 0);
  const COLORS = [C.primary, C.amber, C.purple, C.red];

  const config = {
    data: dd,
    angleField: "value",
    colorField: "name",
    height: 220,
    innerRadius: 0.65,
    legend: {
      color: {
        position: "bottom",
        itemLabelFill: "#6a9bb5",
        itemLabelFontSize: 10,
      },
    },
    style: {
      fill: (datum) => {
        const idx = dd.findIndex(d => d.name === datum.name);
        return COLORS[idx] || C.primary;
      },
      stroke: "transparent",
    },
    label: {
      text: (datum) => {
        const pct = ((datum.value / total) * 100).toFixed(0);
        return pct > 8 ? `${pct}%` : "";
      },
      style: { fill: "#a3c4d4", fontSize: 10 },
    },
    annotations: [
      {
        type: "text",
        style: {
          text: `${fmt(total, 0)}`,
          x: "50%",
          y: "46%",
          textAlign: "center",
          fontSize: 20,
          fontWeight: 800,
          fill: C.primary,
        },
      },
      {
        type: "text",
        style: {
          text: "MW Total",
          x: "50%",
          y: "56%",
          textAlign: "center",
          fontSize: 10,
          fill: "#6a9bb5",
        },
      },
    ],
    theme: {
      view: { viewFill: "transparent" },
    },
  };

  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 10 }}>
        <Text strong style={{ fontSize: 13, color: "#e8f4f8" }}>Energy Distribution</Text>
        <Text style={{ fontSize: 10, color: "#4a7a92" }}>Current</Text>
      </Flex>
      <Pie {...config} />
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
