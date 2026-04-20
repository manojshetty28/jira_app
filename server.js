import 'dotenv/config'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

const metalsApiKey = process.env.METALS_DEV_API_KEY

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  next()
})

async function fetchGoldSpotPrice() {
  const params = new URLSearchParams({
    api_key: metalsApiKey,
    metal: 'gold',
    currency: 'USD',
  })

  const response = await fetch(`https://api.metals.dev/v1/metal/spot?${params}`, {
    headers: { Accept: 'application/json' },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.status === 'failure') {
    throw new Error(data.error || data.message || 'Unable to fetch gold price from Metals.dev.')
  }

  const rate = data.rate || {}
  return {
    source: 'Metals.dev',
    metal: data.metal || 'gold',
    currency: data.currency || 'USD',
    unit: data.unit || 'toz',
    timestamp: data.timestamp || new Date().toISOString(),
    price: rate.price ?? null,
    ask: rate.ask ?? null,
    bid: rate.bid ?? null,
    high: rate.high ?? null,
    low: rate.low ?? null,
    change: rate.change ?? null,
    changePercent: rate.change_percent ?? null,
  }
}

app.get('/api/gold-price', async (_req, res) => {
  if (!metalsApiKey) {
    return res.status(503).json({
      error: 'Live gold price is not configured yet.',
      code: 'METALS_DEV_API_KEY_MISSING',
      setupHint: 'Add METALS_DEV_API_KEY to .env and restart the dev server.',
    })
  }

  try {
    const data = await fetchGoldSpotPrice()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Unable to fetch gold price.' })
  }
})

app.listen(PORT, () => console.log(`Gold price proxy on http://localhost:${PORT}`))
