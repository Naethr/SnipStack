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
  currentUser,
  deleteSnippet,
  fetchSnippets,
  loginUser,
  logoutUser,
  registerUser,
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
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  const sessionVersion = useRef(0);
  const [authMode, setAuthMode] = useState("login");
  const [authDraft, setAuthDraft] = useState({
    email: "",
    password: "",
    confirmation: "",
  });
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const clearSession = useCallback((notice) => {
    sessionVersion.current += 1;
    sessionRef.current = null;
    setSession(null);
    setSnippets([]);
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setDeletePendingId(null);
    setFieldErrors({});
    setApiErrors([]);
    setLoadError("");
    setIsLoading(false);
    setAuthDraft((current) => ({ ...current, password: "", confirmation: "" }));
    setAuthNotice(notice);
    setMessage(null);
  }, []);

  const handleSessionError = useCallback((error, version) => {
    if (error instanceof ApiError && error.status === 401 &&
        version === sessionVersion.current) {
      clearSession("Your session has expired. Sign in again to continue.");
      return true;
    }
    return false;
  }, [clearSession]);

  async function submitAuth(event) {
    event.preventDefault();
    let verifying = false;
    setAuthError("");
    setAuthNotice("");
    setIsAuthenticating(true);
    try {
      const result = authMode === "register"
        ? await registerUser(authDraft.email.trim(), authDraft.password, authDraft.confirmation)
        : await loginUser(authDraft.email.trim(), authDraft.password);
      verifying = true;
      const { user } = await currentUser(result.token);
      sessionVersion.current += 1;
      sessionRef.current = { token: result.token, user };
      setIsLoading(true);
      setSession(sessionRef.current);
      setAuthDraft({ email: "", password: "", confirmation: "" });
      setQuery("");
      setLanguageFilter("");
    } catch (error) {
      setAuthError(
        error instanceof ApiError && error.status === 401 && verifying
            ? "Your session could not be verified. Sign in again."
          : error instanceof ApiError && error.status === 401 && authMode === "login"
            ? "Invalid email or password."
            : error.message,
      );
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function signOut() {
    const activeSession = sessionRef.current;
    if (!activeSession) return;
    setIsLoggingOut(true);
    let notice = "You have signed out.";
    try {
      await logoutUser(activeSession.token);
    } catch (error) {
      notice = error instanceof ApiError && error.status === 401
        ? "Your session was already invalid. Sign in again to continue."
        : "Signed out here, but the API could not confirm logout.";
    } finally {
      clearSession(notice);
      setIsLoggingOut(false);
    }
  }

  async function loadSnippets() {
    const activeSession = sessionRef.current;
    if (!activeSession) return;
    const version = sessionVersion.current;
    setIsLoading(true);
    setLoadError("");

    try {
      const data = await fetchSnippets(activeSession.token);
      if (version === sessionVersion.current) {
        setSnippets(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (version === sessionVersion.current && !handleSessionError(error, version)) {
        setLoadError(error.message);
      }
    } finally {
      if (version === sessionVersion.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    const version = sessionVersion.current;
    const controller = new AbortController();
    fetchSnippets(session.token, { signal: controller.signal })
      .then((data) => {
        if (version === sessionVersion.current && !controller.signal.aborted) {
          setSnippets(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError" && version === sessionVersion.current &&
            !controller.signal.aborted && !handleSessionError(error, version)) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted && version === sessionVersion.current) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [session, handleSessionError]);

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
    const activeSession = sessionRef.current;
    if (!activeSession) return;
    const version = sessionVersion.current;
    const validationErrors = validateDraft(draft);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setApiErrors([]);
      const firstInvalidField = Object.keys(validationErrors)[0];
      requestAnimationFrame(() => {
        document
          .getElementById(`snippet-${firstInvalidField}`)
          ?.focus({ preventScroll: false });
      });
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
        const updatedSnippet = await updateSnippet(activeSession.token, editingId, payload);
        if (version !== sessionVersion.current) return;
        setSnippets((current) =>
          current.map((snippet) =>
            snippet.id === editingId ? updatedSnippet : snippet,
          ),
        );
        announce("success", `“${updatedSnippet.title}” was updated.`);
      } else {
        const createdSnippet = await createSnippet(activeSession.token, payload);
        if (version !== sessionVersion.current) return;
        setSnippets((current) => [createdSnippet, ...current]);
        announce("success", `“${createdSnippet.title}” was added to your stack.`);
      }

      setEditingId(null);
      setDraft(EMPTY_DRAFT);
    } catch (error) {
      if (version !== sessionVersion.current || handleSessionError(error, version)) return;
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
    const activeSession = sessionRef.current;
    if (!activeSession) return;
    const version = sessionVersion.current;
    setDeletingId(id);

    try {
      const snippet = snippets.find((item) => item.id === id);
      await deleteSnippet(activeSession.token, id);
      if (version !== sessionVersion.current) return;
      setSnippets((current) => current.filter((item) => item.id !== id));
      setDeletePendingId(null);

      if (editingId === id) {
        setEditingId(null);
        setDraft(EMPTY_DRAFT);
      }

      announce("success", `“${snippet?.title || "Snippet"}” was deleted.`);
    } catch (error) {
      if (version === sessionVersion.current && !handleSessionError(error, version)) {
        announce("error", error.message);
      }
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

          {session && (
            <div className="topbar__session">
              <span className="session-email">{session.user.email}</span>
              <button className="button button--secondary" onClick={signOut} disabled={isLoggingOut}>
                {isLoggingOut ? "Signing out…" : "Sign out"}
              </button>
              <button className="button button--primary topbar__action" onClick={startCreate}>
                <PiPlus aria-hidden="true" /> New snippet
              </button>
            </div>
          )}
        </header>

        {!session ? (
          <main id="main-content" className="auth-layout">
            <section className="auth-panel" aria-labelledby="auth-title">
              <p className="eyebrow">Your code library</p>
              <h1 id="auth-title">{authMode === "login" ? "Sign in" : "Create an account"}</h1>
              <p>Sign in to view and manage your snippets.</p>
              {authNotice && <p className="auth-notice" role="status">{authNotice}</p>}
              {authError && <p className="form-errors" role="alert">{authError}</p>}
              <form onSubmit={submitAuth}>
                <div className="field-group">
                  <label htmlFor="auth-email">Email</label>
                  <input id="auth-email" type="email" autoComplete="email" required
                    value={authDraft.email}
                    onChange={(event) => setAuthDraft((current) => ({ ...current, email: event.target.value }))} />
                </div>
                <div className="field-group">
                  <label htmlFor="auth-password">Password</label>
                  <input id="auth-password" type="password"
                    autoComplete={authMode === "login" ? "current-password" : "new-password"}
                    minLength={6} required value={authDraft.password}
                    onChange={(event) => setAuthDraft((current) => ({ ...current, password: event.target.value }))} />
                </div>
                {authMode === "register" && (
                  <div className="field-group">
                    <label htmlFor="auth-confirmation">Confirm password</label>
                    <input id="auth-confirmation" type="password" autoComplete="new-password"
                      minLength={6} required value={authDraft.confirmation}
                      onChange={(event) => setAuthDraft((current) => ({ ...current, confirmation: event.target.value }))} />
                  </div>
                )}
                <button className="button button--primary" type="submit" disabled={isAuthenticating}>
                  {isAuthenticating ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"}
                </button>
              </form>
              <button className="button button--text auth-switch" type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError("");
                  setAuthDraft((current) => ({ ...current, password: "", confirmation: "" }));
                }}>
                {authMode === "login" ? "Create an account" : "Already have an account? Sign in"}
              </button>
              <p className="auth-hint">Sessions last until this app is reloaded or closed.</p>
            </section>
          </main>
        ) : (
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
        )}

        <footer className="app-footer">
          <span>SnipStack / developer memory, indexed</span>
          <span>API status · {loadError ? "offline" : session ? "connected" : "sign in required"}</span>
        </footer>
      </div>

      <StatusMessage message={message} onDismiss={() => setMessage(null)} />
    </>
  );
}

export default App;
