import { useId, useState, type ReactNode } from "react";

export function ExplainableTitle({
  label,
  title,
  explanation,
}: {
  label: string;
  title: ReactNode;
  explanation: string;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const explanationId = useId();
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1">
        {title}
        <button
          type="button"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] leading-none text-muted-foreground hover:bg-accent"
          aria-expanded={open}
          aria-controls={explanationId}
          aria-label={`${open ? "Hide" : "Show"} ${label} explanation`}
          onClick={() => setOpen((current) => !current)}
        >
          ?
        </button>
      </div>
      {open ? (
        <p id={explanationId} className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {explanation}
        </p>
      ) : null}
    </div>
  );
}
