// /api/crypto — CRUD for crypto holdings

const { Router } = require('express');
const Crypto = require('../models/Crypto');

const router = Router();

// GET /api/crypto
router.get('/', async (req, res, next) => {
  try {
    const cryptos = await Crypto.find().sort({ symbol: 1 }).lean();
    res.json(cryptos);
  } catch (err) { next(err); }
});

// GET /api/crypto/:symbol
router.get('/:symbol', async (req, res, next) => {
  try {
    const crypto = await Crypto.findOne({ symbol: req.params.symbol.toUpperCase() }).lean();
    if (!crypto) return res.status(404).json({ error: 'Asset not found' });
    res.json(crypto);
  } catch (err) { next(err); }
});

// POST /api/crypto — add a new asset
router.post('/', async (req, res, next) => {
  try {
    const crypto = await Crypto.create(req.body);
    res.status(201).json(crypto);
  } catch (err) { next(err); }
});

// PUT /api/crypto/:symbol — update price or holdings
router.put('/:symbol', async (req, res, next) => {
  try {
    const crypto = await Crypto.findOneAndUpdate(
      { symbol: req.params.symbol.toUpperCase() },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!crypto) return res.status(404).json({ error: 'Asset not found' });
    res.json(crypto);
  } catch (err) { next(err); }
});

// DELETE /api/crypto/:symbol
router.delete('/:symbol', async (req, res, next) => {
  try {
    const crypto = await Crypto.findOneAndDelete({ symbol: req.params.symbol.toUpperCase() }).lean();
    if (!crypto) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: `${req.params.symbol.toUpperCase()} deleted` });
  } catch (err) { next(err); }
});

module.exports = router;
