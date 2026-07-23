import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:3000/api/v1"
).replace(/\/$/, "");

const runtimeFetch = (...args) =>
  isTauri() ? tauriFetch(...args) : globalThis.fetch(...args);

export class ApiError extends Error {
  constructor(message, { status = 0, errors = [] } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, options = {}) {
  const headers = options.body
    ? { "Content-Type": "application/json", ...options.headers }
    : options.headers;

  let response;

  try {
    response = await runtimeFetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Could not reach the SnipStack API. Check that the Rails server is running.",
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errors = Array.isArray(errorBody.errors) ? errorBody.errors : [];
    const message =
      errors[0] ||
      errorBody.error ||
      `The API returned an error (${response.status}).`;

    throw new ApiError(message, { status: response.status, errors });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchSnippets(options = {}) {
  return request("/snippets", options);
}

export function createSnippet(snippet) {
  return request("/snippets", {
    method: "POST",
    body: JSON.stringify({ snippet }),
  });
}

export function updateSnippet(id, snippet) {
  return request(`/snippets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ snippet }),
  });
}

export function deleteSnippet(id) {
  return request(`/snippets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
