import { C, getStatus, statusColor, fmt } from "../config.js";

/**
 * Neon-bordered sensor card with 3D hover lift.
 * Props: label, value, unit, icon, status ("normal"|"warning"|"critical")
 */
export default function MetricCard({ label, value, unit, icon, status = "normal" }) {
  const color = statusColor(status);

  return (
    <div
      className="card-3d relative rounded-2xl p-5 overflow-hidden cursor-default select-none"
      style={{
        background: `linear-gradient(145deg, ${C.card} 0%, #0a1020 100%)`,
        border: `1.5px solid ${color}`,
        boxShadow: `0 0 18px ${color}33, inset 0 1px 0 ${color}22`,
      }}
    >
      {/* Corner glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ background: color }}
      />

      {/* Live dot */}
      <span
        className="absolute top-3 right-3 w-2 h-2 rounded-full neon-pulse"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />

      {/* Label row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <span className="text-xs uppercase tracking-widest font-medium" style={{ color: `${color}bb` }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        <span
          className="text-4xl font-bold tabular-nums leading-none inline-block min-w-[100px]"
          style={{ color, textShadow: `0 0 18px ${color}99` }}
        >
          {value}
        </span>
        <span className="text-sm mb-0.5 font-medium" style={{ color: `${color}77` }}>
          {unit}
        </span>
      </div>

      {/* Status badge */}
      {status !== "normal" && (
        <div
          className="mt-3 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          {status}
        </div>
      )}

      {/* Bottom sweep line */}
      <div
        className="sweep-line absolute bottom-0 left-0 right-0 h-px opacity-60"
        style={{ color }}
      />
    </div>
  );
}
