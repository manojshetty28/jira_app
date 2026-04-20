export async function fetchGoldPrice() {
  const res = await fetch('/api/gold-price', {
    headers: { Accept: 'application/json' },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Unable to load live gold price.')
  }

  return data
}
