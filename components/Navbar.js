// =========================================================
//  Navbar Component
// =========================================================

function Navbar({ activePage, onNavigate, totals }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short", day: "numeric", month: "short", year: "numeric"
  });

  const tabs = [
    { id: "dashboard", icon: "⊞", text: "Dashboard" },
    { id: "cds",       icon: "📈", text: "CDS Account" },
    { id: "crypto",    icon: "₿",  text: "Crypto" },
    { id: "fd",        icon: "🏦", text: "Fixed Deposits" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">P</div>
        <div>
          <span>PIP</span>
          <span className="brand-sub">Portfolio Tracker</span>
        </div>
      </div>

      <div className="navbar-divider" />

      <ul className="navbar-tabs">
        {tabs.map(tab => (
          <li
            key={tab.id}
            className={`navbar-tab${activePage === tab.id ? " active" : ""}`}
            onClick={() => onNavigate(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-text">{tab.text}</span>
          </li>
        ))}
      </ul>

      <div className="navbar-meta">
        <span>
          <span className="live-dot" />
          {today}
        </span>
        {totals && (
          <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.82rem" }}>
            Net Worth: {formatLKR(totals.totalNetWorth)}
          </span>
        )}
      </div>
    </nav>
  );
}

// Shared formatter — available globally since all scripts loaded on same page
function formatLKR(amount) {
  if (amount >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000)     return `Rs. ${(amount / 1_000).toFixed(1)}K`;
  return `Rs. ${amount.toFixed(2)}`;
}

function formatLKRFull(amount) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatUSD(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatPct(pct) {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function formatNum(n, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function PLBadge({ value, pct, lkr = true }) {
  const cls = value >= 0 ? "gain" : "loss";
  const sign = value >= 0 ? "+" : "";
  return (
    <span className={`badge badge-${cls}`}>
      {sign}{lkr ? formatLKR(Math.abs(value)) : `$${Math.abs(value).toFixed(2)}`}
      {pct !== undefined && <span style={{ marginLeft: 5, opacity: 0.8 }}>({formatPct(pct)})</span>}
    </span>
  );
}
