// =========================================================
//  Transaction Table Component
//  Section 2: Buy/Sell transaction history
// =========================================================

function TransactionTable({ transactions, derived }) {
  const sorted = [...(transactions || [])].sort(
    (a, b) => new Date(b.tradeDate) - new Date(a.tradeDate)
  );

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="card transaction-table-card">
      <div className="transaction-table-cse-banner">
        <span>CSE Transaction Costs: Buy 1.12% | Sell 1.12% (up to Rs.100M) · 0.6125% above</span>
      </div>
      <h3 className="transaction-table-title">Transaction History</h3>
      <div className="table-wrapper transaction-table-wrapper">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Trade Date</th>
              <th>No of Shares</th>
              <th>Avg Price</th>
              <th>Gross Amount</th>
              <th>Commission Fee</th>
              <th>Net Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="transaction-table-empty">
                  No transactions recorded
                </td>
              </tr>
            ) : (
              sorted.map((tx, idx) => {
                const cseTx = computeTransactionWithCSE(tx);
                const isBuy = (cseTx.status || "").toUpperCase() === "BUY";
                return (
                  <tr key={idx} className="transaction-table-row">
                    <td>{formatDate(cseTx.tradeDate)}</td>
                    <td>{formatNum(cseTx.shares ?? 0, 0)}</td>
                    <td>{formatLKRFull(cseTx.avgPrice ?? 0)}</td>
                    <td>{formatLKRFull(cseTx.grossAmount ?? 0)}</td>
                    <td>{formatLKRFull(cseTx.commission)}</td>
                    <td>{formatLKRFull(cseTx.netAmount)}</td>
                    <td>
                      <span
                        className={`badge badge-${isBuy ? "gain" : "loss"}`}
                      >
                        {cseTx.status || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {derived && (
        <div className="transaction-derived-strip">
          <div className="transaction-derived-item">
            <span className="transaction-derived-label">Total Shares Held</span>
            <span className="transaction-derived-value">
              {formatNum(derived.totalShares ?? 0, 0)}
            </span>
          </div>
          <div className="transaction-derived-divider" />
          <div className="transaction-derived-item">
            <span className="transaction-derived-label">Current Market Value</span>
            <span className="transaction-derived-value">
              {formatLKRFull(derived.totalInvestmentValue ?? 0)}
            </span>
          </div>
          <div className="transaction-derived-divider" />
          <div className="transaction-derived-item">
            <span className="transaction-derived-label">Avg Holding Price</span>
            <span className="transaction-derived-value">
              {formatLKRFull(derived.avgHoldingPrice ?? 0)}
            </span>
          </div>
          <div className="transaction-derived-divider" />
          <div className="transaction-derived-item">
            <span className="transaction-derived-label">True Cost (LKR)</span>
            <span className="transaction-derived-value">
              {formatLKRFull(derived.costBasis ?? 0)}
            </span>
          </div>
          <div className="transaction-derived-divider" />
          <div className="transaction-derived-item">
            <span className="transaction-derived-label">Est. Sell Cost (LKR)</span>
            <span className="transaction-derived-value text-loss">
              {formatLKRFull(derived.estimatedSellCost ?? 0)}
            </span>
          </div>
          <div className="transaction-derived-divider" />
          <div className="transaction-derived-item">
            <span className="transaction-derived-label">Net Proceeds (LKR)</span>
            <span className="transaction-derived-value">
              {formatLKRFull(derived.netSaleProceeds ?? 0)}
            </span>
          </div>
          <div className="transaction-derived-divider" />
          <div className="transaction-derived-item">
            <span className="transaction-derived-label">Realized Profit</span>
            <span
              className={`transaction-derived-value ${
                (derived.realizedProfit ?? 0) >= 0 ? "text-gain" : "text-loss"
              }`}
            >
              {(derived.realizedProfit ?? 0) >= 0 ? "+" : ""}
              {formatLKRFull(derived.realizedProfit ?? 0)}
            </span>
          </div>
          <div className="transaction-derived-divider" />
          <div className="transaction-derived-item">
            <span className="transaction-derived-label">Unrealized P/L</span>
            <span
              className={`transaction-derived-value ${
                (derived.unrealizedPL ?? 0) >= 0 ? "text-gain" : "text-loss"
              }`}
            >
              {(derived.unrealizedPL ?? 0) >= 0 ? "+" : ""}
              {formatLKRFull(derived.unrealizedPL ?? 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
