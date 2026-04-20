import 'dotenv/config'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

const domain = process.env.JIRA_DOMAIN || process.env.VITE_JIRA_DOMAIN
const email = process.env.JIRA_EMAIL || process.env.VITE_JIRA_EMAIL
const token = process.env.JIRA_API_TOKEN || process.env.VITE_JIRA_API_TOKEN
const metalsApiKey = process.env.METALS_DEV_API_KEY

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  next()
})

async function fetchJiraProjects(startAt, maxResults) {
  const params = new URLSearchParams({
    expand: 'lead',
    maxResults: String(maxResults),
    startAt: String(startAt),
    orderBy: 'name',
  })
  const auth = Buffer.from(`${email}:${token}`).toString('base64')
  const res = await fetch(`https://${domain}/rest/api/3/project/search?${params}`, {
    headers: { Accept: 'application/json', Authorization: `Basic ${auth}` },
  })
  const data = await res.json()
  if (!res.ok) throw data
  return data
}

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

app.get('/api/projects', async (req, res) => {
  if (!domain || !email || !token) {
    return res.status(500).json({ error: 'Server misconfigured: JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN required in .env' })
  }
  const q = (req.query.q || '').trim().toLowerCase()
  try {
    if (q) {
      const matches = []
      let startAt = 0
      const pageSize = 50
      let isLast = false
      while (!isLast) {
        const data = await fetchJiraProjects(startAt, pageSize)
        const batch = (data.values || []).filter(
          (p) => p.name?.toLowerCase().includes(q) || p.key?.toLowerCase().includes(q)
        )
        matches.push(...batch)
        isLast = data.isLast ?? true
        startAt += pageSize
      }
      res.json({ values: matches, total: matches.length })
    } else {
      const data = await fetchJiraProjects(
        parseInt(req.query.startAt, 10) || 0,
        parseInt(req.query.maxResults, 10) || 50
      )
      res.json(data)
    }
  } catch (err) {
    if (typeof err === 'object' && err.errorMessages) {
      return res.status(400).json(err)
    }
    res.status(500).json({ error: err?.message || String(err) })
  }
})

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

app.listen(PORT, () => console.log(`JIRA proxy on http://localhost:${PORT}`))
