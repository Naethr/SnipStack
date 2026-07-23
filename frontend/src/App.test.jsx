import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import {
  createSnippet,
  deleteSnippet,
  fetchSnippets,
  updateSnippet,
} from "./api/snippetsApi";

vi.mock("./api/snippetsApi", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    createSnippet: vi.fn(),
    deleteSnippet: vi.fn(),
    fetchSnippets: vi.fn(),
    updateSnippet: vi.fn(),
  };
});

const snippet = {
  id: 1,
  title: "Retry fetch",
  description: "Network helper",
  language: "JavaScript",
  code: "const retry = true;",
  tags: "fetch, resilience",
  created_at: "2026-07-23T08:00:00.000Z",
  updated_at: "2026-07-23T08:00:00.000Z",
};

describe("App state transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchSnippets.mockResolvedValue([snippet]);
  });

  it("loads, filters, and focuses search with the slash shortcut", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Retry fetch")).toBeInTheDocument();
    const search = screen.getByRole("searchbox", { name: "Search snippets" });

    fireEvent.keyDown(window, { key: "/" });
    expect(search).toHaveFocus();

    await user.type(search, "missing");
    expect(
      screen.getByRole("heading", { name: "Nothing fits those filters" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Clear filters" })[0],
    );
    expect(screen.getByText("Retry fetch")).toBeInTheDocument();
  });

  it("shows an unavailable API state and retries loading", async () => {
    fetchSnippets
      .mockRejectedValueOnce(new Error("API unavailable"))
      .mockResolvedValueOnce([snippet]);
    const user = userEvent.setup();
    render(<App />);

    expect(
      await screen.findByRole("heading", {
        name: "Could not load your snippets",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("API status · offline")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Retry fetch")).toBeInTheDocument();
    expect(screen.getByText("API status · connected")).toBeInTheDocument();
  });

  it("validates required fields before calling the API", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Retry fetch");

    await user.click(screen.getByRole("button", { name: "Save snippet" }));

    expect(screen.getByText("Add a title.")).toBeInTheDocument();
    expect(screen.getByText("Add a language.")).toBeInTheDocument();
    expect(screen.getByText("Add the code you want to save.")).toBeInTheDocument();
    expect(createSnippet).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Title" })).toHaveFocus();
    });
  });

  it("creates, edits, copies, and deletes a snippet", async () => {
    const user = userEvent.setup();
    const created = { ...snippet, id: 2, title: "Created snippet" };
    const updated = { ...created, title: "Updated snippet" };
    createSnippet.mockResolvedValue(created);
    updateSnippet.mockResolvedValue(updated);
    deleteSnippet.mockResolvedValue(null);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<App />);
    await screen.findByText("Retry fetch");

    await user.type(
      screen.getByRole("textbox", { name: "Title" }),
      "Created snippet",
    );
    await user.type(
      screen.getByPlaceholderText("JavaScript"),
      "JavaScript",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Code" }),
      snippet.code,
    );
    await user.click(screen.getByRole("button", { name: "Save snippet" }));

    expect(await screen.findByText("Created snippet")).toBeInTheDocument();
    const createdCard = screen
      .getByText("Created snippet")
      .closest(".snippet-card");

    await user.click(within(createdCard).getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith(snippet.code);

    await user.click(within(createdCard).getByRole("button", { name: "Edit" }));
    const title = screen.getByRole("textbox", { name: "Title" });
    await user.clear(title);
    await user.type(title, "Updated snippet");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Updated snippet")).toBeInTheDocument();
    const updatedCard = screen
      .getByText("Updated snippet")
      .closest(".snippet-card");
    await user.click(within(updatedCard).getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Updated snippet")).not.toBeInTheDocument();
    });
    expect(createSnippet).toHaveBeenCalledOnce();
    expect(updateSnippet).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ title: "Updated snippet" }),
    );
    expect(deleteSnippet).toHaveBeenCalledWith(2);
  });
});
