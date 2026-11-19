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

async function request(path, { token, ...options } = {}, { authenticated = false, bearer = false } = {}) {
  if (authenticated && !token) {
    throw new ApiError("Sign in to access your snippets.", { status: 401 });
  }

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response;
  try {
    response = await runtimeFetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: Object.keys(headers).length ? headers : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "Could not reach the SnipStack API. Check that the Rails server is running.",
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errors = Array.isArray(errorBody.errors) ? errorBody.errors : [];
    const message =
      errors[0] || errorBody.error || `The API returned an error (${response.status}).`;
    throw new ApiError(message, { status: response.status, errors });
  }

  if (response.status === 204) return null;

  const body = await response.json();
  if (!bearer) return body;

  const authorization = response.headers.get("Authorization");
  const match = /^Bearer\s+(\S+)$/i.exec(authorization || "");
  if (!match) {
    throw new ApiError("The API did not provide a readable sign-in token.");
  }
  return { user: body.user, token: match[1] };
}

export function registerUser(email, password, passwordConfirmation) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ user: { email, password, password_confirmation: passwordConfirmation } }),
  }, { bearer: true });
}

export function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ user: { email, password } }),
  }, { bearer: true });
}

export function currentUser(token) {
  return request("/auth/me", { token }, { authenticated: true });
}

export function logoutUser(token) {
  return request("/auth/logout", { method: "DELETE", token }, { authenticated: true });
}

export function fetchSnippets(token, options = {}) {
  return request("/snippets", { ...options, token }, { authenticated: true });
}

export function createSnippet(token, snippet) {
  return request("/snippets", {
    method: "POST",
    token,
    body: JSON.stringify({ snippet }),
  }, { authenticated: true });
}

export function updateSnippet(token, id, snippet) {
  return request(`/snippets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ snippet }),
  }, { authenticated: true });
}

export function deleteSnippet(token, id) {
  return request(`/snippets/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  }, { authenticated: true });
}
