import { cleanedPostingRoot } from "@/src/capture/main-text";
import { elementMarkdown } from "@/src/capture/markdown";
import { clipText, emptyToNull, PAGE_TEXT_LIMIT } from "@/src/capture/text";

const blockTags = new Set(["div", "section", "article", "main", "ul", "ol"]);

/**
 * Title and description from the visible posting.
 * JSON-LD is not read here. A translated structured description must not win.
 */
export function visiblePostingCopy(doc: Document): {
  jobTitle: string | null;
  jobDescription: string | null;
} {
  const root = cleanedPostingRoot(doc);
  const heading = root.querySelector("h1");
  const jobTitle = emptyToNull((heading?.textContent ?? "").replace(/\s+/g, " ").trim());
  const body = richestLeaf(root);
  if (!body) return { jobTitle, jobDescription: null };
  const copy = body.cloneNode(true);
  if (copy instanceof Element) {
    for (const title of copy.querySelectorAll("h1")) title.remove();
  }
  return { jobTitle, jobDescription: emptyToNull(clipText(elementMarkdown(copy), PAGE_TEXT_LIMIT)) };
}

/** The tightest block that holds the posting paragraphs, not a wrapper around it. */
function richestLeaf(root: Element): Element | null {
  const candidates = [root, ...root.querySelectorAll("div, section, article, main, ul, ol")];
  let best: Element | null = null;
  let bestScore = 0;
  for (const el of candidates) {
    if (!blockTags.has(el.tagName.toLowerCase()) && el !== root) continue;
    const score = blockTextLength(el);
    if (score < 40) continue;
    const childScore = Math.max(0, ...[...el.children].map((child) => blockTextLength(child)));
    if (childScore >= score * 0.85) continue;
    if (score > bestScore) {
      best = el;
      bestScore = score;
    }
  }
  return best;
}

function blockTextLength(el: Element): number {
  let total = 0;
  for (const node of el.querySelectorAll("p, li")) {
    total += (node.textContent ?? "").replace(/\s+/g, " ").trim().length;
  }
  return total;
}
