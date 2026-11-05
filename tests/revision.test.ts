// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import RevisionLab from "@/app/components/RevisionLab";
import { decodeSessions, STORAGE_KEY } from "@/lib/learning";
import { mockBrief } from "@/lib/mock";
import type { BriefResponse } from "@/lib/schema";

const notes = "Binary search requires a sorted list. It compares the target with the middle element and discards half of the search space at every step. Its complexity is O(log n).";
const response: BriefResponse = { brief: mockBrief(notes, "notes"), mode: "notes", source: "mock", model: "offline-mock", repaired: false, ms: 0 };
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("revision workflow", () => {
  it("requires confidence, grades once, saves a confident mistake and restores it after remount", async () => {
    const view = render(createElement(RevisionLab, { incoming: { response, notes } }));
    await screen.findByText(response.brief.title);
    fireEvent.click(screen.getByRole("button", { name: "Practice all" }));
    const check = screen.getByRole("button", { name: "Check answer" }) as HTMLButtonElement;
    expect(check.disabled).toBe(true);
    // Choice 0 is correct in the deterministic fixture; choose a wrong option with high confidence.
    fireEvent.click(screen.getByRole("radio", { name: "This is not stated in the notes." }));
    expect(check.disabled).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "Very sure" }));
    expect(check.disabled).toBe(false);
    expect(screen.queryByText("Evidence from your notes")).toBeNull();
    fireEvent.click(check);
    await screen.findByText("A confident mistake — worth revisiting");
    expect(screen.getByText("Evidence from your notes")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Check answer" })).toBeNull();
    await waitFor(() => expect(decodeSessions(localStorage.getItem(STORAGE_KEY))[0].reviews[0].confidentMistakes).toBe(1));
    const saved = decodeSessions(localStorage.getItem(STORAGE_KEY))[0];
    expect(saved.reviews[0].attempts).toBe(1); expect(saved.notes).toBe(notes);
    view.unmount();
    render(createElement(RevisionLab, { incoming: null }));
    await screen.findByText(/Revisit: Demo source recall 1 \(confident mistake\)/);
    fireEvent.click(screen.getByRole("button", { name: "Review due" }));
    expect(screen.getByText(/Question 1 of 2/)).toBeTruthy(); // missed question is not due until ten minutes pass
  });
  it("deletes the saved notes and progress from browser storage", async () => {
    render(createElement(RevisionLab, { incoming: { response, notes } }));
    await screen.findByText(response.brief.title);
    fireEvent.click(screen.getByRole("button", { name: `Delete ${response.brief.title}` }));
    await waitFor(() => expect(decodeSessions(localStorage.getItem(STORAGE_KEY))).toEqual([]));
    expect(screen.getByText(/build your first source-linked practice session/)).toBeTruthy();
  });
});
