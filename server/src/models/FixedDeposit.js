const { Schema, model } = require('mongoose');

const fixedDepositSchema = new Schema({
  bank:          { type: String, required: true },
  accountNumber: { type: String, required: true },
  principal:     { type: Number, required: true },
  interestRate:  { type: Number, required: true },  // % p.a.
  startDate:     { type: Date, required: true },
  maturityDate:  { type: Date, required: true },
  color:         { type: String, default: '#153e70' },
  logo:          { type: String, default: '' },
}, { timestamps: true });

module.exports = model('FixedDeposit', fixedDepositSchema);
