// =========================================================
//  Fixed Deposits Component
// =========================================================

function FixedDeposits({ fds, totals }) {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h2>Fixed Deposit Savings</h2>
          <p>Term deposits and accrued interest across Sri Lankan banks</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4 }}>Total at Maturity</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{formatLKRFull(totals.fdTotalMaturity)}</div>
          <div style={{ fontSize: "0.82rem", marginTop: 3 }}>
            <span className="text-gain" style={{ fontWeight: 600 }}>
              +{formatLKRFull(totals.fdTotalInterest)}
            </span>
            <span className="text-muted"> total interest</span>
          </div>
        </div>
      </div>

      {/* FD cards */}
      <div className="fd-grid">
        {fds.map(fd => (
          <FDCard key={fd.id} fd={fd} />
        ))}
      </div>

      {/* Summary table */}
      <div className="fd-summary-card">
        <h3 style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
          Fixed Deposit Summary
        </h3>
        <table>
          <thead>
            <tr>
              <th>Bank</th>
              <th>A/C Number</th>
              <th>Principal (LKR)</th>
              <th>Rate (% p.a.)</th>
              <th>Tenor (Days)</th>
              <th>Start Date</th>
              <th>Maturity Date</th>
              <th>Interest Earned</th>
              <th>Maturity Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fds.map(fd => (
              <tr key={fd.id}>
                <td style={{ fontWeight: 600 }}>{fd.bank}</td>
                <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {fd.accountNumber}
                </td>
                <td style={{ fontWeight: 600 }}>{formatLKRFull(fd.principal)}</td>
                <td>
                  <span className="badge badge-neutral">{fd.interestRate.toFixed(2)}%</span>
                </td>
                <td>{fd.totalDays} days</td>
                <td className="text-secondary">{formatDate(fd.startDate)}</td>
                <td className="text-secondary">{formatDate(fd.maturityDate)}</td>
                <td>
                  <span className="text-gain" style={{ fontWeight: 600 }}>
                    +{formatLKRFull(fd.interestEarned)}
                  </span>
                </td>
                <td style={{ fontWeight: 700 }}>{formatLKRFull(fd.maturityValue)}</td>
                <td>
                  {fd.isMatured
                    ? <span className="badge badge-gain">Matured</span>
                    : <span className="badge badge-accent">{fd.remainDays}d left</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={2} style={{ textAlign: "left" }}>Total</td>
              <td>{formatLKRFull(totals.fdTotalPrincipal)}</td>
              <td>
                <span className="badge badge-neutral">
                  {fds.length > 0
                    ? (fds.reduce((s, f) => s + f.interestRate, 0) / fds.length).toFixed(2)
                    : "0.00"}% avg
                </span>
              </td>
              <td>—</td>
              <td>—</td>
              <td>—</td>
              <td>
                <span className="text-gain" style={{ fontWeight: 700 }}>
                  +{formatLKRFull(totals.fdTotalInterest)}
                </span>
              </td>
              <td style={{ fontWeight: 700 }}>{formatLKRFull(totals.fdTotalMaturity)}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Totals strip */}
      <div className="totals-strip" style={{ marginTop: 16 }}>
        <div className="totals-strip-item">
          <span className="totals-strip-label">Total Principal</span>
          <span className="totals-strip-value">{formatLKRFull(totals.fdTotalPrincipal)}</span>
        </div>
        <div className="totals-strip-divider" />
        <div className="totals-strip-item">
          <span className="totals-strip-label">Total Interest</span>
          <span className="totals-strip-value text-gain">+{formatLKRFull(totals.fdTotalInterest)}</span>
        </div>
        <div className="totals-strip-divider" />
        <div className="totals-strip-item">
          <span className="totals-strip-label">Maturity Value</span>
          <span className="totals-strip-value">{formatLKRFull(totals.fdTotalMaturity)}</span>
        </div>
        <div className="totals-strip-divider" />
        <div className="totals-strip-item">
          <span className="totals-strip-label">Avg Interest Rate</span>
          <span className="totals-strip-value text-neutral">
            {fds.length > 0
              ? (fds.reduce((s, f) => s + f.interestRate, 0) / fds.length).toFixed(2)
              : "0.00"}% p.a.
          </span>
        </div>
        <div className="totals-strip-divider" />
        <div className="totals-strip-item">
          <span className="totals-strip-label">Effective Yield</span>
          <span className="totals-strip-value text-gain">
            {totals.fdTotalPrincipal > 0
              ? formatPct((totals.fdTotalInterest / totals.fdTotalPrincipal) * 100)
              : "0%"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Individual FD Card ─────────────────────────────────────
function FDCard({ fd }) {
  const progressColor = fd.isMatured ? "var(--gain)" : fd.color || "var(--accent)";
  const progressGrad  = fd.isMatured
    ? "var(--gain)"
    : `linear-gradient(90deg, ${fd.color || "var(--accent)"}, ${fd.color || "var(--accent)"}aa)`;

  return (
    <div className="fd-card">
      {/* Background glow */}
      <div style={{
        position: "absolute", bottom: 0, right: 0, width: 160, height: 160,
        background: `radial-gradient(circle at bottom right, ${fd.color || "var(--neutral)"}10, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div className="fd-card-header">
        <FDBankLogo fd={fd} />
        <div>
          <div className="fd-bank-name">{fd.bank}</div>
          <div className="fd-account-id">A/C: {fd.accountNumber}</div>
          <div style={{ marginTop: 4 }}>
            {fd.isMatured
              ? <span className="badge badge-gain">Matured</span>
              : <span className="badge badge-accent">{fd.remainDays} days remaining</span>
            }
          </div>
        </div>
        <div className="fd-rate-badge" style={{ background: (fd.color || "var(--neutral)") + "18", color: fd.color || "var(--neutral)", borderColor: (fd.color || "var(--neutral)") + "44" }}>
          {fd.interestRate.toFixed(2)}%
          <small>per annum</small>
        </div>
      </div>

      <div className="fd-stats">
        <div className="fd-stat">
          <span className="fd-stat-label">Principal</span>
          <span className="fd-stat-value">{formatLKRFull(fd.principal)}</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Tenor</span>
          <span className="fd-stat-value">{fd.totalDays} days</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Start Date</span>
          <span className="fd-stat-value">{formatDate(fd.startDate)}</span>
        </div>
        <div className="fd-stat">
          <span className="fd-stat-label">Maturity Date</span>
          <span className="fd-stat-value">{formatDate(fd.maturityDate)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="fd-progress-section">
        <div className="fd-progress-header">
          <span>
            {fd.isMatured ? "Matured" : `${fd.elapsedDays} of ${fd.totalDays} days elapsed`}
          </span>
          <span style={{ fontWeight: 600, color: fd.isMatured ? "var(--gain)" : "var(--text-primary)" }}>
            {fd.progressPct.toFixed(1)}%
          </span>
        </div>
        <div className="fd-progress-track">
          <div
            className="fd-progress-fill"
            style={{ width: `${fd.progressPct}%`, background: progressGrad }}
          />
        </div>
        {!fd.isMatured && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: "0.72rem", color: "var(--text-muted)" }}>
            <span>{formatDate(fd.startDate)}</span>
            <span>Matures: {formatDate(fd.maturityDate)}</span>
          </div>
        )}
      </div>

      <div className="fd-footer">
        <div className="fd-highlight">
          <div className="fd-highlight-label">Interest Earned</div>
          <div className="fd-highlight-value text-gain">+{formatLKRFull(fd.interestEarned)}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3 }}>
            Accrued: {formatLKRFull(fd.accruedInterest)}
          </div>
        </div>
        <div className="fd-highlight" style={{ background: (fd.color || "var(--neutral)") + "14", border: `1px solid ${fd.color || "var(--neutral)"}2a` }}>
          <div className="fd-highlight-label">Maturity Value</div>
          <div className="fd-highlight-value" style={{ color: fd.color || "var(--neutral)" }}>
            {formatLKRFull(fd.maturityValue)}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3 }}>
            Yield: {formatPct((fd.interestEarned / fd.principal) * 100)}
          </div>
        </div>
      </div>
    </div>
  );
}

function FDBankLogo({ fd }) {
  const [err, setErr] = React.useState(false);
  if (!fd.logo || err) {
    const initials = fd.bank.split(" ").map(w => w[0]).join("").slice(0, 3);
    return (
      <div className="fd-bank-logo-placeholder"
        style={{ color: fd.color || "var(--neutral)", background: (fd.color || "var(--neutral)") + "18", border: `1px solid ${fd.color || "var(--neutral)"}33` }}>
        {initials}
      </div>
    );
  }
  return (
    <img
      className="fd-bank-logo"
      src={fd.logo}
      alt={fd.bank}
      onError={() => setErr(true)}
    />
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
