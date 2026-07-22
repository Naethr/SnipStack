import {
  PiCopy,
  PiPencilSimple,
  PiTrash,
  PiWarningCircle,
  PiX,
} from "react-icons/pi";
import { LanguageIcon } from "../utils/languageIcons";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : dateFormatter.format(date);
}

function SnippetCard({
  snippet,
  isEditing,
  isDeletePending,
  isDeleting,
  onEdit,
  onCopy,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}) {
  const tags = (snippet.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <article className={`snippet-card${isEditing ? " snippet-card--editing" : ""}`}>
      <div className="snippet-card__rail" aria-hidden="true">
        <span>{String(snippet.id).padStart(2, "0")}</span>
      </div>

      <div className="snippet-card__body">
        <header className="snippet-card__header">
          <div>
            <div className="snippet-card__meta">
              <span className="language-label">
                <LanguageIcon language={snippet.language} aria-hidden="true" />
                {snippet.language}
              </span>
              <time dateTime={snippet.created_at}>
                Saved {formatDate(snippet.created_at)}
              </time>
            </div>
            <h2>{snippet.title}</h2>
            {snippet.description && <p>{snippet.description}</p>}
          </div>

          <div className="card-actions" aria-label={`Actions for ${snippet.title}`}>
            <button type="button" onClick={() => onCopy(snippet)}>
              <PiCopy aria-hidden="true" />
              Copy
            </button>
            <button type="button" onClick={() => onEdit(snippet)}>
              <PiPencilSimple aria-hidden="true" />
              Edit
            </button>
            <button
              className="card-action--danger"
              type="button"
              onClick={() => onRequestDelete(snippet.id)}
            >
              <PiTrash aria-hidden="true" />
              Delete
            </button>
          </div>
        </header>

        <div className="code-window">
          <div className="code-window__bar">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <p>{snippet.language.toLowerCase()}</p>
          </div>
          <pre tabIndex="0">
            <code>{snippet.code}</code>
          </pre>
        </div>

        {tags.length > 0 && (
          <ul className="tag-list" aria-label="Tags">
            {tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        )}

        {isDeletePending && (
          <div className="delete-confirmation" role="alert">
            <div>
              <PiWarningCircle aria-hidden="true" />
              <span>
                <strong>Delete this snippet?</strong>
                <small>This cannot be undone.</small>
              </span>
            </div>
            <div>
              <button
                className="button button--danger"
                type="button"
                onClick={() => onConfirmDelete(snippet.id)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                className="button button--text"
                type="button"
                onClick={onCancelDelete}
                disabled={isDeleting}
              >
                <PiX aria-hidden="true" />
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default SnippetCard;
