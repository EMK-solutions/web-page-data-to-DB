import { parseMarkdown, type MarkdownInline } from "@/src/capture/markdown";

export function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = parseMarkdown(markdown);
  if (blocks.length === 0) return null;

  return (
    <div
      className="max-h-64 overflow-auto rounded-md border bg-muted/40 px-3 py-2 text-sm leading-relaxed"
      aria-label="Description preview"
    >
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          const HeadingTag = block.level <= 2 ? "h3" : "h4";
          return (
            <HeadingTag key={index} className={headingClass(block.level)}>
              <InlineText inlines={block.inlines} />
            </HeadingTag>
          );
        }
        if (block.kind === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={`mb-2 pl-5 last:mb-0 ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineText inlines={item} />
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={index} className="mb-2 whitespace-pre-wrap last:mb-0">
            <InlineText inlines={block.inlines} />
          </p>
        );
      })}
    </div>
  );
}

function InlineText({ inlines }: { inlines: MarkdownInline[] }) {
  return (
    <>
      {inlines.map((part, index) =>
        part.kind === "bold" ? (
          <strong key={index}>{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function headingClass(level: number): string {
  if (level <= 2) return "mb-1 text-base font-semibold last:mb-0";
  return "mb-1 text-sm font-semibold last:mb-0";
}
