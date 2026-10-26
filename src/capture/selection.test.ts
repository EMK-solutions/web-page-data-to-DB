import { describe, expect, it } from "vitest";
import { loadFixture } from "@/src/capture/fixture";
import { readSelectionCapture } from "@/src/capture/read-page";
import { emptySelectionMessage, readDocumentSelection } from "@/src/capture/selection";

const boardId = "11111111-2222-4333-8444-555555555555";
const pageUrl = `https://jobs.example/en/jobs/detail/${boardId}/`;
const selected = "The selected morning shift covers the reading room desk.";

describe("selected text", () => {
  it("uses the selection as the description and fills empty fields from JSON-LD", () => {
    const result = readSelectionCapture(loadFixture("jobposting-with-chrome.html"), pageUrl, selected);
    expect(result.empty).toBe(false);
    if (result.empty) return;
    expect(result.page.fields).toEqual({
      jobTitle: "Reading room clerk",
      company: "City Reading Room",
      jobDescription: selected,
      location: "Fribourg, 1700, CH",
      salaryRange: "CHF 62000–68000 YEAR",
      companyJobReferenceId: null,
    });
    expect(result.page.visibleText).toBe(selected);
    expect(result.page.visibleText).not.toContain("Welcome visitors");
    expect(result.page.visibleText).not.toContain("Browse occupations");
    expect(result.page.visibleText).not.toContain("Night porter");
    expect(result.page.fields.jobDescription).not.toContain("Welcome visitors");
    expect(result.page.sourceJobId).toBe(boardId);
  });

  it("reports an empty selection without a page capture", () => {
    const doc = loadFixture("jobposting-with-chrome.html");
    expect(readSelectionCapture(doc, pageUrl, "")).toEqual({ empty: true });
    expect(readSelectionCapture(doc, pageUrl, "   ")).toEqual({ empty: true });
    expect(emptySelectionMessage).toMatch(/No text is selected/);
  });

  it("reads document.getSelection and does not change the range", () => {
    const calls: string[] = [];
    const selection = {
      rangeCount: 1,
      toString() {
        calls.push("toString");
        return "Selected posting body";
      },
      removeAllRanges() {
        calls.push("removeAllRanges");
      },
      addRange() {
        calls.push("addRange");
      },
    };
    const doc = {
      getSelection() {
        calls.push("getSelection");
        return selection;
      },
    } as unknown as Document;
    expect(readDocumentSelection(doc)).toBe("Selected posting body");
    expect(calls).toEqual(["getSelection", "toString"]);
    expect(readDocumentSelection({ getSelection: () => null } as unknown as Document)).toBe("");
  });
});
