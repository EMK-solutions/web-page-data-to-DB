import { elementText } from "@/src/capture/dom";
import { elementMarkdown } from "@/src/capture/markdown";
import { clipText, PAGE_TEXT_LIMIT } from "@/src/capture/text";

const chromeInPosting = [
  "nav",
  "aside",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[role='complementary']",
  "[role='menu']",
].join(", ");

const siteChrome = ["header", "footer", chromeInPosting].join(", ");

const accountLabel = /account|sign in|log in|login|user-nav|anmelden|connexion|mon compte/i;

const otherListing =
  /^(other jobs|similar jobs|more jobs|related jobs|recommended jobs|others have also looked at|show more jobs|weitere stellen|ähnliche stellen|autres offres|autres emplois)$/i;

/**
 * Clipped posting body for the model. Navigation, header, footer, account menus,
 * and other listings are left out. Defuddle was left out: its bundle dominated
 * the injected page reader.
 */
export function postingBodyText(doc: Document): string {
  const copy = new DOMParser().parseFromString(doc.documentElement.outerHTML, "text/html");
  for (const node of copy.querySelectorAll("script, style, noscript, template")) {
    node.remove();
  }
  const root = postingRoot(copy);
  stripChrome(root, root === copy.body);
  return clipText(elementMarkdown(root), PAGE_TEXT_LIMIT);
}

function postingRoot(copy: Document): Element {
  const main = copy.querySelector("main");
  if (main && elementText(main).length > 0) return main;
  let best: Element | null = null;
  let bestLength = 0;
  for (const article of copy.querySelectorAll("article")) {
    const length = elementText(article).length;
    if (length > bestLength) {
      best = article;
      bestLength = length;
    }
  }
  if (best) return best;
  return copy.body;
}

function stripChrome(root: Element, includeSiteChrome: boolean): void {
  const selector = includeSiteChrome ? siteChrome : chromeInPosting;
  for (const node of [...root.querySelectorAll(selector)]) {
    if (node !== root) node.remove();
  }
  for (const node of [...root.querySelectorAll("[aria-label], [id]")]) {
    if (node === root) continue;
    const label = `${node.getAttribute("aria-label") ?? ""} ${node.id}`;
    if (accountLabel.test(label)) node.remove();
  }
  for (const heading of [...root.querySelectorAll("h1, h2, h3, h4")]) {
    const label = (heading.textContent ?? "").replace(/\s+/g, " ").trim().replace(/[:\s]+$/g, "");
    if (!otherListing.test(label)) continue;
    const block = heading.closest("section, aside");
    if (block && block !== root && root.contains(block)) block.remove();
    else heading.remove();
  }
}
