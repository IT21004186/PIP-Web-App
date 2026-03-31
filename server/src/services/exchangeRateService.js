// USD → LKR exchange rate from ExchangeRate-API (open access endpoint).
// Caches the result in-memory until the API's stated next-update time,
// matching the same caching strategy as the original browser implementation.

const EXCHANGE_API = 'https://open.er-api.com/v6/latest/USD';

let cachedRate   = null;
let cacheExpiry  = 0;   // Unix timestamp (seconds)

async function fetchUsdToLkr(fallback = 308.71) {
  const now = Date.now() / 1000;

  if (cachedRate !== null && now < cacheExpiry) {
    return cachedRate;
  }

  try {
    const res  = await fetch(EXCHANGE_API);
    const json = await res.json();
    if (json.result === 'success' && json.rates?.LKR) {
      cachedRate  = json.rates.LKR;
      cacheExpiry = json.time_next_update_unix || (now + 86400);
      return cachedRate;
    }
  } catch (_) {
    // Network failure — fall through to fallback
  }

  return fallback;
}

module.exports = { fetchUsdToLkr };
