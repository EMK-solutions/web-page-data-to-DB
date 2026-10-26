import { isIndeedHost, type IndeedSlice } from "@/src/capture/indeed";
import { isRecord } from "@/src/capture/records";
import { jobFieldsSchema } from "@/src/capture/schema";
import { type PageAdapter, type PageRead } from "@/src/capture/types";

export function isPageRead(value: unknown): value is PageRead {
  if (!isRecord(value)) return false;
  if (typeof value.sourceUrl !== "string") return false;
  if (value.pageLanguage !== null && typeof value.pageLanguage !== "string") return false;
  if (typeof value.visibleText !== "string") return false;
  if (value.structuredDescription !== null && typeof value.structuredDescription !== "string") {
    return false;
  }
  if (value.sourceJobId !== undefined && typeof value.sourceJobId !== "string") return false;
  if (!isAdapter(value.adapter)) return false;
  if (!isStringList(value.warnings)) return false;
  return jobFieldsSchema.safeParse(value.fields).success;
}

export function isIndeedSlice(value: unknown): value is IndeedSlice {
  if (!isRecord(value)) return false;
  return (
    isNullableString(value.jobTitle) &&
    isNullableString(value.company) &&
    isNullableString(value.jobDescription) &&
    isNullableString(value.location) &&
    isNullableString(value.salaryRange) &&
    isNullableString(value.sourceJobId)
  );
}

export function isIndeedPage(pageUrl: string): boolean {
  try {
    return isIndeedHost(new URL(pageUrl).hostname);
  } catch {
    return false;
  }
}

function isAdapter(value: unknown): value is PageAdapter {
  return value === "linkedin" || value === "structured" || value === "visible-text";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
