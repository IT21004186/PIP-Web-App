import { useState, Fragment } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatLKR, formatLKRFull, formatNum, formatPct, PriceChangePip } from '../utils/formatters';
import { SECTOR_COLORS } from '../utils/cseUtils';
import StockForm from './StockForm';
import { deleteStock } from '../api/crud';

function groupBySector(stocks) {
  return stocks.reduce((acc, stock) => {
    if (!acc[stock.sector]) acc[stock.sector] = [];
    acc[stock.sector].push(stock);
    return acc;
  }, {});
}

export default function CDSAccount({ stocks, totals, onSymbolClick }) {
  const grouped  = groupBySector(stocks);
  const [collapsed,  setCollapsed]  = useState({});
  const [stockForm,  setStockForm]  = useState(null);   // null | 'add' | stockObj
  const qc = useQueryClient();

  async function handleDeleteStock(symbol) {
    if (!window.confirm(`Delete ${symbol} and all its transactions? This cannot be undone.`)) return;
    try { await deleteStock(symbol); await qc.invalidateQueries({ queryKey: ['portfolio'] }); }
    catch (err) { alert(err.message); }
  }

  function toggleSector(sector) {
    setCollapsed(prev => ({ ...prev, [sector]: !prev[sector] }));
  }

  const sectorOrder = [
    'Banks', 'Capital Goods', 'Materials', 'Consumer Services',
    'Health Care Equipment & Services', 'Diversified Financials',
    'Food Beverage & Tobacco', 'Energy',
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
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total CDS Value</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatLKRFull(totals.cdsTotalValue)}</div>
          <div style={{ fontSize: '0.82rem', marginTop: 3 }}>
            <span className={totals.cdsTotalPL >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
              {totals.cdsTotalPL >= 0 ? '+' : ''}{formatLKRFull(totals.cdsTotalPL)}
            </span>
            <span className="text-muted"> unrealized P/L</span>
          </div>
        </div>
      </div>

      <div className="page-action-bar">
        <button type="button" className="btn btn-primary" onClick={() => setStockForm('add')}>
          + Add Stock
        </button>
      </div>

      {/* Sector chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {totals.sectorTotals.map(s => (
          <div
            key={s.sector}
            style={{
              background: 'var(--bg-card)', border: `1px solid ${s.color}44`,
              borderRadius: 'var(--radius-md)', padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            }}
            onClick={() => {
              const el = document.getElementById(`sector-${s.sector.replace(/\s+/g, '-')}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.sector}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatLKR(s.marketValue)}</span>
            <span className={`badge badge-${s.unrealizedPL >= 0 ? 'gain' : 'loss'}`} style={{ fontSize: '0.68rem' }}>
              {formatPct(s.allocationPct)} of CDS
            </span>
          </div>
        ))}
      </div>

      {/* CSE banner */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '10px 18px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        fontSize: '0.78rem', color: 'var(--text-secondary)',
      }}>
        <span>⚖️ <strong style={{ color: 'var(--text-primary)' }}>CSE Transaction Costs Applied</strong></span>
        <span style={{ color: 'var(--border-light)' }}>|</span>
        <span>Buy Commission: <strong style={{ color: 'var(--neutral)' }}>1.12%</strong> (already paid)</span>
        <span style={{ color: 'var(--border-light)' }}>|</span>
        <span>Sell Commission: <strong style={{ color: 'var(--neutral)' }}>1.12%</strong> (up to Rs. 100M) · <strong style={{ color: 'var(--neutral)' }}>0.6125%</strong> on balance above Rs. 100M</span>
        <span style={{ color: 'var(--border-light)' }}>|</span>
        <span>P/L = Net Sale Proceeds − True Cost</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Symbol / Company</th><th>Quantity</th><th>Avg Buy (LKR)</th>
                <th>True Cost (LKR)</th><th>Current Price (LKR)</th><th>Market Value (LKR)</th>
                <th>B.E.S Price (LKR)</th><th>Est. Sell Cost (LKR)</th>
                <th>Net Proceeds (LKR)</th><th>True P/L (LKR)</th><th>P/L %</th><th></th>
              </tr>
            </thead>
            <tbody>
              {allSectors.map(sector => {
                const sectorStocks   = grouped[sector] || [];
                const sectorValue    = sectorStocks.reduce((s, x) => s + x.marketValue, 0);
                const sectorTrueCost = sectorStocks.reduce((s, x) => s + x.trueCostBasis, 0);
                const sectorSellCost = sectorStocks.reduce((s, x) => s + x.estimatedSellCost, 0);
                const sectorProceeds = sectorStocks.reduce((s, x) => s + x.netSaleProceeds, 0);
                const sectorPL       = sectorStocks.reduce((s, x) => s + x.unrealizedPL, 0);
                const sectorColor    = SECTOR_COLORS[sector] || '#888';
                const isOpen         = !collapsed[sector];

                return (
                  <Fragment key={sector}>
                    <tr
                      id={`sector-${sector.replace(/\s+/g, '-')}`}
                      className="sector-row"
                      onClick={() => toggleSector(sector)}
                    >
                      <td colSpan={12}>
                        <span className="sector-badge">
                          <span className="sector-color-dot" style={{ background: sectorColor }} />
                          <span>{sector}</span>
                          <span className="sector-chevron" style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                          <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontWeight: 400 }}>
                            {sectorStocks.length} holding{sectorStocks.length !== 1 ? 's' : ''}
                          </span>
                        </span>
                      </td>
                    </tr>

                    {isOpen && sectorStocks.map(stock => (
                      <tr key={stock.symbol}>
                        <td>
                          <div
                            className={onSymbolClick ? 'stock-symbol-clickable' : ''}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: onSymbolClick ? 'pointer' : 'default' }}
                            onClick={onSymbolClick ? () => onSymbolClick(stock.symbol) : undefined}
                            onKeyDown={onSymbolClick ? (e) => e.key === 'Enter' && onSymbolClick(stock.symbol) : undefined}
                            role={onSymbolClick ? 'button' : undefined}
                            tabIndex={onSymbolClick ? 0 : undefined}
                          >
                            {stock.logo
                              ? <div style={{ width: 36, height: 36, background: '#ffffff', borderRadius: 6, padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <img src={stock.logo} alt={stock.symbol} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                              : <div style={{ width: 36, height: 36, background: sectorColor + '22', border: `1px solid ${sectorColor}44`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: sectorColor, fontFamily: 'monospace', flexShrink: 0 }}>
                                  {stock.symbol.slice(0, 3)}
                                </div>
                            }
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                <span className="stock-symbol-pill">{stock.symbol}</span>
                              </div>
                              <div className="stock-company">{stock.company}</div>
                            </div>
                          </div>
                        </td>
                        <td>{formatNum(stock.quantity, 0)}</td>
                        <td>{formatNum(stock.avgBuyPrice, 4)}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {formatLKRFull(stock.trueCostBasis)}
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            +{formatLKR(stock.buyCostPaid)} buy fee
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {formatNum(stock.currentPrice, 2)}
                          <PriceChangePip current={stock.currentPrice} avg={stock.avgBuyPrice} />
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatLKRFull(stock.marketValue)}</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: stock.currentPrice >= stock.breakEvenPrice ? 'var(--gain)' : 'var(--loss)', fontWeight: 600 }}>
                            {formatNum(stock.breakEvenPrice, 4)}
                          </span>
                          <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {stock.currentPrice >= stock.breakEvenPrice ? '▲ above B.E.S' : '▼ below B.E.S'}
                          </div>
                        </td>
                        <td style={{ color: 'var(--loss)', fontSize: '0.82rem' }}>{formatLKRFull(stock.estimatedSellCost)}</td>
                        <td style={{ fontWeight: 600 }}>{formatLKRFull(stock.netSaleProceeds)}</td>
                        <td>
                          <span className={stock.unrealizedPL >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
                            {stock.unrealizedPL >= 0 ? '+' : ''}{formatLKRFull(stock.unrealizedPL)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${stock.plPercent >= 0 ? 'gain' : 'loss'}`}>
                            {formatPct(stock.plPercent)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button type="button" className="btn btn-ghost btn-icon"
                              title="Edit stock"
                              onClick={() => setStockForm(stock)}>✏</button>
                            <button type="button" className="btn btn-danger btn-icon"
                              title="Delete stock"
                              onClick={() => handleDeleteStock(stock.symbol)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {isOpen && (
                      <tr className="subtotal-row">
                        <td colSpan={3} style={{ textAlign: 'right', paddingRight: 14 }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>SECTOR TOTAL</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{formatLKRFull(sectorTrueCost)}</td>
                        <td></td>
                        <td>{formatLKRFull(sectorValue)}</td>
                        <td></td>
                        <td style={{ color: 'var(--loss)', fontSize: '0.82rem' }}>{formatLKRFull(sectorSellCost)}</td>
                        <td>{formatLKRFull(sectorProceeds)}</td>
                        <td>
                          <span className={sectorPL >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
                            {sectorPL >= 0 ? '+' : ''}{formatLKRFull(sectorPL)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${sectorPL >= 0 ? 'gain' : 'loss'}`}>
                            {formatPct(sectorTrueCost > 0 ? (sectorPL / sectorTrueCost) * 100 : 0)}
                          </span>
                        </td>
                        <td></td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              <tr className="total-row">
                <td colSpan={3} style={{ textAlign: 'right', paddingRight: 14 }}>
                  <span style={{ fontSize: '0.78rem', letterSpacing: '0.07em' }}>PORTFOLIO TOTAL</span>
                </td>
                <td>{formatLKRFull(totals.cdsTotalCost)}</td>
                <td></td>
                <td>{formatLKRFull(totals.cdsTotalValue)}</td>
                <td></td>
                <td style={{ color: 'var(--loss)' }}>{formatLKRFull(totals.cdsTotalSellCost)}</td>
                <td>{formatLKRFull(totals.cdsTotalNetProceeds)}</td>
                <td>
                  <span className={totals.cdsTotalPL >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 700 }}>
                    {totals.cdsTotalPL >= 0 ? '+' : ''}{formatLKRFull(totals.cdsTotalPL)}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${totals.cdsTotalPL >= 0 ? 'gain' : 'loss'}`} style={{ fontSize: '0.78rem' }}>
                    {formatPct(totals.cdsTotalCost > 0 ? (totals.cdsTotalPL / totals.cdsTotalCost) * 100 : 0)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {stockForm && (
        <StockForm
          stock={stockForm === 'add' ? null : stockForm}
          onClose={() => setStockForm(null)}
        />
      )}

      {/* Totals strip */}
      <div className="totals-strip">
        {[
          { label: 'Raw Cost',                  value: formatLKRFull(totals.cdsTotalCostRaw),     cls: '' },
          { label: 'Buy Commission Paid',        value: formatLKRFull(totals.cdsTotalBuyCost),     cls: 'text-loss' },
          { label: 'True Cost (incl. buy fee)',  value: formatLKRFull(totals.cdsTotalCost),        cls: '' },
          { label: 'Market Value',               value: formatLKRFull(totals.cdsTotalValue),       cls: '' },
          { label: 'Est. Sell Commission',       value: formatLKRFull(totals.cdsTotalSellCost),    cls: 'text-loss' },
          { label: 'Net Proceeds (after sell)',  value: formatLKRFull(totals.cdsTotalNetProceeds), cls: '' },
          { label: 'True Realisable P/L',        value: (totals.cdsTotalPL >= 0 ? '+' : '') + formatLKRFull(totals.cdsTotalPL), cls: totals.cdsTotalPL >= 0 ? 'text-gain' : 'text-loss' },
          { label: 'Overall Return',             value: formatPct(totals.cdsTotalCost > 0 ? (totals.cdsTotalPL / totals.cdsTotalCost) * 100 : 0), cls: totals.cdsTotalPL >= 0 ? 'text-gain' : 'text-loss' },
          { label: 'Holdings',                   value: `${stocks.length} stocks · ${Object.keys(grouped).length} sectors`, cls: '' },
        ].map((item, i, arr) => (
          <Fragment key={item.label}>
            <div className="totals-strip-item">
              <span className="totals-strip-label">{item.label}</span>
              <span className={`totals-strip-value ${item.cls}`}>{item.value}</span>
            </div>
            {i < arr.length - 1 && <div className="totals-strip-divider" />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
