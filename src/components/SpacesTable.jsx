function LeadCell({ lead }) {
  if (!lead) return <span className="lead-empty">—</span>
  const initials = lead.name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return (
    <div className="lead-cell">
      <span className="lead-avatar" title={lead.name}>
        {lead.avatar ? (
          <img src={lead.avatar} alt="" width={24} height={24} />
        ) : (
          initials
        )}
      </span>
      <span className="lead-name">{lead.name}</span>
    </div>
  )
}

function SpacesTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="spaces-table">
        <thead>
          <tr>
            <th className="col-star" aria-label="Favorite" />
            <th className="col-name">
              Name <span className="sort-desc" aria-hidden>▼</span>
            </th>
            <th className="col-key">Key</th>
            <th className="col-type">Type</th>
            <th className="col-lead">Lead</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="col-star">
                <span className="star" aria-hidden>☆</span>
              </td>
              <td className="col-name">
                <a href={row.url} target="_blank" rel="noopener noreferrer" className="project-link">
                  <span className="project-icon" aria-hidden>◫</span>
                  {row.name}
                </a>
              </td>
              <td className="col-key">{row.key}</td>
              <td className="col-type">{row.type}</td>
              <td className="col-lead">
                <LeadCell lead={row.lead} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SpacesTable
