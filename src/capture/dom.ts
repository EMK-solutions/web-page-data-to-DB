import { emptyToNull } from "@/src/capture/text";

export function elementText(node: Node | null): string {
  if (!node) return "";
  if (!(node instanceof Element)) {
    return (node.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  const clone = node.cloneNode(true);
  if (!(clone instanceof Element)) return "";

  for (const br of clone.querySelectorAll("br")) {
    br.replaceWith("\n");
  }
  for (const block of clone.querySelectorAll("p, li, h1, h2, h3, h4, tr, div")) {
    block.append("\n");
  }

  return (clone.textContent ?? "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToText(html: string): string {
  const source = html.trim();
  if (!source.includes("<")) return source;
  const parsed = new DOMParser().parseFromString(source, "text/html");
  return elementText(parsed.body);
}

export function pageLanguage(doc: Document): string | null {
  const lang = emptyToNull(doc.documentElement.lang);
  if (lang) return lang;

  for (const meta of doc.querySelectorAll("meta")) {
    const httpEquiv = meta.getAttribute("http-equiv");
    if (httpEquiv?.toLowerCase() === "content-language") {
      return emptyToNull(meta.getAttribute("content"));
    }
  }
  return null;
}
