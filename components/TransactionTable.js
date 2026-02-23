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
                const isBuy = (tx.status || "").toUpperCase() === "BUY";
                return (
                  <tr key={idx} className="transaction-table-row">
                    <td>{formatDate(tx.tradeDate)}</td>
                    <td>{formatNum(tx.shares ?? 0, 0)}</td>
                    <td>{formatLKRFull(tx.avgPrice ?? 0)}</td>
                    <td>{formatLKRFull(tx.grossAmount ?? 0)}</td>
                    <td>{formatLKRFull(tx.commission ?? 0)}</td>
                    <td>{formatLKRFull(tx.netAmount ?? 0)}</td>
                    <td>
                      <span
                        className={`badge badge-${isBuy ? "gain" : "loss"}`}
                      >
                        {tx.status || "—"}
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
            <span className="transaction-derived-label">Total Investment Value</span>
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
        </div>
      )}
    </div>
  );
}
