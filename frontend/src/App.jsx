import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PiArrowCounterClockwise,
  PiPlus,
  PiSpinnerGap,
  PiWarningCircle,
} from "react-icons/pi";
import {
  ApiError,
  createSnippet,
  deleteSnippet,
  fetchSnippets,
  updateSnippet,
} from "./api/snippetsApi";
import EmptyState from "./components/EmptyState";
import SearchControls from "./components/SearchControls";
import SnippetCard from "./components/SnippetCard";
import SnippetForm from "./components/SnippetForm";
import StatusMessage from "./components/StatusMessage";

const EMPTY_DRAFT = {
  title: "",
  description: "",
  language: "",
  code: "",
  tags: "",
};

function validateDraft(draft) {
  const errors = {};

  if (!draft.title.trim()) errors.title = "Add a title.";
  if (!draft.language.trim()) errors.language = "Add a language.";
  if (!draft.code.trim()) errors.code = "Add the code you want to save.";

  return errors;
}

function App() {
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiErrors, setApiErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deletePendingId, setDeletePendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null);
  const messageTimer = useRef(null);

  const announce = useCallback((type, text) => {
    window.clearTimeout(messageTimer.current);
    setMessage({ type, text });
    messageTimer.current = window.setTimeout(() => setMessage(null), 3200);
  }, []);

  async function loadSnippets() {
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await fetchSnippets();
      setSnippets(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    fetchSnippets({ signal: controller.signal })
      .then((data) => setSnippets(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(messageTimer.current);
    },
    [],
  );

  useEffect(() => {
    function focusSearch(event) {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA";

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        document.getElementById("snippet-search")?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const languages = useMemo(() => {
    const unique = new Map();
    snippets.forEach((snippet) => {
      const value = snippet.language?.trim();
      if (value) unique.set(value.toLowerCase(), value);
    });
    return [...unique.values()].sort((a, b) => a.localeCompare(b));
  }, [snippets]);

  const filteredSnippets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return snippets.filter((snippet) => {
      const matchesLanguage =
        !languageFilter ||
        snippet.language?.toLowerCase() === languageFilter.toLowerCase();
      const searchableText = [
        snippet.title,
        snippet.description,
        snippet.language,
        snippet.code,
        snippet.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesLanguage &&
        (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [languageFilter, query, snippets]);

  function focusComposer() {
    requestAnimationFrame(() => {
      document.getElementById("snippet-title")?.focus();
      document
        .getElementById("snippet-composer")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function startCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFieldErrors({});
    setApiErrors([]);
    focusComposer();
  }

  function startEdit(snippet) {
    setEditingId(snippet.id);
    setDraft({
      title: snippet.title || "",
      description: snippet.description || "",
      language: snippet.language || "",
      code: snippet.code || "",
      tags: snippet.tags || "",
    });
    setFieldErrors({});
    setApiErrors([]);
    setDeletePendingId(null);
    focusComposer();
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
    setApiErrors([]);
  }

  async function saveSnippet(event) {
    event.preventDefault();
    const validationErrors = validateDraft(draft);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setApiErrors([]);
      document
        .querySelector('[aria-invalid="true"]')
        ?.focus({ preventScroll: false });
      return;
    }

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      language: draft.language.trim(),
      code: draft.code,
      tags: draft.tags.trim(),
    };

    setIsSaving(true);
    setFieldErrors({});
    setApiErrors([]);

    try {
      if (editingId) {
        const updatedSnippet = await updateSnippet(editingId, payload);
        setSnippets((current) =>
          current.map((snippet) =>
            snippet.id === editingId ? updatedSnippet : snippet,
          ),
        );
        announce("success", `“${updatedSnippet.title}” was updated.`);
      } else {
        const createdSnippet = await createSnippet(payload);
        setSnippets((current) => [createdSnippet, ...current]);
        announce("success", `“${createdSnippet.title}” was added to your stack.`);
      }

      setEditingId(null);
      setDraft(EMPTY_DRAFT);
    } catch (error) {
      const errors =
        error instanceof ApiError && error.errors.length > 0
          ? error.errors
          : [error.message];
      setApiErrors(errors);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeSnippet(id) {
    setDeletingId(id);

    try {
      const snippet = snippets.find((item) => item.id === id);
      await deleteSnippet(id);
      setSnippets((current) => current.filter((item) => item.id !== id));
      setDeletePendingId(null);

      if (editingId === id) {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
      }

      announce("success", `“${snippet?.title || "Snippet"}” was deleted.`);
    } catch (error) {
      announce("error", error.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function copyCode(snippet) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is not available in this browser.");
      }
      await navigator.clipboard.writeText(snippet.code);
      announce("success", `Code from “${snippet.title}” copied.`);
    } catch (error) {
      announce("error", error.message || "Could not copy the code.");
    }
  }

  function clearFilters() {
    setQuery("");
    setLanguageFilter("");
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to snippets
      </a>
      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="#main-content" aria-label="SnipStack home">
            <span className="brand__mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <strong>SnipStack</strong>
              <small>Your useful code, within reach.</small>
            </span>
          </a>

          <div className="topbar__stats" aria-label="Library statistics">
            <span>
              <strong>{snippets.length}</strong> snippets
            </span>
            <span>
              <strong>{languages.length}</strong> languages
            </span>
          </div>

          <button className="button button--primary topbar__action" onClick={startCreate}>
            <PiPlus aria-hidden="true" /> New snippet
          </button>
        </header>

        <main id="main-content" className="workspace">
          <aside id="snippet-composer" className="composer-panel">
            <SnippetForm
              draft={draft}
              mode={editingId ? "edit" : "create"}
              fieldErrors={fieldErrors}
              apiErrors={apiErrors}
              isSubmitting={isSaving}
              onChange={updateDraft}
              onSubmit={saveSnippet}
              onCancel={startCreate}
            />
          </aside>

          <section className="library" aria-labelledby="library-title">
            <div className="library__heading">
              <div>
                <p className="eyebrow">Local knowledge base</p>
                <h1 id="library-title">Snippet library</h1>
              </div>
              <p>Search the code you saved before rewriting it.</p>
            </div>

            <SearchControls
              query={query}
              language={languageFilter}
              languages={languages}
              resultCount={filteredSnippets.length}
              totalCount={snippets.length}
              onQueryChange={setQuery}
              onLanguageChange={setLanguageFilter}
              onClear={clearFilters}
            />

            {loadError && !isLoading && (
              <section className="load-error" role="alert">
                <div>
                  <PiWarningCircle aria-hidden="true" />
                  <div>
                    <h2>Could not load your snippets</h2>
                    <p>{loadError}</p>
                  </div>
                </div>
                <button className="button button--secondary" onClick={() => loadSnippets()}>
                  <PiArrowCounterClockwise aria-hidden="true" />
                  Try again
                </button>
              </section>
            )}

            {isLoading && (
              <div aria-label="Loading snippets" aria-busy="true">
                <p className="loading-label">
                  <PiSpinnerGap aria-hidden="true" /> Loading your library
                </p>
                <div className="snippet-list">
                  {[1, 2, 3].map((item) => (
                    <div className="snippet-skeleton" key={item}>
                      <span />
                      <span />
                      <span />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && !loadError && filteredSnippets.length === 0 && (
              <EmptyState
                isFiltered={Boolean(query || languageFilter)}
                onClearFilters={clearFilters}
                onCreate={startCreate}
              />
            )}

            {!isLoading && !loadError && filteredSnippets.length > 0 && (
              <div className="snippet-list">
                {filteredSnippets.map((snippet) => (
                  <SnippetCard
                    key={snippet.id}
                    snippet={snippet}
                    isEditing={editingId === snippet.id}
                    isDeletePending={deletePendingId === snippet.id}
                    isDeleting={deletingId === snippet.id}
                    onEdit={startEdit}
                    onCopy={copyCode}
                    onRequestDelete={setDeletePendingId}
                    onCancelDelete={() => setDeletePendingId(null)}
                    onConfirmDelete={removeSnippet}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <footer className="app-footer">
          <span>SnipStack / developer memory, indexed</span>
          <span>API status · {loadError ? "offline" : "connected"}</span>
        </footer>
      </div>

      <StatusMessage message={message} onDismiss={() => setMessage(null)} />
    </>
  );
}

export default App;
