import { Card, Statistic } from "antd";
import {
  ThunderboltOutlined,
  SyncOutlined,
  ExperimentOutlined,
  VerticalAlignTopOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { C, fmt } from "../config.js";

const STATS = [
  { key: "active_power_mw",     label: "Active Power",  unit: "MW",   icon: <ThunderboltOutlined />,       color: C.primary },
  { key: "rotational_speed_rpm", label: "Speed",         unit: "RPM",  icon: <SyncOutlined />,              color: C.sky },
  { key: "water_flow_rate_m3s", label: "Flow Rate",     unit: "m³/s", icon: <ExperimentOutlined />,        color: C.aqua },
  { key: "net_head_m",          label: "Net Head",      unit: "m",    icon: <VerticalAlignTopOutlined />,  color: C.purple },
  { key: "frequency_hz",        label: "Frequency",     unit: "Hz",   icon: <DashboardOutlined />,         color: C.amber },
];

export default function StatusStrip({ latest }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
      {STATS.map(s => {
        const raw = latest?.[s.key];
        const dec = s.key === "frequency_hz" ? 2 : s.key === "rotational_speed_rpm" ? 0 : 1;
        return (
          <Card
            key={s.key}
            size="small"
            className="stat-strip-card"
            style={{ borderColor: `${s.color}30` }}
          >
            <div className="stat-strip-icon" style={{ background: `${s.color}15`, color: s.color, fontSize: 20 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#6a9bb5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                {s.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {fmt(raw, dec)}
                </span>
                <span style={{ fontSize: 11, color: "#6a9bb5" }}>{s.unit}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
