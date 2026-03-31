const { Schema, model } = require('mongoose');

const stockSchema = new Schema({
  symbol:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  company:      { type: String, required: true },
  sector:       { type: String, required: true },
  // Fallback holdings — overridden by transaction history when transactions exist
  quantity:     { type: Number, default: 0 },
  avgBuyPrice:  { type: Number, default: 0 },
  currentPrice: { type: Number, required: true },
  logo:         { type: String, default: '' },
  // Optional fundamentals — rendered as stat tiles in SymbolHeader
  marketCap:        Number,
  issuedQuantity:   Number,
  eps:              Number,
  nav:              Number,
  dividendPerShare: Number,
  peRatio:          Number,
  pbv:              Number,
  dividendYield:    Number,
  roe:              Number,
}, { timestamps: true });

module.exports = model('Stock', stockSchema);
