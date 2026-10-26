export const PAGE_TEXT_LIMIT = 12_000;

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function clipText(value: string, limit = PAGE_TEXT_LIMIT): string {
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).trimEnd()}\n…`;
}

/** Keep `primary` when it is at least as long as `extra`. */
export function longerText(primary: string | null, extra: string | null): string | null {
  const preferred = emptyToNull(primary);
  const visible = emptyToNull(extra);
  if (!preferred) return visible;
  if (!visible) return preferred;
  return visible.length > preferred.length ? visible : preferred;
}
