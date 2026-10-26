import { emptyToNull } from "@/src/capture/text";

export const jobFieldKeys = [
  "jobTitle",
  "company",
  "jobDescription",
  "location",
  "salaryRange",
  "companyJobReferenceId",
] as const;

export type JobFieldKey = (typeof jobFieldKeys)[number];

export type JobFields = Record<JobFieldKey, string | null>;

export function blankFields(): JobFields {
  return {
    jobTitle: null,
    company: null,
    jobDescription: null,
    location: null,
    salaryRange: null,
    companyJobReferenceId: null,
  };
}

export function normalizeFields(
  input: Partial<Record<JobFieldKey, string | null | undefined>>,
): JobFields {
  const fields = blankFields();
  for (const key of jobFieldKeys) {
    fields[key] = emptyToNull(input[key]);
  }
  return fields;
}

export type FieldForm = Record<JobFieldKey, string>;

export function blankForm(): FieldForm {
  return {
    jobTitle: "",
    company: "",
    jobDescription: "",
    location: "",
    salaryRange: "",
    companyJobReferenceId: "",
  };
}

export function fieldsToForm(fields: JobFields): FieldForm {
  const form = blankForm();
  for (const key of jobFieldKeys) {
    form[key] = fields[key] ?? "";
  }
  return form;
}

export function fieldsFromForm(form: FieldForm): JobFields {
  return normalizeFields(form);
}

export function fillGaps(base: JobFields, incoming: JobFields): JobFields {
  const next = { ...base };
  for (const key of jobFieldKeys) {
    if (next[key] == null) next[key] = incoming[key];
  }
  return next;
}

export function rejectBoardIdAsCompanyReference(
  fields: JobFields,
  sourceJobId: string | undefined,
): JobFields {
  return rejectBoardIds(fields, [sourceJobId]);
}

export function rejectBoardIds(
  fields: JobFields,
  boardIds: readonly (string | undefined)[],
): JobFields {
  const reference = fields.companyJobReferenceId?.trim().toLowerCase();
  if (!reference) return fields;
  const blocked = boardIds.some((id) => id?.trim().toLowerCase() === reference);
  if (!blocked) return fields;
  return { ...fields, companyJobReferenceId: null };
}

export function applyModelGaps(
  fields: JobFields,
  model: JobFields,
  sourceJobId: string | undefined,
): JobFields {
  return rejectBoardIdAsCompanyReference(fillGaps(fields, model), sourceJobId);
}

export type SelectionApplyMode = "replace" | "fill";

/** Replace writes the model fields. Fill keeps every field that already has a value. */
export function applySelectionModel(
  current: JobFields,
  model: JobFields,
  mode: SelectionApplyMode,
  sourceJobId: string | undefined,
): JobFields {
  if (mode === "replace") {
    return rejectBoardIdAsCompanyReference(normalizeFields(model), sourceJobId);
  }
  return applyModelGaps(current, model, sourceJobId);
}
