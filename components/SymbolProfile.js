// =========================================================
//  Symbol Profile Component
//  Company (Symbol) profile page: header + transaction history
// =========================================================

function SymbolProfile({ symbol, stocks, transactions, onBack }) {
  const symbolData = getSymbolProfile(stocks, symbol);
  const txList = getSymbolTransactions(transactions, symbol);
  const derived = symbolData
    ? computeSymbolDerived(txList, symbolData.currentPrice)
    : null;

  if (!symbol) {
    return (
      <div className="page-wrapper symbol-profile-page">
        <div className="symbol-profile-error">
          <p>No symbol selected.</p>
          {onBack && (
            <button type="button" className="symbol-profile-back" onClick={onBack}>
              ← Back to CDS Account
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!symbolData) {
    return (
      <div className="page-wrapper symbol-profile-page">
        <div className="symbol-profile-error">
          <p>Symbol &quot;{symbol}&quot; not found in portfolio.</p>
          {onBack && (
            <button type="button" className="symbol-profile-back" onClick={onBack}>
              ← Back to CDS Account
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper symbol-profile-page">
      <div className="symbol-profile-breadcrumb">
        <button
          type="button"
          className="symbol-profile-back"
          onClick={onBack}
        >
          ← CDS Account
        </button>
        <span className="symbol-profile-breadcrumb-sep">/</span>
        <span className="symbol-profile-breadcrumb-symbol">{symbol}</span>
      </div>

      <SymbolHeader symbolData={symbolData} />

      <TransactionTable transactions={txList} derived={derived} />
    </div>
  );
}
