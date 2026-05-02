// ── Navigation items ─────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",   icon: "📊", color: "#3b82f6" },
  { id: "scada",      label: "SCADA Control", icon: "⚙",  color: "#00d4ff" },
  { id: "ai-alerts",  label: "AI & Alerts", icon: "🚨", color: "#f59e0b" },
  { id: "analytics",  label: "Analytics",   icon: "📈", color: "#a855f7" },
];

export default function NavBar({ activePage, setActivePage }) {
  return (
    <nav className="subnav" id="main-nav">
      <div className="subnav-inner">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`subnav-btn ${isActive ? "subnav-btn--active" : ""}`}
              onClick={() => setActivePage(item.id)}
              style={{
                "--nav-color": item.color,
              }}
            >
              <span className="subnav-icon">{item.icon}</span>
              <span className="subnav-label">{item.label}</span>
              {isActive && <span className="subnav-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
