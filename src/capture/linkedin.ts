import { elementText } from "@/src/capture/dom";
import { linkedInSelectors, loginWallText, showMoreLabel } from "@/src/capture/selectors";
import { blankFields, normalizeFields, type JobFields } from "@/src/capture/fields";
import { clipText, emptyToNull } from "@/src/capture/text";

export const INCOMPLETE_DESCRIPTION_WARNING =
  "The description looks incomplete. This page may be behind a sign-in or join wall.";

const TINY_DESCRIPTION = 400;

export type LinkedInRead = {
  fields: JobFields;
  sourceJobId?: string;
  warnings: string[];
};

export function isLinkedInHost(hostname: string): boolean {
  return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
}

export function isLinkedInJobUrl(pageUrl: string): boolean {
  const url = tryUrl(pageUrl);
  if (!url || !isLinkedInHost(url.hostname)) return false;
  return url.pathname.includes("/jobs") || linkedInJobIdFromUrl(pageUrl) != null;
}

/**
 * The id in a LinkedIn job URL is LinkedIn's id. It is never the company reference.
 */
export function linkedInJobIdFromUrl(pageUrl: string): string | null {
  const url = tryUrl(pageUrl);
  if (!url || !isLinkedInHost(url.hostname)) return null;

  const current = url.searchParams.get("currentJobId");
  if (current && /^\d{6,}$/.test(current)) return current;

  const view = /\/jobs\/view\/(?:.*-)?(\d{6,})\/?$/.exec(url.pathname);
  return view?.[1] ?? null;
}

export async function readLinkedInJob(
  doc: Document,
  pageUrl: string,
  wait: (ms: number) => Promise<void>,
): Promise<LinkedInRead> {
  await expandDescription(doc, wait);
  const known = longestMatch(doc, linkedInSelectors.description);
  const fallback = longestMatch(doc, linkedInSelectors.jobDetailsRegion);
  const description = clipText(known ?? fallback ?? "");
  const sourceJobId = linkedInJobIdFromUrl(pageUrl) ?? undefined;
  const warnings: string[] = [];
  if (description.length < TINY_DESCRIPTION && loginWallVisible(doc)) {
    warnings.push(INCOMPLETE_DESCRIPTION_WARNING);
  }

  return {
    fields: normalizeFields({
      ...blankFields(),
      jobTitle: firstMatch(doc, linkedInSelectors.title),
      company: firstMatch(doc, linkedInSelectors.company),
      jobDescription: emptyToNull(description),
      location: firstMatch(doc, linkedInSelectors.location),
      salaryRange: null,
      companyJobReferenceId: null,
    }),
    ...(sourceJobId ? { sourceJobId } : {}),
    warnings,
  };
}

async function expandDescription(
  doc: Document,
  wait: (ms: number) => Promise<void>,
): Promise<void> {
  const button = findShowMore(doc);
  if (!button) return;
  button.click();
  await wait(200);
}

function findShowMore(doc: Document): HTMLElement | null {
  for (const selector of linkedInSelectors.showMore) {
    for (const node of doc.querySelectorAll(selector)) {
      if (node instanceof HTMLElement && isVisible(node)) return node;
    }
  }
  for (const node of doc.querySelectorAll("button, a")) {
    if (!(node instanceof HTMLElement) || !isVisible(node)) continue;
    const label = `${node.getAttribute("aria-label") ?? ""} ${node.textContent ?? ""}`.trim();
    if (showMoreLabel.test(label)) return node;
  }
  return null;
}

function loginWallVisible(doc: Document): boolean {
  for (const selector of linkedInSelectors.loginWall) {
    const node = doc.querySelector(selector);
    if (node instanceof HTMLElement && isVisible(node)) return true;
  }
  for (const node of doc.querySelectorAll("button, a, h1, h2, p")) {
    if (!(node instanceof HTMLElement) || !isVisible(node)) continue;
    if (loginWallText.test(node.textContent ?? "")) return true;
  }
  return false;
}

function longestMatch(doc: Document, selectors: readonly string[]): string | null {
  let best: string | null = null;
  for (const selector of selectors) {
    for (const node of doc.querySelectorAll(selector)) {
      const text = elementText(node);
      if (!best || text.length > best.length) best = text;
    }
  }
  return emptyToNull(best);
}

function firstMatch(doc: Document, selectors: readonly string[]): string | null {
  for (const selector of selectors) {
    const node = doc.querySelector(selector);
    const text = emptyToNull(elementText(node));
    if (text) return text;
  }
  return null;
}

function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  let current: HTMLElement | null = element;
  while (current) {
    if (current.style.display === "none" || current.style.visibility === "hidden") return false;
    current = current.parentElement;
  }
  return true;
}

function tryUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
