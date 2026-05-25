// =========================================================
//  PIP – Calculation Engine (server-side port of data.js)
//  Pure functions only — no browser APIs, no DOM references.
//  All financial math for CDS, Crypto, and Fixed Deposits.
// =========================================================

const SECTOR_COLORS = {
  'Banks':                            '#153e70',
  'Capital Goods':                    '#8b5cf6',
  'Materials':                        '#7786d9',
  'Consumer Services':                '#fdcb34',
  'Diversified Financials':           '#009e69',
  'Health Care Equipment & Services': '#e44c69',
  'Food Beverage & Tobacco':          '#f39302',
  'Energy':                           '#7d8385',
};

// =========================================================
//  CSE Transaction Cost Rates (effective 28th July 2025)
// =========================================================
const CSE_BUY_RATE   = 0.0112;         // 1.12% — paid on purchase
const CSE_SELL_RATE  = 0.0112;         // 1.12% — paid on sale (up to Rs.100M)
const CSE_TIER1_CAP  = 100_000_000;    // Rs. 100 Million threshold
const CSE_TIER2_RATE = 0.006125;       // 0.6125% for amount above Rs.100M

// Tiered sell commission: 1.12% up to Rs.100M, 0.6125% on the remainder
function computeSellCommission(saleValue) {
  if (saleValue <= CSE_TIER1_CAP) {
    return saleValue * CSE_SELL_RATE;
  }
  return (CSE_TIER1_CAP * CSE_SELL_RATE) + ((saleValue - CSE_TIER1_CAP) * CSE_TIER2_RATE);
}

// CSE commission for a single BUY or SELL transaction
function computeTransactionCommission(tx) {
  const gross  = tx.grossAmount ?? (tx.shares ?? 0) * (tx.avgPrice ?? 0);
  const status = (tx.status || '').toUpperCase();
  if (status === 'BUY')  return gross * CSE_BUY_RATE;
  if (status === 'SELL') return computeSellCommission(gross);
  return 0;
}

// Net cash flow for a transaction: BUY costs more, SELL receives less
function deriveNetAmount(tx) {
  const gross      = tx.grossAmount ?? (tx.shares ?? 0) * (tx.avgPrice ?? 0);
  const commission = computeTransactionCommission(tx);
  const status     = (tx.status || '').toUpperCase();
  if (status === 'BUY')  return gross + commission;
  if (status === 'SELL') return gross - commission;
  return gross;
}

// Returns tx enriched with { commission, netAmount }
function computeTransactionWithCSE(tx) {
  const commission = computeTransactionCommission(tx);
  const netAmount  = deriveNetAmount(tx);
  return { ...tx, commission, netAmount };
}

// =========================================================
//  Per-asset computation helpers
// =========================================================

function computeStock(stock) {
  const marketValue   = stock.quantity * stock.currentPrice;
  const costBasis     = stock.quantity * stock.avgBuyPrice;

  const buyCostPaid   = costBasis * CSE_BUY_RATE;
  const trueCostBasis = costBasis + buyCostPaid;

  const estimatedSellCost = computeSellCommission(marketValue);
  const netSaleProceeds   = marketValue - estimatedSellCost;

  const unrealizedPL  = netSaleProceeds - trueCostBasis;
  const plPercent     = trueCostBasis > 0 ? (unrealizedPL / trueCostBasis) * 100 : 0;
  const breakEvenPrice = trueCostBasis / (stock.quantity * (1 - CSE_SELL_RATE));

  return {
    ...stock,
    marketValue,
    costBasis,
    buyCostPaid,
    trueCostBasis,
    estimatedSellCost,
    netSaleProceeds,
    unrealizedPL,
    plPercent,
    breakEvenPrice,
  };
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

  return { ...fd, totalDays, elapsedDays, remainDays, progressPct, maturityValue, interestEarned, accruedInterest, isMatured };
}

// =========================================================
//  Symbol profile helpers
// =========================================================

function getSymbolProfile(stocks, symbol) {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return null;
  return {
    symbol: stock.symbol, company: stock.company, sector: stock.sector,
    currentPrice: stock.currentPrice, logo: stock.logo,
    marketCap: stock.marketCap, issuedQuantity: stock.issuedQuantity,
    eps: stock.eps, nav: stock.nav, dividendPerShare: stock.dividendPerShare,
    peRatio: stock.peRatio, pbv: stock.pbv, dividendYield: stock.dividendYield, roe: stock.roe,
  };
}

