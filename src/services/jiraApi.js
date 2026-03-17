/**
 * Fetches projects via server-side proxy. Credentials are never sent to the client.
 */
export async function fetchProjects({ startAt = 0, maxResults = 50 } = {}) {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
    startAt: String(startAt),
  })
  const res = await fetch(`/api/projects?${params}`, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg = data.error || res.statusText
    if (res.status === 401) throw new Error('Invalid JIRA credentials. Check server .env (JIRA_EMAIL, JIRA_API_TOKEN).')
    if (res.status === 403) throw new Error('Access denied to JIRA.')
    throw new Error(`JIRA API error: ${res.status} ${msg}`)
  }

  return res.json()
}
