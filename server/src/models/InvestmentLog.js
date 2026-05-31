const { Schema, model } = require('mongoose');

const investmentLogSchema = new Schema({
  date:   { type: Date,   required: true },
  amount: { type: Number, required: true },
  note:   { type: String, default: '' },
}, { timestamps: true });

module.exports = model('InvestmentLog', investmentLogSchema);
