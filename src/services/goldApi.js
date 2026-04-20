export async function fetchGoldPrice() {
  const res = await fetch('/api/gold-price', {
    headers: { Accept: 'application/json' },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || 'Unable to load live gold price.')
    error.code = data.code || 'GOLD_PRICE_REQUEST_FAILED'
    error.setupHint = data.setupHint || null
    throw error
  }

  return data
}
