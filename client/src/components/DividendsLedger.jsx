import { useState, Fragment } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDividends } from '../hooks/useDividends';
import { addDividend, updateDividend, deleteDividend } from '../api/crud';
import { formatLKR, formatLKRFull } from '../utils/formatters';
import DividendModal from './DividendModal';

// ── Constants ─────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
// Harmonious oklch palette — same chroma/lightness, varied hue (ported from design)
const SYM_HUES = [158, 292, 240, 80, 24, 200, 330, 120, 50, 270, 180, 10];

// ── Date helpers ──────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function prettyDate(iso) {
  const d = parseISO(iso);
  return `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Formatting ────────────────────────────────────────────

function fmtNum(n, decimals = 2) {
  return (Number(n) || 0).toLocaleString('en-LK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── Color ─────────────────────────────────────────────────

function symColor(index) {
  return `oklch(0.74 0.135 ${SYM_HUES[index % SYM_HUES.length]})`;
}

// ── Data aggregation ──────────────────────────────────────

function byDay(items) {
  const m = {};
  for (const it of items) (m[it.date] ||= []).push(it);
  return m;
}

function dayTotal(list) {
  return (list || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
}

function bySymbol(items) {
  const m = {};
  for (const it of items) m[it.symbol] = (m[it.symbol] || 0) + (Number(it.amount) || 0);
  return Object.entries(m).map(([symbol, total]) => ({ symbol, total })).sort((a, b) => b.total - a.total);
}

function byYear(items) {
  const m = {};
  for (const it of items) {
    const y = it.date.slice(0, 4);
    m[y] = (m[y] || 0) + (Number(it.amount) || 0);
  }
  return Object.entries(m).map(([year, total]) => ({ year, total })).sort((a, b) => a.year.localeCompare(b.year));
}

function calcSummary(items) {
  const total      = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  const grossTotal = items.reduce((s, it) => {
    const r = it.taxRate != null ? it.taxRate : 15;
    const g = r < 100 ? (Number(it.amount) || 0) / (1 - r / 100) : (Number(it.amount) || 0);
    return s + g;
  }, 0);
  const taxTotal   = grossTotal - total;
  const months     = new Set(items.map(it => it.date.slice(0, 7)));
  const avgMonth   = months.size ? total / months.size : 0;
  const topSym     = bySymbol(items)[0] || null;
  return {
    total, taxTotal,
    symbolCount: new Set(items.map(it => it.symbol)).size,
    avgMonth, topSymbol: topSym, monthCount: months.size,
  };
}

// Back-calculates gross when shares/perShare not available
function grossOf(it) {
  if (it.shares != null && it.perShare != null) return it.shares * it.perShare;
  const r = it.taxRate != null ? it.taxRate : 15;
  return r < 100 ? it.amount / (1 - r / 100) : it.amount;
}

// ── StatCards ─────────────────────────────────────────────

function StatCards({ s }) {
  return (
    <div className="dl-stats">
      <div className="dl-stat">
        <div className="dl-stat-label">Total Received</div>
        <div className="dl-stat-value accent">{formatLKRFull(s.total)}</div>
        <div className="dl-stat-sub">
          {s.taxTotal > 0.005
            ? <span>net of <b>{formatLKRFull(s.taxTotal)}</b> tax</span>
            : s.monthCount
              ? <span><b>{s.monthCount}</b> active month{s.monthCount !== 1 ? 's' : ''}</span>
              : 'all time'}
        </div>
      </div>
      <div className="dl-stat">
        <div className="dl-stat-label">Average / Month</div>
        <div className="dl-stat-value">{formatLKRFull(s.avgMonth)}</div>
        <div className="dl-stat-sub">across active months</div>
      </div>
      <div className="dl-stat">
        <div className="dl-stat-label">Paying Symbols</div>
        <div className="dl-stat-value">{s.symbolCount}</div>
        <div className="dl-stat-sub">{s.symbolCount ? 'in your ledger' : 'none yet'}</div>
      </div>
      <div className="dl-stat">
        <div className="dl-stat-label">Top Symbol</div>
        <div className="dl-stat-value" style={{ fontSize: s.topSymbol ? '1.3rem' : undefined }}>
          {s.topSymbol ? s.topSymbol.symbol : '—'}
        </div>
        <div className="dl-stat-sub">
          {s.topSymbol
            ? <span><b>{formatLKRFull(s.topSymbol.total)}</b> received</span>
            : 'no data'}
        </div>
      </div>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────

function DivCalendar({ viewDate, setViewDate, selected, setSelected, dayMap }) {
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayISO();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const go = (delta) => setViewDate(new Date(year, month + delta, 1));

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  let monthTotal = 0, monthCount = 0;
  Object.entries(dayMap).forEach(([iso, list]) => {
    if (iso.startsWith(monthPrefix)) { monthTotal += dayTotal(list); monthCount += list.length; }
  });

  return (
    <div className="dl-panel">
      <div className="dl-panel-head">
        <div className="dl-panel-title">Monthly Calendar</div>
        <div className="dl-panel-sub">Click a day to view &amp; log its dividends</div>
      </div>

      <div className="dl-cal-nav">
        <button onClick={() => go(-1)}>‹</button>
        <span className="dl-cal-month">{MONTHS[month]} {year}</span>
        <button onClick={() => go(1)}>›</button>
      </div>

      <div className="dl-cal-grid">
        {DOW.map(d => <div key={d} className="dl-cal-dow">{d}</div>)}
        {cells.map((d, i) => {
          if (d == null) return <div key={i} className="dl-cal-cell empty" />;
          const iso  = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const list = dayMap[iso] || [];
          const tot  = dayTotal(list);
          const cls  = ['dl-cal-cell'];
          if (tot > 0)       cls.push('has-data');
          if (iso === today) cls.push('today');
          if (iso === selected) cls.push('selected');
          return (
            <div key={i} className={cls.join(' ')} onClick={() => setSelected(iso)}>
              <span className="dl-cal-num">{d}</span>
              {list.length > 1 && <span className="dl-cal-cnt">{list.length}×</span>}
              {tot > 0 && <span className="dl-cal-amt">{formatLKR(tot)}</span>}
            </div>
          );
        })}
      </div>

      <div className="dl-cal-footer">
        <span>{monthCount} payment{monthCount !== 1 ? 's' : ''} this month</span>
        <span style={{
          color: monthTotal > 0 ? 'var(--gain)' : 'var(--text-muted)',
          fontWeight: 600, fontFamily: 'monospace',
        }}>
          {formatLKRFull(monthTotal)}
        </span>
      </div>
    </div>
  );
}

// ── Day Panel ─────────────────────────────────────────────

function DayPanel({ selected, items, onAdd, onEdit, onDelete, symIndex }) {
  const list     = items.filter(it => it.date === selected).sort((a, b) => a.symbol.localeCompare(b.symbol));
  const tot      = dayTotal(list);
  const totGross = list.reduce((s, it) => s + grossOf(it), 0);
  const totTax   = totGross - tot;

  return (
    <div className="dl-panel">
      <div className="dl-day-head">
        <div>
          <div className="dl-day-title">Dividends on {prettyDate(selected)}</div>
          <div className="dl-day-sub">{list.length} payment{list.length !== 1 ? 's' : ''} logged</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {tot > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div className="dl-day-total">{formatLKRFull(tot)}</div>
              {totTax > 0.005 && (
                <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  net · <span style={{ fontFamily: 'monospace' }}>{formatLKRFull(totTax)}</span> tax withheld
                </div>
              )}
            </div>
          )}
          <button className="btn btn-primary" onClick={onAdd}>+ Add</button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="dl-empty">
          <div className="dl-empty-icon">+</div>
          <div className="dl-empty-title">No dividends on this day</div>
          <div className="dl-empty-sub">
            Pick another day on the calendar, or log a payment received on {prettyDate(selected)}.
          </div>
          <button className="btn btn-primary" onClick={onAdd} style={{ margin: '0 auto' }}>
            + Log a dividend
          </button>
        </div>
      ) : (
        <table className="dl-tbl">
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="r">Shares</th>
              <th className="r">Per share</th>
              <th className="r">Gross</th>
              <th className="r">Tax</th>
              <th className="r">Net</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(it => {
              const rate  = it.taxRate != null ? it.taxRate : 15;
              const gross = grossOf(it);
              const tax   = gross - it.amount;
              return (
                <tr className="dl-tbl-row" key={it._id}>
                  <td>
                    <span className="dl-sym-badge">
                      <span className="dl-sym-swatch"
                        style={{ background: symColor(symIndex[it.symbol] ?? 0) }} />
                      {it.symbol}
                    </span>
                  </td>
                  <td className="r dl-cell-muted">{it.shares   != null ? fmtNum(it.shares, 0)   : '—'}</td>
                  <td className="r dl-cell-muted">{it.perShare != null ? fmtNum(it.perShare, 2) : '—'}</td>
                  <td className="r dl-cell-muted">{fmtNum(gross, 2)}</td>
                  <td className="r dl-cell-loss" title={`${rate}% withholding`}>
                    {tax > 0.005 ? `−${fmtNum(tax, 2)}` : '—'}
                  </td>
                  <td className="r dl-amt-pos">{formatLKRFull(it.amount)}</td>
                  <td className="r">
                    <div className="dl-row-actions">
                      <button className="btn btn-ghost btn-icon" title="Edit"   onClick={() => onEdit(it)}>✏</button>
                      <button className="btn btn-danger btn-icon" title="Delete" onClick={() => onDelete(it)}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Donut chart (By Symbol) ───────────────────────────────

function DividendPieChart({ data }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.total, 0);

  if (!total) return (
    <div className="dl-chart-empty">Log dividends to see your symbol breakdown.</div>
  );

  const R = 78, CX = 90, CY = 90, INNER = 46;
  let acc = 0;
  const segs = data.map((d, i) => {
    const frac = d.total / total;
    const a0 = acc * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const a1 = acc * 2 * Math.PI - Math.PI / 2;
    const big = frac > 0.5 ? 1 : 0;
    const cos0 = Math.cos(a0), sin0 = Math.sin(a0);
    const cos1 = Math.cos(a1), sin1 = Math.sin(a1);
    const path = [
      `M ${CX + R * cos0} ${CY + R * sin0}`,
      `A ${R} ${R} 0 ${big} 1 ${CX + R * cos1} ${CY + R * sin1}`,
      `L ${CX + INNER * cos1} ${CY + INNER * sin1}`,
      `A ${INNER} ${INNER} 0 ${big} 0 ${CX + INNER * cos0} ${CY + INNER * sin0}`,
      'Z',
    ].join(' ');
    return { ...d, path, color: symColor(i), frac, i };
  });

  const active = hover != null ? segs[hover] : null;

  return (
    <div className="dl-pie-wrap">
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ flex: 'none' }}>
        {segs.map(s => (
          <path key={s.symbol} d={s.path} fill={s.color}
            stroke="var(--bg-card)" strokeWidth="2"
            opacity={hover == null || hover === s.i ? 1 : 0.3}
            style={{
              transition: 'opacity .15s, transform .15s', cursor: 'pointer',
              transformOrigin: '90px 90px',
              transform: hover === s.i ? 'scale(1.04)' : 'none',
            }}
            onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(null)} />
        ))}
        <g style={{ pointerEvents: 'none' }}>
          <text x="90" y="84" textAnchor="middle" fontSize="9" fill="var(--text-muted)"
            style={{ letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            {active ? active.symbol : 'TOTAL'}
          </text>
          <text x="90" y="102" textAnchor="middle" fontSize="13" fontWeight="600"
            fill="var(--text-primary)" style={{ fontFamily: 'monospace' }}>
            {active ? `${Math.round(active.frac * 100)}%` : formatLKR(total)}
          </text>
        </g>
      </svg>

      <div className="dl-legend">
        {segs.map(s => (
          <div className="dl-legend-row" key={s.symbol}
            onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(null)}
            style={{ opacity: hover == null || hover === s.i ? 1 : 0.4 }}>
            <span className="dl-legend-sw" style={{ background: s.color }} />
            <span className="dl-legend-sym">{s.symbol}</span>
            <span className="dl-legend-pct">{Math.round(s.frac * 100)}%</span>
            <span className="dl-legend-amt">{formatLKRFull(s.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar chart (By Year) ───────────────────────────────────

function DividendBarChart({ data }) {
  const [hover, setHover] = useState(null);

  if (!data.length) return (
    <div className="dl-chart-empty">Log dividends to see yearly totals.</div>
  );

  const W      = 100 / data.length;
  const max    = Math.max(...data.map(d => d.total)) || 1;
  const H      = 168, PAD_TOP = 20, PAD_BOT = 28;
  const plotH  = H - PAD_TOP - PAD_BOT;

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" height={H} viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(g => (
          <line key={g} x1="0" x2="100"
            y1={PAD_TOP + plotH * (1 - g)} y2={PAD_TOP + plotH * (1 - g)}
            stroke="var(--border)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        ))}
        {data.map((d, i) => {
          const h  = (d.total / max) * plotH;
          const bw = W * 0.5;
          const x  = i * W + (W - bw) / 2;
          const y  = PAD_TOP + plotH - h;
          return (
            <rect key={d.year} x={x} y={y} width={bw} height={Math.max(h, 0)}
              rx={Math.min(2, bw / 2)}
              fill="var(--gain)"
              opacity={hover == null || hover === i ? 1 : 0.35}
              vectorEffect="non-scaling-stroke"
              style={{ transition: 'opacity .15s', cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          );
        })}
      </svg>

      {/* HTML overlay: value labels above bars + year labels at bottom */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {data.map((d, i) => {
          const h = (d.total / max) * plotH;
          const y = PAD_TOP + plotH - h;
          return (
            <Fragment key={d.year}>
              <div style={{
                position: 'absolute', left: `${i * W}%`, width: `${W}%`, top: y - 16,
                textAlign: 'center', fontSize: 10.5, fontWeight: 600,
                color: hover === i ? 'var(--gain)' : 'var(--text-muted)',
                fontFamily: 'monospace', transition: '.15s',
              }}>
                {formatLKR(d.total)}
              </div>
              <div style={{
                position: 'absolute', left: `${i * W}%`, width: `${W}%`, bottom: 3,
                textAlign: 'center', fontSize: 11.5, color: 'var(--text-muted)',
                fontFamily: 'monospace',
              }}>
                {d.year}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function DividendsLedger() {
  const { data: items = [], isLoading, error } = useDividends();
  const qc = useQueryClient();

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayISO);
  const [modal,    setModal]    = useState(null); // null | { mode:'add'|'edit', record }

  const dayMap   = byDay(items);
  const summary  = calcSummary(items);
  const symData  = bySymbol(items);
  const yearData = byYear(items);
  const knownSymbols = [...new Set(items.map(it => it.symbol))];

  // stable symbol → index mapping (by total desc, matches chart colors)
  const symIndex = {};
  symData.forEach((s, i) => { symIndex[s.symbol] = i; });

  async function handleSave(payload) {
    try {
      if (modal.mode === 'edit') await updateDividend(modal.record._id, payload);
      else                        await addDividend(payload);
      await qc.invalidateQueries({ queryKey: ['dividends'] });
      setSelected(payload.date);
      setViewDate(new Date(
        parseInt(payload.date.slice(0, 4), 10),
        parseInt(payload.date.slice(5, 7), 10) - 1,
        1,
      ));
      setModal(null);
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(it) {
    if (!window.confirm(
      `Delete dividend from ${it.symbol} on ${prettyDate(it.date)}? This cannot be undone.`
    )) return;
    try {
      await deleteDividend(it._id);
      await qc.invalidateQueries({ queryKey: ['dividends'] });
    } catch (err) { alert(err.message); }
  }

  if (isLoading) return (
    <div className="page-wrapper">
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
    </div>
  );
  if (error) return (
    <div className="page-wrapper">
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--loss)' }}>
        Failed to load: {error.message}
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Dividend Income
        </h2>
        <span style={{
          fontSize: '0.73rem', color: 'var(--text-muted)',
          border: '1px solid var(--border)', padding: '4px 10px',
          borderRadius: 7, letterSpacing: '0.02em',
        }}>
          CSE · LKR
        </span>
      </div>

      <StatCards s={summary} />

      <div className="dl-main-grid">
        <DivCalendar
          viewDate={viewDate} setViewDate={setViewDate}
          selected={selected} setSelected={setSelected}
          dayMap={dayMap}
        />
        <DayPanel
          selected={selected} items={items}
          onAdd={() => setModal({ mode: 'add',  record: { date: selected } })}
          onEdit={rec => setModal({ mode: 'edit', record: rec })}
          onDelete={handleDelete}
          symIndex={symIndex}
        />
      </div>

      <div className="dl-charts">
        <div className="dl-panel">
          <div className="dl-panel-head">
            <div className="dl-panel-title">By Symbol</div>
            <div className="dl-panel-sub">Share of total dividends received</div>
          </div>
          <div className="dl-chart-body">
            <DividendPieChart data={symData} />
          </div>
        </div>
        <div className="dl-panel">
          <div className="dl-panel-head">
            <div className="dl-panel-title">By Year</div>
            <div className="dl-panel-sub">Total dividends received per year</div>
          </div>
          <div className="dl-chart-body">
            <DividendBarChart data={yearData} />
          </div>
        </div>
      </div>

      {modal && (
        <DividendModal
          initial={modal.record}
          knownSymbols={knownSymbols}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

    </div>
  );
}
