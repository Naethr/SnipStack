import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
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

vi.mock("./api/snippetsApi", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    createSnippet: vi.fn(),
    currentUser: vi.fn(),
    deleteSnippet: vi.fn(),
    fetchSnippets: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
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
    loginUser.mockResolvedValue({ token: "test-jwt", user: { id: 1, email: "a@example.com" } });
    registerUser.mockResolvedValue({ token: "test-jwt", user: { id: 1, email: "a@example.com" } });
    currentUser.mockResolvedValue({ user: { id: 1, email: "a@example.com" } });
    logoutUser.mockResolvedValue(null);
    fetchSnippets.mockResolvedValue([snippet]);
  });

  async function signIn(user = userEvent.setup()) {
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText("Retry fetch");
    return user;
  }

  it("does not access snippets until signed in and verifies /me", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(fetchSnippets).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Save snippet" })).not.toBeInTheDocument();
    await signIn(user);
    expect(currentUser).toHaveBeenCalledWith("test-jwt");
    expect(fetchSnippets).toHaveBeenCalledWith("test-jwt", expect.any(Object));
    expect(screen.getByText("a@example.com", { selector: ".session-email" })).toBeInTheDocument();
  });

  it("registers and shows the returned account after /me", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.type(screen.getByLabelText("Confirm password"), "password");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByText("Retry fetch");
    expect(registerUser).toHaveBeenCalledWith("a@example.com", "password", "password");
  });

  it("handles /me 401 without loading snippets", async () => {
    currentUser.mockRejectedValue(new ApiError("Unauthorized", { status: 401 }));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("session could not be verified");
    expect(fetchSnippets).not.toHaveBeenCalled();
  });

  it("clears private data and offers sign-in after a CRUD 401", async () => {
    fetchSnippets.mockRejectedValue(new ApiError("Unauthorized", { status: 401 }));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("status")).toHaveTextContent("session has expired");
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(fetchSnippets).toHaveBeenCalledOnce();
  });

  it("clears the session after a create 401", async () => {
    createSnippet.mockRejectedValue(new ApiError("Unauthorized", { status: 401 }));
    const user = userEvent.setup();
    render(<App />);
    await signIn(user);
    await user.type(screen.getByRole("textbox", { name: "Title" }), "New snippet");
    await user.type(screen.getByPlaceholderText("JavaScript"), "JavaScript");
    await user.type(screen.getByRole("textbox", { name: "Code" }), "const x = 1;");
    await user.click(screen.getByRole("button", { name: "Save snippet" }));
    expect(await screen.findByRole("status")).toHaveTextContent("session has expired");
    expect(screen.queryByText("Retry fetch")).not.toBeInTheDocument();
  });

  it("calls logout with the token, then clears local session", async () => {
    const user = userEvent.setup();
    render(<App />);
    await signIn(user);
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(logoutUser).toHaveBeenCalledWith("test-jwt");
    expect(await screen.findByRole("status")).toHaveTextContent("signed out");
    expect(screen.queryByText("Retry fetch")).not.toBeInTheDocument();
  });

  it("explains when the logout token was already invalid", async () => {
    logoutUser.mockRejectedValue(new ApiError("Unauthorized", { status: 401 }));
    const user = userEvent.setup();
    render(<App />);
    await signIn(user);
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("status")).toHaveTextContent("already invalid");
  });

  it("requires a new login after the app remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await signIn(user);
    unmount();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.queryByText("Retry fetch")).not.toBeInTheDocument();
    expect(fetchSnippets).toHaveBeenCalledOnce();
  });

  it("loads, filters, and focuses search with the slash shortcut", async () => {
    const user = userEvent.setup();
    render(<App />);
    await signIn(user);
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
    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

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
    await signIn(user);

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
    await signIn(user);

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
      "test-jwt",
      2,
      expect.objectContaining({ title: "Updated snippet" }),
    );
    expect(deleteSnippet).toHaveBeenCalledWith("test-jwt", 2);
  });
});
