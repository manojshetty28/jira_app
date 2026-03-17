import { useState, useEffect, useCallback } from 'react'
import { fetchProjects } from '../services/jiraApi'
import SpacesHeader from './SpacesHeader'
import SearchBar from './SearchBar'
import FilterDropdown from './FilterDropdown'
import SpacesTable from './SpacesTable'
import Pagination from './Pagination'

const PAGE_SIZE = 50

function getProjectType(project) {
  if (project.simplified) return 'Team-managed software'
  const key = project.projectTypeKey || 'software'
  const map = { software: 'Team-managed software', business: 'Business', service_desk: 'Service desk' }
  return map[key] || key
}

export default function SpacesPage() {
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProjects({
        startAt: page * PAGE_SIZE,
        maxResults: PAGE_SIZE,
        query: search,
      })
      const list = data.values || []
      setProjects(list)
      setTotal(data.total ?? list.length)
    } catch (err) {
      setError(err.message)
      setProjects([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  useEffect(() => {
    setPage(0)
  }, [search])

  const rows = projects.map((p) => ({
    id: p.id,
    name: p.name,
    key: p.key,
    type: getProjectType(p),
    lead: p.lead ? { name: p.lead.displayName, avatar: p.lead.avatarUrls?.['48x48'] } : null,
    url: `https://${import.meta.env.VITE_JIRA_DOMAIN ?? 'manojcursoragentapp.atlassian.net'}/browse/${p.key}`,
  }))

  return (
    <div className="spaces-page">
      <SpacesHeader />
      <SearchBar value={search} onChange={setSearch} placeholder="Search spaces" />
      <FilterDropdown />
      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loading">Loading spaces...</div>
      ) : (
        <>
          <SpacesTable rows={rows} />
          <Pagination
            page={search ? 0 : page}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            hideWhenSearching={!!search}
          />
        </>
      )}
    </div>
  )
}
