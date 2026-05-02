import { useState, useRef, useCallback } from "react";
import { Card, Slider, Button, Tag, Flex, Typography, InputNumber, Space } from "antd";
import { PlayCircleOutlined, LoadingOutlined, SettingOutlined } from "@ant-design/icons";
import { C } from "../config.js";

const { Text } = Typography;
const CONTROL_URL = "http://localhost:8000/api/control-gate";

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function arcPath(cx, cy, r, startDeg, endDeg) {
  const toRad = (d) => (d * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(endDeg));
  const ey = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

export default function GateControlPanel() {
  const [sliderValue, setSliderValue] = useState(50);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState("idle");
  const [isSending, setIsSending] = useState(false);
  const timerRef = useRef(null);

  const flash = useCallback((msg, type) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatusMessage(msg);
    setStatusType(type);
    timerRef.current = setTimeout(() => {
      setStatusMessage(null);
      setStatusType("idle");
    }, 3000);
  }, []);

  async function sendControlCommand() {
    if (isSending) return;
    setIsSending(true);
    flash("Transmitting command…", "pending");
    try {
      const res = await fetch(CONTROL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gate_opening_percentage: sliderValue }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      flash("Command Accepted. Gate adjusting.", "success");
    } catch {
      flash("Connection Error: Modbus Offline", "error");
    } finally {
      setIsSending(false);
    }
  }

  const pct = clamp(sliderValue, 0, 100);
  const gaugeStart = 135;
  const gaugeEnd = 405;
  const gaugeSpan = gaugeEnd - gaugeStart;
  const fillEnd = gaugeStart + (pct / 100) * gaugeSpan;
  const accentColor =
    pct <= 15 ? "#ef4444" : pct <= 40 ? "#f59e0b" : pct <= 70 ? "#14b8a6" : "#10b981";

  const statusColor =
    statusType === "pending" ? C.amber
    : statusType === "success" ? C.green
    : statusType === "error" ? C.red
    : "#6a9bb5";

  const sliderMarks = { 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" };

  return (
    <Card
      className="glow-card"
      style={{ "--glow-color": accentColor, borderColor: `${accentColor}30` }}
      styles={{ body: { padding: 24 } }}
    >
      {/* Header */}
      <Flex align="center" justify="space-between" style={{ marginBottom: 20 }}>
        <Flex align="center" gap={10}>
          <SettingOutlined style={{ fontSize: 16, color: accentColor }} />
          <Text strong style={{ fontSize: 14, color: "#e8f4f8" }}>Wicket Gate Supervisory Control</Text>
        </Flex>
        <Tag style={{ margin: 0, background: "rgba(7,26,43,0.6)", borderColor: "#164260", color: "#6a9bb5", fontVariantNumeric: "tabular-nums" }}>
          REGISTER 6
        </Tag>
      </Flex>

      {/* Body: Gauge + Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 28, alignItems: "center" }}>

        {/* Gauge */}
        <Flex vertical align="center">
          <svg width="160" height="100" viewBox="0 0 160 100">
            <path d={arcPath(80, 85, 60, gaugeStart, gaugeEnd)} fill="none" stroke="#164260" strokeWidth="8" strokeLinecap="round" />
            <path d={arcPath(80, 85, 60, gaugeStart, fillEnd)} fill="none" stroke={accentColor} strokeWidth="8" strokeLinecap="round"
              style={{ transition: "all 0.35s ease", filter: `drop-shadow(0 0 6px ${accentColor}88)` }} />
            <text x="12" y="97" fill="#4a7a92" fontSize="9" fontWeight="600">0</text>
            <text x="140" y="97" fill="#4a7a92" fontSize="9" fontWeight="600">100</text>
          </svg>
          <div style={{ marginTop: -30, display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: accentColor, fontVariantNumeric: "tabular-nums", lineHeight: 1, transition: "color 0.3s ease" }}>
              {pct}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#6a9bb5" }}>%</span>
          </div>
          <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#4a7a92", marginTop: 4 }}>
            TARGET OPENING
          </span>
        </Flex>

        {/* Controls */}
        <Flex vertical gap={14}>
          {/* Setpoint display */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderRadius: 10,
            background: "rgba(7, 26, 43, 0.6)", border: "1px solid #164260",
          }}>
            <Text style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#6a9bb5" }}>Setpoint</Text>
            <Space size={4}>
              <span style={{ fontSize: 22, fontWeight: 800, color: accentColor, fontVariantNumeric: "tabular-nums", transition: "color 0.3s ease" }}>
                {pct}
              </span>
              <span style={{ fontSize: 11, color: "#6a9bb5" }}>%</span>
            </Space>
          </div>

          {/* Ant Slider */}
          <Slider
            min={0}
            max={100}
            value={sliderValue}
            onChange={setSliderValue}
            marks={sliderMarks}
            tooltip={{ formatter: v => `${v}%` }}
            styles={{
              track: { background: accentColor },
              rail: { background: "#164260" },
            }}
          />

          {/* Execute button */}
          <Button
            type="primary"
            size="large"
            block
            icon={isSending ? <LoadingOutlined /> : <PlayCircleOutlined />}
            loading={isSending}
            onClick={sendControlCommand}
            style={{
              fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
              background: accentColor, borderColor: accentColor,
              boxShadow: `0 2px 12px ${accentColor}44`,
            }}
          >
            {isSending ? "Transmitting…" : "Execute Command"}
          </Button>

          {/* Status */}
          <div style={{
            fontSize: 12, fontWeight: 600, color: statusColor, letterSpacing: 0.5,
            minHeight: 18, transition: "opacity 0.3s ease",
            opacity: statusMessage ? 1 : 0,
          }}>
            {statusType === "pending" && "◉ "}
            {statusType === "success" && "✓ "}
            {statusType === "error" && "✕ "}
            {statusMessage ?? "\u00A0"}
          </div>
        </Flex>
      </div>

      {/* Footer */}
      <Flex gap={16} style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #164260" }}>
        <Text style={{ fontSize: 10, color: "#4a7a92", letterSpacing: 0.5 }}>Modbus TCP · localhost:5020</Text>
        <Text style={{ fontSize: 10, color: "#4a7a92", letterSpacing: 0.5 }}>Holding Register 6 · Wicket Gate</Text>
        <Text style={{ fontSize: 10, color: "#4a7a92", letterSpacing: 0.5 }}>Scale ×10</Text>
      </Flex>
    </Card>
  );
}
