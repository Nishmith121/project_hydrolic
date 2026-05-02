import { Card, Button, Tag, Descriptions, Flex, Typography } from "antd";
import { CheckCircleOutlined, WarningOutlined, AlertOutlined } from "@ant-design/icons";
import { C } from "../config.js";

const { Text } = Typography;

export default function DiagnosticPanel({ diagnosis, actionRequired }) {
  const isHealthy = actionRequired === "None" || !actionRequired;

  if (isHealthy) {
    return (
      <Card
        style={{
          borderColor: `${C.green}40`,
          background: "linear-gradient(135deg, rgba(34,197,94,0.05), rgba(11,34,54,0.7))",
          height: "100%",
        }}
        styles={{ body: { padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, height: "100%" } }}
      >
        <CheckCircleOutlined style={{ fontSize: 28, color: C.green }} />
        <div>
          <Text strong style={{
            color: C.green, fontSize: 14, textTransform: "uppercase", letterSpacing: 1,
            display: "block",
          }}>
            System Optimal
          </Text>
          <Text style={{ color: "#6a9bb5", fontSize: 13 }}>
            No prescriptive actions required at this time.
          </Text>
        </div>
      </Card>
    );
  }

  const isCritical = actionRequired.toUpperCase().includes("CRITICAL");
  const severityColor = isCritical ? C.red : C.amber;
  const severityLabel = isCritical ? "CRITICAL ACTION REQUIRED" : "MAINTENANCE WARNING";
  const SeverityIcon = isCritical ? AlertOutlined : WarningOutlined;

  return (
    <Card
      className="glow-card"
      style={{
        "--glow-color": severityColor,
        borderColor: `${severityColor}50`,
        background: `linear-gradient(135deg, rgba(11,34,54,0.9), ${isCritical ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)"})`,
        position: "relative",
        height: "100%",
      }}
      styles={{ body: { padding: "24px" } }}
    >
      {/* Top severity banner */}
      <div className="severity-banner" style={{ background: severityColor }} />

      {/* Header */}
      <Flex align="center" gap={14} style={{ marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${severityColor}18`, border: `1px solid ${severityColor}40`,
          color: severityColor, fontSize: 20,
        }}>
          <SeverityIcon />
        </div>
        <div>
          <Tag color={isCritical ? "error" : "warning"} style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
            {severityLabel}
          </Tag>
          <Text strong style={{ display: "block", color: "#e8f4f8", fontSize: 18, marginTop: 4 }}>
            WORK ORDER TICKET
          </Text>
        </div>
      </Flex>

      {/* Diagnosis Details */}
      <div style={{
        background: "rgba(7, 26, 43, 0.6)",
        border: "1px solid #164260",
        borderRadius: 10, padding: 18,
        marginBottom: 18,
      }}>
        <Flex vertical gap={14}>
          <div>
            <Text style={{ fontSize: 10, color: "#6a9bb5", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
              Fault Diagnosis
            </Text>
            <Text style={{ fontSize: 14, color: "#e8f4f8", fontWeight: 500 }}>
              {diagnosis || "Unknown Fault"}
            </Text>
          </div>
          <div>
            <Text style={{ fontSize: 10, color: "#6a9bb5", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
              Prescribed Action
            </Text>
            <Text strong style={{ fontSize: 14, color: severityColor, lineHeight: 1.5 }}>
              {actionRequired}
            </Text>
          </div>
        </Flex>
      </div>

      {/* Action Button */}
      <Button
        type="primary"
        block
        size="large"
        danger={isCritical}
        style={{
          fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
          background: isCritical ? undefined : C.amber,
          borderColor: isCritical ? undefined : C.amber,
        }}
      >
        Acknowledge & Dispatch
      </Button>
    </Card>
  );
}
