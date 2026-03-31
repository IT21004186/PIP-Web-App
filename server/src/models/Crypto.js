const { Schema, model } = require('mongoose');

const cryptoSchema = new Schema({
  symbol:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:         { type: String, required: true },
  quantity:     { type: Number, required: true },
  avgBuyPrice:  { type: Number, required: true },   // USD
  currentPrice: { type: Number, required: true },   // USD
  color:        { type: String, default: '#888' },  // hex, used in charts
  logo:         { type: String, default: '' },
}, { timestamps: true });

module.exports = model('Crypto', cryptoSchema);
