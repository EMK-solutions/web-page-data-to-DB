import { type JobFields } from "@/src/capture/fields";

export type PageAdapter = "linkedin" | "structured" | "visible-text";

export type PageRead = {
  fields: JobFields;
  sourceUrl: string;
  sourceJobId?: string;
  pageLanguage: string | null;
  /** Clipped posting body for the model. Site chrome is left out. */
  visibleText: string;
  /** Description from JobPosting data or the site adapter. The full page is not stored here. */
  structuredDescription: string | null;
  warnings: string[];
  adapter: PageAdapter;
};
