import { htmlToMarkdown } from "@/src/capture/markdown";
import { isRecord } from "@/src/capture/records";
import { type JobFields } from "@/src/capture/fields";
import { emptyToNull, longerText } from "@/src/capture/text";
import { type PageRead } from "@/src/capture/types";

const MAX_DEPTH = 8;

export type IndeedSlice = {
  jobTitle: string | null;
  company: string | null;
  jobDescription: string | null;
  location: string | null;
  salaryRange: string | null;
  sourceJobId: string | null;
};

export function isIndeedHost(hostname: string): boolean {
  return hostname === "indeed.com" || hostname.endsWith(".indeed.com");
}

export function indeedJobIdFromUrl(pageUrl: string): string | null {
  const url = tryUrl(pageUrl);
  if (!url || !isIndeedHost(url.hostname)) return null;
  return emptyToNull(url.searchParams.get("jk"));
}

export function readIndeedFromWindow(rootProps: unknown): IndeedSlice | null {
  const found = findSanitized(rootProps, 0, null);
  if (!found) return null;
  const { node, parent } = found;
  const description = deepString(node, ["sanitizedJobDescription"], 0);
  return {
    jobTitle: deepString(node, ["jobTitle", "title"], 0) ?? deepString(parent, ["jobTitle", "title"], 0),
    company:
      deepString(node, ["companyName", "company"], 0) ??
      deepString(parent, ["companyName", "company"], 0),
    jobDescription: description ? emptyToNull(htmlToMarkdown(description)) : null,
    location:
      deepString(node, ["formattedLocation", "location"], 0) ??
      deepString(parent, ["formattedLocation", "location"], 0),
    salaryRange:
      deepString(node, ["salaryText", "formattedSalary"], 0) ??
      deepString(parent, ["salaryText", "formattedSalary"], 0),
    sourceJobId:
      deepString(node, ["jobKey", "jobkey"], 0) ?? deepString(parent, ["jobKey", "jobkey"], 0),
  };
}

export function mergeIndeedSlice(page: PageRead, indeed: IndeedSlice | null): PageRead {
  if (!indeed) return page;
  const fields: JobFields = { ...page.fields };
  fields.jobTitle ??= indeed.jobTitle;
  fields.company ??= indeed.company;
  fields.location ??= indeed.location;
  fields.salaryRange ??= indeed.salaryRange;
  const structured = indeed.jobDescription ?? page.structuredDescription;
  fields.jobDescription = longerText(structured, page.visibleText);
  const sourceJobId = page.sourceJobId ?? indeed.sourceJobId ?? undefined;
  if (sourceJobId && fields.companyJobReferenceId === sourceJobId) {
    fields.companyJobReferenceId = null;
  }
  return {
    ...page,
    fields,
    structuredDescription: structured,
    ...(sourceJobId ? { sourceJobId } : {}),
  };
}

function findSanitized(
  value: unknown,
  depth: number,
  parent: Record<string, unknown> | null,
): { node: Record<string, unknown>; parent: Record<string, unknown> | null } | null {
  if (depth > MAX_DEPTH || value == null) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSanitized(item, depth + 1, parent);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(value)) return null;
  if (typeof value.sanitizedJobDescription === "string") return { node: value, parent };
  for (const child of Object.values(value)) {
    const found = findSanitized(child, depth + 1, value);
    if (found) return found;
  }
  return null;
}

function deepString(value: unknown, keys: readonly string[], depth: number): string | null {
  if (value == null || depth > 4 || !isRecord(value)) return null;
  for (const key of keys) {
    const direct = value[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
  }
  for (const child of Object.values(value)) {
    if (!isRecord(child) && !Array.isArray(child)) continue;
    const found = Array.isArray(child)
      ? child.map((item) => deepString(item, keys, depth + 1)).find((item) => item != null)
      : deepString(child, keys, depth + 1);
    if (typeof found === "string") return found;
  }
  return null;
}

function tryUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
