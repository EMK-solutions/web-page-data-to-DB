import { elementText } from "@/src/capture/dom";
import { clipText, PAGE_TEXT_LIMIT } from "@/src/capture/text";

/**
 * Clipped visible text for the model. Script and style contents are removed.
 * Defuddle was left out: its bundle dominated the injected page reader.
 */
export function cleanedPageText(doc: Document, _pageUrl: string): string {
  const copy = new DOMParser().parseFromString(doc.documentElement.outerHTML, "text/html");
  for (const node of copy.querySelectorAll("script, style, noscript, template")) {
    node.remove();
  }
  return clipText(elementText(copy.body), PAGE_TEXT_LIMIT);
}
