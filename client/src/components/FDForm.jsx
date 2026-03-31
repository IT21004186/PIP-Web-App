import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { addFD, updateFD } from '../api/crud';

function toDateInput(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

const EMPTY = {
  bank: '', accountNumber: '', principal: '', interestRate: '',
  startDate: '', maturityDate: '', color: '#3b82f6', logo: '',
};

export default function FDForm({ fd, onClose }) {
  const isEdit = Boolean(fd);
  const qc = useQueryClient();

  const [form, setForm] = useState(isEdit ? {
    bank:          fd.bank          ?? '',
    accountNumber: fd.accountNumber ?? '',
    principal:     fd.principal     ?? '',
    interestRate:  fd.interestRate  ?? '',
    startDate:     toDateInput(fd.startDate),
    maturityDate:  toDateInput(fd.maturityDate),
    color:         fd.color         ?? '#3b82f6',
    logo:          fd.logo          ?? '',
  } : EMPTY);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  // Preview computed tenor & interest
  const tenor = (form.startDate && form.maturityDate)
    ? Math.round((new Date(form.maturityDate) - new Date(form.startDate)) / 86400000)
    : null;
  const interest = (tenor && form.principal && form.interestRate)
    ? (parseFloat(form.principal) * (parseFloat(form.interestRate) / 100) * (tenor / 365))
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        bank:          form.bank.trim(),
        accountNumber: form.accountNumber.trim(),
        principal:     parseFloat(form.principal),
        interestRate:  parseFloat(form.interestRate),
        startDate:     form.startDate,
        maturityDate:  form.maturityDate,
        color:         form.color,
        logo:          form.logo.trim() || undefined,
      };
      if (isEdit) await updateFD(fd._id, payload);
      else        await addFD(payload);
      await qc.invalidateQueries({ queryKey: ['portfolio'] });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit FD — ${fd.accountNumber}` : 'Add Fixed Deposit'} onClose={onClose}>
      <form className="pip-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Bank *</label>
            <input required value={form.bank} onChange={e => set('bank', e.target.value)}
              placeholder="e.g. LB Finance PLC" />
          </div>
          <div className="form-group">
            <label>Account Number *</label>
            <input required value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)}
              placeholder="e.g. 1234-5678-9012" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Principal (LKR) *</label>
            <input required type="number" step="0.01" min="1" value={form.principal}
              onChange={e => set('principal', e.target.value)} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label>Interest Rate (% p.a.) *</label>
            <input required type="number" step="0.01" min="0.01" max="100" value={form.interestRate}
              onChange={e => set('interestRate', e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date *</label>
            <input required type="date" value={form.startDate}
              onChange={e => set('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Maturity Date *</label>
            <input required type="date" value={form.maturityDate}
              onChange={e => set('maturityDate', e.target.value)} />
          </div>
        </div>

        {(tenor !== null) && (
          <div className="form-calc-preview">
            <span className="form-calc-label">Tenor</span>
            <span className="form-calc-value">{tenor} days</span>
            {interest !== null && <>
              <span className="form-calc-label" style={{ marginLeft: 24 }}>Est. Interest</span>
              <span className="form-calc-value text-gain">
                +LKR {interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </>}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Logo URL</label>
            <input value={form.logo} onChange={e => set('logo', e.target.value)}
              placeholder="https://…" />
          </div>
          <div className="form-group" style={{ maxWidth: 100 }}>
            <label>Color</label>
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
              style={{ height: 38, padding: 2, cursor: 'pointer' }} />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Fixed Deposit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
