// =========================================================
//  PIP – App Root
// =========================================================

const { useState, useEffect } = React;

function LoadingScreen() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: 16,
      background: "var(--bg-base)",
      color: "var(--text-secondary)",
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: "3px solid var(--border)",
        borderTop: "3px solid var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: "0.9rem", letterSpacing: "0.05em" }}>Loading portfolio…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: 12,
      background: "var(--bg-base)",
      color: "var(--loss)",
      padding: 32,
      textAlign: "center",
    }}>
      <div style={{ fontSize: "2rem" }}>⚠</div>
      <p style={{ fontWeight: 600 }}>Failed to load portfolio data</p>
      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 420 }}>
        {message}
      </p>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8 }}>
        Make sure you are running the app via Live Server (not by opening the file directly),
        and that <strong style={{ color: "var(--text-secondary)" }}>data.json</strong> exists in the project root.
      </p>
    </div>
  );
}

function App() {
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError]         = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    loadPortfolio()
      .then(setPortfolio)
      .catch(err => setError(err.message));
  }, []);

  if (error)     return <ErrorScreen message={error} />;
  if (!portfolio) return <LoadingScreen />;

  const { stocks, cryptos, fds, totals } = portfolio;

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