function getSymbolTransactions(transactions, symbol) {
  if (!transactions || typeof transactions !== 'object') return [];
  return transactions[symbol] || [];
}

// Compute cumulative position and P/L from raw transaction list
function computeSymbolDerived(transactions, currentPrice) {
  let totalShares   = 0;
  let costBasis     = 0;
  let rawCostBasis  = 0;
  let realizedProfit = 0;

  const sorted = [...(transactions || [])].sort(
    (a, b) => new Date(a.tradeDate) - new Date(b.tradeDate)
  );

  for (const t of sorted) {
    const cseTx  = computeTransactionWithCSE(t);
    const status = (cseTx.status || '').toUpperCase();
    const gross  = cseTx.grossAmount ?? (cseTx.shares ?? 0) * (cseTx.avgPrice ?? 0);

    if (status === 'BUY') {
      totalShares  += cseTx.shares || 0;
      costBasis    += cseTx.netAmount;
      rawCostBasis += gross;
    } else if (status === 'SELL') {
      const avgCost    = totalShares > 0 ? costBasis    / totalShares : 0;
      const avgRawCost = totalShares > 0 ? rawCostBasis / totalShares : 0;
      const sold       = cseTx.shares || 0;
      const costOfSold = sold * avgCost;
      realizedProfit  += cseTx.netAmount - costOfSold;
      totalShares     -= sold;
      costBasis       -= costOfSold;
      rawCostBasis    -= sold * avgRawCost;
    } else if (status === 'SCRIP') {
      // Shares received at zero cost — increase holding, cost basis unchanged
      totalShares += cseTx.shares || 0;
    }
  }

  const avgHoldingPrice    = totalShares > 0 ? costBasis / totalShares : 0;
  const buyCostPaid        = costBasis - rawCostBasis;
  const marketValue        = totalShares * (currentPrice || 0);
  const estimatedSellCost  = computeSellCommission(marketValue);
  const netSaleProceeds    = marketValue - estimatedSellCost;

  return {
    totalShares, costBasis, rawCostBasis, buyCostPaid,
    avgHoldingPrice, totalInvestmentValue: marketValue, realizedProfit,
    marketValue, estimatedSellCost, netSaleProceeds,
    unrealizedPL: netSaleProceeds - costBasis,
  };
}

// =========================================================
//  Portfolio aggregation
// =========================================================

function groupBySector(stocks) {
  return stocks.reduce((acc, stock) => {
    if (!acc[stock.sector]) acc[stock.sector] = [];
    acc[stock.sector].push(stock);
    return acc;
  }, {});
}

// When a stock has transaction history, derive its holdings from that history
// (single source of truth — overrides the static quantity/avgBuyPrice fields)
function applyTransactionDerivedToStock(stock, transactionsBySymbol) {
  const txList = transactionsBySymbol[stock.symbol];
  if (!txList || !Array.isArray(txList) || txList.length === 0) return stock;

  const derived = computeSymbolDerived(txList, stock.currentPrice);

  const quantity          = derived.totalShares;
  const trueCostBasis     = derived.costBasis;
  const costBasis         = derived.rawCostBasis;
  const buyCostPaid       = derived.buyCostPaid;
  const marketValue       = quantity * (stock.currentPrice || 0);
  const estimatedSellCost = computeSellCommission(marketValue);
  const netSaleProceeds   = marketValue - estimatedSellCost;
  const unrealizedPL      = netSaleProceeds - trueCostBasis;
  const plPercent         = trueCostBasis > 0 ? (unrealizedPL / trueCostBasis) * 100 : 0;
  const breakEvenPrice    = quantity > 0 ? trueCostBasis / (quantity * (1 - CSE_SELL_RATE)) : 0;
  const avgBuyPrice       = quantity > 0 ? costBasis / quantity : stock.avgBuyPrice;

  return {
    ...stock, quantity, avgBuyPrice, costBasis, buyCostPaid,
    trueCostBasis, marketValue, estimatedSellCost,
    netSaleProceeds, unrealizedPL, plPercent, breakEvenPrice,
  };
}

