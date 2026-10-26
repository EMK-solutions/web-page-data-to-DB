import { pageLanguage } from "@/src/capture/dom";
import { indeedJobIdFromUrl } from "@/src/capture/indeed";
import { readJsonLdJob } from "@/src/capture/jsonld";
import { isLinkedInJobUrl, readLinkedInJob } from "@/src/capture/linkedin";
import { postingBodyText } from "@/src/capture/main-text";
import { blankFields, rejectBoardIds } from "@/src/capture/fields";
import { type PageRead } from "@/src/capture/types";

const defaultWait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export async function readOpenPage(
  doc: Document,
  pageUrl: string,
  wait: (ms: number) => Promise<void> = defaultWait,
): Promise<PageRead> {
  const language = pageLanguage(doc);

  if (isLinkedInJobUrl(pageUrl)) {
    const linkedIn = await readLinkedInJob(doc, pageUrl, wait);
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
  const structured = readJsonLdJob(doc);
  const urlBoardIds = boardIdsFromUrl(pageUrl);
  const sourceJobId = indeedJobIdFromUrl(pageUrl) ?? urlBoardIds[0];
  const fields = rejectBoardIds(structured ?? blankFields(), [sourceJobId, ...urlBoardIds]);
  return {
    fields,
    sourceUrl: pageUrl,
    pageLanguage: language,
    visibleText,
    structuredDescription: fields.jobDescription,
    warnings: [],
    adapter: structured ? "structured" : "visible-text",
    ...(sourceJobId ? { sourceJobId } : {}),
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
