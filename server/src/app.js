const express      = require('express');
const cors         = require('cors');
const errorHandler = require('./middleware/errorHandler');

const portfolioRoutes       = require('./routes/portfolio');
const stockRoutes           = require('./routes/stocks');
const transactionRoutes     = require('./routes/transactions');
const cryptoRoutes          = require('./routes/crypto');
const fdRoutes              = require('./routes/fixedDeposits');
const investmentLogRoutes   = require('./routes/investmentLogs');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/portfolio',                 portfolioRoutes);
app.use('/api/stocks',                    stockRoutes);
app.use('/api/stocks/:symbol/transactions', transactionRoutes);
app.use('/api/crypto',                    cryptoRoutes);
app.use('/api/fd',                        fdRoutes);
app.use('/api/investment-logs',           investmentLogRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Centralised error handler — must be last
app.use(errorHandler);

module.exports = app;
