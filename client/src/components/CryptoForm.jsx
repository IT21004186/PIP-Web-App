import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { addCrypto, updateCrypto } from '../api/crud';

const EMPTY = {
  symbol: '', name: '', quantity: '', avgBuyPrice: '',
  currentPrice: '', color: '#3b82f6', logo: '',
};

export default function CryptoForm({ asset, onClose }) {
  const isEdit = Boolean(asset);
  const qc = useQueryClient();

  const [form, setForm] = useState(isEdit ? {
    symbol:       asset.symbol       ?? '',
    name:         asset.name         ?? '',
    quantity:     asset.quantity     ?? '',
    avgBuyPrice:  asset.avgBuyPrice  ?? '',
    currentPrice: asset.currentPrice ?? '',
    color:        asset.color        ?? '#3b82f6',
    logo:         asset.logo         ?? '',
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
        name:         form.name.trim(),
        quantity:     parseFloat(form.quantity),
        avgBuyPrice:  parseFloat(form.avgBuyPrice),
        currentPrice: parseFloat(form.currentPrice),
        color:        form.color,
        logo:         form.logo.trim() || undefined,
      };
      if (isEdit) await updateCrypto(asset.symbol, payload);
      else        await addCrypto(payload);
      await qc.invalidateQueries({ queryKey: ['portfolio'] });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${asset.symbol}` : 'Add Crypto Asset'} onClose={onClose}>
      <form className="pip-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Symbol *</label>
            <input required value={form.symbol} onChange={e => set('symbol', e.target.value)}
              placeholder="e.g. SOL" disabled={isEdit} />
          </div>
          <div className="form-group">
            <label>Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Solana" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Quantity *</label>
            <input required type="number" step="0.0001" min="0" value={form.quantity}
              onChange={e => set('quantity', e.target.value)} placeholder="0.0000" />
          </div>
          <div className="form-group">
            <label>Avg Buy Price (USDT) *</label>
            <input required type="number" step="0.0001" min="0" value={form.avgBuyPrice}
              onChange={e => set('avgBuyPrice', e.target.value)} placeholder="0.0000" />
          </div>
          <div className="form-group">
            <label>Current Price (USDT) *</label>
            <input required type="number" step="0.0001" min="0" value={form.currentPrice}
              onChange={e => set('currentPrice', e.target.value)} placeholder="0.0000" />
          </div>
        </div>

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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Asset'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
