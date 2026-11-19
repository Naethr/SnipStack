import { PiFunnel, PiMagnifyingGlass, PiX } from "react-icons/pi";

function SearchControls({
  query,
  language,
  languages,
  resultCount,
  totalCount,
  onQueryChange,
  onLanguageChange,
  onClear,
}) {
  const hasFilters = Boolean(query || language);

  return (
    <section className="search-controls" aria-label="Search snippets">
      <div className="search-field">
        <PiMagnifyingGlass aria-hidden="true" />
        <label className="sr-only" htmlFor="snippet-search">
          Search snippets
        </label>
        <input
          id="snippet-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search title, code, tags…"
          autoComplete="off"
        />
        <kbd aria-hidden="true">/</kbd>
      </div>

      <div className="filter-field">
        <label htmlFor="language-filter">
          <PiFunnel aria-hidden="true" /> Language
        </label>
        <select
          id="language-filter"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          <option value="">All languages</option>
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="search-summary" aria-live="polite">
        <span>
          {resultCount} of {totalCount}
        </span>
        <button type="button" onClick={onClear} disabled={!hasFilters}>
          <PiX aria-hidden="true" />
          Clear filters
        </button>
      </div>
    </section>
  );
}

export default SearchControls;
