import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtPreview(n) {
  if (n == null || isNaN(n)) return '—';
  return `Rs. ${Math.abs(Number(n)).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DividendModal({ initial, onSave, onClose, knownSymbols }) {
  const isEdit = !!initial._id;

  const [date,     setDate]     = useState(initial.date     || todayISO());
  const [symbol,   setSymbol]   = useState(initial.symbol   || '');
  const [shares,   setShares]   = useState(initial.shares   != null ? String(initial.shares)   : '');
  const [perShare, setPerShare] = useState(initial.perShare != null ? String(initial.perShare) : '');
  const [taxRate,  setTaxRate]  = useState(initial.taxRate  != null ? String(initial.taxRate)  : '15');
  const [amount,   setAmount]   = useState(initial.amount   != null ? String(initial.amount)   : '');
  const [amountManual, setAmountManual] = useState(isEdit);
  const [error, setError] = useState('');
  const symRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => symRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // auto-calculate: net = shares × perShare × (1 − taxRate/100)
  const sharesN   = parseFloat(shares);
  const perShareN = parseFloat(perShare);
  const taxN      = parseFloat(taxRate) || 0;
  const grossNum  = !isNaN(sharesN) && !isNaN(perShareN) ? sharesN * perShareN : null;
  const taxNum    = grossNum != null ? grossNum * (taxN / 100) : null;
  const netNum    = grossNum != null ? grossNum - taxNum       : null;

  useEffect(() => {
    if (amountManual) return;
    if (netNum != null) setAmount(netNum.toFixed(2));
  }, [shares, perShare, taxRate, amountManual]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!symbol.trim())                        return setError('Enter a stock symbol.');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0)                return setError('Enter a dividend amount greater than zero.');
    if (!date)                                 return setError('Pick the date you received it.');

    onSave({
      date,
      symbol:   symbol.trim().toUpperCase(),
      shares:   shares   === '' ? null : parseFloat(shares),
      perShare: perShare === '' ? null : parseFloat(perShare),
      taxRate:  taxRate  === '' ? 0    : parseFloat(taxRate),
      amount:   amt,
    });
  }

  return (
    <Modal title={isEdit ? 'Edit dividend' : 'Log a dividend'} onClose={onClose}>
      <form className="pip-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Stock symbol</label>
          <input
            ref={symRef}
            list="dl-sym-list"
            value={symbol}
            placeholder="e.g. JKH.N0000"
            onChange={e => { setSymbol(e.target.value.toUpperCase()); setError(''); }}
            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
          />
          <datalist id="dl-sym-list">
            {knownSymbols.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Shares held</label>
            <input
              type="number" step="any" value={shares} placeholder="0"
              onChange={e => { setShares(e.target.value); setError(''); }}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <div className="form-group">
            <label>Per share (Rs.)</label>
            <input
              type="number" step="any" value={perShare} placeholder="0.00"
              onChange={e => { setPerShare(e.target.value); setError(''); }}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date received</label>
            <input
              type="date" value={date}
              onChange={e => { setDate(e.target.value); setError(''); }}
            />
          </div>
          <div className="form-group">
            <label>Income tax (%)</label>
            <input
              type="number" step="any" value={taxRate} placeholder="15"
              onChange={e => { setTaxRate(e.target.value); setAmountManual(false); setError(''); }}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span>Net amount received (Rs.)</span>
            {!amountManual && netNum != null && (
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.73rem' }}>auto</span>
            )}
          </label>
          <input
            type="number" step="any" value={amount} placeholder="0.00"
            onChange={e => { setAmount(e.target.value); setAmountManual(true); setError(''); }}
            style={{
              fontFamily: 'monospace', fontWeight: 600, fontSize: '1rem',
              borderColor: amountManual ? 'var(--accent)' : undefined,
            }}
          />
        </div>

        {/* Gross / Tax / Net preview row */}
        {grossNum != null && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.82rem',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Gross{' '}
              <b style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{fmtPreview(grossNum)}</b>
            </span>
            <span style={{ color: 'var(--loss)' }}>
              − {taxN}% tax{' '}
              <b style={{ fontFamily: 'monospace' }}>{fmtPreview(taxNum)}</b>
            </span>
            <span style={{ color: 'var(--gain)', fontWeight: 600 }}>
              ={' '}
              <span style={{ fontFamily: 'monospace' }}>{fmtPreview(netNum)}</span>
            </span>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Save changes' : 'Add dividend'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
