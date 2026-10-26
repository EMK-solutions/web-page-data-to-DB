import { elementMarkdown } from "@/src/capture/markdown";

export const emptySelectionMessage =
  "No text is selected. Select the posting on the page, then extract the selection.";

const inlineWrap = new Set(["strong", "b"]);
const blockWrap = new Set(["p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"]);
const stopWrap = new Set(["div", "article", "section", "main", "body", "html"]);

/**
 * Markdown for the current selection, from the DOM rather than innerText.
 * Does not add, remove, or move ranges.
 */
export function readDocumentSelection(doc: Document): string {
  const selection = doc.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const host = doc.createElement("div");
  let added = false;
  for (let index = 0; index < selection.rangeCount; index += 1) {
    const range = selection.getRangeAt(index);
    if (range.collapsed) continue;
    host.append(contextualFragment(range));
    added = true;
  }
  if (!added) return "";
  return elementMarkdown(host);
}

function contextualFragment(range: Range): Node {
  const fragment = range.cloneContents();
  let node: Node = fragment;
  for (const source of ancestorWrappers(range)) {
    if (alreadyWrapped(node, source.tagName.toLowerCase())) continue;
    const wrap = source.cloneNode(false);
    if (!(wrap instanceof Element)) continue;
    wrap.append(node);
    node = wrap;
  }
  return node;
}

function ancestorWrappers(range: Range): Element[] {
  const wrappers: Element[] = [];
  let element: Element | null =
    range.commonAncestorContainer instanceof Element
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;

  while (element) {
    const tag = element.tagName.toLowerCase();
    if (stopWrap.has(tag)) break;
    if (inlineWrap.has(tag) || blockWrap.has(tag)) wrappers.push(element);
    if (blockWrap.has(tag)) break;
    element = element.parentElement;
  }
  return wrappers;
}

function alreadyWrapped(node: Node, tag: string): boolean {
  const children =
    node instanceof DocumentFragment || node instanceof Element ? [...node.childNodes] : [node];
  return (
    children.length === 1 &&
    children[0] instanceof Element &&
    children[0].tagName.toLowerCase() === tag
  );
}
