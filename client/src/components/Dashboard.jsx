import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatLKR, formatLKRFull, formatPct } from '../utils/formatters';

export default function Dashboard({ stocks, cryptos, fds, totals }) {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2>Portfolio Dashboard</h2>
          <p>Overview of your Sri Lankan investment portfolio</p>
        </div>
      </div>
      <KPIGrid totals={totals} />
      <ChartsRow totals={totals} />
      <PerformanceTable stocks={stocks} cryptos={cryptos} fds={fds} totals={totals} />
    </div>
  );
}

function KPIIcon({ src, fallback }) {
  if (!src) return <span>{fallback}</span>;
  return (
    <img
      src={src}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      onError={e => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function KPIGrid({ totals }) {
  const plSign  = totals.totalPL >= 0 ? '+' : '';
  const plColorHex = totals.totalPL >= 0 ? '#10b981' : '#ef4444';
  const kpis = [
    {
      label: 'Total Net Worth',
      value: formatLKRFull(totals.totalNetWorth),
      sub: `${formatLKR(totals.fdTotalPrincipal)} invested in FDs`,
      icon: '/Assets/net-worth.png', iconFallback: '💰',
      color: 'var(--accent)', colorHex: '#3b82f6', valueClass: '',
    },
    {
      label: 'Total Unrealized P/L',
      value: `${plSign}${formatLKRFull(totals.totalPL)}`,
      sub: `CDS: ${formatLKR(totals.cdsTotalPL)} · Crypto: ${formatLKR(totals.cryptoTotalPL)}`,
      icon: '/Assets/unrealized-pl.png', iconFallback: '📈',
      color: totals.totalPL >= 0 ? 'var(--gain)' : 'var(--loss)',
      colorHex: plColorHex,
      valueClass: totals.totalPL >= 0 ? 'gain' : 'loss',
    },
    {
      label: 'Best Performer',
      value: totals.bestStock ? totals.bestStock.symbol : '—',
      sub: totals.bestStock ? `${formatPct(totals.bestStock.plPercent)} · ${totals.bestStock.company}` : '',
      icon: '/Assets/best-performer.png', iconFallback: '🏆',
      color: 'var(--gain)', colorHex: '#10b981', valueClass: 'gain',
    },
    {
      label: 'Worst Performer',
      value: totals.worstStock ? totals.worstStock.symbol : '—',
      sub: totals.worstStock ? `${formatPct(totals.worstStock.plPercent)} · ${totals.worstStock.company}` : '',
      icon: '/Assets/worst-performer.png', iconFallback: '📉',
      color: 'var(--loss)', colorHex: '#ef4444',
      valueClass: totals.worstStock && totals.worstStock.plPercent < 0 ? 'loss' : '',
    },
  ];

  return (
    <div className="kpi-grid">
      {kpis.map((kpi, i) => (
        <div key={i} className="kpi-card" style={{ '--kpi-color': kpi.color }}>
          <div className="kpi-top-row">
            <div className="kpi-label">{kpi.label}</div>
            <div
              className="kpi-icon"
              style={{ background: kpi.colorHex + '1a', border: `1px solid ${kpi.colorHex}30` }}
            >
              <KPIIcon src={kpi.icon} fallback={kpi.iconFallback} />
            </div>
          </div>
          <div className={`kpi-value ${kpi.valueClass}`}>{kpi.value}</div>
          <div className="kpi-sub">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
}

function ChartsRow({ totals }) {
  return (
    <div className="charts-row">
      <AssetAllocationChart totals={totals} />
      <SectorAllocationChart totals={totals} />
    </div>
  );
}

function AssetAllocationChart({ totals }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const { assetAllocation } = totals;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: assetAllocation.map(a => a.label),
        datasets: [{
          data: assetAllocation.map(a => a.value),
          backgroundColor: assetAllocation.map(a => a.color),
          borderColor: '#141928', borderWidth: 3, hoverBorderWidth: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: true, cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatLKRFull(ctx.raw)}  (${totals.assetAllocation[ctx.dataIndex].pct.toFixed(1)}%)`,
            },
            backgroundColor: '#1e2740', borderColor: '#263050', borderWidth: 1,
            titleColor: '#e8edf5', bodyColor: '#8a9bbf', padding: 12,
          },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [totals]);

  return (
    <div className="chart-card">
      <h3>Asset Allocation</h3>
      <div className="chart-container donut-chart-wrapper">
        <canvas ref={canvasRef} height="200" />
        <div className="donut-center-label">
          <div className="donut-center-value">{formatLKR(totals.totalNetWorth)}</div>
          <div className="donut-center-sub">Total</div>
        </div>
      </div>
      <div className="donut-legend">
        {totals.assetAllocation.map((a, i) => (
          <div key={i} className="donut-legend-item">
            <div className="donut-legend-dot" style={{ background: a.color }} />
            <span className="donut-legend-label">{a.label}</span>
            <span className="donut-legend-value">{formatLKR(a.value)}</span>
            <span className="donut-legend-pct">{a.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectorAllocationChart({ totals }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const sectors = [...totals.sectorTotals].filter(s => s.marketValue > 0).sort((a, b) => b.marketValue - a.marketValue);
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: sectors.map(s => s.sector),
        datasets: [{
          label: 'Market Value (LKR)',
          data: sectors.map(s => s.marketValue),
          backgroundColor: sectors.map(s => s.color + 'cc'),
          borderColor: sectors.map(s => s.color),
          borderWidth: 1, borderRadius: 4, borderSkipped: false, minBarLength: 6,
        }],
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatLKRFull(ctx.raw)}`,
              afterLabel: (ctx) => {
                const s = sectors[ctx.dataIndex];
                const pl = s.unrealizedPL >= 0 ? '+' : '';
                return ` P/L: ${pl}${formatLKR(s.unrealizedPL)}  (${s.allocationPct.toFixed(1)}% of CDS)`;
              },
            },
            backgroundColor: '#1e2740', borderColor: '#263050', borderWidth: 1,
            titleColor: '#e8edf5', bodyColor: '#8a9bbf', padding: 12,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#8a9bbf', font: { size: 11 }, callback: (val) => formatLKR(val) },
          },
          y: { grid: { display: false }, ticks: { color: '#8a9bbf', font: { size: 12 } } },
        },
      },
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [totals]);

  return (
    <div className="chart-card">
      <h3>GICS Sector Allocation – CDS</h3>
      <div className="chart-container" style={{ height: 280 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

const PERF_ROW_COLORS = ['#3b82f6', '#9945FF', '#f59e0b'];

function PerformanceTable({ totals }) {
  const rows = [
    {
      asset: 'CDS Account', type: 'Equities', note: 'incl. 1.12% buy commission',
      investedValue: formatLKRFull(totals.cdsTotalCost),
      currentValue:  formatLKRFull(totals.cdsTotalValue),
      netProceeds:   formatLKRFull(totals.cdsTotalNetProceeds),
      pl:     totals.cdsTotalPL,
      plPct:  totals.cdsTotalCost > 0 ? (totals.cdsTotalPL / totals.cdsTotalCost) * 100 : 0,
      alloc:  totals.totalNetWorth > 0 ? (totals.cdsTotalValue / totals.totalNetWorth) * 100 : 0,
    },
    {
      asset: 'Crypto', type: 'Digital Assets', note: '',
      investedValue: formatLKRFull(totals.cryptoTotalCostLKR),
      currentValue:  formatLKRFull(totals.cryptoTotalLKR),
      netProceeds:   '—',
      pl:     totals.cryptoTotalPL,
      plPct:  totals.cryptoTotalCostLKR > 0 ? (totals.cryptoTotalPL / totals.cryptoTotalCostLKR) * 100 : 0,
      alloc:  totals.totalNetWorth > 0 ? (totals.cryptoTotalLKR / totals.totalNetWorth) * 100 : 0,
    },
    {
      asset: 'Fixed Deposits', type: 'Fixed Income', note: '',
      investedValue: formatLKRFull(totals.fdTotalPrincipal),
      currentValue:  formatLKRFull(totals.fdTotalMaturity),
      netProceeds:   '—',
      pl:     totals.fdTotalInterest,
      plPct:  totals.fdTotalPrincipal > 0 ? (totals.fdTotalInterest / totals.fdTotalPrincipal) * 100 : 0,
      alloc:  totals.totalNetWorth > 0 ? (totals.fdTotalMaturity / totals.totalNetWorth) * 100 : 0,
    },
  ];

  return (
    <div className="perf-table-card">
      <h3>Portfolio Performance Summary</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Asset Class</th><th>Type</th><th>True Invested Cost</th>
              <th>Market Value</th><th>Net Proceeds (est.)</th>
              <th>True P/L</th><th>P/L %</th><th>Allocation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="perf-row" style={{ '--row-accent': PERF_ROW_COLORS[i] }}>
                <td>
                  <div style={{ fontWeight: 600 }}>{row.asset}</div>
                  {row.note && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{row.note}</div>}
                </td>
                <td>
                  <span className="perf-type-pill" style={{ background: PERF_ROW_COLORS[i] + '18', color: PERF_ROW_COLORS[i], border: `1px solid ${PERF_ROW_COLORS[i]}30` }}>
                    {row.type}
                  </span>
                </td>
                <td className="text-secondary">{row.investedValue}</td>
                <td style={{ fontWeight: 600 }}>{row.currentValue}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.netProceeds}</td>
                <td>
                  <span className={row.pl >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
                    {row.pl >= 0 ? '+' : ''}{formatLKRFull(row.pl)}
                  </span>
                </td>
                <td><span className={`badge badge-${row.plPct >= 0 ? 'gain' : 'loss'}`}>{formatPct(row.plPct)}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <div style={{ width: 64, height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${row.alloc}%`, height: '100%', background: PERF_ROW_COLORS[i], borderRadius: 3 }} />
                    </div>
                    <span style={{ fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{row.alloc.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={2} style={{ textAlign: 'left' }}>Total Portfolio</td>
              <td>—</td>
              <td>{formatLKRFull(totals.totalNetWorth)}</td>
              <td>—</td>
              <td>
                <span className={totals.totalPL >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 700 }}>
                  {totals.totalPL >= 0 ? '+' : ''}{formatLKRFull(totals.totalPL)}
                </span>
              </td>
              <td>—</td>
              <td style={{ fontWeight: 700 }}>100.0%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
