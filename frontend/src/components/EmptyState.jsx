import { PiBracketsCurly, PiMagnifyingGlass, PiPlus, PiX } from "react-icons/pi";

function EmptyState({ isFiltered, onClearFilters, onCreate }) {
  return (
    <section className="empty-state">
      <div className="empty-state__glyph" aria-hidden="true">
        {isFiltered ? <PiMagnifyingGlass /> : <PiBracketsCurly />}
      </div>
      <p className="eyebrow">{isFiltered ? "No match" : "Fresh stack"}</p>
      <h2>
        {isFiltered
          ? "Nothing fits those filters"
          : "Your first useful snippet belongs here"}
      </h2>
      <p>
        {isFiltered
          ? "Try a broader search or return to the complete library."
          : "Save the code you reach for twice, then find it in seconds."}
      </p>
      <button
        className="button button--primary"
        type="button"
        onClick={isFiltered ? onClearFilters : onCreate}
      >
        {isFiltered ? <PiX aria-hidden="true" /> : <PiPlus aria-hidden="true" />}
        {isFiltered ? "Clear filters" : "Create a snippet"}
      </button>
    </section>
  );
}

export default EmptyState;
