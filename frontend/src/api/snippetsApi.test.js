import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import {
  ApiError,
  createSnippet,
  deleteSnippet,
  fetchSnippets,
  updateSnippet,
} from "./snippetsApi";

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: vi.fn(() => false),
}));

vi.mock("@tauri-apps/plugin-http", () => ({
  fetch: vi.fn(),
}));

function response(body, { status = 200 } = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("snippetsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTauri.mockReturnValue(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads snippets from the configured API", async () => {
    const snippets = [{ id: 1, title: "Fetch" }];
    const fetchMock = vi.fn().mockResolvedValue(response(snippets));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSnippets()).resolves.toEqual(snippets);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/v1/snippets",
      { headers: undefined },
    );
  });

  it("uses the scoped Tauri transport only in the Desktop runtime", async () => {
    const snippets = [{ id: 2, title: "Desktop fetch" }];
    const browserFetch = vi.fn();
    vi.stubGlobal("fetch", browserFetch);
    isTauri.mockReturnValue(true);
    tauriFetch.mockResolvedValue(response(snippets));

    await expect(fetchSnippets()).resolves.toEqual(snippets);
    expect(tauriFetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/v1/snippets",
      { headers: undefined },
    );
    expect(browserFetch).not.toHaveBeenCalled();
  });

  it("serializes create and update requests", async () => {
    const created = { id: 7, title: "Create" };
    const updated = { ...created, title: "Updated" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(created, { status: 201 }))
      .mockResolvedValueOnce(response(updated));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createSnippet({ title: "Create" })).resolves.toEqual(created);
    await expect(updateSnippet("7/value", { title: "Updated" })).resolves.toEqual(
      updated,
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://127.0.0.1:3000/api/v1/snippets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ snippet: { title: "Create" } }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://127.0.0.1:3000/api/v1/snippets/7%2Fvalue",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("wraps network failures in an ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(fetchSnippets()).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      message:
        "Could not reach the SnipStack API. Check that the Rails server is running.",
    });
  });

  it.each([
    [404, { error: "Missing" }, "Missing", []],
    [422, { errors: ["Title can't be blank"] }, "Title can't be blank", [
      "Title can't be blank",
    ]],
  ])(
    "exposes API details for a %s response",
    async (status, body, message, errors) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(response(body, { status })),
      );

      const error = await fetchSnippets().catch((caught) => caught);

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status, message, errors });
    },
  );

  it("returns null for a successful 204 deletion", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteSnippet(12)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/v1/snippets/12",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("preserves AbortError so unmount cancellation stays distinguishable", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(fetchSnippets()).rejects.toBe(abortError);
  });
});
