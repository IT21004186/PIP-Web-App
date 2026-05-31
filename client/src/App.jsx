import { useState } from 'react';
import { usePortfolio } from './hooks/usePortfolio';
import Navbar            from './components/Navbar';
import Dashboard         from './components/Dashboard';
import CDSAccount        from './components/CDSAccount';
import CryptoSavings     from './components/CryptoSavings';
import FixedDeposits     from './components/FixedDeposits';
import SymbolProfile     from './components/SymbolProfile';
import InvestmentLogs    from './components/InvestmentLogs';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 16,
      background: 'var(--bg-base)', color: 'var(--text-secondary)',
    }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid var(--border)',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>Loading portfolio…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 12,
      background: 'var(--bg-base)', color: 'var(--loss)',
      padding: 32, textAlign: 'center',
    }}>
      <div style={{ fontSize: '2rem' }}>⚠</div>
      <p style={{ fontWeight: 600 }}>Failed to load portfolio data</p>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 420 }}>{message}</p>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
        Make sure the API server is running:{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>cd server &amp;&amp; npm run dev</strong>
      </p>
    </div>
  );
}

export default function App() {
  const { data: portfolio, isLoading, error } = usePortfolio();
  const [activePage,     setActivePage]     = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  function handleNavigate(page) {
    setActivePage(page);
    setSelectedSymbol(null);
  }

  function handleSymbolClick(symbol) {
    setActivePage('symbol');
    setSelectedSymbol(symbol);
  }

  function handleSymbolBack() {
    setActivePage('cds');
    setSelectedSymbol(null);
  }

  if (isLoading) return <LoadingScreen />;
  if (error)     return <ErrorScreen message={error.message} />;

  const { stocks, cryptos, fds, totals, transactions } = portfolio;

  function renderPage() {
    switch (activePage) {
      case 'dashboard': return <Dashboard stocks={stocks} cryptos={cryptos} fds={fds} totals={totals} />;
      case 'cds':       return <CDSAccount stocks={stocks} totals={totals} onSymbolClick={handleSymbolClick} />;
      case 'crypto':    return <CryptoSavings cryptos={cryptos} totals={totals} />;
      case 'fd':        return <FixedDeposits fds={fds} totals={totals} />;
      case 'logs':      return <InvestmentLogs />;
      case 'symbol':    return <SymbolProfile symbol={selectedSymbol} stocks={stocks} transactions={transactions} onBack={handleSymbolBack} />;
      default:          return <Dashboard stocks={stocks} cryptos={cryptos} fds={fds} totals={totals} />;
    }
  }

  return (
    <div>
      <Navbar activePage={activePage} onNavigate={handleNavigate} totals={totals} />
      <main>{renderPage()}</main>
    </div>
  );
}
