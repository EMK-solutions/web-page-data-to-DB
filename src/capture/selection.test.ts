import { afterEach, describe, expect, it } from "vitest";
import { loadFixture } from "@/src/capture/fixture";
import { applySelectionModel, blankFields } from "@/src/capture/fields";
import { readSelectionCapture } from "@/src/capture/read-page";
import { emptySelectionMessage, readDocumentSelection } from "@/src/capture/selection";

const boardId = "11111111-2222-4333-8444-555555555555";
const pageUrl = `https://jobs.example/en/jobs/detail/${boardId}/`;

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.lang = "";
  document.getSelection()?.removeAllRanges();
});

describe("selected text", () => {
  it("sends selection markdown and does not copy it into job fields", () => {
    document.documentElement.lang = "de";
    document.body.innerHTML = [
      "<main>",
      "<h1>Reading room clerk</h1>",
      "<p>Welcome <strong>visitors</strong>.</p>",
      "<section><h2>Other jobs</h2><p>Night porter</p></section>",
      "</main>",
    ].join("");
    selectContents(document.querySelector("p"));

    const result = readSelectionCapture(document, pageUrl);

    expect(result).toEqual({
      empty: false,
      markdown: "Welcome **visitors**.",
      sourceUrl: pageUrl,
      pageLanguage: "de",
      sourceJobId: boardId,
    });
    expect(result.empty ? "" : result.markdown).not.toContain("Night porter");
    expect(result.empty ? "" : result.markdown).not.toContain("Reading room clerk");
  });

  it("reads a title or a later slice as markdown and leaves the range alone", () => {
    document.body.innerHTML = [
      "<h1>Reading room clerk</h1>",
      "<p>Welcome visitors.</p>",
      "<p>The evening desk covers returns.</p>",
      "<ul><li>Label <strong>boxes</strong></li></ul>",
    ].join("");
    const heading = document.querySelector("h1");
    const before = selectContents(heading);
    expect(readDocumentSelection(document)).toBe("# Reading room clerk");
    expect(document.getSelection()?.toString()).toBe(before.text);
    expect(document.getSelection()?.rangeCount).toBe(before.count);

    const paragraphs = document.querySelectorAll("p");
    selectContents(paragraphs[1] ?? null);
    expect(readDocumentSelection(document)).toBe("The evening desk covers returns.");

    selectContents(document.querySelector("li"));
    expect(readDocumentSelection(document)).toBe("- Label **boxes**");
  });

  it("reports an empty selection without a page capture", () => {
    const doc = loadFixture("jobposting-with-chrome.html");
    expect(readSelectionCapture(doc, pageUrl)).toEqual({ empty: true });
    expect(emptySelectionMessage).toMatch(/No text is selected/);
    document.body.innerHTML = "<p>Unread posting.</p>";
    expect(readSelectionCapture(document, pageUrl)).toEqual({ empty: true });
  });

  it("replaces fields from the model and drops a board id", () => {
    const current = { ...blankFields(), jobTitle: "Old", jobDescription: "Old description" };
    const model = {
      ...blankFields(),
      jobTitle: "New title",
      location: "Bern",
      jobDescription: "## Tasks\n\n- Sort files",
      companyJobReferenceId: boardId,
    };
    expect(applySelectionModel(current, model, "replace", boardId)).toEqual({
      ...blankFields(),
      jobTitle: "New title",
      location: "Bern",
      jobDescription: "## Tasks\n\n- Sort files",
    });
  });

  it("fills only fields that are still empty", () => {
    const current = { ...blankFields(), jobTitle: "Kept title", jobDescription: "Kept description" };
    const model = {
      ...blankFields(),
      jobTitle: "New title",
      jobDescription: "New description",
      location: "Bern",
    };
    expect(applySelectionModel(current, model, "fill", boardId)).toEqual({
      ...current,
      location: "Bern",
    });
  });
});

function selectContents(node: Element | null): { text: string; count: number } {
  if (!node) throw new Error("missing selection node");
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = document.getSelection();
  if (!selection) throw new Error("this document has no selection");
  selection.removeAllRanges();
  selection.addRange(range);
  return { text: selection.toString(), count: selection.rangeCount };
}
