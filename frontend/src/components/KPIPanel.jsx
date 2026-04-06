import { Card, Progress, Flex, Typography } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import { C, fmt } from "../config.js";

const { Text } = Typography;

function CircleKpi({ label, value, max = 100, unit, color }) {
  const pct = Math.round(Math.min(100, (value / max) * 100));
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 14px", borderRadius: 10,
      background: "#000000",
      border: "1px solid #164260",
    }}>
      <Progress
        type="circle"
        percent={pct}
        size={48}
        strokeColor={color}
        railColor="#164260"
        format={() => <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}%</span>}
      />
      <div>
        <div style={{ fontSize: 10, color: "#6a9bb5" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e8f4f8", fontVariantNumeric: "tabular-nums" }}>
          {Number(value).toFixed(1)} <span style={{ fontSize: 10, color: "#6a9bb5", fontWeight: 400 }}>{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function KPIPanel({ latest, score }) {
  const freqPct = latest ? Math.min(100, ((latest.frequency_hz - 49.5) / 1.0) * 100) : 50;

  return (
    <Card
      style={{ borderColor: `${C.purple}30`, height: "100%", background: "#000000" }}
      styles={{ body: { padding: 20 } }}
    >
      {/* Header */}
      <Flex align="center" gap={12} style={{ marginBottom: 18 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${C.purple}15`, border: `1px solid ${C.purple}25`,
          color: C.purple, fontSize: 16,
        }}>
          <BarChartOutlined />
        </div>
        <div>
          <Text strong style={{ fontSize: 14, color: "#e8f4f8" }}>Efficiency KPIs</Text>
          <div style={{ fontSize: 10, color: "#6a9bb5" }}>Performance metrics</div>
        </div>
      </Flex>

      {/* KPI Circles */}
      <Flex vertical gap={10} style={{ marginBottom: 14 }}>
        <CircleKpi
          label="Condition Score" value={score} max={100} unit="/ 100"
          color={score >= 90 ? C.green : score >= 75 ? C.amber : C.red}
        />
        <CircleKpi
          label="Active Power" value={latest?.active_power_mw ?? 0} max={140} unit="MW"
          color={C.primary}
        />
        <CircleKpi
          label="Water Flow" value={latest?.water_flow_rate_m3s ?? 0} max={90} unit="m³/s"
          color={C.teal}
        />
      </Flex>

      {/* Frequency Bar */}
      <div style={{
        padding: "12px 14px", borderRadius: 10,
        background: "#000000",
        border: "1px solid #164260",
      }}>
        <Flex justify="space-between" style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 10, color: "#6a9bb5" }}>Grid Frequency</Text>
          <Text style={{ fontSize: 12, fontWeight: 700, color: C.purple, fontVariantNumeric: "tabular-nums" }}>
            {latest ? Number(latest.frequency_hz).toFixed(2) : "—"} Hz
          </Text>
        </Flex>
        <Progress
          percent={freqPct}
          showInfo={false}
          size="small"
          strokeColor={{ from: C.purple, to: C.pink }}
          railColor="#164260"
        />
      </div>
    </Card>
  );
}
