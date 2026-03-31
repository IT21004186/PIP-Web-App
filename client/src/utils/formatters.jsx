// Shared formatters and display helpers — replaces the global functions
// that were defined in Navbar.js in the CDN prototype.

export function formatLKR(amount) {
  if (amount >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000)     return `Rs. ${(amount / 1_000).toFixed(1)}K`;
  return `Rs. ${amount.toFixed(2)}`;
}

export function formatLKRFull(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatPct(pct) {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatNum(n, decimals = 2) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function PLBadge({ value, pct, lkr = true }) {
  const cls  = value >= 0 ? 'gain' : 'loss';
  const sign = value >= 0 ? '+' : '';
  return (
    <span className={`badge badge-${cls}`}>
      {sign}{lkr ? formatLKR(Math.abs(value)) : `$${Math.abs(value).toFixed(2)}`}
      {pct !== undefined && <span style={{ marginLeft: 5, opacity: 0.8 }}>({formatPct(pct)})</span>}
    </span>
  );
}

// Small inline pip showing price direction vs average — shared by CDSAccount and CryptoSavings
export function PriceChangePip({ current, avg }) {
  const diff = current - avg;
  if (Math.abs(diff) < 0.001) return null;
  const color = diff > 0 ? 'var(--gain)' : 'var(--loss)';
  const arrow = diff > 0 ? '▲' : '▼';
  return (
    <span style={{ fontSize: '0.7rem', color, marginLeft: 5 }}>
      {arrow} {Math.abs(diff).toFixed(2)}
    </span>
  );
}
