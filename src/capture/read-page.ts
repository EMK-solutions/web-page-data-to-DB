import { pageLanguage } from "@/src/capture/dom";
import { indeedJobIdFromUrl } from "@/src/capture/indeed";
import { readJsonLdJob } from "@/src/capture/jsonld";
import { isLinkedInJobUrl, readLinkedInJob } from "@/src/capture/linkedin";
import { cleanedPageText } from "@/src/capture/main-text";
import { blankFields } from "@/src/capture/fields";
import { longerText } from "@/src/capture/text";
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
    const visibleText = cleanedPageText(doc, pageUrl);
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

  const visibleText = cleanedPageText(doc, pageUrl);
  const structured = readJsonLdJob(doc);
  const fields = structured ?? blankFields();
  const sourceJobId = indeedJobIdFromUrl(pageUrl) ?? undefined;
  return {
    fields: {
      ...fields,
      jobDescription: longerText(fields.jobDescription, visibleText),
    },
    sourceUrl: pageUrl,
    pageLanguage: language,
    visibleText,
    structuredDescription: fields.jobDescription,
    warnings: [],
    adapter: structured ? "structured" : "visible-text",
    ...(sourceJobId ? { sourceJobId } : {}),
  };
}
