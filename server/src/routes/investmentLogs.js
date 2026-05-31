// /api/investment-logs — CRUD for CDS investment bookkeeping log

const { Router } = require('express');
const InvestmentLog = require('../models/InvestmentLog');

const router = Router();

// GET /api/investment-logs
router.get('/', async (req, res, next) => {
  try {
    const logs = await InvestmentLog.find().sort({ date: 1 }).lean();
    res.json(logs);
  } catch (err) { next(err); }
});

// POST /api/investment-logs
router.post('/', async (req, res, next) => {
  try {
    const log = await InvestmentLog.create(req.body);
    res.status(201).json(log);
  } catch (err) { next(err); }
});

// PUT /api/investment-logs/:id
router.put('/:id', async (req, res, next) => {
  try {
    const log = await InvestmentLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!log) return res.status(404).json({ error: 'Investment log not found' });
    res.json(log);
  } catch (err) { next(err); }
});

// DELETE /api/investment-logs/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const log = await InvestmentLog.findByIdAndDelete(req.params.id).lean();
    if (!log) return res.status(404).json({ error: 'Investment log not found' });
    res.json({ message: 'Investment log deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
