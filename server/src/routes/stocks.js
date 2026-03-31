// /api/stocks — CRUD for CSE stock holdings

const { Router } = require('express');
const Stock = require('../models/Stock');

const router = Router();

// GET /api/stocks — list all stocks
router.get('/', async (req, res, next) => {
  try {
    const stocks = await Stock.find().sort({ symbol: 1 }).lean();
    res.json(stocks);
  } catch (err) { next(err); }
});

// GET /api/stocks/:symbol
router.get('/:symbol', async (req, res, next) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() }).lean();
    if (!stock) return res.status(404).json({ error: 'Stock not found' });
    res.json(stock);
  } catch (err) { next(err); }
});

// POST /api/stocks — add a new holding
router.post('/', async (req, res, next) => {
  try {
    const stock = await Stock.create(req.body);
    res.status(201).json(stock);
  } catch (err) { next(err); }
});

// PUT /api/stocks/:symbol — update price, fundamentals, or base holding fields
router.put('/:symbol', async (req, res, next) => {
  try {
    const stock = await Stock.findOneAndUpdate(
      { symbol: req.params.symbol.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!stock) return res.status(404).json({ error: 'Stock not found' });
    res.json(stock);
  } catch (err) { next(err); }
});

// DELETE /api/stocks/:symbol — remove holding and all its transactions
router.delete('/:symbol', async (req, res, next) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const Transaction = require('../models/Transaction');
    const [stock] = await Promise.all([
      Stock.findOneAndDelete({ symbol }),
      Transaction.deleteMany({ symbol }),
    ]);
    if (!stock) return res.status(404).json({ error: 'Stock not found' });
    res.json({ message: `${symbol} and its transactions deleted` });
  } catch (err) { next(err); }
});

module.exports = router;
