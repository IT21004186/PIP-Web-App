// All HTTP calls to the PIP backend API

export async function fetchPortfolio() {
  const res = await fetch('/api/portfolio');
  if (!res.ok) throw new Error(`Failed to load portfolio: ${res.status} ${res.statusText}`);
  return res.json();
}
