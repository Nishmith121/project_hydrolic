import { Menu, Input, Typography, Badge, Flex } from "antd";
import {
  SearchOutlined,
  DownOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import { C } from "../config.js";

const { Text } = Typography;

const turbineItems = [
  {
    key: "turbines",
    label: <Text strong style={{ fontSize: 13, color: "#e8f4f8" }}>Turbines</Text>,
    icon: <DesktopOutlined />,
    children: [
      {
        key: "t1",
        label: (
          <Flex align="center" gap={8}>
            <Badge status="success" />
            <span>Turbine 01</span>
          </Flex>
        ),
      },
      {
        key: "t2",
        label: (
          <Flex align="center" gap={8}>
            <Badge status="error" />
            <span>Turbine 02</span>
          </Flex>
        ),
      },
    ],
  },
];

export default function SidebarLeft() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "18px 20px",
        fontSize: 14, fontWeight: 700,
        color: "#e8f4f8",
        borderBottom: "1px solid #164260",
      }}>
        Plant Explorer
      </div>

      {/* Search */}
      <div style={{ padding: "14px 16px" }}>
        <Input
          prefix={<SearchOutlined style={{ color: "#6a9bb5" }} />}
          placeholder="Search"
          style={{
            background: "rgba(7, 26, 43, 0.6)",
            borderColor: "#164260",
            color: "#e8f4f8",
          }}
        />
      </div>

      {/* Navigation Tree */}
      <Menu
        mode="inline"
        theme="dark"
        defaultOpenKeys={["turbines"]}
        defaultSelectedKeys={["t1"]}
        items={turbineItems}
        style={{ background: "transparent", border: "none", flex: 1 }}
      />

      {/* Footer */}
      <div style={{
        padding: "14px 20px",
        borderTop: "1px solid #164260",
        fontSize: 10,
        color: "#4a7a92",
        letterSpacing: 0.5,
      }}>
        Virtual Hydraulic Plant v2.0
      </div>
    </div>
  );
}
