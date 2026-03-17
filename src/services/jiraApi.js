const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    return '' // Use Vite proxy in dev to avoid CORS
  }
  const domain = import.meta.env.VITE_JIRA_DOMAIN || 'manojcursoragentapp.atlassian.net'
  return `https://${domain}`
}

const getAuthHeader = () => {
  const email = import.meta.env.VITE_JIRA_EMAIL
  const token = import.meta.env.VITE_JIRA_API_TOKEN
  if (!email || !token) {
    throw new Error('Missing VITE_JIRA_EMAIL or VITE_JIRA_API_TOKEN in .env')
  }
  const encoded = btoa(`${email}:${token}`)
  return `Basic ${encoded}`
}

export async function fetchProjects({ startAt = 0, maxResults = 50 } = {}) {
  const baseUrl = getBaseUrl()
  const params = new URLSearchParams({
    expand: 'lead',
    maxResults: String(maxResults),
    startAt: String(startAt),
    orderBy: 'name',
  })

  const url = `${baseUrl}/rest/api/3/project/search?${params}`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: getAuthHeader(),
    },
  })

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid JIRA credentials. Check .env (email, API token).')
    if (res.status === 403) throw new Error('Access denied to JIRA.')
    throw new Error(`JIRA API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}