function getPortfolioTotals(stocks, cryptos, fds, usdToLkr) {
  const cdsTotalValue       = stocks.reduce((s, x) => s + x.marketValue, 0);
  const cdsTotalCostRaw     = stocks.reduce((s, x) => s + x.costBasis, 0);
  const cdsTotalBuyCost     = stocks.reduce((s, x) => s + x.buyCostPaid, 0);
  const cdsTotalCost        = stocks.reduce((s, x) => s + x.trueCostBasis, 0);
  const cdsTotalSellCost    = stocks.reduce((s, x) => s + x.estimatedSellCost, 0);
  const cdsTotalNetProceeds = stocks.reduce((s, x) => s + x.netSaleProceeds, 0);
  const cdsTotalPL          = stocks.reduce((s, x) => s + x.unrealizedPL, 0);

  const cryptoTotalLKR     = cryptos.reduce((s, x) => s + x.marketValueLKR, 0);
  const cryptoTotalPL      = cryptos.reduce((s, x) => s + x.unrealizedPLLKR, 0);
  const cryptoTotalCostLKR = cryptos.reduce((s, x) => s + x.costBasisUSD * (usdToLkr || 1), 0);

  const fdTotalPrincipal = fds.reduce((s, x) => s + x.principal, 0);
  const fdTotalMaturity  = fds.reduce((s, x) => s + x.maturityValue, 0);
  const fdTotalInterest  = fds.reduce((s, x) => s + x.interestEarned, 0);

  const totalNetWorth = cdsTotalValue + cryptoTotalLKR + fdTotalMaturity;
  const totalPL       = cdsTotalPL + cryptoTotalPL + fdTotalInterest;

  const sortedByPL = [...stocks].filter(s => s.quantity > 0);
  const bestStock  = [...sortedByPL].sort((a, b) => b.plPercent - a.plPercent)[0] || null;
  const worstStock = [...sortedByPL].sort((a, b) => a.plPercent - b.plPercent)[0] || null;

  const grouped      = groupBySector(stocks.filter(s => s.quantity > 0));
  const sectorTotals = Object.entries(grouped).map(([sector, items]) => ({
    sector,
    color:             SECTOR_COLORS[sector] || '#888',
    marketValue:       items.reduce((s, x) => s + x.marketValue, 0),
    trueCostBasis:     items.reduce((s, x) => s + x.trueCostBasis, 0),
    estimatedSellCost: items.reduce((s, x) => s + x.estimatedSellCost, 0),
    netSaleProceeds:   items.reduce((s, x) => s + x.netSaleProceeds, 0),
    unrealizedPL:      items.reduce((s, x) => s + x.unrealizedPL, 0),
    allocationPct:     cdsTotalValue > 0 ? (items.reduce((s, x) => s + x.marketValue, 0) / cdsTotalValue) * 100 : 0,
  })).filter(s => s.marketValue > 0);

  return {
    cdsTotalValue, cdsTotalCostRaw, cdsTotalBuyCost, cdsTotalCost,
    cdsTotalSellCost, cdsTotalNetProceeds, cdsTotalPL,
    cryptoTotalLKR, cryptoTotalPL, cryptoTotalCostLKR,
    fdTotalPrincipal, fdTotalMaturity, fdTotalInterest,
    totalNetWorth, totalPL,
    usdToLkr: usdToLkr || 0,
    bestStock, worstStock,
    sectorTotals,
    assetAllocation: [
      { label: 'CDS Stocks',     value: cdsTotalValue,  color: '#992b2b', pct: totalNetWorth > 0 ? (cdsTotalValue  / totalNetWorth) * 100 : 0 },
      { label: 'Crypto',         value: cryptoTotalLKR, color: '#F0b90b', pct: totalNetWorth > 0 ? (cryptoTotalLKR / totalNetWorth) * 100 : 0 },
      { label: 'Fixed Deposits', value: fdTotalMaturity, color: '#153e70', pct: totalNetWorth > 0 ? (fdTotalMaturity / totalNetWorth) * 100 : 0 },
    ],
  };
}

module.exports = {
  SECTOR_COLORS,
  computeSellCommission,
  computeTransactionCommission,
  computeTransactionWithCSE,
  computeStock,
  computeCrypto,
  computeFD,
  getSymbolProfile,
  getSymbolTransactions,
  computeSymbolDerived,
  groupBySector,
  applyTransactionDerivedToStock,
  getPortfolioTotals,
};
