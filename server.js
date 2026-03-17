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

app.get('/api/projects', async (req, res) => {
  if (!domain || !email || !token) {
    return res.status(500).json({ error: 'Server misconfigured: JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN required in .env' })
  }
  try {
    const params = new URLSearchParams({
      expand: 'lead',
      maxResults: req.query.maxResults || '50',
      startAt: req.query.startAt || '0',
      orderBy: 'name',
    })
    const auth = Buffer.from(`${email}:${token}`).toString('base64')
    const jiraRes = await fetch(`https://${domain}/rest/api/3/project/search?${params}`, {
      headers: { Accept: 'application/json', Authorization: `Basic ${auth}` },
    })
    const data = await jiraRes.json()
    if (!jiraRes.ok) {
      return res.status(jiraRes.status).json(data)
    }
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => console.log(`JIRA proxy on http://localhost:${PORT}`))
