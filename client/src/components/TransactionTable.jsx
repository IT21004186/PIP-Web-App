import { Fragment, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatLKRFull, formatNum } from '../utils/formatters';
import { computeTransactionWithCSE } from '../utils/cseUtils';
import TransactionForm from './TransactionForm';
import { deleteTransaction } from '../api/crud';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TransactionTable({ symbol, transactions, derived }) {
  const qc = useQueryClient();
  const [txForm, setTxForm] = useState(null);  // null | 'add' | txObj
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const sorted = [...(transactions || [])].sort(
    (a, b) => new Date(b.tradeDate) - new Date(a.tradeDate)
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  async function handleDeleteTx(tx) {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    try { await deleteTransaction(symbol, tx._id); await qc.invalidateQueries({ queryKey: ['portfolio'] }); }
    catch (err) { alert(err.message); }
  }

  return (
    <div className="card transaction-table-card">
      <div className="transaction-table-cse-banner">
        <span>CSE Transaction Costs: Buy 1.12% | Sell 1.12% (up to Rs.100M) · 0.6125% above</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 className="transaction-table-title" style={{ margin: 0 }}>Transaction History</h3>
        {symbol && (
          <button type="button" className="btn btn-primary" onClick={() => setTxForm('add')}>
            + Add Transaction
          </button>
        )}
      </div>
      <div className="table-wrapper transaction-table-wrapper">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Trade Date</th><th>No of Shares</th><th>Avg Price</th>
              <th>Gross Amount</th><th>Commission Fee</th><th>Net Amount</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={8} className="transaction-table-empty">No transactions recorded</td></tr>
            ) : (
              paginated.map((tx, idx) => {
                const cseTx  = computeTransactionWithCSE(tx);
                const status = (cseTx.status || '').toUpperCase();
                const badgeCls = status === 'BUY' ? 'badge-gain' : status === 'SELL' ? 'badge-loss' : 'badge-scrip';
                return (
                  <tr key={idx} className="transaction-table-row">
                    <td>{formatDate(cseTx.tradeDate)}</td>
                    <td>{formatNum(cseTx.shares ?? 0, 0)}</td>
                    <td>{status === 'SCRIP' ? '—' : formatLKRFull(cseTx.avgPrice ?? 0)}</td>
                    <td>{status === 'SCRIP' ? '—' : formatLKRFull(cseTx.grossAmount ?? 0)}</td>
                    <td>{status === 'SCRIP' ? '—' : formatLKRFull(cseTx.commission)}</td>
                    <td>{status === 'SCRIP' ? '—' : formatLKRFull(cseTx.netAmount)}</td>
                    <td><span className={`badge ${badgeCls}`}>{cseTx.status || '—'}</span></td>
                    <td>
                      {symbol && (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button type="button" className="btn btn-ghost btn-icon"
                            title="Edit transaction"
                            onClick={() => setTxForm(tx)}>✏</button>
                          <button type="button" className="btn btn-danger btn-icon"
                            title="Delete transaction"
                            onClick={() => handleDeleteTx(tx)}>✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <div className="transaction-pagination">
          <div className="pagination-rows-select">
            <span>Rows per page:</span>
            <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
          <div className="pagination-controls">
            <span className="pagination-range">
              {(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, sorted.length)} of {sorted.length}
            </span>
            <button className="btn btn-ghost btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
            <button className="btn btn-ghost btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
          </div>
        </div>
      )}

      {txForm && (
        <TransactionForm
          symbol={symbol}
          tx={txForm === 'add' ? null : txForm}
          onClose={() => setTxForm(null)}
        />
      )}

      {derived && (
        <div className="transaction-derived-strip">
          {[
            { label: 'Total Shares Held',    value: formatNum(derived.totalShares ?? 0, 0),          cls: '' },
            { label: 'Current Market Value', value: formatLKRFull(derived.totalInvestmentValue ?? 0), cls: '' },
            { label: 'Avg Holding Price',    value: formatLKRFull(derived.avgHoldingPrice ?? 0),      cls: '' },
            { label: 'True Cost (LKR)',      value: formatLKRFull(derived.costBasis ?? 0),            cls: '' },
            { label: 'Est. Sell Cost (LKR)', value: formatLKRFull(derived.estimatedSellCost ?? 0),    cls: 'text-loss' },
            { label: 'Net Proceeds (LKR)',   value: formatLKRFull(derived.netSaleProceeds ?? 0),      cls: '' },
            { label: 'Realized Profit',      value: `${(derived.realizedProfit ?? 0) >= 0 ? '+' : ''}${formatLKRFull(derived.realizedProfit ?? 0)}`, cls: (derived.realizedProfit ?? 0) >= 0 ? 'text-gain' : 'text-loss' },
            { label: 'Unrealized P/L',       value: `${(derived.unrealizedPL ?? 0) >= 0 ? '+' : ''}${formatLKRFull(derived.unrealizedPL ?? 0)}`,    cls: (derived.unrealizedPL ?? 0) >= 0 ? 'text-gain' : 'text-loss' },
          ].map((item, i, arr) => (
            <Fragment key={item.label}>
              <div className="transaction-derived-item">
                <span className="transaction-derived-label">{item.label}</span>
                <span className={`transaction-derived-value ${item.cls}`}>{item.value}</span>
              </div>
              {i < arr.length - 1 && <div className="transaction-derived-divider" />}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
