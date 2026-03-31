// CRUD API helpers — every write operation resolves to the saved document
// or throws with the server's error message.

async function request(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `${method} ${url} failed (${res.status})`);
  }
  return res.json();
}

// ── Stocks ────────────────────────────────────────────────
export const addStock    = (data)           => request('/api/stocks',            'POST',   data);
export const updateStock = (symbol, data)   => request(`/api/stocks/${symbol}`,  'PUT',    data);
export const deleteStock = (symbol)         => request(`/api/stocks/${symbol}`,  'DELETE');

// ── Transactions ──────────────────────────────────────────
export const addTransaction    = (symbol, data) => request(`/api/stocks/${symbol}/transactions`,      'POST',   data);
export const updateTransaction = (symbol, id, data) => request(`/api/stocks/${symbol}/transactions/${id}`, 'PUT', data);
export const deleteTransaction = (symbol, id)   => request(`/api/stocks/${symbol}/transactions/${id}`, 'DELETE');

// ── Crypto ────────────────────────────────────────────────
export const addCrypto    = (data)           => request('/api/crypto',            'POST',   data);
export const updateCrypto = (symbol, data)   => request(`/api/crypto/${symbol}`,  'PUT',    data);
export const deleteCrypto = (symbol)         => request(`/api/crypto/${symbol}`,  'DELETE');

// ── Fixed Deposits ────────────────────────────────────────
export const addFD    = (data)   => request('/api/fd',        'POST',   data);
export const updateFD = (id, data) => request(`/api/fd/${id}`, 'PUT',    data);
export const deleteFD = (id)     => request(`/api/fd/${id}`,  'DELETE');
