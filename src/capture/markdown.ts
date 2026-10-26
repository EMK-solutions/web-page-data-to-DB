const skipTags = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "img",
  "video",
  "iframe",
]);

const blockContainers = new Set([
  "address",
  "article",
  "blockquote",
  "body",
  "div",
  "dl",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "header",
  "main",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
]);

type RenderCtx = { bold: boolean };

export type MarkdownInline = { kind: "text"; text: string } | { kind: "bold"; text: string };

export type MarkdownBlock =
  | { kind: "heading"; level: number; inlines: MarkdownInline[] }
  | { kind: "paragraph"; inlines: MarkdownInline[] }
  | { kind: "list"; ordered: boolean; items: MarkdownInline[][] };

/** Markdown from posting HTML. A string with no tags is returned unchanged. */
export function htmlToMarkdown(html: string): string {
  const source = html.trim();
  if (!source.includes("<")) return source;
  const parsed = new DOMParser().parseFromString(source, "text/html");
  return elementMarkdown(parsed.body);
}

/** Markdown from a live or detached node. Does not read innerText. */
export function elementMarkdown(node: Node | null): string {
  if (!node) return "";
  return tidy(render(node, { bold: false }));
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const heading = /^(#{1,6})[ \t]+(\S.*)$/.exec(line.trim());
    if (heading?.[1] && heading[2]) {
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        inlines: parseInlines(heading[2].trim()),
      });
      index += 1;
      continue;
    }
    if (isListLine(line)) {
      const ordered = /^\s*\d+\.[ \t]+/.test(line);
      const items: MarkdownInline[][] = [];
      while (index < lines.length && isListLine(lines[index] ?? "")) {
        const current = lines[index] ?? "";
        if (/^\s*\d+\.[ \t]+/.test(current) !== ordered) break;
        items.push(parseInlines(current.replace(/^\s*(?:[-*+]|\d+\.)[ \t]+/, "").trim()));
        index += 1;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length) {
      const current = lines[index] ?? "";
      if (!current.trim() || isListLine(current) || /^(#{1,6})[ \t]+\S/.test(current.trim())) break;
      paragraph.push(current.trim());
      index += 1;
    }
    blocks.push({ kind: "paragraph", inlines: parseInlines(paragraph.join(" ")) });
  }
  return blocks.filter((block) => blockHasText(block));
}

function render(node: Node, ctx: RenderCtx): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\s+/g, " ");
  }
  if (!(node instanceof Element)) {
    let text = "";
    for (const child of node.childNodes) text += render(child, ctx);
    return text;
  }

  const tag = node.tagName.toLowerCase();
  if (skipTags.has(tag)) return "";
  if (tag === "br" || tag === "hr") return "\n";

  if (tag === "strong" || tag === "b") {
    const inner = collapseInline(renderChildren(node, { bold: true }));
    if (!inner) return "";
    if (ctx.bold) return inner;
    return `**${inner}**`;
  }

  const heading = /^h([1-6])$/.exec(tag);
  if (heading?.[1]) {
    const text = collapseInline(renderChildren(node, ctx));
    if (!text) return "";
    return `\n\n${"#".repeat(Number(heading[1]))} ${text}\n\n`;
  }

  if (tag === "p") {
    const text = collapseInline(renderChildren(node, ctx));
    if (!text) return "";
    return `\n\n${text}\n\n`;
  }

  if (tag === "ul" || tag === "ol") {
    const list = renderList(node, tag === "ol", ctx);
    if (!list) return "";
    return `\n\n${list}\n\n`;
  }

  if (tag === "li") {
    const body = renderListItem(node, ctx);
    if (!body) return "";
    return `\n\n- ${body}\n\n`;
  }

  if (blockContainers.has(tag)) {
    if (hasBlockChild(node)) return renderChildren(node, ctx);
    const text = collapseInline(renderChildren(node, ctx));
    if (!text) return "";
    return `\n\n${text}\n\n`;
  }

  return renderChildren(node, ctx);
}

function renderChildren(node: Node, ctx: RenderCtx): string {
  let text = "";
  for (const child of node.childNodes) text += render(child, ctx);
  return text;
}

function renderList(list: Element, ordered: boolean, ctx: RenderCtx): string {
  const items = [...list.children].filter((child) => child.tagName.toLowerCase() === "li");
  return items
    .map((item, index) => {
      const body = renderListItem(item, ctx);
      if (!body) return "";
      const marker = ordered ? `${index + 1}. ` : "- ";
      return `${marker}${body}`;
    })
    .filter((line) => line.length > 0)
    .join("\n");
}

function renderListItem(item: Element, ctx: RenderCtx): string {
  const chunks: string[] = [];
  let inline = "";
  const flush = () => {
    const text = collapseInline(inline);
    inline = "";
    if (text) chunks.push(text);
  };
  for (const child of item.childNodes) {
    if (child instanceof Element) {
      const tag = child.tagName.toLowerCase();
      if (tag === "ul" || tag === "ol") {
        flush();
        const nested = renderList(child, tag === "ol", ctx);
        if (nested) chunks.push(nested.split("\n").map((line) => `  ${line}`).join("\n"));
        continue;
      }
    }
    inline += render(child, ctx);
  }
  flush();
  return chunks.join("\n");
}

function hasBlockChild(node: Element): boolean {
  for (const child of node.children) {
    const tag = child.tagName.toLowerCase();
    if (
      blockContainers.has(tag) ||
      tag === "p" ||
      tag === "ul" ||
      tag === "ol" ||
      tag === "li" ||
      /^h[1-6]$/.test(tag)
    ) {
      return true;
    }
  }
  return false;
}

function collapseInline(value: string): string {
  return value
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function tidy(value: string): string {
  return value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isListLine(line: string): boolean {
  return /^\s*(?:[-*+]|\d+\.)[ \t]+\S/.test(line);
}

function parseInlines(text: string): MarkdownInline[] {
  const parts: MarkdownInline[] = [];
  const pattern = /\*\*([^*\n]+)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ kind: "text", text: text.slice(last, start) });
    if (match[1]) parts.push({ kind: "bold", text: match[1] });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", text: text.slice(last) });
  return parts.filter((part) => part.text.length > 0);
}

function blockHasText(block: MarkdownBlock): boolean {
  if (block.kind === "list") return block.items.some((item) => item.length > 0);
  return block.inlines.length > 0;
}
