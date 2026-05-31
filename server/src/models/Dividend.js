const { Schema, model } = require('mongoose');

// date stored as YYYY-MM-DD string — avoids UTC midnight / timezone drift
const dividendSchema = new Schema({
  date:     { type: String, required: true },   // "2026-05-31"
  symbol:   { type: String, required: true },
  shares:   { type: Number, default: null },
  perShare: { type: Number, default: null },
  taxRate:  { type: Number, default: 15 },       // % withholding tax
  amount:   { type: Number, required: true },    // net received
}, { timestamps: true });

module.exports = model('Dividend', dividendSchema);
