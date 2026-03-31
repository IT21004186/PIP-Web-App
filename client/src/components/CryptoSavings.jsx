import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatLKR, formatLKRFull, formatNum, formatPct, PriceChangePip } from '../utils/formatters';
import CryptoForm from './CryptoForm';
import { deleteCrypto } from '../api/crud';

export default function CryptoSavings({ cryptos, totals }) {
  const totalCryptoLKR   = totals.cryptoTotalLKR;
  const totalCryptoPLLKR = totals.cryptoTotalPL;
  const totalCostLKR     = totals.cryptoTotalCostLKR;
  const [cryptoForm, setCryptoForm] = useState(null);  // null | 'add' | assetObj
  const qc = useQueryClient();

  async function handleDeleteCrypto(symbol) {
    if (!window.confirm(`Delete ${symbol}? This cannot be undone.`)) return;
    try { await deleteCrypto(symbol); await qc.invalidateQueries({ queryKey: ['portfolio'] }); }
    catch (err) { alert(err.message); }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2>Crypto Currency Savings</h2>
          <p>Digital asset holdings – valued in USDT and LKR equivalent</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCryptoForm('add')}>
          + Add Asset
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Crypto Value</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatLKRFull(totalCryptoLKR)}</div>
          <div style={{ fontSize: '0.82rem', marginTop: 3 }}>
            <span className={totalCryptoPLLKR >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
              {totalCryptoPLLKR >= 0 ? '+' : ''}{formatLKRFull(totalCryptoPLLKR)}
            </span>
            <span className="text-muted"> unrealized P/L</span>
          </div>
        </div>
      </div>

      <div className="rate-banner">
        <span>💱</span>
        <span>Exchange Rate:</span>
        <strong>1 USD = Rs. {formatNum(totals.usdToLkr, 2)}</strong>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
        <span>All crypto prices in</span><strong>USDT</strong>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
        <span>LKR equivalents calculated at current rate</span>
        <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.72rem', opacity: 0.7, color: 'inherit', textDecoration: 'none' }}>
          Rates by Exchange Rate API
        </a>
      </div>

      <div className="crypto-grid">
        {cryptos.map(asset => (
          <CryptoCard key={asset.symbol} asset={asset} totalCryptoLKR={totalCryptoLKR}
            onEdit={() => setCryptoForm(asset)}
            onDelete={() => handleDeleteCrypto(asset.symbol)} />
        ))}
      </div>

      {cryptoForm && (
        <CryptoForm
          asset={cryptoForm === 'add' ? null : cryptoForm}
          onClose={() => setCryptoForm(null)}
        />
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Crypto Holdings Summary
          </h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Asset</th><th>Quantity</th><th>Avg Buy (USDT)</th>
                <th>Current Price (USDT)</th><th>Market Value (USDT)</th>
                <th>Market Value (LKR)</th><th>Unrealized P/L (USDT)</th>
                <th>Unrealized P/L (LKR)</th><th>P/L %</th><th>Allocation</th>
              </tr>
            </thead>
            <tbody>
              {cryptos.map(asset => (
                <tr key={asset.symbol}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CryptoLogoSmall asset={asset} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{asset.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asset.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{formatNum(asset.quantity, asset.quantity < 100 ? 4 : 2)}</td>
                  <td>${formatNum(asset.avgBuyPrice, asset.avgBuyPrice < 10 ? 4 : 2)}</td>
                  <td style={{ fontWeight: 600 }}>
                    ${formatNum(asset.currentPrice, asset.currentPrice < 10 ? 4 : 2)}
                    <PriceChangePip current={asset.currentPrice} avg={asset.avgBuyPrice} />
                  </td>
                  <td style={{ fontWeight: 600 }}>${formatNum(asset.marketValueUSD, 2)}</td>
                  <td style={{ fontWeight: 600 }}>{formatLKRFull(asset.marketValueLKR)}</td>
                  <td>
                    <span className={asset.unrealizedPLUSD >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
                      {asset.unrealizedPLUSD >= 0 ? '+' : ''}${formatNum(Math.abs(asset.unrealizedPLUSD), 2)}
                    </span>
                  </td>
                  <td>
                    <span className={asset.unrealizedPLLKR >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
                      {asset.unrealizedPLLKR >= 0 ? '+' : ''}{formatLKRFull(Math.abs(asset.unrealizedPLLKR))}
                    </span>
                  </td>
                  <td><span className={`badge badge-${asset.plPercent >= 0 ? 'gain' : 'loss'}`}>{formatPct(asset.plPercent)}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'flex-end' }}>
                      <div style={{ width: 50, height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${totalCryptoLKR > 0 ? (asset.marketValueLKR / totalCryptoLKR) * 100 : 0}%`, height: '100%', background: asset.color, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontWeight: 600, minWidth: 42, textAlign: 'right', fontSize: '0.82rem' }}>
                        {totalCryptoLKR > 0 ? ((asset.marketValueLKR / totalCryptoLKR) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={4} style={{ textAlign: 'right' }}>Total</td>
                <td>${formatNum(cryptos.reduce((s, c) => s + c.marketValueUSD, 0), 2)}</td>
                <td>{formatLKRFull(totalCryptoLKR)}</td>
                <td>
                  <span className={totalCryptoPLLKR >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 700 }}>
                    {totalCryptoPLLKR >= 0 ? '+' : ''}${formatNum(Math.abs(cryptos.reduce((s, c) => s + c.unrealizedPLUSD, 0)), 2)}
                  </span>
                </td>
                <td>
                  <span className={totalCryptoPLLKR >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 700 }}>
                    {totalCryptoPLLKR >= 0 ? '+' : ''}{formatLKRFull(Math.abs(totalCryptoPLLKR))}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${totalCostLKR > 0 && totalCryptoLKR >= totalCostLKR ? 'gain' : 'loss'}`}>
                    {formatPct(totalCostLKR > 0 ? ((totalCryptoLKR - totalCostLKR) / totalCostLKR) * 100 : 0)}
                  </span>
                </td>
                <td style={{ fontWeight: 700 }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function CryptoCard({ asset, totalCryptoLKR, onEdit, onDelete }) {
  const allocPct   = totalCryptoLKR > 0 ? (asset.marketValueLKR / totalCryptoLKR) * 100 : 0;
  const plBarPct   = Math.min(Math.abs(asset.plPercent), 200) / 2;
  const plBarColor = asset.plPercent >= 0 ? 'var(--gain)' : 'var(--loss)';

  return (
    <div className="crypto-card">
      <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle at top right, ${asset.color}18, transparent 70%)`, pointerEvents: 'none' }} />
      <div className="crypto-card-header">
        <CryptoLogoLarge asset={asset} />
        <div className="crypto-name-block">
          <div className="crypto-name">{asset.name}</div>
          <div className="crypto-symbol">{asset.symbol} · Digital Asset</div>
        </div>
        <div className="crypto-price">
          <div className="crypto-price-value" style={{ color: asset.color }}>
            ${formatNum(asset.currentPrice, asset.currentPrice < 10 ? 4 : 2)}
          </div>
          <div className="crypto-price-label">Current Price (USDT)</div>
        </div>
      </div>
      <div className="crypto-stats">
        {[
          { label: 'Quantity',            value: `${formatNum(asset.quantity, asset.quantity < 100 ? 4 : 2)} ${asset.symbol}`, mono: true },
          { label: 'Avg Buy Price',       value: `$${formatNum(asset.avgBuyPrice, asset.avgBuyPrice < 10 ? 4 : 2)}` },
          { label: 'Market Value (USDT)', value: `$${formatNum(asset.marketValueUSD, 2)}` },
          { label: 'Market Value (LKR)',  value: formatLKR(asset.marketValueLKR) },
          { label: 'Unrealized P/L (USDT)', value: `${asset.unrealizedPLUSD >= 0 ? '+' : ''}$${formatNum(asset.unrealizedPLUSD, 2)}`, gain: asset.unrealizedPLUSD >= 0 },
          { label: 'Unrealized P/L (LKR)',  value: `${asset.unrealizedPLLKR >= 0 ? '+' : ''}${formatLKR(asset.unrealizedPLLKR)}`, gain: asset.unrealizedPLLKR >= 0, hasGain: true },
        ].map(s => (
          <div key={s.label} className="crypto-stat">
            <span className="crypto-stat-label">{s.label}</span>
            <span className={`crypto-stat-value${s.hasGain ? ` ${s.gain ? 'text-gain' : 'text-loss'}` : ''}`} style={s.mono ? { fontFamily: 'monospace' } : {}}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>P/L Performance</span>
        <span className={`badge badge-${asset.plPercent >= 0 ? 'gain' : 'loss'}`}>{formatPct(asset.plPercent)}</span>
      </div>
      <div className="crypto-pl-bar-track">
        <div className="crypto-pl-bar-fill" style={{ width: `${plBarPct}%`, background: plBarColor }} />
      </div>
      <div className="allocation-row">
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Crypto Allocation</span>
        <div className="allocation-bar-track">
          <div className="allocation-bar-fill" style={{ width: `${allocPct}%`, background: asset.color }} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: asset.color }}>{allocPct.toFixed(1)}%</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost btn-icon" onClick={onEdit}>✏ Edit</button>
        <button type="button" className="btn btn-danger btn-icon" onClick={onDelete}>✕ Delete</button>
      </div>
    </div>
  );
}

function CryptoLogoLarge({ asset }) {
  const [err, setErr] = useState(false);
  if (!asset.logo || err) {
    return (
      <div className="crypto-logo-placeholder" style={{ background: asset.color + '22', color: asset.color, border: `1px solid ${asset.color}44` }}>
        {asset.symbol.slice(0, 3)}
      </div>
    );
  }
  return <img className="crypto-logo" src={asset.logo} alt={asset.name} onError={() => setErr(true)} />;
}

function CryptoLogoSmall({ asset }) {
  const [err, setErr] = useState(false);
  if (!asset.logo || err) {
    return (
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: asset.color + '22', color: asset.color, border: `1px solid ${asset.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, fontFamily: 'monospace', flexShrink: 0 }}>
        {asset.symbol.slice(0, 3)}
      </div>
    );
  }
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <img src={asset.logo} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} onError={() => setErr(true)} />
    </div>
  );
}
