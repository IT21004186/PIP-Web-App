// =========================================================
//  PIP – App Root
// =========================================================

const { useState, useMemo } = React;

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  // All data is pre-computed from data.js (loaded as plain <script>)
  const stocks = useMemo(() => computedStocks, []);
  const cryptos = useMemo(() => computedCrypto, []);
  const fds     = useMemo(() => computedFDs, []);
  const totals  = useMemo(() => getPortfolioTotals(stocks, cryptos, fds), [stocks, cryptos, fds]);

  function renderPage() {
    switch (activePage) {
      case "dashboard": return <Dashboard stocks={stocks} cryptos={cryptos} fds={fds} totals={totals} />;
      case "cds":       return <CDSAccount stocks={stocks} totals={totals} />;
      case "crypto":    return <CryptoSavings cryptos={cryptos} totals={totals} />;
      case "fd":        return <FixedDeposits fds={fds} totals={totals} />;
      default:          return <Dashboard stocks={stocks} cryptos={cryptos} fds={fds} totals={totals} />;
    }
  }

  return (
    <div>
      <Navbar activePage={activePage} onNavigate={setActivePage} totals={totals} />
      <main>{renderPage()}</main>
    </div>
  );
}

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<App />);
