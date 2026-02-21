// =========================================================
//  CDS Account Component
// =========================================================

function CDSAccount({ stocks, totals }) {
  const grouped = groupBySector(stocks);
  const [collapsed, setCollapsed] = React.useState({});

  function toggleSector(sector) {
    setCollapsed(prev => ({ ...prev, [sector]: !prev[sector] }));
  }

  const sectorOrder = [
    "Banks",
    "Capital Goods",
    "Materials",
    "Consumer Services",
    "Health Care Equipment & Services",
    "Diversified Financials",
  ];

  const orderedSectors = sectorOrder.filter(s => grouped[s]);
  const extraSectors   = Object.keys(grouped).filter(s => !sectorOrder.includes(s));
  const allSectors     = [...orderedSectors, ...extraSectors];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2>CDS Account</h2>
          <p>Colombo Stock Exchange – equity holdings by GICS sector</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4 }}>Total CDS Value</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{formatLKRFull(totals.cdsTotalValue)}</div>
          <div style={{ fontSize: "0.82rem", marginTop: 3 }}>
            <span className={totals.cdsTotalPL >= 0 ? "text-gain" : "text-loss"} style={{ fontWeight: 600 }}>
              {totals.cdsTotalPL >= 0 ? "+" : ""}{formatLKRFull(totals.cdsTotalPL)}
            </span>
            <span className="text-muted"> unrealized P/L</span>
          </div>
        </div>
      </div>

      {/* Sector summary chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {totals.sectorTotals.map(s => (
          <div
            key={s.sector}
            style={{
              background: "var(--bg-card)",
              border: `1px solid ${s.color}44`,
              borderRadius: "var(--radius-md)",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
            onClick={() => {
              const el = document.getElementById(`sector-${s.sector.replace(/\s+/g, "-")}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{s.sector}</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{formatLKR(s.marketValue)}</span>
            <span className={`badge badge-${s.unrealizedPL >= 0 ? "gain" : "loss"}`} style={{ fontSize: "0.68rem" }}>
              {formatPct(s.allocationPct)} of CDS
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Symbol / Company</th>
                <th>Quantity</th>
                <th>Avg Buy (LKR)</th>
                <th>Current Price (LKR)</th>
                <th>Market Value (LKR)</th>
                <th>Unrealized P/L (LKR)</th>
                <th>P/L %</th>
              </tr>
            </thead>
            <tbody>
              {allSectors.map(sector => {
                const sectorStocks = grouped[sector] || [];
                const sectorValue  = sectorStocks.reduce((s, x) => s + x.marketValue, 0);
                const sectorPL     = sectorStocks.reduce((s, x) => s + x.unrealizedPL, 0);
                const sectorColor  = SECTOR_COLORS[sector] || "#888";
                const isOpen       = !collapsed[sector];

                return (
                  <React.Fragment key={sector}>
                    {/* Sector header row */}
                    <tr
                      id={`sector-${sector.replace(/\s+/g, "-")}`}
                      className="sector-row"
                      onClick={() => toggleSector(sector)}
                    >
                      <td colSpan={7}>
                        <span className="sector-badge">
                          <span className="sector-color-dot" style={{ background: sectorColor }} />
                          <span>{sector}</span>
                          <span className="sector-chevron" style={{ transform: isOpen ? "rotate(90deg)" : "none" }}>›</span>
                          <span style={{ marginLeft: 8, color: "var(--text-muted)", fontWeight: 400 }}>
                            {sectorStocks.length} holding{sectorStocks.length !== 1 ? "s" : ""}
                          </span>
                        </span>
                      </td>
                    </tr>

                    {/* Stock rows */}
                    {isOpen && sectorStocks.map(stock => (
                      <tr key={stock.symbol}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {stock.logo
                              ? <img src={stock.logo} alt={stock.symbol} style={{ width: 28, height: 28, objectFit: "contain" }} />
                              : <div style={{
                                  width: 28, height: 28,
                                  background: sectorColor + "22",
                                  border: `1px solid ${sectorColor}44`,
                                  borderRadius: 4,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "0.6rem", fontWeight: 800, color: sectorColor,
                                  fontFamily: "monospace",
                                }}>
                                  {stock.symbol.slice(0, 3)}
                                </div>
                            }
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                                <span className="stock-symbol-pill">{stock.symbol}</span>
                              </div>
                              <div className="stock-company">{stock.company}</div>
                            </div>
                          </div>
                        </td>
                        <td>{formatNum(stock.quantity, 0)}</td>
                        <td>{formatNum(stock.avgBuyPrice, 2)}</td>
                        <td style={{ fontWeight: 600 }}>
                          {formatNum(stock.currentPrice, 2)}
                          <PriceChangePip current={stock.currentPrice} avg={stock.avgBuyPrice} />
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatLKRFull(stock.marketValue)}</td>
                        <td>
                          <span className={stock.unrealizedPL >= 0 ? "text-gain" : "text-loss"} style={{ fontWeight: 600 }}>
                            {stock.unrealizedPL >= 0 ? "+" : ""}{formatLKRFull(stock.unrealizedPL)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${stock.plPercent >= 0 ? "gain" : "loss"}`}>
                            {formatPct(stock.plPercent)}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Sector subtotal */}
                    {isOpen && (
                      <tr className="subtotal-row">
                        <td colSpan={4} style={{ textAlign: "right", paddingRight: 14 }}>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginRight: 8 }}>SECTOR TOTAL</span>
                        </td>
                        <td>{formatLKRFull(sectorValue)}</td>
                        <td>
                          <span className={sectorPL >= 0 ? "text-gain" : "text-loss"} style={{ fontWeight: 600 }}>
                            {sectorPL >= 0 ? "+" : ""}{formatLKRFull(sectorPL)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${sectorPL >= 0 ? "gain" : "loss"}`}>
                            {formatPct(sectorValue > 0 ? (sectorPL / (sectorValue - sectorPL)) * 100 : 0)}
                          </span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Grand total */}
              <tr className="total-row">
                <td colSpan={4} style={{ textAlign: "right", paddingRight: 14 }}>
                  <span style={{ fontSize: "0.78rem", letterSpacing: "0.07em" }}>PORTFOLIO TOTAL</span>
                </td>
                <td>{formatLKRFull(totals.cdsTotalValue)}</td>
                <td>
                  <span className={totals.cdsTotalPL >= 0 ? "text-gain" : "text-loss"} style={{ fontWeight: 700 }}>
                    {totals.cdsTotalPL >= 0 ? "+" : ""}{formatLKRFull(totals.cdsTotalPL)}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${totals.cdsTotalPL >= 0 ? "gain" : "loss"}`} style={{ fontSize: "0.78rem" }}>
                    {formatPct(totals.cdsTotalCost > 0 ? (totals.cdsTotalPL / totals.cdsTotalCost) * 100 : 0)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals strip */}
      <div className="totals-strip">
        <div className="totals-strip-item">
          <span className="totals-strip-label">Total Invested</span>
          <span className="totals-strip-value">{formatLKRFull(totals.cdsTotalCost)}</span>
        </div>
        <div className="totals-strip-divider" />
        <div className="totals-strip-item">
          <span className="totals-strip-label">Current Value</span>
          <span className="totals-strip-value">{formatLKRFull(totals.cdsTotalValue)}</span>
        </div>
        <div className="totals-strip-divider" />
        <div className="totals-strip-item">
          <span className="totals-strip-label">Unrealized P/L</span>
          <span className={`totals-strip-value ${totals.cdsTotalPL >= 0 ? "text-gain" : "text-loss"}`}>
            {totals.cdsTotalPL >= 0 ? "+" : ""}{formatLKRFull(totals.cdsTotalPL)}
          </span>
        </div>
        <div className="totals-strip-divider" />
        <div className="totals-strip-item">
          <span className="totals-strip-label">Overall Return</span>
          <span className={`totals-strip-value ${totals.cdsTotalPL >= 0 ? "text-gain" : "text-loss"}`}>
            {formatPct(totals.cdsTotalCost > 0 ? (totals.cdsTotalPL / totals.cdsTotalCost) * 100 : 0)}
          </span>
        </div>
        <div className="totals-strip-divider" />
        <div className="totals-strip-item">
          <span className="totals-strip-label">Holdings</span>
          <span className="totals-strip-value">{stocks.length} stocks · {Object.keys(grouped).length} sectors</span>
        </div>
      </div>
    </div>
  );
}

// Small pip showing price direction
function PriceChangePip({ current, avg }) {
  const diff = current - avg;
  if (Math.abs(diff) < 0.001) return null;
  const color = diff > 0 ? "var(--gain)" : "var(--loss)";
  const arrow = diff > 0 ? "▲" : "▼";
  return (
    <span style={{ fontSize: "0.7rem", color, marginLeft: 5 }}>
      {arrow} {Math.abs(diff).toFixed(2)}
    </span>
  );
}
