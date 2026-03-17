function Pagination({ page, total, pageSize, onPageChange, hideWhenSearching }) {
  if (hideWhenSearching || total <= pageSize) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasPrev = page > 0
  const hasNext = page < totalPages - 1

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrev}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span className="page-num" aria-current="page">
        {page + 1}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  )
}

export default Pagination
