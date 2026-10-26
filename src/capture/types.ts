import { type JobFields } from "@/src/capture/fields";

export type PageAdapter = "linkedin" | "structured" | "visible-text";

export type PageRead = {
  fields: JobFields;
  sourceUrl: string;
  sourceJobId?: string;
  pageLanguage: string | null;
  /** Clipped main text from the page. Sent to the model as untrusted data. */
  visibleText: string;
  /** Description taken from the site adapter or JobPosting data, before the longer-text comparison. */
  structuredDescription: string | null;
  warnings: string[];
  adapter: PageAdapter;
};
