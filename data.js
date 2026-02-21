// =========================================================
//  PIP – Portfolio Data
//  Update currentPrice values as market prices change.
// =========================================================

const SECTOR_COLORS = {
  "Banking":                      "#6366f1",
  "Capital Goods":                "#8b5cf6",
  "Materials":                    "#06b6d4",
  "Consumer Services":            "#f59e0b",
  "Health Care Equipment & Services": "#10b981",
  "Diversified Financials":       "#3b82f6",
};

// ── CDS Stock Holdings ────────────────────────────────────
const CDS_STOCKS = [
  // Banking
  {
    symbol: "COMB",
    company: "Commercial Bank of Ceylon PLC",
    sector: "Banking",
    quantity: 400,
    avgBuyPrice: 92.50,
    currentPrice: 108.75,
    logo: "Assets/company-logo/Commercial-Bank.png",
  },
  {
    symbol: "SAMP",
    company: "Sampath Bank PLC",
    sector: "Banking",
    quantity: 300,
    avgBuyPrice: 74.20,
    currentPrice: 81.00,
    logo: "Assets/company-logo/Nation-Trust.png",
  },
  {
    symbol: "HNB",
    company: "Hatton National Bank PLC",
    sector: "Banking",
    quantity: 250,
    avgBuyPrice: 158.00,
    currentPrice: 172.50,
    logo: "Assets/company-logo/HNB-Bank.png",
  },

  // Capital Goods
  {
    symbol: "LOLC",
    company: "LOLC Holdings PLC",
    sector: "Capital Goods",
    quantity: 150,
    avgBuyPrice: 315.00,
    currentPrice: 298.50,
    logo: "Assets/company-logo/LB-Finance.jpg",
  },
  {
    symbol: "LFIN",
    company: "LOLC Finance PLC",
    sector: "Capital Goods",
    quantity: 500,
    avgBuyPrice: 18.40,
    currentPrice: 22.80,
  },

  // Materials
  {
    symbol: "TKYO",
    company: "Tokyo Cement Company (Lanka) PLC",
    sector: "Materials",
    quantity: 600,
    avgBuyPrice: 44.50,
    currentPrice: 51.20,
    logo: "Assets/company-logo/Tokyo-Cement-Grp.png",
  },
  {
    symbol: "REXP",
    company: "Richard Pieris Exports PLC",
    sector: "Materials",
    quantity: 800,
    avgBuyPrice: 12.80,
    currentPrice: 14.60,
  },

  // Consumer Services
  {
    symbol: "JKH",
    company: "John Keells Holdings PLC",
    sector: "Consumer Services",
    quantity: 500,
    avgBuyPrice: 185.50,
    currentPrice: 210.00,
    logo: "Assets/company-logo/john-keells-holdings.svg",
  },
  {
    symbol: "HAYA",
    company: "Hayleys PLC",
    sector: "Consumer Services",
    quantity: 200,
    avgBuyPrice: 72.00,
    currentPrice: 78.50,
    logo: "Assets/company-logo/Hayleys.png",
  },

  // Health Care Equipment & Services
  {
    symbol: "ASIR",
    company: "Asiri Hospital Holdings PLC",
    sector: "Health Care Equipment & Services",
    quantity: 700,
    avgBuyPrice: 35.60,
    currentPrice: 42.30,
    logo: "Assets/company-logo/Hemas-Holdings.png",
  },

  // Diversified Financials
  {
    symbol: "CFVF",
    company: "CF Venture Fund",
    sector: "Diversified Financials",
    quantity: 1000,
    avgBuyPrice: 8.20,
    currentPrice: 9.55,
  },
  {
    symbol: "AITS",
    company: "Aitken Spence PLC",
    sector: "Diversified Financials",
    quantity: 450,
    avgBuyPrice: 42.10,
    currentPrice: 38.80,
    logo: "Assets/company-logo/Aitken-Spence.jpg",
  },
];

// ── Crypto Holdings ───────────────────────────────────────
const USD_TO_LKR = 324.50;   // Update as exchange rate changes

const CRYPTO_ASSETS = [
  {
    symbol: "SOL",
    name: "Solana",
    quantity: 12.5,
    avgBuyPrice: 98.40,     // USDT
    currentPrice: 172.30,   // USDT
    logo: "Assets/cryptocurrency-logo/solana.png",
    color: "#9945FF",
  },
  {
    symbol: "XRP",
    name: "XRP",
    quantity: 4500,
    avgBuyPrice: 0.52,      // USDT
    currentPrice: 2.18,     // USDT
    logo: "Assets/cryptocurrency-logo/xrp.png",
    color: "#00AAE4",
  },
];

