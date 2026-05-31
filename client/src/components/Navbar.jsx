import { formatLKR } from '../utils/formatters';

export default function Navbar({ activePage, onNavigate, totals }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  const tabs = [
    { id: 'dashboard', icon: '⊞', text: 'Dashboard' },
    { id: 'cds',       icon: '📈', text: 'CDS Account' },
    { id: 'crypto',    icon: '₿',  text: 'Crypto' },
    { id: 'fd',        icon: '🏦', text: 'Fixed Deposits' },
    { id: 'logs',      icon: '📒', text: 'Investment Logs' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">
          <img src="/Assets/favicon.ico" alt="PIP" />
        </div>
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
            className={`navbar-tab${activePage === tab.id ? ' active' : ''}`}
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
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem' }}>
            Net Worth: {formatLKR(totals.totalNetWorth)}
          </span>
        )}
      </div>
    </nav>
  );
}
