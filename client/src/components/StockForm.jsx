import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { addStock, updateStock } from '../api/crud';

const EMPTY = {
  symbol: '', company: '', sector: '', currentPrice: '',
  quantity: '', avgBuyPrice: '', logo: '',
  marketCap: '', eps: '', nav: '', peRatio: '', pbv: '',
  dividendPerShare: '', dividendYield: '', roe: '', issuedQuantity: '',
};

function toNum(v) { const n = parseFloat(v); return isNaN(n) ? undefined : n; }

export default function StockForm({ stock, onClose }) {
  const isEdit = Boolean(stock);
  const qc = useQueryClient();

  const [form, setForm] = useState(isEdit ? {
    symbol:          stock.symbol          ?? '',
    company:         stock.company         ?? '',
    sector:          stock.sector          ?? '',
    currentPrice:    stock.currentPrice    ?? '',
    quantity:        stock.quantity        ?? '',
    avgBuyPrice:     stock.avgBuyPrice     ?? '',
    logo:            stock.logo            ?? '',
    marketCap:       stock.marketCap       ?? '',
    eps:             stock.eps             ?? '',
    nav:             stock.nav             ?? '',
    peRatio:         stock.peRatio         ?? '',
    pbv:             stock.pbv             ?? '',
    dividendPerShare:stock.dividendPerShare ?? '',
    dividendYield:   stock.dividendYield   ?? '',
    roe:             stock.roe             ?? '',
    issuedQuantity:  stock.issuedQuantity  ?? '',
  } : EMPTY);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        symbol:       form.symbol.toUpperCase().trim(),
        company:      form.company.trim(),
        sector:       form.sector.trim(),
        currentPrice: parseFloat(form.currentPrice),
        quantity:     toNum(form.quantity),
        avgBuyPrice:  toNum(form.avgBuyPrice),
        logo:         form.logo.trim() || undefined,
        // optional fundamentals — only include if filled in
        ...(form.marketCap        !== '' && { marketCap:        toNum(form.marketCap) }),
        ...(form.eps              !== '' && { eps:              toNum(form.eps) }),
        ...(form.nav              !== '' && { nav:              toNum(form.nav) }),
        ...(form.peRatio          !== '' && { peRatio:          toNum(form.peRatio) }),
        ...(form.pbv              !== '' && { pbv:              toNum(form.pbv) }),
        ...(form.dividendPerShare !== '' && { dividendPerShare: toNum(form.dividendPerShare) }),
        ...(form.dividendYield    !== '' && { dividendYield:    toNum(form.dividendYield) }),
        ...(form.roe              !== '' && { roe:              toNum(form.roe) }),
        ...(form.issuedQuantity   !== '' && { issuedQuantity:   toNum(form.issuedQuantity) }),
      };
      if (isEdit) await updateStock(stock.symbol, payload);
      else        await addStock(payload);
      await qc.invalidateQueries({ queryKey: ['portfolio'] });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${stock.symbol}` : 'Add Stock'} onClose={onClose}>
      <form className="pip-form" onSubmit={handleSubmit}>
        <div className="form-section-label">Core Details</div>
        <div className="form-row">
          <div className="form-group">
            <label>Symbol *</label>
            <input required value={form.symbol} onChange={e => set('symbol', e.target.value)}
              placeholder="e.g. HNB.X" disabled={isEdit} />
          </div>
          <div className="form-group">
            <label>Current Price (LKR) *</label>
            <input required type="number" step="0.01" min="0" value={form.currentPrice}
              onChange={e => set('currentPrice', e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div className="form-group">
          <label>Company Name *</label>
          <input required value={form.company} onChange={e => set('company', e.target.value)}
            placeholder="e.g. Hatton National Bank PLC" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sector</label>
            <input value={form.sector} onChange={e => set('sector', e.target.value)}
              placeholder="e.g. Banks" />
          </div>
          <div className="form-group">
            <label>Logo URL</label>
            <input value={form.logo} onChange={e => set('logo', e.target.value)}
              placeholder="https://…" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quantity (fallback)</label>
            <input type="number" step="1" min="0" value={form.quantity}
              onChange={e => set('quantity', e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Avg Buy Price (fallback)</label>
            <input type="number" step="0.0001" min="0" value={form.avgBuyPrice}
              onChange={e => set('avgBuyPrice', e.target.value)} placeholder="0.0000" />
          </div>
        </div>

        <div className="form-section-label" style={{ marginTop: 12 }}>Fundamentals (optional)</div>
        <div className="form-row">
          <div className="form-group">
            <label>Market Cap (LKR)</label>
            <input type="number" step="1" min="0" value={form.marketCap}
              onChange={e => set('marketCap', e.target.value)} placeholder="—" />
          </div>
          <div className="form-group">
            <label>Issued Quantity</label>
            <input type="number" step="1" min="0" value={form.issuedQuantity}
              onChange={e => set('issuedQuantity', e.target.value)} placeholder="—" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>EPS (LKR)</label>
            <input type="number" step="0.01" value={form.eps} onChange={e => set('eps', e.target.value)} placeholder="—" /></div>
          <div className="form-group"><label>NAV (LKR)</label>
            <input type="number" step="0.01" value={form.nav} onChange={e => set('nav', e.target.value)} placeholder="—" /></div>
          <div className="form-group"><label>P/E Ratio</label>
            <input type="number" step="0.01" value={form.peRatio} onChange={e => set('peRatio', e.target.value)} placeholder="—" /></div>
          <div className="form-group"><label>PBV</label>
            <input type="number" step="0.01" value={form.pbv} onChange={e => set('pbv', e.target.value)} placeholder="—" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Dividend / Share</label>
            <input type="number" step="0.01" value={form.dividendPerShare} onChange={e => set('dividendPerShare', e.target.value)} placeholder="—" /></div>
          <div className="form-group"><label>Dividend Yield (%)</label>
            <input type="number" step="0.01" value={form.dividendYield} onChange={e => set('dividendYield', e.target.value)} placeholder="—" /></div>
          <div className="form-group"><label>ROE (%)</label>
            <input type="number" step="0.01" value={form.roe} onChange={e => set('roe', e.target.value)} placeholder="—" /></div>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
