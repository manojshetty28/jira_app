function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden>🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        aria-label="Search spaces"
      />
    </div>
  )
}

export default SearchBar
