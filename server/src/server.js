// Fix: Node's DNS resolver was failing to look up the MongoDB SRV record
// (querySrv ECONNREFUSED) on this machine, even though Windows' own DNS
// resolved it fine. Root cause: default DNS was a flaky IPv6 link-local
// address (fe80::1) that Node's c-ares resolver couldn't query properly.
// Forcing public DNS servers here fixes it. Safe to keep in production,
// but may not be needed on hosts with properly configured DNS.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const connectDB = require('./config/db');
const app       = require('./app');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`PIP API running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
