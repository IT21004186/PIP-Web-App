// Seed script — reads ../data.json and populates MongoDB.
// Run once: npm run seed
// Safe to re-run: clears existing documents before inserting.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');

const Stock        = require('../src/models/Stock');
const Transaction  = require('../src/models/Transaction');
const Crypto       = require('../src/models/Crypto');
const FixedDeposit = require('../src/models/FixedDeposit');
const Settings     = require('../src/models/Settings');

async function seed() {
  const dataPath = path.join(__dirname, '../../data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('data.json not found at:', dataPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/pip';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Stock.deleteMany({}),
    Transaction.deleteMany({}),
    Crypto.deleteMany({}),
    FixedDeposit.deleteMany({}),
    Settings.deleteMany({}),
  ]);
  console.log('Cleared existing collections');

  // Seed stocks
  if (Array.isArray(raw.stocks) && raw.stocks.length > 0) {
    await Stock.insertMany(raw.stocks);
    console.log(`Inserted ${raw.stocks.length} stocks`);
  }

  // Seed transactions (flatten symbol-keyed map into individual documents)
  if (raw.transactions && typeof raw.transactions === 'object') {
    const txDocs = [];
    for (const [symbol, txList] of Object.entries(raw.transactions)) {
      for (const tx of txList) {
        txDocs.push({ ...tx, symbol });
      }
    }
    if (txDocs.length > 0) {
      await Transaction.insertMany(txDocs);
      console.log(`Inserted ${txDocs.length} transactions`);
    }
  }

  // Seed crypto
  if (Array.isArray(raw.crypto) && raw.crypto.length > 0) {
    await Crypto.insertMany(raw.crypto);
    console.log(`Inserted ${raw.crypto.length} crypto assets`);
  }

  // Seed fixed deposits
  if (Array.isArray(raw.fixedDeposits) && raw.fixedDeposits.length > 0) {
    await FixedDeposit.insertMany(raw.fixedDeposits);
    console.log(`Inserted ${raw.fixedDeposits.length} fixed deposits`);
  }

  // Seed USD→LKR fallback rate
  const fallback = raw.usdToLkr || 308.71;
  await Settings.create({ key: 'usdToLkrFallback', value: fallback });
  console.log(`USD→LKR fallback rate set to ${fallback}`);

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
