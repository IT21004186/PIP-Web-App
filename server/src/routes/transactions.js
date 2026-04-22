// /api/stocks/:symbol/transactions — CRUD for BUY/SELL transaction history

const { Router } = require('express');
const Transaction = require('../models/Transaction');

const router = Router({ mergeParams: true });  // inherit :symbol from parent router

// GET /api/stocks/:symbol/transactions
router.get('/', async (req, res, next) => {
  try {
    const txs = await Transaction.find({ symbol: req.params.symbol.toUpperCase() })
      .sort({ tradeDate: -1 })
      .lean();
    res.json(txs);
  } catch (err) { next(err); }
});

// POST /api/stocks/:symbol/transactions — add a trade
router.post('/', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const body   = { ...req.body, symbol };
    // SCRIP dividends are received at zero cost — enforce server-side regardless of client payload
    if ((body.status || '').toUpperCase() === 'SCRIP') {
      body.avgPrice    = 0;
      body.grossAmount = 0;
    }
    const tx = await Transaction.create(body);
    res.status(201).json(tx);
  } catch (err) { next(err); }
});

// PUT /api/stocks/:symbol/transactions/:id — correct a trade
router.put('/:id', async (req, res, next) => {
  try {
    const body = { ...req.body };
    if ((body.status || '').toUpperCase() === 'SCRIP') {
      body.avgPrice    = 0;
      body.grossAmount = 0;
    }
    const tx = await Transaction.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    ).lean();
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json(tx);
  } catch (err) { next(err); }
});

// DELETE /api/stocks/:symbol/transactions/:id — remove a trade
router.delete('/:id', async (req, res, next) => {
  try {
    const tx = await Transaction.findByIdAndDelete(req.params.id).lean();
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
