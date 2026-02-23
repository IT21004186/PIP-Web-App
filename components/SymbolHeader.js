// =========================================================
//  Symbol Header Component
//  Section 1: Company logo (left), basic details (right)
//  Reusable for any stock symbol
// =========================================================

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
    </div>
  );
}
