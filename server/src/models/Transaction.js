const { Schema, model } = require('mongoose');

// Each document is one BUY, SELL, or SCRIP DIVIDEND trade for a CSE-listed stock.
// grossAmount = shares × avgPrice (stored for convenience; recalculated if missing).
// SCRIP DIVIDEND: shares received at zero cost — avgPrice and grossAmount are always 0.
const transactionSchema = new Schema({
  symbol:      { type: String, required: true, uppercase: true, trim: true, index: true },
  tradeDate:   { type: Date, required: true },
  shares:      { type: Number, required: true },
  avgPrice:    { type: Number, default: 0 },   // 0 for SCRIP; required for BUY/SELL
  grossAmount: { type: Number },               // shares × avgPrice; derived on save if omitted
  status:      { type: String, required: true, enum: ['BUY', 'SELL', 'SCRIP'], uppercase: true },
}, { timestamps: true });

// Auto-compute grossAmount before saving if not supplied
transactionSchema.pre('save', function (next) {
  if (this.grossAmount == null) {
    this.grossAmount = this.shares * this.avgPrice;
  }
  next();
});

module.exports = model('Transaction', transactionSchema);
