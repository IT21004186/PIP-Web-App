// =========================================================
//  PIP – Calculation Engine
//  Raw portfolio data lives in data.json — edit that file
//  to update prices, quantities, and holdings.
// =========================================================

const SECTOR_COLORS = {
  "Banking":                          "#6366f1",
  "Capital Goods":                    "#8b5cf6",
  "Materials":                        "#06b6d4",
  "Consumer Services":                "#f59e0b",
  "Health Care Equipment & Services": "#10b981",
  "Diversified Financials":           "#3b82f6",
};

// =========================================================
//  Computation helpers (pure functions, no React dependency)
// =========================================================

function computeStock(stock) {
  const marketValue  = stock.quantity * stock.currentPrice;
  const costBasis    = stock.quantity * stock.avgBuyPrice;
  const unrealizedPL = marketValue - costBasis;
  const plPercent    = ((stock.currentPrice - stock.avgBuyPrice) / stock.avgBuyPrice) * 100;
  return { ...stock, marketValue, costBasis, unrealizedPL, plPercent };
}

function computeCrypto(asset, usdToLkr) {
  const marketValueUSD  = asset.quantity * asset.currentPrice;
  const marketValueLKR  = marketValueUSD * usdToLkr;
  const costBasisUSD    = asset.quantity * asset.avgBuyPrice;
  const unrealizedPLUSD = marketValueUSD - costBasisUSD;
  const unrealizedPLLKR = unrealizedPLUSD * usdToLkr;
  const plPercent       = ((asset.currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice) * 100;
  return { ...asset, marketValueUSD, marketValueLKR, costBasisUSD, unrealizedPLUSD, unrealizedPLLKR, plPercent };
}

function computeFD(fd) {
  const start    = new Date(fd.startDate);
  const maturity = new Date(fd.maturityDate);
  const today    = new Date();

  const totalDays     = Math.round((maturity - start) / 86400000);
  const elapsedDays   = Math.min(Math.max(Math.round((today - start) / 86400000), 0), totalDays);
  const remainDays    = Math.max(totalDays - elapsedDays, 0);
  const progressPct   = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

  const maturityValue   = fd.principal * (1 + (fd.interestRate / 100) * (totalDays / 365));
  const interestEarned  = maturityValue - fd.principal;
  const accruedInterest = fd.principal * (fd.interestRate / 100) * (elapsedDays / 365);
  const isMatured       = today >= maturity;

  return {
    ...fd,
    totalDays,
    elapsedDays,
    remainDays,
    progressPct,
    maturityValue,
    interestEarned,
    accruedInterest,
    isMatured,
  };
}

// Sector grouping helper
function groupBySector(stocks) {
  return stocks.reduce((acc, stock) => {
    if (!acc[stock.sector]) acc[stock.sector] = [];
    acc[stock.sector].push(stock);
    return acc;
  }, {});
}

// Portfolio totals
function getPortfolioTotals(stocks, cryptos, fds, usdToLkr) {
  const cdsTotalValue = stocks.reduce((s, x) => s + x.marketValue, 0);
  const cdsTotalPL    = stocks.reduce((s, x) => s + x.unrealizedPL, 0);
  const cdsTotalCost  = stocks.reduce((s, x) => s + x.costBasis, 0);

  const cryptoTotalLKR     = cryptos.reduce((s, x) => s + x.marketValueLKR, 0);
  const cryptoTotalPL      = cryptos.reduce((s, x) => s + x.unrealizedPLLKR, 0);
  const cryptoTotalCostLKR = cryptos.reduce((s, x) => s + x.costBasisUSD * (usdToLkr || 1), 0);

  const fdTotalPrincipal = fds.reduce((s, x) => s + x.principal, 0);
  const fdTotalMaturity  = fds.reduce((s, x) => s + x.maturityValue, 0);
  const fdTotalInterest  = fds.reduce((s, x) => s + x.interestEarned, 0);

  const totalNetWorth = cdsTotalValue + cryptoTotalLKR + fdTotalMaturity;
  const totalPL       = cdsTotalPL + cryptoTotalPL + fdTotalInterest;

  const bestStock  = [...stocks].sort((a, b) => b.plPercent - a.plPercent)[0];
  const worstStock = [...stocks].sort((a, b) => a.plPercent - b.plPercent)[0];

  const grouped = groupBySector(stocks);
  const sectorTotals = Object.entries(grouped).map(([sector, items]) => ({
    sector,
    color: SECTOR_COLORS[sector] || "#888",
    marketValue:  items.reduce((s, x) => s + x.marketValue, 0),
    unrealizedPL: items.reduce((s, x) => s + x.unrealizedPL, 0),
    allocationPct: 0,
  }));
  sectorTotals.forEach(s => {
    s.allocationPct = cdsTotalValue > 0 ? (s.marketValue / cdsTotalValue) * 100 : 0;
  });

  return {
    cdsTotalValue, cdsTotalPL, cdsTotalCost,
    cryptoTotalLKR, cryptoTotalPL, cryptoTotalCostLKR,
    fdTotalPrincipal, fdTotalMaturity, fdTotalInterest,
    totalNetWorth, totalPL,
    usdToLkr: usdToLkr || 0,
    bestStock, worstStock,
    sectorTotals,
    assetAllocation: [
      { label: "CDS Stocks",     value: cdsTotalValue,  color: "#3b82f6", pct: totalNetWorth > 0 ? (cdsTotalValue  / totalNetWorth) * 100 : 0 },
      { label: "Crypto",         value: cryptoTotalLKR, color: "#9945FF", pct: totalNetWorth > 0 ? (cryptoTotalLKR / totalNetWorth) * 100 : 0 },
      { label: "Fixed Deposits", value: fdTotalMaturity, color: "#f59e0b", pct: totalNetWorth > 0 ? (fdTotalMaturity / totalNetWorth) * 100 : 0 },
    ],
  };
}

// =========================================================
//  Async portfolio loader — fetches data.json, runs all
//  computations, and returns the fully calculated portfolio.
// =========================================================

async function loadPortfolio() {
  const response = await fetch('data.json');
  if (!response.ok) {
    throw new Error(`Failed to load data.json: ${response.status} ${response.statusText}`);
  }
  const raw = await response.json();

  const stocks  = raw.stocks.map(computeStock);
  const cryptos = raw.crypto.map(s => computeCrypto(s, raw.usdToLkr));
  const fds     = raw.fixedDeposits.map(computeFD);
  const totals  = getPortfolioTotals(stocks, cryptos, fds, raw.usdToLkr);

  return { stocks, cryptos, fds, totals, usdToLkr: raw.usdToLkr };
}
