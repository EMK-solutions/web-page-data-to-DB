import { pageLanguage } from "@/src/capture/dom";
import { indeedJobIdFromUrl } from "@/src/capture/indeed";
import { readJsonLdJob } from "@/src/capture/jsonld";
import { isLinkedInJobUrl, readLinkedInJob } from "@/src/capture/linkedin";
import { postingBodyText } from "@/src/capture/main-text";
import { blankFields, rejectBoardIds, type JobFields } from "@/src/capture/fields";
import { clipText, emptyToNull } from "@/src/capture/text";
import { type PageRead } from "@/src/capture/types";

export type SelectionCapture = { empty: true } | { empty: false; page: PageRead };

export function readOpenPage(doc: Document, pageUrl: string): PageRead {
  const language = pageLanguage(doc);

  if (isLinkedInJobUrl(pageUrl)) {
    const linkedIn = readLinkedInJob(doc, pageUrl);
    const visibleText = postingBodyText(doc);
    return {
      fields: linkedIn.fields,
      sourceUrl: pageUrl,
      pageLanguage: language,
      visibleText,
      structuredDescription: linkedIn.fields.jobDescription,
      warnings: linkedIn.warnings,
      adapter: "linkedin",
      ...(linkedIn.sourceJobId ? { sourceJobId: linkedIn.sourceJobId } : {}),
    };
  }

  const visibleText = postingBodyText(doc);
  const { fields, sourceJobId, found } = structuredFields(doc, pageUrl);
  return {
    fields,
    sourceUrl: pageUrl,
    pageLanguage: language,
    visibleText,
    structuredDescription: fields.jobDescription,
    warnings: [],
    adapter: found ? "structured" : "visible-text",
    ...(sourceJobId ? { sourceJobId } : {}),
  };
}

export function readSelectionCapture(
  doc: Document,
  pageUrl: string,
  selection: string,
): SelectionCapture {
  const selected = emptyToNull(selection);
  if (!selected) return { empty: true };
  const clipped = clipText(selected);
  const { fields, sourceJobId, found } = structuredFields(doc, pageUrl);
  return {
    empty: false,
    page: {
      fields: { ...fields, jobDescription: clipped },
      sourceUrl: pageUrl,
      pageLanguage: pageLanguage(doc),
      visibleText: clipped,
      structuredDescription: clipped,
      warnings: [],
      adapter: found ? "structured" : "visible-text",
      ...(sourceJobId ? { sourceJobId } : {}),
    },
  };
}

function structuredFields(
  doc: Document,
  pageUrl: string,
): { fields: JobFields; sourceJobId: string | undefined; found: boolean } {
  const structured = readJsonLdJob(doc);
  const urlBoardIds = boardIdsFromUrl(pageUrl);
  const sourceJobId = indeedJobIdFromUrl(pageUrl) ?? urlBoardIds[0];
  return {
    fields: rejectBoardIds(structured ?? blankFields(), [sourceJobId, ...urlBoardIds]),
    sourceJobId,
    found: structured != null,
  };
}

function boardIdsFromUrl(pageUrl: string): string[] {
  const boardUuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const match of pageUrl.matchAll(boardUuid)) {
    const key = match[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ids.push(match[0]);
  }
  return ids;
}
