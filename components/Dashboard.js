// =========================================================
//  Dashboard Component
// =========================================================

const { useEffect, useRef, useState } = React;

function Dashboard({ stocks, cryptos, fds, totals }) {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2>Portfolio Dashboard</h2>
          <p>Overview of your Sri Lankan investment portfolio</p>
        </div>
      </div>

      <KPIGrid totals={totals} />
      <ChartsRow stocks={stocks} cryptos={cryptos} fds={fds} totals={totals} />
      <PerformanceTable stocks={stocks} cryptos={cryptos} fds={fds} totals={totals} />
    </div>
  );
}

// ── KPI Grid ──────────────────────────────────────────────
function KPIGrid({ totals }) {
  const plColor = totals.totalPL >= 0 ? "var(--gain)" : "var(--loss)";
  const plSign  = totals.totalPL >= 0 ? "+" : "";
  const cdsPlColor = totals.cdsTotalPL >= 0 ? "var(--gain)" : "var(--loss)";

  const kpis = [
    {
      label: "Total Net Worth",
      value: formatLKRFull(totals.totalNetWorth),
      sub: `${formatLKR(totals.fdTotalPrincipal)} invested in FDs`,
      icon: "💰",
      color: "var(--accent)",
      valueClass: "",
    },
    {
      label: "Total Unrealized P/L",
      value: `${plSign}${formatLKRFull(totals.totalPL)}`,
      sub: `CDS: ${formatLKR(totals.cdsTotalPL)} · Crypto: ${formatLKR(totals.cryptoTotalPL)}`,
      icon: "📊",
      color: plColor,
      valueClass: totals.totalPL >= 0 ? "gain" : "loss",
    },
    {
      label: "Best Performer",
      value: totals.bestStock ? totals.bestStock.symbol : "—",
      sub: totals.bestStock ? `${formatPct(totals.bestStock.plPercent)} · ${totals.bestStock.company}` : "",
      icon: "🏆",
      color: "var(--gain)",
      valueClass: "gain",
    },
    {
      label: "Worst Performer",
      value: totals.worstStock ? totals.worstStock.symbol : "—",
      sub: totals.worstStock ? `${formatPct(totals.worstStock.plPercent)} · ${totals.worstStock.company}` : "",
      icon: "📉",
      color: "var(--loss)",
      valueClass: totals.worstStock && totals.worstStock.plPercent < 0 ? "loss" : "",
    },
  ];

  return (
    <div className="kpi-grid">
      {kpis.map((kpi, i) => (
        <div key={i} className="kpi-card" style={{ "--kpi-color": kpi.color }}>
          <div className="kpi-icon">{kpi.icon}</div>
          <div className="kpi-label">{kpi.label}</div>
          <div className={`kpi-value ${kpi.valueClass}`}>{kpi.value}</div>
          <div className="kpi-sub">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Charts Row ─────────────────────────────────────────────
function ChartsRow({ stocks, cryptos, fds, totals }) {
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
      type: "doughnut",
      data: {
        labels: assetAllocation.map(a => a.label),
        datasets: [{
          data: assetAllocation.map(a => a.value),
          backgroundColor: assetAllocation.map(a => a.color),
          borderColor: "var(--bg-card)",
          borderWidth: 3,
          hoverBorderWidth: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "65%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.raw;
                const pct = totals.assetAllocation[ctx.dataIndex].pct;
                return ` ${formatLKRFull(val)}  (${pct.toFixed(1)}%)`;
              },
            },
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderWidth: 1,
            titleColor: "var(--text-primary)",
            bodyColor: "var(--text-secondary)",
            padding: 12,
          },
        },
      },
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [totals]);

  return (
    <div className="chart-card">
      <h3>Asset Allocation</h3>
      <div className="chart-container">
        <canvas ref={canvasRef} height="200" />
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

    const sectors = [...totals.sectorTotals].sort((a, b) => b.marketValue - a.marketValue);

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: sectors.map(s => s.sector),
        datasets: [
          {
            label: "Market Value (LKR)",
            data: sectors.map(s => s.marketValue),
            backgroundColor: sectors.map(s => s.color + "cc"),
            borderColor: sectors.map(s => s.color),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatLKRFull(ctx.raw)}`,
              afterLabel: (ctx) => {
                const s = sectors[ctx.dataIndex];
                const pl = s.unrealizedPL >= 0 ? "+" : "";
                return ` P/L: ${pl}${formatLKR(s.unrealizedPL)}  (${s.allocationPct.toFixed(1)}% of CDS)`;
              },
            },
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border)",
            borderWidth: 1,
            titleColor: "var(--text-primary)",
            bodyColor: "var(--text-secondary)",
            padding: 12,
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: {
              color: "var(--text-muted)",
              font: { size: 11 },
              callback: (val) => formatLKR(val),
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: "var(--text-secondary)",
              font: { size: 12 },
            },
          },
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

// ── Performance Summary Table ──────────────────────────────
function PerformanceTable({ stocks, cryptos, fds, totals }) {
  const rows = [
    {
      asset: "CDS Account",
      type: "Equities",
      investedValue: formatLKRFull(totals.cdsTotalCost),
      currentValue:  formatLKRFull(totals.cdsTotalValue),
      pl:            totals.cdsTotalPL,
      plPct:         totals.cdsTotalCost > 0 ? ((totals.cdsTotalPL / totals.cdsTotalCost) * 100) : 0,
      alloc:         totals.totalNetWorth > 0 ? (totals.cdsTotalValue / totals.totalNetWorth) * 100 : 0,
    },
    {
      asset: "Crypto",
      type: "Digital Assets",
      investedValue: formatLKRFull(cryptos.reduce((s, c) => s + c.costBasisUSD * USD_TO_LKR, 0)),
      currentValue:  formatLKRFull(totals.cryptoTotalLKR),
      pl:            totals.cryptoTotalPL,
      plPct:         cryptos.reduce((s, c) => s + c.costBasisUSD * USD_TO_LKR, 0) > 0
                       ? (totals.cryptoTotalPL / cryptos.reduce((s, c) => s + c.costBasisUSD * USD_TO_LKR, 0)) * 100
                       : 0,
      alloc:         totals.totalNetWorth > 0 ? (totals.cryptoTotalLKR / totals.totalNetWorth) * 100 : 0,
    },
    {
      asset: "Fixed Deposits",
      type: "Fixed Income",
      investedValue: formatLKRFull(totals.fdTotalPrincipal),
      currentValue:  formatLKRFull(totals.fdTotalMaturity),
      pl:            totals.fdTotalInterest,
      plPct:         totals.fdTotalPrincipal > 0 ? (totals.fdTotalInterest / totals.fdTotalPrincipal) * 100 : 0,
      alloc:         totals.totalNetWorth > 0 ? (totals.fdTotalMaturity / totals.totalNetWorth) * 100 : 0,
    },
  ];

  return (
    <div className="perf-table-card">
      <h3>Portfolio Performance Summary</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Asset Class</th>
              <th>Type</th>
              <th>Invested Value</th>
              <th>Current Value</th>
              <th>Unrealized P/L</th>
              <th>P/L %</th>
              <th>Allocation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{row.asset}</td>
                <td className="text-secondary">{row.type}</td>
                <td className="text-secondary">{row.investedValue}</td>
                <td style={{ fontWeight: 600 }}>{row.currentValue}</td>
                <td>
                  <span className={row.pl >= 0 ? "text-gain" : "text-loss"} style={{ fontWeight: 600 }}>
                    {row.pl >= 0 ? "+" : ""}{formatLKRFull(row.pl)}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${row.plPct >= 0 ? "gain" : "loss"}`}>
                    {formatPct(row.plPct)}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <div style={{ width: 60, height: 4, background: "var(--bg-surface)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${row.alloc}%`, height: "100%", background: ["var(--accent)", "#9945FF", "var(--neutral)"][i], borderRadius: 2 }} />
                    </div>
                    <span style={{ fontWeight: 600, minWidth: 40, textAlign: "right" }}>{row.alloc.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={2} style={{ textAlign: "left" }}>Total Portfolio</td>
              <td>—</td>
              <td>{formatLKRFull(totals.totalNetWorth)}</td>
              <td>
                <span className={totals.totalPL >= 0 ? "text-gain" : "text-loss"} style={{ fontWeight: 700 }}>
                  {totals.totalPL >= 0 ? "+" : ""}{formatLKRFull(totals.totalPL)}
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
