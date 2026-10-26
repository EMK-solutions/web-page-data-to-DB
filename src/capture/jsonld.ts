import { htmlToMarkdown } from "@/src/capture/markdown";
import { isRecord, parseJson } from "@/src/capture/records";
import { blankFields, normalizeFields, type JobFields } from "@/src/capture/fields";
import { emptyToNull } from "@/src/capture/text";

export function readJsonLdJob(doc: Document): JobFields | null {
  const postings: Record<string, unknown>[] = [];
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    const raw = script.textContent;
    if (!raw?.trim()) continue;
    let parsed: unknown;
    try {
      parsed = parseJson(raw);
    } catch {
      continue;
    }
    collectNodes(parsed, postings);
  }

  const posting = postings.find(isJobPosting);
  if (!posting) return null;

  return normalizeFields({
    ...blankFields(),
    jobTitle: textValue(posting.title),
    company: organizationName(posting.hiringOrganization),
    jobDescription:
      typeof posting.description === "string" ? htmlToMarkdown(posting.description) : null,
    location: formatLocation(posting.jobLocation),
    salaryRange: formatSalary(posting.baseSalary),
    companyJobReferenceId: formatIdentifier(posting.identifier),
  });
}

function collectNodes(value: unknown, out: Record<string, unknown>[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectNodes(item, out);
    return;
  }
  if (!isRecord(value)) return;
  out.push(value);
  if ("@graph" in value) collectNodes(value["@graph"], out);
}

function isJobPosting(node: Record<string, unknown>): boolean {
  return hasType(node["@type"], "JobPosting");
}

function hasType(value: unknown, expected: string): boolean {
  if (typeof value === "string") return typeName(value) === expected;
  if (!Array.isArray(value)) return false;
  return value.some((item) => typeof item === "string" && typeName(item) === expected);
}

function typeName(value: string): string {
  const parts = value.split("/");
  return parts[parts.length - 1] ?? value;
}

function textValue(value: unknown): string | null {
  return typeof value === "string" ? emptyToNull(value) : null;
}

function organizationName(value: unknown): string | null {
  if (typeof value === "string") return emptyToNull(value);
  if (!isRecord(value)) return null;
  return textValue(value.name);
}

function formatLocation(value: unknown): string | null {
  if (typeof value === "string") return emptyToNull(value);
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatLocation(item))
      .filter((item): item is string => item != null);
    return parts.length > 0 ? parts.join("; ") : null;
  }
  if (!isRecord(value)) return null;
  const address = isRecord(value.address) ? value.address : value;
  const country = address.addressCountry;
  const countryText =
    typeof country === "string"
      ? country
      : isRecord(country)
        ? textValue(country.name)
        : null;
  const bits = [address.addressLocality, address.addressRegion, address.postalCode, countryText]
    .map((item) => (typeof item === "string" ? emptyToNull(item) : null))
    .filter((item): item is string => item != null);
  if (bits.length > 0) return bits.join(", ");
  return textValue(value.name);
}

function formatSalary(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return emptyToNull(String(value));
  if (!isRecord(value)) return null;
  const currency = typeof value.currency === "string" ? value.currency.trim() : "";
  const raw = "value" in value ? value.value : value;
  if (typeof raw === "string" || typeof raw === "number") {
    const amount = emptyToNull(String(raw));
    if (!amount) return null;
    return joinSalary(currency, amount, "");
  }
  if (!isRecord(raw)) return null;
  const min = raw.minValue;
  const max = raw.maxValue;
  const single = raw.value;
  const unit = typeof raw.unitText === "string" ? raw.unitText.trim() : "";
  let range = "";
  if (typeof min === "number" && typeof max === "number") range = `${min}–${max}`;
  else if (typeof single === "number" || typeof single === "string") range = emptyToNull(String(single)) ?? "";
  else if (typeof min === "number") range = String(min);
  if (!range) return null;
  return joinSalary(currency, range, unit);
}

function joinSalary(currency: string, range: string, unit: string): string | null {
  return emptyToNull([currency, range, unit].filter((part) => part.length > 0).join(" "));
}

function formatIdentifier(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return emptyToNull(String(value));
  if (!isRecord(value)) return null;
  if (typeof value.value === "string" || typeof value.value === "number") {
    return emptyToNull(String(value.value));
  }
  return null;
}
