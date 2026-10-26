import { z } from "zod";
import {
  normalizeFields,
  rejectBoardIdAsCompanyReference,
  type JobFields,
} from "@/src/capture/fields";
import { isRecord, parseJson } from "@/src/capture/records";
import { calendarDateOrNull } from "@/src/capture/date";
import { emptyToNull } from "@/src/capture/text";

export {
  applyModelGaps,
  applyPageModel,
  applySelectionModel,
  blankFields,
  blankForm,
  fieldsFromForm,
  fieldsToForm,
  fillGaps,
  jobFieldKeys,
  mergeExtractedFields,
  normalizeFields,
  rejectBoardIdAsCompanyReference,
} from "@/src/capture/fields";
export type { FieldForm, JobFieldKey, JobFields, SelectionApplyMode } from "@/src/capture/fields";

export const SCHEMA_VERSION = 1;
export const USE_CASE = "job-post" as const;

const nullableText = z.string().nullable();

export const jobFieldsSchema = z
  .object({
    jobTitle: nullableText,
    company: nullableText,
    jobDescription: nullableText,
    jobPostedDate: nullableText,
    location: nullableText,
    salaryRange: nullableText,
    companyJobReferenceId: nullableText,
  })
  .strict();

export const jobCaptureSchema = jobFieldsSchema
  .extend({
    useCase: z.literal(USE_CASE),
    schemaVersion: z.literal(SCHEMA_VERSION),
    sourceUrl: z.string().url(),
    extractedAt: z.string().datetime(),
    sourceJobId: z.string().min(1).optional(),
  })
  .strict();

export type JobCapture = z.infer<typeof jobCaptureSchema>;

export const jobFieldsJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    jobTitle: { type: ["string", "null"] },
    company: { type: ["string", "null"] },
    jobDescription: { type: ["string", "null"] },
    jobPostedDate: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    salaryRange: { type: ["string", "null"] },
    companyJobReferenceId: { type: ["string", "null"] },
  },
  required: [
    "jobTitle",
    "company",
    "jobDescription",
    "jobPostedDate",
    "location",
    "salaryRange",
    "companyJobReferenceId",
  ],
} as const;

export class ModelOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelOutputError";
  }
}

export function parseModelOutput(content: unknown): JobFields {
  const value = typeof content === "string" ? parseModelJson(content) : content;
  const coerced = coerceBlankStrings(value);
  const parsed = jobFieldsSchema.safeParse(coerced);
  if (!parsed.success) {
    throw new ModelOutputError(firstIssue(parsed.error));
  }
  return parsed.data;
}

export function buildCapture(input: {
  fields: JobFields;
  sourceUrl: string;
  extractedAt: string;
  sourceJobId?: string;
}): JobCapture {
  const fields = rejectBoardIdAsCompanyReference(
    normalizeFields(input.fields),
    input.sourceJobId,
  );
  const capture = {
    useCase: USE_CASE,
    schemaVersion: SCHEMA_VERSION,
    sourceUrl: input.sourceUrl,
    extractedAt: input.extractedAt,
    ...fields,
    ...(input.sourceJobId ? { sourceJobId: input.sourceJobId } : {}),
  };
  return jobCaptureSchema.parse(capture);
}

export function captureToJson(capture: JobCapture): string {
  const ordered = {
    useCase: capture.useCase,
    schemaVersion: capture.schemaVersion,
    sourceUrl: capture.sourceUrl,
    extractedAt: capture.extractedAt,
    ...(capture.sourceJobId ? { sourceJobId: capture.sourceJobId } : {}),
    jobTitle: capture.jobTitle,
    company: capture.company,
    jobDescription: capture.jobDescription,
    jobPostedDate: capture.jobPostedDate,
    location: capture.location,
    salaryRange: capture.salaryRange,
    companyJobReferenceId: capture.companyJobReferenceId,
  };
  return JSON.stringify(ordered, null, 2);
}

function parseModelJson(text: string): unknown {
  const raw = text.trim();
  try {
    return parseJson(raw);
  } catch {
    const unwrapped = unwrapModelJson(raw);
    if (unwrapped !== raw) {
      try {
        return parseJson(unwrapped);
      } catch {
        // The same error covers a wrapper that still does not contain JSON.
      }
    }
    throw new ModelOutputError("The model did not return JSON.");
  }
}

/** Drops a leading think block and a surrounding markdown fence. Does not log the text. */
function unwrapModelJson(text: string): string {
  let next = text.trim();
  for (let pass = 0; pass < 4; pass += 1) {
    const before = next;
    next = next.replace(/^<think>[\s\S]*?<\/think>\s*/i, "").trim();
    const fenced = /^```(?:json)?[^\n]*\n?([\s\S]*?)```\s*$/i.exec(next);
    if (fenced?.[1] != null) next = fenced[1].trim();
    if (next === before) break;
  }
  return next;
}

function coerceBlankStrings(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const next: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(value)) {
    if (key === "jobPostedDate") {
      next[key] = coercePostedDate(field);
      continue;
    }
    next[key] = typeof field === "string" ? emptyToNull(field) : field;
  }
  return next;
}

function coercePostedDate(value: unknown): string | null {
  if (value == null) return null;
  return typeof value === "string" ? calendarDateOrNull(value) : null;
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "The model output does not match the job schema.";
  const path = issue.path.length > 0 ? issue.path.join(".") : "the object";
  return `The model output is invalid at ${path}.`;
}
