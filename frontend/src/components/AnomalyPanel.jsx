import { Card, Progress, Tag, Flex, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { C } from "../config.js";

const { Text } = Typography;

export default function AnomalyPanel({ mlInsights }) {
  if (!mlInsights) {
    return (
      <Card style={{ display: "grid", placeItems: "center", minHeight: 160 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>⏳</p>
          <Text style={{ color: "#6a9bb5", fontSize: 13 }}>ML model not loaded</Text>
        </div>
      </Card>
    );
  }

  if (mlInsights.error) {
    return (
      <Card style={{ borderColor: `${C.amber}30` }}>
        <Flex align="center" gap={12} style={{
          padding: "12px 14px", borderRadius: 10,
          background: `${C.amber}10`, border: `1px solid ${C.amber}20`,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <Text strong style={{ color: C.amber, fontSize: 13 }}>Prediction Error</Text>
            <div style={{ fontSize: 11, color: "#6a9bb5" }}>{mlInsights.error}</div>
          </div>
        </Flex>
      </Card>
    );
  }

  const isAnomaly = mlInsights.is_anomaly;
  const score = mlInsights.anomaly_score ?? 0;
  const msg = mlInsights.status_message ?? "Unknown";
  const accent = isAnomaly ? C.red : C.green;
  const pct = Math.max(0, Math.min(100, ((score + 0.5) / 0.7) * 100));

  return (
    <Card
      className="glow-card"
      style={{
        "--glow-color": accent,
        borderColor: `${accent}30`,
        background: isAnomaly
          ? "linear-gradient(135deg, rgba(239,68,68,0.05), rgba(11,34,54,0.7))"
          : "linear-gradient(135deg, rgba(34,197,94,0.05), rgba(11,34,54,0.7))",
        height: "100%",
      }}
      styles={{ body: { padding: 20 } }}
    >
      {/* Header */}
      <Flex align="center" justify="space-between" style={{ marginBottom: 20 }}>
        <Flex align="center" gap={8}>
          <RobotOutlined style={{ fontSize: 16, color: accent }} />
          <Text strong style={{ fontSize: 13, color: "#e8f4f8" }}>Isolation Forest Model</Text>
        </Flex>
        <Tag color={isAnomaly ? "error" : "success"} style={{ margin: 0, fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>
          {isAnomaly ? "⚠ ANOMALY DETECTED" : "✓ SYSTEM NORMAL"}
        </Tag>
      </Flex>

      {/* Body: Gauge + Details */}
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 24, alignItems: "center" }}>
        {/* Gauge */}
        <Flex vertical align="center">
          <Progress
            type="dashboard"
            percent={pct}
            size={120}
            strokeColor={accent}
            railColor="#164260"
            gapDegree={75}
            format={() => (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums" }}>
                  {score.toFixed(3)}
                </div>
                <div style={{ fontSize: 9, color: "#6a9bb5", marginTop: 2 }}>anomaly score</div>
              </div>
            )}
          />
        </Flex>

        {/* Details */}
        <Flex vertical gap={12}>
          {/* Status */}
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: `${accent}08`, border: `1px solid ${accent}18`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>{isAnomaly ? "🚨" : "🛡️"}</span>
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 14, color: accent, lineHeight: 1.2, display: "block" }}>{msg}</Text>
              <Text style={{ fontSize: 11, color: "#6a9bb5", marginTop: 3, display: "block" }}>
                {isAnomaly ? "Operating outside learned patterns" : "All parameters within normal bounds"}
              </Text>
            </div>
            {isAnomaly && <span className="alert-pulse" style={{ background: C.red, boxShadow: `0 0 8px ${C.red}` }} />}
          </div>

          {/* Confidence Bar */}
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: "rgba(7, 26, 43, 0.6)", border: "1px solid #164260",
          }}>
            <Flex justify="space-between" style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 10, color: "#6a9bb5" }}>Health Confidence</Text>
              <Text style={{ fontSize: 11, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>
                {pct.toFixed(1)}%
              </Text>
            </Flex>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={accent}
              railColor="#164260"
            />
          </div>

          <Text style={{ fontSize: 10, color: "#4a7a92" }}>
            15 features · Isolation Forest · Real-time inference
          </Text>
        </Flex>
      </div>
    </Card>
  );
}
