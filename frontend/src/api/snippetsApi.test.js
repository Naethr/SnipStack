import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
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
} from "./snippetsApi";

vi.mock("@tauri-apps/api/core", () => ({ isTauri: vi.fn(() => false) }));
vi.mock("@tauri-apps/plugin-http", () => ({ fetch: vi.fn() }));

const token = "test-jwt";
const baseUrl = "http://127.0.0.1:3000/api/v1";

function response(body, { status = 200, authorization } = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
  });
}

describe("snippetsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTauri.mockReturnValue(false);
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["register", () => registerUser("a@example.com", "password", "password"), 201, "/auth/register"],
    ["login", () => loginUser("a@example.com", "password"), 200, "/auth/login"],
  ])("reads the %s token from Authorization, not JSON", async (_, action, status, path) => {
    const fetchMock = vi.fn().mockResolvedValue(response(
      { user: { id: 1, email: "a@example.com" }, token: "wrong-source" },
      { status, authorization: "Bearer test-jwt" },
    ));
    vi.stubGlobal("fetch", fetchMock);

    await expect(action()).resolves.toEqual({
      user: { id: 1, email: "a@example.com" },
      token,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}${path}`,
      expect.objectContaining({ method: "POST", headers: { "Content-Type": "application/json" } }),
    );
  });

  it("sends the backend's registration payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(
      { user: { id: 1, email: "a@example.com" } },
      { status: 201, authorization: "Bearer test-jwt" },
    ));
    vi.stubGlobal("fetch", fetchMock);
    await registerUser("a@example.com", "password", "password");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      user: { email: "a@example.com", password: "password", password_confirmation: "password" },
    });
  });

  it("fails safely if Authorization is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      response({ user: { id: 1 }, token: "wrong-source" }),
    ));
    await expect(loginUser("a@example.com", "password")).rejects.toMatchObject({
      name: "ApiError",
      message: "The API did not provide a readable sign-in token.",
    });
  });

  it("uses browser fetch for authenticated snippets and me", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ user: { id: 1, email: "a@example.com" } }))
      .mockResolvedValueOnce(response([{ id: 1 }]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(currentUser(token)).resolves.toEqual({ user: { id: 1, email: "a@example.com" } });
    await expect(fetchSnippets(token)).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${baseUrl}/auth/me`, {
      headers: { Authorization: "Bearer test-jwt" },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${baseUrl}/snippets`, {
      headers: { Authorization: "Bearer test-jwt" },
    });
  });

  it("uses the Tauri HTTP plugin for auth and CRUD", async () => {
    const browserFetch = vi.fn();
    vi.stubGlobal("fetch", browserFetch);
    isTauri.mockReturnValue(true);
    tauriFetch.mockResolvedValueOnce(response(
      { user: { id: 1 } }, { authorization: "Bearer test-jwt" },
    )).mockResolvedValueOnce(response([{ id: 2 }]));

    await loginUser("a@example.com", "password");
    await fetchSnippets(token);
    expect(tauriFetch).toHaveBeenNthCalledWith(2, `${baseUrl}/snippets`, {
      headers: { Authorization: "Bearer test-jwt" },
    });
    expect(browserFetch).not.toHaveBeenCalled();
  });

  it("blocks all authenticated endpoints before transport without a token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const action of [
      () => currentUser(),
      () => logoutUser(),
      () => fetchSnippets(),
      () => createSnippet(undefined, {}),
      () => updateSnippet(undefined, 1, {}),
      () => deleteSnippet(undefined, 1),
    ]) {
      await expect(action()).rejects.toMatchObject({ status: 401 });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serializes create/update and sends bearer auth on all mutations", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ id: 7 }, { status: 201 }))
      .mockResolvedValueOnce(response({ id: 7 }))
      .mockResolvedValueOnce(response(null, { status: 204 }))
      .mockResolvedValueOnce(response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await createSnippet(token, { title: "Create" });
    await updateSnippet(token, "7/value", { title: "Updated" });
    await expect(deleteSnippet(token, 7)).resolves.toBeNull();
    await expect(logoutUser(token)).resolves.toBeNull();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${baseUrl}/snippets`, `${baseUrl}/snippets/7%2Fvalue`,
      `${baseUrl}/snippets/7`, `${baseUrl}/auth/logout`,
    ]);
    for (const [, options] of fetchMock.mock.calls) {
      expect(options.headers.Authorization).toBe("Bearer test-jwt");
    }
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      snippet: { title: "Create" },
    });
    expect(fetchMock.mock.calls.map(([, options]) => options.method)).toEqual([
      "POST", "PATCH", "DELETE", "DELETE",
    ]);
  });

  it("wraps network failures and exposes 401/404/422 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(fetchSnippets(token)).rejects.toMatchObject({
      status: 0,
      message: "Could not reach the SnipStack API. Check that the Rails server is running.",
    });
    for (const [status, body, message] of [
      [401, { errors: ["Unauthorized"] }, "Unauthorized"],
      [404, { error: "Missing" }, "Missing"],
      [422, { errors: ["Title can't be blank"] }, "Title can't be blank"],
    ]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(body, { status })));
      const error = await fetchSnippets(token).catch((caught) => caught);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status, message });
    }
  });

  it("preserves AbortError", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    await expect(fetchSnippets(token)).rejects.toBe(abortError);
  });
});
