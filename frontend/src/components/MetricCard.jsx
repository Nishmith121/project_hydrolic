import { Card, Tag } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { statusColor } from "../config.js";

export default function MetricCard({ label, value, unit, icon, status = "normal", compact = false }) {
  const color = statusColor(status);
  const isUp = Math.random() > 0.5;
  const trendColor = isUp ? "#22c55e" : "#ef4444";

  return (
    <Card
      size="small"
      className="glow-card"
      style={{
        "--glow-color": color,
        borderColor: `${color}40`,
        background: "#000000",
      }}
      styles={{ body: { padding: compact ? "12px 14px" : "16px 18px" } }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: 1.2, color: "#6a9bb5",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 13 }}>{icon}</span>
          {label}
        </span>
        {status !== "normal" && (
          <Tag
            color={status === "critical" ? "error" : "warning"}
            style={{ margin: 0, fontSize: 9, lineHeight: "16px", padding: "0 6px" }}
          >
            {status === "critical" ? "CRIT" : "WARN"}
          </Tag>
        )}
      </div>

      {/* Value */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{
          fontSize: compact ? 22 : 28,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          color: "#e8f4f8",
        }}>
          {value}
        </span>
        <span style={{ fontSize: 11, color: "#6a9bb5", fontWeight: 400 }}>{unit}</span>
      </div>

      {/* Trend */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
        {isUp ? (
          <ArrowUpOutlined style={{ color: trendColor, fontSize: 11 }} />
        ) : (
          <ArrowDownOutlined style={{ color: trendColor, fontSize: 11 }} />
        )}
        <span style={{ color: trendColor, fontSize: 11, fontWeight: 600 }}>
          {isUp ? "↗" : "↘"}
        </span>
      </div>
    </Card>
  );
}
