import { mergeExtractedFields, type JobFields } from "@/src/capture/fields";
import { readStructuredJobPosting } from "@/src/capture/read-page";

export const NO_JOB_POSTING_MESSAGE =
  "This page has no schema.org JobPosting. Structured data was not extracted, and fields were not taken from the rest of the page.";

export type StructuredExtractResult =
  | { applied: false; message: string }
  | {
      applied: true;
      fields: JobFields;
      sourceUrl: string;
      pageLanguage: string | null;
      sourceJobId?: string;
    };

/**
 * JobPosting JSON-LD only. Title and description stay as published.
 * Does not rewrite them from the visible posting and does not call a model.
 */
export function applyStructuredExtract(input: {
  doc: Document;
  pageUrl: string;
  current: JobFields;
  overwrite: boolean;
}): StructuredExtractResult {
  const read = readStructuredJobPosting(input.doc, input.pageUrl);
  if (!read.found) return { applied: false, message: NO_JOB_POSTING_MESSAGE };
  return {
    applied: true,
    fields: mergeExtractedFields(input.current, read.fields, input.overwrite),
    sourceUrl: read.sourceUrl,
    pageLanguage: read.pageLanguage,
    ...(read.sourceJobId ? { sourceJobId: read.sourceJobId } : {}),
  };
}

/** Rebuild a document from JSON-LD script text. Script bodies are not concatenated into HTML. */
export function documentFromJsonLd(scripts: readonly string[], lang: string | null): Document {
  const doc = new DOMParser().parseFromString(
    "<!doctype html><html><head></head><body></body></html>",
    "text/html",
  );
  if (lang) doc.documentElement.lang = lang;
  for (const text of scripts) {
    const script = doc.createElement("script");
    script.type = "application/ld+json";
    script.textContent = text;
    doc.head.append(script);
  }
  return doc;
}
