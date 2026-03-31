// /api/fd — CRUD for fixed deposit records

const { Router } = require('express');
const FixedDeposit = require('../models/FixedDeposit');

const router = Router();

// GET /api/fd
router.get('/', async (req, res, next) => {
  try {
    const fds = await FixedDeposit.find().sort({ maturityDate: 1 }).lean();
    res.json(fds);
  } catch (err) { next(err); }
});

// GET /api/fd/:id
router.get('/:id', async (req, res, next) => {
  try {
    const fd = await FixedDeposit.findById(req.params.id).lean();
    if (!fd) return res.status(404).json({ error: 'Fixed deposit not found' });
    res.json(fd);
  } catch (err) { next(err); }
});

// POST /api/fd — create new FD
router.post('/', async (req, res, next) => {
  try {
    const fd = await FixedDeposit.create(req.body);
    res.status(201).json(fd);
  } catch (err) { next(err); }
});

// PUT /api/fd/:id — update an FD (e.g. renewal, rate change)
router.put('/:id', async (req, res, next) => {
  try {
    const fd = await FixedDeposit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!fd) return res.status(404).json({ error: 'Fixed deposit not found' });
    res.json(fd);
  } catch (err) { next(err); }
});

// DELETE /api/fd/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const fd = await FixedDeposit.findByIdAndDelete(req.params.id).lean();
    if (!fd) return res.status(404).json({ error: 'Fixed deposit not found' });
    res.json({ message: 'Fixed deposit deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
