import { describe, expect, it } from "vitest";
import {
  applyModelGaps,
  blankFields,
  buildCapture,
  ModelOutputError,
  parseModelOutput,
} from "@/src/capture/schema";

const valid = {
  jobTitle: "Archivist",
  company: "City Archive",
  jobDescription: "Sort the files.",
  jobPostedDate: null,
  location: "Lausanne",
  salaryRange: null,
  companyJobReferenceId: null,
};

const longDescription = {
  ...valid,
  jobDescription: [
    "Accueillir les lecteurs et tenir le bureau du matin.",
    "",
    "## Missions",
    "",
    "- Trier les dossiers du fonds communal",
    "- **Ranger** les rayons après la consultation",
  ].join("\n"),
};

describe("model output schema", () => {
  it("rejects a numeric field", () => {
    expect(() => parseModelOutput({ ...valid, jobTitle: 1 })).toThrow(ModelOutputError);
  });

  it("rejects a missing key", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.company;
    expect(() => parseModelOutput(rest)).toThrow(ModelOutputError);
  });

  it("rejects an extra key", () => {
    expect(() => parseModelOutput({ ...valid, employmentType: "FULL_TIME" })).toThrow(
      ModelOutputError,
    );
  });

  it("reads JSON after a leading think block", () => {
    const reply = `<think>The description is long. {not the answer}</think>\n${JSON.stringify(longDescription)}`;
    expect(parseModelOutput(reply)).toEqual(longDescription);
  });

  it("reads JSON inside a markdown fence", () => {
    const reply = `\`\`\`json\n${JSON.stringify(longDescription)}\n\`\`\``;
    expect(parseModelOutput(reply)).toEqual(longDescription);
  });

  it("rejects an array and a non-JSON string", () => {
    expect(() => parseModelOutput([valid])).toThrow(ModelOutputError);
    expect(() => parseModelOutput("not json")).toThrow(ModelOutputError);
  });

  it("rejects a company reference that is an object", () => {
    expect(() =>
      parseModelOutput({ ...valid, companyJobReferenceId: { value: "NORTH-14" } }),
    ).toThrow(ModelOutputError);
  });

  it("turns blank strings into null", () => {
    expect(parseModelOutput({ ...valid, salaryRange: "  " }).salaryRange).toBeNull();
  });

  it("keeps a real posted date and stores null for a date that is not real", () => {
    expect(parseModelOutput({ ...valid, jobPostedDate: "2026-10-26" }).jobPostedDate).toBe(
      "2026-10-26",
    );
    expect(parseModelOutput({ ...valid, jobPostedDate: "2026-02-31" }).jobPostedDate).toBeNull();
    expect(parseModelOutput({ ...valid, jobPostedDate: "3 days ago" }).jobPostedDate).toBeNull();
    expect(parseModelOutput({ ...valid, jobPostedDate: "" }).jobPostedDate).toBeNull();
    expect(parseModelOutput({ ...valid, jobPostedDate: 20261026 }).jobPostedDate).toBeNull();
  });

  it("still rejects a model object that omits the posted date", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.jobPostedDate;
    expect(() => parseModelOutput(rest)).toThrow(ModelOutputError);
  });

  it("fills only gaps and drops a board id copied into the company reference", () => {
    const base = {
      ...blankFields(),
      jobTitle: "Archivist",
      companyJobReferenceId: null,
    };
    const model = parseModelOutput({
      ...valid,
      jobTitle: "Changed by the model",
      salaryRange: "CHF 90,000",
      companyJobReferenceId: "9876543210",
    });
    expect(applyModelGaps(base, model, "9876543210")).toEqual({
      ...base,
      salaryRange: "CHF 90,000",
      company: "City Archive",
      jobDescription: "Sort the files.",
      location: "Lausanne",
      companyJobReferenceId: null,
    });
  });

  it("keeps a real company reference that is not the board id", () => {
    const filled = applyModelGaps(blankFields(), parseModelOutput({
      ...valid,
      companyJobReferenceId: "MILL-9",
    }), "1234567890");
    expect(filled.companyJobReferenceId).toBe("MILL-9");
    const capture = buildCapture({
      fields: filled,
      sourceUrl: "https://jobs.example/1",
      extractedAt: "2026-10-26T10:00:00.000Z",
      sourceJobId: "1234567890",
    });
    expect(capture.sourceJobId).toBe("1234567890");
    expect(capture.companyJobReferenceId).toBe("MILL-9");
    expect(capture.useCase).toBe("job-post");
    expect(capture.schemaVersion).toBe(1);
  });
});
