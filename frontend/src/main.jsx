import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import { antTheme } from "./theme.js";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider theme={antTheme}>
      <App />
    </ConfigProvider>
  </StrictMode>
);
