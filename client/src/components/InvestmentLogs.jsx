import { Fragment, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInvestmentLogs } from '../hooks/useInvestmentLogs';
import { deleteInvestmentLog } from '../api/crud';
import { formatLKRFull } from '../utils/formatters';
import InvestmentLogForm from './InvestmentLogForm';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function InvestmentLogs() {
  const { data: logs = [], isLoading, error } = useInvestmentLogs();
  const [logForm, setLogForm] = useState(null); // null | 'add' | logObj
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const qc = useQueryClient();

  const total = logs.reduce((sum, l) => sum + l.amount, 0);

  const totalPages = Math.max(1, Math.ceil(logs.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = logs.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  async function handleDelete(log) {
    if (!window.confirm(`Delete log entry for ${formatDate(log.date)}? This cannot be undone.`)) return;
    try {
      await deleteInvestmentLog(log._id);
      await qc.invalidateQueries({ queryKey: ['investmentLogs'] });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2>Investment Logs</h2>
          <p>Bookkeeping record of funds deposited into your CDS account</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setLogForm('add')}>
          + Add Log
        </button>
      </div>

      {logForm && (
        <InvestmentLogForm
          log={logForm === 'add' ? null : logForm}
          onClose={() => setLogForm(null)}
        />
      )}

      {isLoading && (
        <div className="inv-log-empty">Loading…</div>
      )}

      {error && (
        <div className="inv-log-empty" style={{ color: 'var(--loss)' }}>
          Failed to load logs: {error.message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="inv-log-table-wrap">
            <table className="inv-log-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Amount (LKR)</th>
                  <th>Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="inv-log-empty-cell">
                      No logs yet — click <strong>+ Add Log</strong> to get started.
                    </td>
                  </tr>
                ) : (
                  paginated.map((log, i) => (
                    <tr key={log._id}>
                      <td className="inv-log-num">{(safePage - 1) * rowsPerPage + i + 1}</td>
                      <td className="inv-log-date">{formatDate(log.date)}</td>
                      <td className="inv-log-amount">{formatLKRFull(log.amount)}</td>
                      <td className="inv-log-note">{log.note || <span className="text-muted">—</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            title="Edit"
                            onClick={() => setLogForm(log)}
                          >✏</button>
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            title="Delete"
                            onClick={() => handleDelete(log)}
                          >✕</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {logs.length > 0 && (
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={2} style={{ textAlign: 'center' }}>Total</td>
                    <td style={{ fontWeight: 700, textAlign: 'right' }}>{formatLKRFull(total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {logs.length > 0 && (
            <div className="transaction-pagination">
              <div className="pagination-rows-select">
                <span>Rows per page:</span>
                <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="pagination-controls">
                <span className="pagination-range">
                  {(safePage - 1) * rowsPerPage + 1}–{Math.min(safePage * rowsPerPage, logs.length)} of {logs.length}
                </span>
                <button className="btn btn-ghost btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
                <button className="btn btn-ghost btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="totals-strip" style={{ marginTop: 16 }}>
              {[
                { label: 'Total Entries',    value: String(logs.length),     cls: '' },
                { label: 'Total Invested',   value: formatLKRFull(total),    cls: '' },
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
          )}
        </>
      )}
    </div>
  );
}
