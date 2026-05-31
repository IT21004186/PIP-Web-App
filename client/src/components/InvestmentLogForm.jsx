import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { addInvestmentLog, updateInvestmentLog } from '../api/crud';

function toInputDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function InvestmentLogForm({ log, onClose }) {
  const isEdit = Boolean(log);
  const qc = useQueryClient();

  const [form, setForm] = useState({
    date:   isEdit ? toInputDate(log.date) : '',
    amount: isEdit ? String(log.amount)    : '',
    note:   isEdit ? (log.note || '')      : '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.date)   return setError('Date is required.');
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return setError('Enter a valid amount greater than 0.');

    const payload = {
      date:   form.date,
      amount: Number(form.amount),
      note:   form.note.trim(),
    };

    setLoading(true);
    try {
      if (isEdit) await updateInvestmentLog(log._id, payload);
      else        await addInvestmentLog(payload);
      await qc.invalidateQueries({ queryKey: ['investmentLogs'] });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Investment Log' : 'Add Investment Log'} onClose={onClose}>
      <form className="pip-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Amount (LKR)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 21000"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Note <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text"
            placeholder="e.g. Top-up for TKYO.X purchase"
            value={form.note}
            onChange={e => set('note', e.target.value)}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Update Log' : 'Add Log'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
