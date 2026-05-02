import { Card, Tag, Badge, Flex, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { C } from "../config.js";

const { Text } = Typography;

const LEVEL = {
  critical: { bg: "rgba(239,68,68,0.08)", border: "#ef4444", color: "#ef4444", tag: "error" },
  warning:  { bg: "rgba(245,158,11,0.08)", border: "#f59e0b", color: "#f59e0b", tag: "warning" },
  ok:       { bg: "rgba(34,197,94,0.08)",  border: "#22c55e", color: "#22c55e", tag: "success" },
};

function AlertItem({ alert, index }) {
  const s = LEVEL[alert.level] ?? LEVEL.ok;
  return (
    <div
      className="fade-in"
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 16px", borderRadius: 10,
        background: s.bg,
        borderLeft: `3px solid ${s.border}`,
        animationDelay: `${index * 0.06}s`,
        transition: "transform 0.15s ease",
        cursor: "default",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, background: `${s.border}18`, color: s.color,
        flexShrink: 0,
      }}>
        {alert.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13, color: s.color, display: "block" }}>{alert.title}</Text>
        <Text style={{ fontSize: 11, color: "#6a9bb5" }}>{alert.desc}</Text>
      </div>
      <Tag color={s.tag} style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
        {alert.level === "critical" ? "CRIT" : alert.level === "warning" ? "WARN" : "OK"}
      </Tag>
      {alert.level !== "ok" && (
        <span className="alert-pulse" style={{ background: s.border, boxShadow: `0 0 8px ${s.border}` }} />
      )}
    </div>
  );
}

export default function AlertsPanel({ alerts, mlInsights }) {
  const mlAlert = mlInsights && !mlInsights.error
    ? {
        level: mlInsights.is_anomaly ? "critical" : "ok",
        title: mlInsights.is_anomaly ? "ML: Anomaly Detected" : "ML: System Healthy",
        desc: `Anomaly Score: ${(mlInsights.anomaly_score ?? 0).toFixed(3)}`,
        icon: mlInsights.is_anomaly ? "🚨" : "🤖",
      }
    : null;

  const allAlerts = mlAlert ? [mlAlert, ...alerts] : alerts;
  const critCount = allAlerts.filter(a => a.level === "critical").length;
  const warnCount = allAlerts.filter(a => a.level === "warning").length;

  return (
    <Card
      className="glow-card"
      style={{ "--glow-color": C.amber, borderColor: `${C.amber}25` }}
      styles={{ body: { padding: 20 } }}
    >
      {/* Header */}
      <Flex align="center" justify="space-between" style={{ marginBottom: 18 }} wrap="wrap" gap={10}>
        <Flex align="center" gap={12}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${C.amber}15`, border: `1px solid ${C.amber}20`,
            color: C.amber, fontSize: 16,
          }}>
            <BellOutlined />
          </div>
          <div>
            <Text strong style={{ fontSize: 14, color: "#e8f4f8" }}>Live Alert Monitor</Text>
            <div style={{ fontSize: 10, color: "#6a9bb5" }}>Real-time threshold & ML alerts</div>
          </div>
        </Flex>
        <Flex gap={8}>
          {critCount > 0 && (
            <Badge count={critCount} color={C.red} size="small">
              <Tag color="error" style={{ margin: 0 }}>Critical</Tag>
            </Badge>
          )}
          {warnCount > 0 && (
            <Badge count={warnCount} color={C.amber} size="small">
              <Tag color="warning" style={{ margin: 0 }}>Warning</Tag>
            </Badge>
          )}
          {critCount === 0 && warnCount === 0 && (
            <Tag color="success" style={{ margin: 0 }}>✓ All Clear</Tag>
          )}
        </Flex>
      </Flex>

      {/* Alert List */}
      <Flex vertical gap={8}>
        {allAlerts.map((a, i) => <AlertItem key={i} alert={a} index={i} />)}
      </Flex>
    </Card>
  );
}
