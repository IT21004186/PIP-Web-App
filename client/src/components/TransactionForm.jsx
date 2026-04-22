import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { addTransaction, updateTransaction } from '../api/crud';

function toDateInput(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function TransactionForm({ symbol, tx, onClose }) {
  const isEdit = Boolean(tx);
  const qc = useQueryClient();

  const [form, setForm] = useState({
    tradeDate:   isEdit ? toDateInput(tx.tradeDate) : '',
    shares:      isEdit ? tx.shares      : '',
    avgPrice:    isEdit ? tx.avgPrice    : '',
    status:      isEdit ? tx.status      : 'BUY',
  });

  const isScrip = form.status === 'SCRIP';

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  const gross = isScrip
    ? '0.00'
    : (form.shares && form.avgPrice
        ? (parseFloat(form.shares) * parseFloat(form.avgPrice)).toFixed(2)
        : '—');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        tradeDate: form.tradeDate,
        shares:    parseFloat(form.shares),
        avgPrice:  isScrip ? 0 : parseFloat(form.avgPrice),
        status:    form.status,
      };
      if (isEdit) await updateTransaction(symbol, tx._id, payload);
      else        await addTransaction(symbol, payload);
      await qc.invalidateQueries({ queryKey: ['portfolio'] });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Transaction' : `Add Transaction — ${symbol}`} onClose={onClose}>
      <form className="pip-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Trade Date *</label>
            <input required type="date" value={form.tradeDate}
              onChange={e => set('tradeDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Type *</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="SCRIP">SCRIP DIVIDEND</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>No. of Shares *</label>
            <input required type="number" step="1" min="1" value={form.shares}
              onChange={e => set('shares', e.target.value)} placeholder="0" />
          </div>
          {!isScrip && (
            <div className="form-group">
              <label>Avg Price (LKR) *</label>
              <input required type="number" step="0.0001" min="0.0001" value={form.avgPrice}
                onChange={e => set('avgPrice', e.target.value)} placeholder="0.0000" />
            </div>
          )}
        </div>

        {isScrip && (
          <p style={{ margin: '4px 0 8px', fontSize: '0.82rem', color: 'var(--text-muted, #888)' }}>
            Scrip shares are received at no cost — no price or commission applies.
          </p>
        )}

        <div className="form-calc-preview">
          <span className="form-calc-label">Gross Amount</span>
          <span className="form-calc-value">
            {gross === '—' ? '—' : `LKR ${parseFloat(gross).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </span>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
