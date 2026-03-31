// CSE commission helpers and symbol profile utilities needed on the frontend.
// These mirror the same pure functions in server/src/services/calculationService.js.
// Kept on the client so TransactionTable can show per-trade commission breakdowns
// and SymbolProfile can compute derived stats without an extra API round-trip.

export const SECTOR_COLORS = {
  'Banks':                            '#153e70',
  'Capital Goods':                    '#8b5cf6',
  'Materials':                        '#7786d9',
  'Consumer Services':                '#fdcb34',
  'Diversified Financials':           '#009e69',
  'Health Care Equipment & Services': '#e44c69',
  'Food Beverage & Tobacco':          '#f39302',
  'Energy':                           '#7d8385',
};

const CSE_BUY_RATE   = 0.0112;
const CSE_SELL_RATE  = 0.0112;
const CSE_TIER1_CAP  = 100_000_000;
const CSE_TIER2_RATE = 0.006125;

function computeSellCommission(saleValue) {
  if (saleValue <= CSE_TIER1_CAP) return saleValue * CSE_SELL_RATE;
  return (CSE_TIER1_CAP * CSE_SELL_RATE) + ((saleValue - CSE_TIER1_CAP) * CSE_TIER2_RATE);
}

function computeTransactionCommission(tx) {
  const gross  = tx.grossAmount ?? (tx.shares ?? 0) * (tx.avgPrice ?? 0);
  const status = (tx.status || '').toUpperCase();
  if (status === 'BUY')  return gross * CSE_BUY_RATE;
  if (status === 'SELL') return computeSellCommission(gross);
  return 0;
}

function deriveNetAmount(tx) {
  const gross      = tx.grossAmount ?? (tx.shares ?? 0) * (tx.avgPrice ?? 0);
  const commission = computeTransactionCommission(tx);
  const status     = (tx.status || '').toUpperCase();
  if (status === 'BUY')  return gross + commission;
  if (status === 'SELL') return gross - commission;
  return gross;
}

export function computeTransactionWithCSE(tx) {
  const commission = computeTransactionCommission(tx);
  const netAmount  = deriveNetAmount(tx);
  return { ...tx, commission, netAmount };
}

export function getSymbolProfile(stocks, symbol) {
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

export function getSymbolTransactions(transactions, symbol) {
  if (!transactions || typeof transactions !== 'object') return [];
  return transactions[symbol] || [];
}

export function computeSymbolDerived(transactions, currentPrice) {
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
    }
  }

  const avgHoldingPrice   = totalShares > 0 ? costBasis / totalShares : 0;
  const marketValue       = totalShares * (currentPrice || 0);
  const estimatedSellCost = computeSellCommission(marketValue);
  const netSaleProceeds   = marketValue - estimatedSellCost;

  return {
    totalShares, costBasis, rawCostBasis,
    buyCostPaid: costBasis - rawCostBasis,
    avgHoldingPrice, totalInvestmentValue: marketValue, realizedProfit,
    marketValue, estimatedSellCost, netSaleProceeds,
    unrealizedPL: netSaleProceeds - costBasis,
  };
}
