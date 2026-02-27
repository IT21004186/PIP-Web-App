// =========================================================
//  Symbol Header Component
//  Section 1: Company logo (left), basic details (right)
//  Section 2: Optional statistics grid (when data is present)
//  Reusable for any stock symbol
// =========================================================

const STATS_CONFIG = [
  { key: "marketCap",        label: "Market Cap (LKR)",  format: "lkr-full",  wide: true },
  { key: "issuedQuantity",   label: "Issued Quantity",   format: "number"    },
  { key: "eps",              label: "EPS (LKR)",         format: "decimal2"  },
  { key: "nav",              label: "NAV (LKR)",         format: "decimal2"  },
  { key: "dividendPerShare", label: "Dividend / Share",  format: "decimal2"  },
  { key: "peRatio",          label: "P/E Ratio",         format: "decimal2"  },
  { key: "pbv",              label: "PBV",               format: "decimal2"  },
  { key: "dividendYield",    label: "Dividend Yield",    format: "pct"       },
  { key: "roe",              label: "ROE",               format: "pct"       },
];

function formatStatValue(value, format) {
  if (value === null || value === undefined) return "—";
  switch (format) {
    case "lkr-full":  return formatLKRFull(value);
    case "number":    return value.toLocaleString();
    case "decimal2":  return formatNum(value, 2);
    case "pct":       return formatNum(value, 2) + "%";
    default:          return String(value);
  }
}

function SymbolStats({ symbolData }) {
  const visibleStats = STATS_CONFIG.filter(s => symbolData[s.key] !== null && symbolData[s.key] !== undefined);
  if (visibleStats.length === 0) return null;

  return (
    <div className="symbol-header-stats">
      <div className="symbol-header-stats-grid">
        {visibleStats.map(stat => (
          <div key={stat.key} className={`symbol-stat-tile${stat.wide ? " symbol-stat-tile--wide" : ""}`}>
            <div className="symbol-stat-label">{stat.label}</div>
            <div className="symbol-stat-value">{formatStatValue(symbolData[stat.key], stat.format)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SymbolHeader({ symbolData }) {
  if (!symbolData) return null;

  const { company, symbol, sector, currentPrice, logo } = symbolData;

  return (
    <div className="symbol-header">
      <div className="symbol-header-inner">
        <div className="symbol-header-logo">
          {logo ? (
            <div className="symbol-header-logo-card">
              <img src={logo} alt={company} />
            </div>
          ) : (
            <div className="symbol-header-logo-placeholder">
              {symbol ? symbol.slice(0, 3) : "—"}
            </div>
          )}
        </div>
        <div className="symbol-header-details">
          <h1 className="symbol-header-company">{company}</h1>
          <div className="symbol-header-meta">
            <span>SYMBOL: {symbol}</span>
            {sector && <span className="symbol-header-sep">•</span>}
            {sector && <span>{sector}</span>}
          </div>
          <div className="symbol-header-price-block">
            <div className="symbol-header-price-main">
              <span className="symbol-header-price-value">
                {formatLKRFull(currentPrice ?? 0)}
              </span>
              <span className="symbol-header-price-label">CURRENT MARKET PRICE (LKR)</span>
            </div>
          </div>
        </div>
      </div>
      <SymbolStats symbolData={symbolData} />
    </div>
  );
}
