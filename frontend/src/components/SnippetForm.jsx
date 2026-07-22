import { PiFloppyDisk, PiSpinnerGap, PiX } from "react-icons/pi";

const LANGUAGE_SUGGESTIONS = [
  "Bash",
  "CSS",
  "Go",
  "HTML",
  "Java",
  "JavaScript",
  "JSON",
  "Python",
  "Ruby",
  "Rust",
  "SQL",
  "TypeScript",
];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <span id={id} className="field-error">
      {message}
    </span>
  );
}

function SnippetForm({
  draft,
  mode,
  fieldErrors,
  apiErrors,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}) {
  const isEditing = mode === "edit";

  function updateField(event) {
    onChange(event.target.name, event.target.value);
  }

  return (
    <form className="snippet-form" onSubmit={onSubmit} noValidate>
      <div className="form-heading">
        <div>
          <p className="eyebrow">{isEditing ? "Edit mode" : "New entry"}</p>
          <h2>{isEditing ? "Refine this snippet" : "Add to your stack"}</h2>
        </div>
        <span className="form-heading__shortcut" aria-hidden="true">
          {isEditing ? "PATCH" : "POST"}
        </span>
      </div>

      {apiErrors.length > 0 && (
        <div className="form-errors" role="alert">
          <p>Could not save this snippet:</p>
          <ul>
            {apiErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="field-group">
        <label htmlFor="snippet-title">
          Title <span aria-hidden="true">*</span>
        </label>
        <input
          id="snippet-title"
          name="title"
          type="text"
          value={draft.title}
          onChange={updateField}
          maxLength="100"
          placeholder="e.g. Retry a fetch request"
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "title-error" : undefined}
          required
        />
        <FieldError id="title-error" message={fieldErrors.title} />
      </div>

      <div className="field-group">
        <label htmlFor="snippet-description">Description</label>
        <textarea
          id="snippet-description"
          name="description"
          value={draft.description}
          onChange={updateField}
          maxLength="500"
          rows="3"
          placeholder="When and why this code is useful"
        />
      </div>

      <div className="field-group">
        <label htmlFor="snippet-language">
          Language <span aria-hidden="true">*</span>
        </label>
        <input
          id="snippet-language"
          name="language"
          type="text"
          list="language-suggestions"
          value={draft.language}
          onChange={updateField}
          maxLength="50"
          placeholder="JavaScript"
          aria-invalid={Boolean(fieldErrors.language)}
          aria-describedby={fieldErrors.language ? "language-error" : undefined}
          required
        />
        <datalist id="language-suggestions">
          {LANGUAGE_SUGGESTIONS.map((language) => (
            <option key={language} value={language} />
          ))}
        </datalist>
        <FieldError id="language-error" message={fieldErrors.language} />
      </div>

      <div className="field-group field-group--code">
        <div className="field-label-row">
          <label htmlFor="snippet-code">
            Code <span aria-hidden="true">*</span>
          </label>
          <span>{draft.code.length.toLocaleString()} chars</span>
        </div>
        <textarea
          id="snippet-code"
          name="code"
          value={draft.code}
          onChange={updateField}
          maxLength="20000"
          rows="11"
          placeholder={'const useful = () => {\n  return "save me";\n};'}
          spellCheck="false"
          aria-invalid={Boolean(fieldErrors.code)}
          aria-describedby={fieldErrors.code ? "code-error" : undefined}
          required
        />
        <FieldError id="code-error" message={fieldErrors.code} />
      </div>

      <div className="field-group">
        <label htmlFor="snippet-tags">Tags</label>
        <input
          id="snippet-tags"
          name="tags"
          type="text"
          value={draft.tags}
          onChange={updateField}
          maxLength="300"
          placeholder="fetch, resilience, async"
        />
        <span className="field-hint">Separate tags with commas.</span>
      </div>

      <div className="form-actions">
        <button
          className="button button--primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <PiSpinnerGap className="icon-spin" aria-hidden="true" />
          ) : (
            <PiFloppyDisk aria-hidden="true" />
          )}
          {isSubmitting
            ? "Saving…"
            : isEditing
              ? "Save changes"
              : "Save snippet"}
        </button>
        {isEditing && (
          <button
            className="button button--text"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <PiX aria-hidden="true" />
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}

export default SnippetForm;
