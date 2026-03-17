import 'dotenv/config'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

const domain = process.env.JIRA_DOMAIN || process.env.VITE_JIRA_DOMAIN
const email = process.env.JIRA_EMAIL || process.env.VITE_JIRA_EMAIL
const token = process.env.JIRA_API_TOKEN || process.env.VITE_JIRA_API_TOKEN

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

app.listen(PORT, () => console.log(`JIRA proxy on http://localhost:${PORT}`))