// ── Fixed Deposits ────────────────────────────────────────
const FIXED_DEPOSITS = [
  {
    id: "FD001",
    bank: "Commercial Bank of Ceylon",
    accountNumber: "1234-5678-9012",
    principal: 1500000,        // LKR
    interestRate: 12.5,        // % per annum
    startDate: "2024-06-01",
    maturityDate: "2025-06-01",
    logo: "Assets/company-logo/Commercial-Bank.png",
    color: "#3b82f6",
  },
  {
    id: "FD002",
    bank: "Bank of Ceylon",
    accountNumber: "9876-5432-1011",
    principal: 2000000,        // LKR
    interestRate: 11.75,       // % per annum
    startDate: "2024-09-15",
    maturityDate: "2025-09-15",
    logo: "Assets/FD-savings-logo.png",
    color: "#f59e0b",
  },
];

// =========================================================
//  Computation helpers (pure functions, no React dependency)
// =========================================================

function computeStock(stock) {
  const marketValue   = stock.quantity * stock.currentPrice;
  const costBasis     = stock.quantity * stock.avgBuyPrice;
  const unrealizedPL  = marketValue - costBasis;
  const plPercent     = ((stock.currentPrice - stock.avgBuyPrice) / stock.avgBuyPrice) * 100;
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

  const totalDays    = Math.round((maturity - start) / 86400000);
  const elapsedDays  = Math.min(Math.max(Math.round((today - start) / 86400000), 0), totalDays);
  const remainDays   = Math.max(totalDays - elapsedDays, 0);
  const progressPct  = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

  const maturityValue  = fd.principal * (1 + (fd.interestRate / 100) * (totalDays / 365));
  const interestEarned = maturityValue - fd.principal;
  const accruedInterest = fd.principal * (fd.interestRate / 100) * (elapsedDays / 365);
  const isMatured      = today >= maturity;

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

// Pre-compute all data
const computedStocks   = CDS_STOCKS.map(computeStock);
const computedCrypto   = CRYPTO_ASSETS.map(a => computeCrypto(a, USD_TO_LKR));
const computedFDs      = FIXED_DEPOSITS.map(computeFD);

// Sector grouping helper
function groupBySector(stocks) {
  return stocks.reduce((acc, stock) => {
    if (!acc[stock.sector]) acc[stock.sector] = [];
    acc[stock.sector].push(stock);
    return acc;
  }, {});
}

// Portfolio totals
function getPortfolioTotals(stocks, cryptos, fds) {
  const cdsTotalValue  = stocks.reduce((s, x) => s + x.marketValue, 0);
  const cdsTotalPL     = stocks.reduce((s, x) => s + x.unrealizedPL, 0);
  const cdsTotalCost   = stocks.reduce((s, x) => s + x.costBasis, 0);

  const cryptoTotalLKR = cryptos.reduce((s, x) => s + x.marketValueLKR, 0);
  const cryptoTotalPL  = cryptos.reduce((s, x) => s + x.unrealizedPLLKR, 0);

  const fdTotalPrincipal  = fds.reduce((s, x) => s + x.principal, 0);
  const fdTotalMaturity   = fds.reduce((s, x) => s + x.maturityValue, 0);
  const fdTotalInterest   = fds.reduce((s, x) => s + x.interestEarned, 0);

  const totalNetWorth = cdsTotalValue + cryptoTotalLKR + fdTotalMaturity;
  const totalPL       = cdsTotalPL + cryptoTotalPL + fdTotalInterest;

  const bestStock  = [...stocks].sort((a, b) => b.plPercent - a.plPercent)[0];
  const worstStock = [...stocks].sort((a, b) => a.plPercent - b.plPercent)[0];

  // Sector totals
  const grouped = groupBySector(stocks);
  const sectorTotals = Object.entries(grouped).map(([sector, items]) => ({
    sector,
    color: SECTOR_COLORS[sector] || "#888",
    marketValue: items.reduce((s, x) => s + x.marketValue, 0),
    unrealizedPL: items.reduce((s, x) => s + x.unrealizedPL, 0),
    allocationPct: 0, // computed below
  }));
  sectorTotals.forEach(s => {
    s.allocationPct = cdsTotalValue > 0 ? (s.marketValue / cdsTotalValue) * 100 : 0;
  });

  return {
    cdsTotalValue, cdsTotalPL, cdsTotalCost,
    cryptoTotalLKR, cryptoTotalPL,
    fdTotalPrincipal, fdTotalMaturity, fdTotalInterest,
    totalNetWorth, totalPL,
    bestStock, worstStock,
    sectorTotals,
    assetAllocation: [
      { label: "CDS Stocks",      value: cdsTotalValue,  color: "#3b82f6", pct: totalNetWorth > 0 ? (cdsTotalValue / totalNetWorth) * 100 : 0 },
      { label: "Crypto",          value: cryptoTotalLKR, color: "#9945FF", pct: totalNetWorth > 0 ? (cryptoTotalLKR / totalNetWorth) * 100 : 0 },
      { label: "Fixed Deposits",  value: fdTotalMaturity,color: "#f59e0b", pct: totalNetWorth > 0 ? (fdTotalMaturity / totalNetWorth) * 100 : 0 },
    ],
  };
}
