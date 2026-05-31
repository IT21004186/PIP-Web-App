// /api/dividends — CRUD for dividend income ledger

const { Router } = require('express');
const Dividend = require('../models/Dividend');

const router = Router();

// GET /api/dividends — sorted chronologically
router.get('/', async (req, res, next) => {
  try {
    const dividends = await Dividend.find().sort({ date: 1 }).lean();
    res.json(dividends);
  } catch (err) { next(err); }
});

// POST /api/dividends
router.post('/', async (req, res, next) => {
  try {
    const dividend = await Dividend.create(req.body);
    res.status(201).json(dividend);
  } catch (err) { next(err); }
});

// PUT /api/dividends/:id
router.put('/:id', async (req, res, next) => {
  try {
    const dividend = await Dividend.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!dividend) return res.status(404).json({ error: 'Dividend not found' });
    res.json(dividend);
  } catch (err) { next(err); }
});

// DELETE /api/dividends/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const dividend = await Dividend.findByIdAndDelete(req.params.id).lean();
    if (!dividend) return res.status(404).json({ error: 'Dividend not found' });
    res.json({ message: 'Dividend deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
