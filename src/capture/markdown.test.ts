import { describe, expect, it } from "vitest";
import { readJsonLdJob } from "@/src/capture/jsonld";
import { htmlToMarkdown, parseMarkdown } from "@/src/capture/markdown";

const rich = [
  "<h2>Tasks</h2>",
  "<ul><li>Sort <strong>paper</strong> files</li><li>Label boxes</li></ul>",
  "<p>Apply in the reading room.</p>",
].join("");

const richMarkdown = ["## Tasks", "", "- Sort **paper** files", "- Label boxes", "", "Apply in the reading room."].join(
  "\n",
);

describe("posting markdown", () => {
  it("keeps headings, bold, lists, and paragraphs from HTML", () => {
    expect(htmlToMarkdown(rich)).toBe(richMarkdown);
    expect(htmlToMarkdown(rich)).not.toContain("<");
    const blocks = parseMarkdown(richMarkdown);
    expect(blocks.map((block) => block.kind)).toEqual(["heading", "list", "paragraph"]);
    expect(blocks[0]).toMatchObject({ level: 2 });
    expect(blocks[1]).toMatchObject({
      ordered: false,
      items: [[{ kind: "text", text: "Sort " }, { kind: "bold", text: "paper" }, { kind: "text", text: " files" }], [{ kind: "text", text: "Label boxes" }]],
    });
  });

  it("numbers an ordered list and leaves a tag-free string unchanged", () => {
    expect(htmlToMarkdown("<ol><li>First</li><li>Second</li></ol>")).toBe("1. First\n2. Second");
    expect(htmlToMarkdown("Lock the reading room.")).toBe("Lock the reading room.");
  });

  it("turns one paragraph or a div of text into that sentence", () => {
    expect(htmlToMarkdown("<p>Count the boats.</p>")).toBe("Count the boats.");
    expect(htmlToMarkdown("<div><div>Lock the stacks.</div></div>")).toBe("Lock the stacks.");
    expect(htmlToMarkdown("<p>Sort paper files.</p><p>Reference: NORTH-14</p>")).toBe(
      "Sort paper files.\n\nReference: NORTH-14",
    );
  });

  it("stores JSON-LD description structure as markdown", () => {
    const html = `<script type="application/ld+json">
      ${JSON.stringify({
        "@type": "JobPosting",
        title: "Clerk",
        description: rich,
      })}
    </script>`;
    const fields = readJsonLdJob(new DOMParser().parseFromString(html, "text/html"));
    expect(fields?.jobDescription).toBe(richMarkdown);
    expect(fields?.jobTitle).toBe("Clerk");
  });
});
