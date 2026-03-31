const { Schema, model } = require('mongoose');

// Each document is one BUY or SELL trade for a CSE-listed stock.
// grossAmount = shares × avgPrice (stored for convenience; recalculated if missing).
const transactionSchema = new Schema({
  symbol:      { type: String, required: true, uppercase: true, trim: true, index: true },
  tradeDate:   { type: Date, required: true },
  shares:      { type: Number, required: true },
  avgPrice:    { type: Number, required: true },
  grossAmount: { type: Number },   // shares × avgPrice; derived on save if omitted
  status:      { type: String, required: true, enum: ['BUY', 'SELL'], uppercase: true },
}, { timestamps: true });

// Auto-compute grossAmount before saving if not supplied
transactionSchema.pre('save', function (next) {
  if (this.grossAmount == null) {
    this.grossAmount = this.shares * this.avgPrice;
  }
  next();
});

module.exports = model('Transaction', transactionSchema);
