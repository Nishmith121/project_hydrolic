// ── Ant Design 5 Theme — Blue-Green Oceanic SCADA ──────────────────────────
// Uses Ant's darkAlgorithm + custom token overrides for an industrial blue-green palette

import { theme } from "antd";

/* ── Color Palette ─────────────────────────────────────────────────────────── */
export const palette = {
  // Backgrounds (deep ocean blue-green)
  bgBase:      "#071a2b",     // Deepest background
  bgSurface:   "#0b2236",     // Card / panel backgrounds
  bgElevated:  "#0f2d44",     // Elevated containers
  bgCard:      "#0d2a3e",     // Card inner backgrounds
  bgHover:     "#133a52",     // Hover state

  // Borders
  border:      "#164260",
  borderLight: "#1e5a7a",

  // Text
  textWhite:   "#e8f4f8",
  textGray:    "#a3c4d4",
  textMuted:   "#6a9bb5",
  textDim:     "#4a7a92",

  // Accent colors
  primary:     "#10b981",     // Emerald green — primary accent
  secondary:   "#06b6d4",     // Cyan/teal — secondary
  blue:        "#3b82f6",     // Pure blue
  teal:        "#14b8a6",     // Teal
  emerald:     "#34d399",     // Light emerald
  aqua:        "#22d3ee",     // Aqua
  mint:        "#6ee7b7",     // Mint green
  sky:         "#38bdf8",     // Sky blue

  // Status colors
  green:       "#22c55e",
  amber:       "#f59e0b",
  red:         "#ef4444",
  purple:      "#a78bfa",
  pink:        "#f472b6",
};

/* ── Ant Design Theme Config ──────────────────────────────────────────────── */
export const antTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    // Primary color
    colorPrimary:       palette.primary,
    colorInfo:          palette.secondary,
    colorSuccess:       palette.green,
    colorWarning:       palette.amber,
    colorError:         palette.red,

    // Backgrounds
    colorBgBase:        palette.bgBase,
    colorBgContainer:   palette.bgSurface,
    colorBgElevated:    palette.bgElevated,
    colorBgLayout:      palette.bgBase,

    // Borders
    colorBorder:        palette.border,
    colorBorderSecondary: palette.border,

    // Text
    colorText:          palette.textWhite,
    colorTextSecondary: palette.textGray,
    colorTextTertiary:  palette.textMuted,
    colorTextQuaternary: palette.textDim,

    // Typography
    fontFamily: "'Inter', -apple-system, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 16,

    // Radius
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,

    // Motion
    motionDurationSlow: "0.3s",
    motionDurationMid: "0.2s",
    motionDurationFast: "0.1s",
  },
  components: {
    Layout: {
      headerBg:    palette.bgSurface,
      bodyBg:      palette.bgBase,
      siderBg:     palette.bgSurface,
      headerHeight: 64,
      headerPadding: "0 24px",
    },
    Menu: {
      darkItemBg:           palette.bgSurface,
      darkItemSelectedBg:   `${palette.primary}20`,
      darkItemHoverBg:      `${palette.primary}10`,
      darkItemColor:        palette.textGray,
      darkItemSelectedColor: palette.primary,
      itemBorderRadius: 8,
    },
    Card: {
      colorBgContainer: palette.bgSurface,
      colorBorder:      palette.border,
    },
    Statistic: {
      contentFontSize: 28,
      titleFontSize: 12,
    },
    Progress: {
      remainingColor: `${palette.border}88`,
    },
    Slider: {
      trackBg:        palette.primary,
      trackHoverBg:   palette.emerald,
      handleColor:    palette.primary,
      dotBorderColor: palette.border,
      railBg:         palette.border,
      railHoverBg:    palette.borderLight,
    },
    Button: {
      primaryShadow: `0 2px 8px ${palette.primary}44`,
    },
    Alert: {
      colorInfoBg:    `${palette.secondary}15`,
      colorInfoBorder: `${palette.secondary}30`,
    },
    Tag: {
      defaultBg: `${palette.primary}15`,
      defaultColor: palette.primary,
    },
    Segmented: {
      itemSelectedBg: palette.bgElevated,
      trackBg: palette.bgCard,
    },
  },
};
