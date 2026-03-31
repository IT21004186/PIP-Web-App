// GET /api/portfolio
// Fetches all data from MongoDB, runs the full calculation engine,
// and returns the same portfolio shape that loadPortfolio() returned in data.js.

const { Router } = require('express');
const Stock        = require('../models/Stock');
const Transaction  = require('../models/Transaction');
const Crypto       = require('../models/Crypto');
const FixedDeposit = require('../models/FixedDeposit');
const Settings     = require('../models/Settings');
const { fetchUsdToLkr }             = require('../services/exchangeRateService');
const { computeStock, computeCrypto, computeFD,
        applyTransactionDerivedToStock, getPortfolioTotals } = require('../services/calculationService');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // Parallel DB reads
    const [stocks, allTx, cryptos, fds, rateSetting] = await Promise.all([
      Stock.find().lean(),
      Transaction.find().lean(),
      Crypto.find().lean(),
      FixedDeposit.find().lean(),
      Settings.findOne({ key: 'usdToLkrFallback' }).lean(),
    ]);

    const fallback = rateSetting?.value ?? 308.71;
    const usdToLkr = await fetchUsdToLkr(fallback);

    // Group transactions by symbol (mirrors data.json structure)
    const transactionsBySymbol = {};
    for (const tx of allTx) {
      if (!transactionsBySymbol[tx.symbol]) transactionsBySymbol[tx.symbol] = [];
      transactionsBySymbol[tx.symbol].push(tx);
    }

    // Run calculation engine — identical logic to data.js loadPortfolio()
    const computedStocks = stocks
      .map(computeStock)
      .map(s => applyTransactionDerivedToStock(s, transactionsBySymbol));

    const computedCryptos = cryptos.map(c => computeCrypto(c, usdToLkr));
    const computedFDs     = fds.map(computeFD);
    const totals          = getPortfolioTotals(computedStocks, computedCryptos, computedFDs, usdToLkr);

    res.json({
      stocks:       computedStocks,
      cryptos:      computedCryptos,
      fds:          computedFDs,
      totals,
      transactions: transactionsBySymbol,
      usdToLkr,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
